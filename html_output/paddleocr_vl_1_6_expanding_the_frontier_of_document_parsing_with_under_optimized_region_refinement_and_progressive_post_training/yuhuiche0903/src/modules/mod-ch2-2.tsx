import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, easeInOutQuad } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 模块 3.2：脆弱分数流水线：从 128 次预测到检索种子（P2 步进式）。
// 布局（无重叠）：左侧 8×16 网格（x 24–111, y 14–189），列名/行名在网格外；
// 右侧白色面板（x 130–544, y 14–189）放每步注释与新增图示；
// 底部说明带（y 194–236）。四步连贯：网格常驻，上一步的标注不消失。
// 新元素 0.8s 慢速淡入，无快速逐格闪烁。

const W = 560;
const H = 240;

const GRID_X = 24;
const GRID_Y = 14;
const COLS = 8;
const ROWS = 16;
const CELL = 10;
const GAP = 1;
const GRID_W = COLS * CELL + (COLS - 1) * GAP;
const GRID_H = ROWS * CELL + (ROWS - 1) * GAP;

const PANEL_X = 130;
const PANEL_Y = 14;
const PANEL_W = 414;
const PANEL_H = 175;

const BLUE = '#27446e';
const GREEN = '#228d5c';
const ORANGE = '#d97706';
const INK = '#21324a';
const MUTED = '#68778f';
const AXIS = '#d7deea';

const STEP_BAND = [
  '第 1 步：8 个晚期 checkpoint × 16 种语义不变扰动，得到 128 次预测。',
  '第 2 步：两两计算归一化编辑距离，共 8128 对（C(128,2)）。',
  '第 3 步：取最大的 128 个距离平均，压制微小格式差异。',
  '第 4 步：按分数取前 1% 作为检索种子，出现退化的样本额外纳入。',
];

const DONE_TEXT = '分数越高，说明这个样本所在区域的映射越不稳——它们就是数据引擎要优先修补的地方。';

// 示意用的橙色连线端点（top-128 对的演示）
const PAIR_LINKS: Array<[number, number, number, number]> = [
  [0, 0, 1, 0],
  [0, 1, 0, 2],
  [1, 1, 2, 1],
  [2, 0, 3, 0],
  [3, 1, 3, 2],
  [4, 0, 4, 1],
  [5, 1, 6, 1],
  [6, 0, 7, 0],
  [0, 14, 1, 15],
  [2, 14, 3, 15],
  [4, 14, 5, 15],
  [6, 14, 7, 15],
];

function cellCenter(ci: number, ri: number): [number, number] {
  return [GRID_X + ci * (CELL + GAP) + CELL / 2, GRID_Y + ri * (CELL + GAP) + CELL / 2];
}

function drawGrid(ctx: CanvasRenderingContext2D, dimmed: boolean, alpha: number): void {
  ctx.globalAlpha = alpha;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const x = GRID_X + c * (CELL + GAP);
      const y = GRID_Y + r * (CELL + GAP);
      ctx.fillStyle = dimmed ? '#eef2ea' : '#ffffff';
      ctx.fillRect(x, y, CELL, CELL);
      ctx.strokeStyle = AXIS;
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 0.5, y + 0.5, CELL - 1, CELL - 1);
    }
  }
  ctx.globalAlpha = 1;
  // 列名（网格下方）与行名（左侧，旋转 90°）
  ctx.fillStyle = MUTED;
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('8 个 checkpoint', GRID_X + GRID_W / 2, GRID_Y + GRID_H + 14);
  ctx.save();
  ctx.translate(10, GRID_Y + GRID_H / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('16 种扰动', 0, 3);
  ctx.restore();
  ctx.textAlign = 'left';
}

export const Ch2Mod2: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ step: 1, fadeStart: 0, raf: null as number | null });
  const [step, setStep] = useState(1);
  const [feedback, setFeedback] = useState({ text: STEP_BAND[0], cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const s = stateRef.current;
    s.fadeStart = performance.now();

    const render = (now: number) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#b8c9a7';
      ctx.fillRect(10, 10, W - 20, H - 20);

      // 0.8s 慢速淡入（新步骤元素）；网格与既有标注常驻保证连贯
      const fade = clamp((now - s.fadeStart) / 800, 0, 1);
      const a = easeInOutQuad(fade);
      const st = s.step;

      drawGrid(ctx, st >= 4, st === 1 ? a : 1);

      // 第 1 步新增：缓慢的蓝色扫掠一次（0.8s 内完成，之后静止）
      if (st === 1) {
        const sweep = easeInOutQuad(fade);
        ctx.fillStyle = BLUE;
        ctx.globalAlpha = 0.3 * (1 - sweep);
        ctx.fillRect(GRID_X, GRID_Y, GRID_W * sweep, GRID_H);
        ctx.globalAlpha = 1;
      }

      // 右侧面板
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(PANEL_X, PANEL_Y, PANEL_W, PANEL_H);
      ctx.strokeStyle = AXIS;
      ctx.lineWidth = 1;
      ctx.strokeRect(PANEL_X + 0.5, PANEL_Y + 0.5, PANEL_W - 1, PANEL_H - 1);

      if (st === 1) {
        ctx.globalAlpha = a;
        ctx.fillStyle = INK;
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('= 128 次预测', PANEL_X + 16, PANEL_Y + 34);
        ctx.fillStyle = MUTED;
        ctx.font = '12px sans-serif';
        ctx.fillText('对每个训练样本：8 个晚期 checkpoint × 16 种语义不变扰动', PANEL_X + 16, PANEL_Y + 62);
        ctx.fillText('（像素平移、JPEG 压缩、噪声、模糊、非均匀缩放等）', PANEL_X + 16, PANEL_Y + 84);
        ctx.globalAlpha = 1;
      }

      if (st >= 2) {
        // 第 2 步新增：一对代表格 + 连线 + 8128 文字
        const [c1, r1, c2, r2] = [2, 2, 4, 2];
        const [x1, y1] = cellCenter(c1, r1);
        const [x2, y2] = cellCenter(c2, r2);
        ctx.globalAlpha = a;
        ctx.strokeStyle = BLUE;
        ctx.lineWidth = 2;
        ctx.strokeRect(x1 - CELL / 2 - 1, y1 - CELL / 2 - 1, CELL + 2, CELL + 2);
        ctx.strokeRect(x2 - CELL / 2 - 1, y2 - CELL / 2 - 1, CELL + 2, CELL + 2);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.quadraticCurveTo((x1 + x2) / 2, y1 - 24, x2, y2);
        ctx.stroke();
        ctx.globalAlpha = 1;
        if (st === 2) {
          ctx.globalAlpha = a;
          ctx.fillStyle = INK;
          ctx.font = '16px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText('两两比较：8128 对', PANEL_X + 16, PANEL_Y + 34);
          ctx.fillStyle = MUTED;
          ctx.font = '12px sans-serif';
          ctx.fillText('任意两次预测之间都算一次归一化编辑距离', PANEL_X + 16, PANEL_Y + 62);
          ctx.fillText('C(128, 2) = 128 × 127 ÷ 2 = 8128', PANEL_X + 16, PANEL_Y + 84);
          ctx.globalAlpha = 1;
        }
      }

      if (st >= 3) {
        // 第 3 步新增：橙色连线（示意 top-128）+ 右侧仪表盘
        ctx.globalAlpha = a * 0.75;
        ctx.strokeStyle = ORANGE;
        ctx.lineWidth = 1.5;
        for (const [c1, r1, c2, r2] of PAIR_LINKS) {
          const [x1, y1] = cellCenter(c1, r1);
          const [x2, y2] = cellCenter(c2, r2);
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
        // 仪表盘（示意）
        const gx = PANEL_X + 200;
        const gy = PANEL_Y + 60;
        ctx.globalAlpha = a;
        ctx.strokeStyle = AXIS;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(gx, gy, 30, Math.PI * 0.75, Math.PI * 2.25);
        ctx.stroke();
        const needle = Math.PI * 0.75 + Math.PI * 1.5 * 0.42;
        ctx.strokeStyle = ORANGE;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(gx, gy);
        ctx.lineTo(gx + Math.cos(needle) * 25, gy + Math.sin(needle) * 25);
        ctx.stroke();
        ctx.fillStyle = INK;
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('脆弱分数（示意）', gx - 30, gy + 50);
        if (st === 3) {
          ctx.fillStyle = MUTED;
          ctx.font = '12px sans-serif';
          ctx.fillText('取最大的 128 对平均，压制微小格式差异', PANEL_X + 16, PANEL_Y + 148);
        }
        ctx.globalAlpha = 1;
      }

      if (st >= 4) {
        // 第 4 步新增：排序条，top 1% 绿色 = 检索种子
        ctx.globalAlpha = a;
        const bx = PANEL_X + 16;
        const by = PANEL_Y + 120;
        const barW = 30;
        for (let i = 0; i < 10; i++) {
          const h = 5 + (10 - i) * 6;
          ctx.fillStyle = i === 0 ? GREEN : AXIS;
          ctx.fillRect(bx + i * (barW + 5), by - h, barW, h);
        }
        ctx.strokeStyle = GREEN;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(bx - 2, by - 68, barW + 4, 68);
        ctx.fillStyle = INK;
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('前 1% → 检索种子', bx, by + 16);
        ctx.fillStyle = MUTED;
        ctx.font = '11px sans-serif';
        ctx.fillText('（条高为示意分布）', bx + 112, by + 16);
        ctx.fillText('出现退化的样本额外纳入', PANEL_X + 16, PANEL_Y + 158);
        ctx.globalAlpha = 1;
      }

      // 底部步骤说明带
      ctx.fillStyle = INK;
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(STEP_BAND[st - 1], 16, 212);

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      s.raf = requestAnimationFrame(render);
    };

    const tick = () => render(performance.now());
    const stop = () => {
      if (s.raf) cancelAnimationFrame(s.raf);
      s.raf = null;
    };
    const start = () => {
      if (!s.raf) s.raf = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const goTo = (v: number) => {
    const nv = Math.max(1, Math.min(4, v));
    const s = stateRef.current;
    s.step = nv;
    s.fadeStart = performance.now();
    setStep(nv);
    setFeedback(nv === 4 ? { text: DONE_TEXT, cls: 'good' } : { text: STEP_BAND[nv - 1], cls: '' });
  };

  const btnStyle = (disabled: boolean): React.CSSProperties =>
    disabled ? { opacity: 0.45, cursor: 'not-allowed' } : {};

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button type="button" className="chip" onClick={() => goTo(step - 1)} disabled={step === 1} style={btnStyle(step === 1)} aria-disabled={step === 1}>
          上一步
        </button>
        <button type="button" className="chip" onClick={() => goTo(step + 1)} disabled={step === 4} style={btnStyle(step === 4)} aria-disabled={step === 4}>
          下一步
        </button>
        <button type="button" className="chip" onClick={() => goTo(1)}>
          重置
        </button>
        <span className="val">第 {step} / 4 步</span>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch2Mod2;
