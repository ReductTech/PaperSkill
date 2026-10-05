import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, easeInOutQuad } from '../lib/canvasKit';
import {
  clearScene,
  drawBoard,
  drawPlane,
  drawShavings,
  drawSceneLabel,
  drawLegend,
  GUIDE,
  OK,
  EMPH,
  INK,
  MUTED,
  LINE,
} from './woodKit';
import type { WidgetProps } from './registry';

// 第 9 章 模块 9.1 —— 一次预测多少步：动作视野 Ta
// 上面：木板 + 预测条（Tp = 16 固定）+ 可拖动的提交把手（吸附到离散步数）。
// 下面：相对性能条——按论文 Fig 5 的趋势示意，不是实测值。

const W = 1080;
const H = 280;
const FONT = '"Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';

const TA_VALUES = [1, 2, 4, 8, 16, 32];
const TP = 16;
const TASK_STEPS = 40;

const STEP_W = 26;
const BAR_X = 70;
const BAR_Y = 110;
const BAR_H = 18;
const BD_X = 70;
const BD_Y = 160;
const BD_W = 832;
const BD_H = 28;
const BD_N = 33;

// 按论文 Fig 5（左）的趋势取值的示意图：Ta = 8 最高，Ta = 1 明显偏低，Ta = 32 回落。
const REL: Record<number, number> = { 1: 0.3, 2: 0.62, 4: 0.86, 8: 1, 16: 0.93, 32: 0.72 };

const BASE: number[] = (() => {
  const out: number[] = [];
  for (let i = 0; i < BD_N; i += 1) {
    out.push(2.5 + 2.2 * Math.sin(i * 0.66) + 1.1 * Math.sin(i * 1.5));
  }
  return out;
})();

const sampleArr = (arr: number[], x: number): number => {
  const fi = clamp(((x - BD_X) / BD_W) * (BD_N - 1), 0, BD_N - 1);
  const i0 = Math.floor(fi);
  const i1 = Math.min(BD_N - 1, i0 + 1);
  return lerp(arr[i0], arr[i1], fi - i0);
};

const feedbackFor = (v: number): { text: string; cls: string } => {
  const tail = '下面的柱高是按论文 Fig 5 的趋势画的示意，不是实测数值。';
  if (v <= 2) return { text: '每次都重新规划，动作抖、时序不一致。' + tail, cls: 'bad' };
  if (v === 8)
    return {
      text: '预测 16 步、只执行 8 步——这是论文在多数任务上的最优设置。' + tail,
      cls: 'good',
    };
  if (v === 32)
    return { text: '一次执行太久，环境变了也来不及反应。' + tail, cls: '' };
  return { text: '预测 16 步、只执行 ' + v + ' 步——落在论文最优设置的附近。' + tail, cls: 'good' };
};

export const M81: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const elapsedRef = useRef(0);
  const lastRef = useRef(0);
  const stateRef = useRef<{ ta: number }>({ ta: 8 });
  const dragRef = useRef<((e: PointerEvent) => void) | null>(null);
  const upRef = useRef<(() => void) | null>(null);
  const [ta, setTa] = useState(8);
  const [feedback, setFeedback] = useState(feedbackFor(8));
  // 40 步长的任务里，一共要重新规划多少次
  const replanCount = Math.ceil(TASK_STEPS / ta);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (s: { ta: number }, tl: number) => {
      clearScene(ctx, W, H);
      const commitEnd = BAR_X + s.ta * STEP_W;

      // ---- 上：木板与预测条 ----
      const shown = BASE.map((v, i) => {
        const sx = BD_X + (BD_W * i) / (BD_N - 1);
        return sx <= commitEnd ? 0 : v;
      });
      drawBoard(ctx, BD_X, BD_Y, BD_W, BD_H, shown);

      ctx.strokeStyle = OK;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(BD_X, BD_Y);
      ctx.lineTo(clamp(commitEnd, BD_X, BD_X + BD_W), BD_Y);
      ctx.stroke();

      // 预测条：长度正比 Tp，固定不变
      ctx.fillStyle = GUIDE;
      ctx.fillRect(BAR_X, BAR_Y, TP * STEP_W, BAR_H);
      // 已提交区间：长度正比 Ta
      ctx.fillStyle = OK;
      ctx.fillRect(BAR_X, BAR_Y, s.ta * STEP_W, BAR_H);

      ctx.strokeStyle = LINE;
      ctx.lineWidth = 1;
      for (let i = 1; i < TP; i += 1) {
        ctx.beginPath();
        ctx.moveTo(BAR_X + i * STEP_W, BAR_Y);
        ctx.lineTo(BAR_X + i * STEP_W, BAR_Y + BAR_H);
        ctx.stroke();
      }

      // 预测总长度的右端：Tp 固定为 16 步
      ctx.strokeStyle = GUIDE;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(BAR_X + TP * STEP_W, BAR_Y - 5);
      ctx.lineTo(BAR_X + TP * STEP_W, BAR_Y + BAR_H + 5);
      ctx.stroke();

      // 把手：可拖动，吸附到离散步数
      const hx = BAR_X + s.ta * STEP_W;
      ctx.fillStyle = EMPH;
      ctx.fillRect(hx - 1.5, 104, 3, 40);
      ctx.beginPath();
      ctx.moveTo(hx - 7, 104);
      ctx.lineTo(hx + 7, 104);
      ctx.lineTo(hx, 114);
      ctx.closePath();
      ctx.fill();

      // 刨子：一次只走「已提交」这一小段，走完立刻重新规划
      const regionW = s.ta * STEP_W;
      const walk = Math.max(0, regionW - 60);
      const period = 0.7 + s.ta * 0.07;
      const t = (tl % period) / period;
      const u = easeInOutQuad(clamp(t / 0.82, 0, 1));
      const planeX = clamp(
        BAR_X + regionW / 2 - walk / 2 + u * walk,
        BD_X + 27,
        BD_X + BD_W - 27
      );
      const planeY = BD_Y - sampleArr(shown, planeX) - 1;
      drawPlane(ctx, planeX, planeY, { length: 54 });
      drawShavings(ctx, planeX - 28, planeY - 2, tl * 4, walk > 0 ? 2 : 1);

      drawLegend(
        ctx,
        [
          { color: GUIDE, text: '预测 Tp' },
          { color: OK, text: '执行 Ta' },
          { color: EMPH, text: '把手' },
        ],
        70,
        34
      );

      // ---- 下：相对性能条 ----
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(24, 200, 1032, 72);
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(24.75, 200.75, 1030.5, 70.5);

      const baseY = 256;
      ctx.font = '13px ' + FONT;
      ctx.textAlign = 'center';
      for (let i = 0; i < TA_VALUES.length; i += 1) {
        const v = TA_VALUES[i];
        const bx = 91 + i * 164;
        const hgt = REL[v] * 46;
        const sel = v === s.ta;
        ctx.fillStyle = sel ? OK : LINE;
        ctx.fillRect(bx, baseY - hgt, 78, hgt);
        if (sel) {
          ctx.strokeStyle = GUIDE;
          ctx.lineWidth = 2;
          ctx.strokeRect(bx, baseY - hgt, 78, hgt);
        }
        ctx.fillStyle = sel ? GUIDE : MUTED;
        ctx.fillText(String(v), bx + 39, 270);
      }
      ctx.textAlign = 'left';

      drawSceneLabel(ctx, '示意趋势', 908, 190, MUTED);
      ctx.font = '13px ' + FONT;
      ctx.fillStyle = INK;
      ctx.fillText('Ta 的取值', 91, 216);
    };

    const tick = (ts: number) => {
      const last = lastRef.current;
      lastRef.current = ts;
      if (last !== 0) elapsedRef.current += Math.min(64, ts - last) / 1000;
      render(stateRef.current, elapsedRef.current);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastRef.current = 0;
    };
    const start = () => {
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
      if (dragRef.current) window.removeEventListener('pointermove', dragRef.current);
      if (upRef.current) window.removeEventListener('pointerup', upRef.current);
      dragRef.current = null;
      upRef.current = null;
    };
  }, []);

  const commit = (v: number) => {
    stateRef.current.ta = v;
    setTa(v);
    setFeedback(feedbackFor(v));
    elapsedRef.current = 0;
  };

  const snapTo = (x: number) => {
    let best = TA_VALUES[0];
    let bestD = Infinity;
    for (const v of TA_VALUES) {
      const d = Math.abs(BAR_X + v * STEP_W - x);
      if (d < bestD) {
        bestD = d;
        best = v;
      }
    }
    commit(best);
  };

  const onCanvasDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const y = ((e.clientY - rect.top) * H) / rect.height;
    if (y > 160 || y < 92) return;
    snapTo(((e.clientX - rect.left) * W) / rect.width);
    const onMove = (ev: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      snapTo(((ev.clientX - r.left) * W) / r.width);
    };
    const onUp = () => {
      if (dragRef.current) window.removeEventListener('pointermove', dragRef.current);
      if (upRef.current) window.removeEventListener('pointerup', upRef.current);
      dragRef.current = null;
      upRef.current = null;
      elapsedRef.current = 0;
    };
    dragRef.current = onMove;
    upRef.current = onUp;
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        onPointerDown={onCanvasDown}
        style={{ cursor: 'ew-resize' }}
        aria-label="拖动橙色把手选择动作视野 Ta，可吸附到 1、2、4、8、16、32 步"
      />
      <div className="ctrl">
        <label>
          动作视野 Ta <span className="val">{ta}</span>
        </label>
        <label>
          重规划次数 <span className="val">{replanCount}</span>
        </label>
        <label>
          预测视野 Tp <span className="val">{TP}</span>
        </label>
      </div>
      <div className="chip-row">
        {TA_VALUES.map((v) => (
          <button
            key={v}
            className={'chip' + (v === ta ? ' selected' : '')}
            onClick={() => commit(v)}
          >
            {v}
          </button>
        ))}
      </div>
      <div className={'feedback ' + feedback.cls}>{feedback.text}</div>
    </div>
  );
};

export default M81;
