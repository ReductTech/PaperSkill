import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, lerpColor, easeOutCubic } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §6 模块 6.1「动作是怎么被筛出来的」（1080×280）
// 左侧 funnel：候选动作逐层收窄（块数只表示相对收窄，不是论文数据）；
// 右侧 families：五类工具族按步点亮，最后只剩被命中的那一族。
// 论文 p.5 §2.4 公式(4) 只给出「动作空间是被裁剪的子集」这一运行时契约，
// 全文未报告任何能力/候选计数，因此本模块刻意不显示具体数量。

const W = 1080;
const H = 280;

const BG = '#f5f8f0';
const GROUND = '#e6ead9';
const LINE = '#d7deea';
const BLUE = '#27446e';
const GREEN = '#228d5c';
const ORANGE = '#f07e47';
const INK = '#21324a';
const SLATE = '#68778f';
const MUTED = '#a9b4c4';

const CX = 320;
const ROW_Y = [62, 112, 162, 212];
// 纯示意的相对块数：5 → 4 → 3 → 1，只表达「越来越少」，不对应论文中的任何计数
const COUNTS = [5, 4, 3, 1];
const STEP_SCALE = ['全部能力', '仍然相关', '本轮允许', '唯一动作'] as const;

const CARD_X = 660;
const CARD_W = 380;
const CARD_H = 40;
const CARD_GAP = 6;
const CARD_Y0 = 36;

// 文案严格按论文 p.5 Table 2 的 "Representative operations" 改写
const FAMILIES: { name: string; note: string }[] = [
  { name: '画布工具', note: '读/建/连/分组节点' },
  { name: '生成工具', note: '图像·视频·音频' },
  { name: '原生工具', note: '浏览器·文件·文档' },
  { name: '恢复工具', note: '反馈·校验·检查点' },
  { name: 'MCP 工具', note: '同清单同授权契约' },
];

// 1=落在这条路径上，0=本轮未被命中
const LIT: number[][] = [
  [0, 0, 0, 0, 0],
  [1, 1, 1, 1, 1],
  [1, 1, 0, 1, 0],
  [0, 1, 0, 0, 0],
  [0, 1, 0, 0, 0],
];

const STEP_DESC = [
  '先读当前画布上的产物、依赖与未完成节点。',
  '把画布现状与能力清单 Γ\u209c 对齐。',
  '按执行授权 Ω\u209c 去掉本轮不允许的动作。',
  '按当前请求 q\u209c 收窄到真正相关的候选。',
  '提交唯一动作，并由协议桥写回画布。',
];

const STEP_FEEDBACK: { text: string; cls: string; color: string }[] = [
  {
    text: '观测画布：当前画布上有哪些产物、依赖与未完成节点。',
    cls: '',
    color: '',
  },
  { text: '对齐能力清单：把与当前画布相关的能力挑出来。', cls: '', color: '' },
  { text: '应用执行授权：去掉本轮不允许的动作。', cls: '', color: '' },
  { text: '按当前请求收窄：只留下真正相关的候选。', cls: '', color: ORANGE },
  { text: '提交唯一动作，并经协议桥写回画布。', cls: 'good', color: '' },
];

function halfWidth(y: number): number {
  return 280 - 210 * ((y - 40) / 204);
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function clearScene(ctx: CanvasRenderingContext2D): void {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);
  const gy = H * 0.82;
  ctx.fillStyle = GROUND;
  ctx.fillRect(0, gy, W, H - gy);
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, gy);
  ctx.lineTo(W, gy);
  ctx.stroke();
}

/** 一层候选块：宽度按本层相对规模分配，位置在漏斗中轴上居中。块数只表示相对收窄。 */
function drawRow(
  ctx: CanvasRenderingContext2D,
  rowY: number,
  rowW: number,
  n: number,
  color: string,
  alpha: number
): void {
  const gap = 4;
  const bw = Math.min(64, (rowW - (n - 1) * gap) / n);
  const total = n * bw + (n - 1) * gap;
  const x0 = CX - total / 2;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  for (let k = 0; k < n; k++) {
    roundRectPath(ctx, x0 + k * (bw + gap), rowY - 13, bw, 26, 6);
    ctx.fill();
  }
  ctx.restore();
}

function render(ctx: CanvasRenderingContext2D, step: number, dstep: number, easeT: number): void {
  clearScene(ctx);

  // 漏斗轮廓
  ctx.save();
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(40, 40);
  ctx.lineTo(200, 244);
  ctx.moveTo(600, 40);
  ctx.lineTo(340, 244);
  ctx.moveTo(200, 244);
  ctx.lineTo(340, 244);
  ctx.stroke();
  ctx.restore();

  const rowW = ROW_Y.map((y) => halfWidth(y) * 2);

  for (let i = 0; i < 4; i++) {
    const alpha = clamp(dstep - (i + 2) + 1, 0, 1);
    if (alpha <= 0.02) {
      const w = 80 + (3 - i) * 30;
      ctx.save();
      ctx.setLineDash([6, 5]);
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 2;
      roundRectPath(ctx, CX - w / 2, ROW_Y[i] - 13, w, 26, 6);
      ctx.stroke();
      ctx.restore();
      continue;
    }
    const isActive = i === step - 2;
    const isPast = i < step - 2;
    let color: string;
    if (isActive) color = step === 5 ? GREEN : BLUE;
    else if (isPast) color = i === step - 3 ? lerpColor(BLUE, MUTED, easeT) : MUTED;
    else color = BLUE;
    drawRow(ctx, ROW_Y[i], rowW[i], COUNTS[i], color, alpha);
  }

  // 当前的收拢位置
  if (step >= 2) {
    const iFrom = clamp(step - 3, 0, 3);
    const iTo = clamp(step - 2, 0, 3);
    const fy = lerp(ROW_Y[iFrom], ROW_Y[iTo], easeT);
    ctx.save();
    ctx.strokeStyle = ORANGE;
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(40, fy);
    ctx.lineTo(600, fy);
    ctx.stroke();
    ctx.restore();
  } else {
    ctx.fillStyle = SLATE;
    ctx.font = '28px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('—', CX, 150);
  }

  // 五类工具族
  for (let i = 0; i < FAMILIES.length; i++) {
    const y = CARD_Y0 + i * (CARD_H + CARD_GAP);
    const lit = LIT[step - 1][i] === 1;
    const hit = lit && step >= 4;
    const done = lit && step === 5;
    const border = done ? GREEN : lit ? BLUE : LINE;
    const width = done ? 3 : hit ? 4 : lit ? 3 : 1.5;
    ctx.save();
    if (lit) {
      ctx.fillStyle = done ? 'rgba(34,141,92,0.12)' : hit ? 'rgba(39,68,110,0.10)' : 'rgba(255,255,255,0)';
      roundRectPath(ctx, CARD_X, y, CARD_W, CARD_H, 8);
      ctx.fill();
    }
    ctx.strokeStyle = border;
    ctx.lineWidth = width;
    roundRectPath(ctx, CARD_X, y, CARD_W, CARD_H, 8);
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = done ? GREEN : lit ? BLUE : SLATE;
    ctx.font = '16px "Segoe UI", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(FAMILIES[i].name, CARD_X + 16, y + 26);

    ctx.font = '13px "Segoe UI", sans-serif';
    ctx.fillStyle = lit ? (done ? GREEN : BLUE) : SLATE;
    ctx.textAlign = 'right';
    const tail = done ? '已提交' : hit ? '唯一动作' : FAMILIES[i].note;
    ctx.fillText(tail, CARD_X + CARD_W - 16, y + 25);
  }

  // 最多两个短标签
  ctx.textAlign = 'left';
  ctx.fillStyle = INK;
  ctx.font = '16px "Segoe UI", sans-serif';
  ctx.fillText('候选动作', 40, 26);
  ctx.fillText('命中工具族', CARD_X, 26);
}

export const Ch6Space: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stepRef = useRef<number>(1);
  const animRef = useRef<{ from: number; start: number }>({ from: 1, start: -1e9 });
  const [step, setStep] = useState(1);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const tick = () => {
      const easeT = clamp((performance.now() - animRef.current.start) / 250, 0, 1);
      const dstep = lerp(animRef.current.from, stepRef.current, easeOutCubic(easeT));
      render(ctx, stepRef.current, dstep, easeT);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const move = (next: number) => {
    const target = clamp(next, 1, 5);
    if (target === stepRef.current) return;
    animRef.current = { from: stepRef.current, start: performance.now() };
    stepRef.current = target;
    setStep(target);
  };

  const fb = STEP_FEEDBACK[step - 1];
  const atEnd = step === 5;
  const scale = STEP_SCALE[step - 1];

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="step-ctrl">
        <button type="button" className="tiny ghost" onClick={() => move(step - 1)} disabled={step === 1}>
          上一步
        </button>
        <span className="step-label">
          第 <b>{step}</b> / 5 步 · 候选范围 <b>{scale}</b>
        </span>
        <button
          type="button"
          className="tiny"
          onClick={() => move(step + 1)}
          disabled={atEnd}
          style={
            atEnd
              ? { background: GREEN, borderColor: GREEN, color: '#fff', opacity: 1 }
              : undefined
          }
        >
          {atEnd ? '已完成' : '下一步'}
        </button>
        <button type="button" className="tiny ghost" onClick={() => move(1)} disabled={step === 1}>
          重置
        </button>
      </div>
      <div className="step-desc">{STEP_DESC[step - 1]}</div>
      <div className={`feedback ${fb.cls}`} style={fb.color ? { color: fb.color, borderLeftColor: fb.color } : undefined}>
        {fb.text}
      </div>
    </div>
  );
};

export default Ch6Space;
