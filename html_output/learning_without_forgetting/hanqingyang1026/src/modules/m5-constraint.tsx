import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, easeOutCubic } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §5.2 —— 拉参数（L2）还是拉输出（LwF）：左三只杯看汤色，右旧–新平面看落点。
// 三个点取自 Table 1(a) ImageNet→Scenes；L2 的四个点按 Fig.7(b) 读出，聚在微调右上方一小簇。

const W = 1080;
const H = 280;

const C = {
  bg: '#f5f8f0',
  table: '#c9b79a',
  edge: '#92400e',
  deep: '#7a4a22',
  porcelain: '#ece6d9',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  purple: '#7c3aed',
  axis: '#d7deea',
  ink: '#21324a',
  mute: '#7d8ea3',
};

type Mode = 'ft' | 'l2' | 'lwf' | 'fe';

const MODES: { id: Mode; label: string }[] = [
  { id: 'ft', label: '微调' },
  { id: 'l2', label: '参数 L2' },
  { id: 'lwf', label: 'LwF' },
  { id: 'fe', label: '特征提取' },
];

const LEVEL: Record<Mode, number> = { ft: 0.34, l2: 0.52, lwf: 0.66, fe: 0.8 };

const TINT: Record<Mode, string> = {
  ft: 'rgba(186,177,163,0.95)',
  l2: 'rgba(188,156,113,0.95)',
  lwf: 'rgba(169,113,58,0.95)',
  fe: 'rgba(169,113,58,0.95)',
};

const POINTS: { id: 'ft' | 'fe' | 'lwf'; old: number; new: number; color: string }[] = [
  { id: 'ft', old: 53.9, new: 63.7, color: C.red },
  { id: 'fe', old: 57.1, new: 61.2, color: C.blue },
  { id: 'lwf', old: 55.9, new: 64.5, color: C.green },
];

// L2 的四个落点按 Fig.7(b) 读出：旧 54.0–54.9、新 63.4–64.1，聚成一小簇。
const L2_PTS: { old: number; new: number }[] = [
  { old: 53.95, new: 64.1 },
  { old: 54.0, new: 63.5 },
  { old: 54.2, new: 63.45 },
  { old: 54.9, new: 63.4 },
];

const FEEDBACK: Record<Mode, { text: string; cls: string }> = {
  ft: { text: '参数完全放开：新任务 63.7，旧任务只剩 53.9。', cls: 'bad' },
  l2: {
    text: '把参数拉住：λ 加大时，点从 54.0/64.1 滑到 54.9/63.4 —— 旧任务升一点、新任务降一点，整体只在微调附近打转，离 LwF（55.9/64.5）还差一截。数值按 Fig.7(b) 读出，为近似值。',
    cls: '',
  },
  lwf: { text: '把输出拉住：旧任务 55.9、新任务 64.5 —— 比微调和参数 L2 两头都更好；旧任务只比完全冻结低 1.2，新任务最高。', cls: 'good' },
  fe: { text: '完全不动：旧任务 57.1 最高，新任务 61.2 最低。', cls: '' },
};

const PX0 = 520;
const PX1 = 1010;
const PY0 = 54;
const PY1 = 228;
const OLD_MIN = 53;
const OLD_SPAN = 5;
const NEW_MIN = 60.5;
const NEW_SPAN = 4.7;

const xOf = (v: number) => PX0 + ((v - OLD_MIN) / OLD_SPAN) * (PX1 - PX0);
const yOf = (v: number) => PY1 - ((v - NEW_MIN) / NEW_SPAN) * (PY1 - PY0);

function arrowHead(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  dx: number,
  dy: number
) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - dx * 9 - dy * 4, y - dy * 9 + dx * 4);
  ctx.lineTo(x - dx * 9 + dy * 4, y - dy * 9 - dx * 4);
  ctx.closePath();
  ctx.fill();
}

function cup(
  ctx: CanvasRenderingContext2D,
  x: number,
  base: number,
  s: number,
  level: number,
  tint: string,
  accent: string
) {
  const w = 30 * s;
  const h = 34 * s;
  const top = base - h;
  ctx.fillStyle = C.porcelain;
  ctx.strokeStyle = C.deep;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(x - w / 2, top);
  ctx.lineTo(x + w / 2, top);
  ctx.lineTo(x + w * 0.36, base);
  ctx.lineTo(x - w * 0.36, base);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  const inset = 4;
  const lh = (h - 10) * clamp(level, 0, 1);
  const wTop = (w - 6) * (1 - 0.12 * (inset / h));
  const wBottom = (w - 6) * (1 - 0.12 * ((inset + lh) / h));
  ctx.fillStyle = tint;
  ctx.beginPath();
  ctx.moveTo(x - wTop / 2, top + inset);
  ctx.lineTo(x + wTop / 2, top + inset);
  ctx.lineTo(x + wBottom / 2, top + inset + lh);
  ctx.lineTo(x - wBottom / 2, top + inset + lh);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = accent;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(x, top, w / 2, 3.6 * s * 0.9, 0, 0, Math.PI * 2);
  ctx.stroke();
}

function render(
  ctx: CanvasRenderingContext2D,
  mode: Mode,
  level: number,
  band: number,
  ring: number
) {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);

  // 左：三只杯（旧样 / 当前 / 新样）
  ctx.fillStyle = C.table;
  ctx.fillRect(40, 206, 380, 12);
  ctx.strokeStyle = C.edge;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(40, 206);
  ctx.lineTo(420, 206);
  ctx.stroke();

  cup(ctx, 110, 206, 2.1, 0.82, 'rgba(122,74,34,0.95)', C.deep);
  cup(ctx, 225, 206, 2.1, level, TINT[mode], mode === 'lwf' ? C.green : C.deep);
  cup(ctx, 340, 206, 2.1, 0.62, 'rgba(169,113,58,0.55)', C.deep);

  // 右：旧–新平面
  ctx.strokeStyle = C.axis;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(PX0, PY1);
  ctx.lineTo(PX0, PY0 - 10);
  ctx.moveTo(PX0, PY1);
  ctx.lineTo(PX1 + 18, PY1);
  ctx.stroke();
  ctx.fillStyle = C.axis;
  arrowHead(ctx, PX1 + 18, PY1, 1, 0);
  arrowHead(ctx, PX0, PY0 - 10, 0, -1);

  for (let v = 54; v <= 58; v += 1) {
    ctx.beginPath();
    ctx.moveTo(xOf(v), PY1);
    ctx.lineTo(xOf(v), PY1 + 4);
    ctx.stroke();
  }
  for (let v = 61; v <= 65; v += 1) {
    const ty = yOf(v);
    ctx.beginPath();
    ctx.moveTo(PX0 - 4, ty);
    ctx.lineTo(PX0, ty);
    ctx.stroke();
  }

  // L2 的一小簇落点：按 Fig.7(b) 读出的四个位置，选中时整簇描边加深
  ctx.globalAlpha = band;
  ctx.strokeStyle = C.purple;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  L2_PTS.forEach((p, i) => {
    const px = xOf(p.old);
    const py = yOf(p.new);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.stroke();
  ctx.fillStyle = C.purple;
  L2_PTS.forEach((p) => {
    ctx.beginPath();
    ctx.arc(xOf(p.old), yOf(p.new), 5, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;

  if (mode === 'l2') {
    ctx.strokeStyle = C.purple;
    ctx.lineWidth = 1.6;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.arc(xOf(54.4), yOf(63.8), 46, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // 三个点
  POINTS.forEach((p) => {
    const active = mode === p.id;
    const px = xOf(p.old);
    const py = yOf(p.new);
    if (active) {
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 2.5;
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.arc(px, py, 8 + 7 * ring, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    ctx.fillStyle = p.color;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(px, py, active ? 8 : 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  });

  // 本帧只有两处文字
  ctx.fillStyle = C.ink;
  ctx.font = '15px "Segoe UI", system-ui, sans-serif';
  ctx.fillText('新任务', 524, 42);
  ctx.fillText('旧任务', 902, 256);
}

export const M5Constraint: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef({ from: LEVEL.ft, to: LEVEL.ft, bandFrom: 0.55, bandTo: 0.55, t0: 0 });
  const modeRef = useRef<Mode>('ft');
  const [mode, setMode] = useState<Mode>('ft');
  const [feedback, setFeedback] = useState(FEEDBACK.ft);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    animRef.current.t0 = performance.now() - 400;
    let raf: number | null = null;

    const tick = (now: number) => {
      const a = animRef.current;
      const p = clamp((now - a.t0) / 300, 0, 1);
      const e = easeOutCubic(p);
      const level = a.from + (a.to - a.from) * e;
      const band = a.bandFrom + (a.bandTo - a.bandFrom) * e;
      render(ctx, modeRef.current, level, band, e);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = window.requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf !== null) window.cancelAnimationFrame(raf);
      raf = null;
    };
    const start = () => {
      if (raf === null) raf = window.requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const pick = (next: Mode) => {
    if (next === modeRef.current) return;
    const a = animRef.current;
    const p = clamp((performance.now() - a.t0) / 300, 0, 1);
    const e = easeOutCubic(p);
    a.from = a.from + (a.to - a.from) * e;
    a.bandFrom = a.bandFrom + (a.bandTo - a.bandFrom) * e;
    a.to = LEVEL[next];
    a.bandTo = next === 'l2' ? 1 : 0.55;
    a.t0 = performance.now();
    modeRef.current = next;
    setMode(next);
    setFeedback(FEEDBACK[next]);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            className={`chip${mode === m.id ? ' selected' : ''}`}
            aria-pressed={mode === m.id}
            onClick={() => pick(m.id)}
          >
            {m.label}
          </button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M5Constraint;
