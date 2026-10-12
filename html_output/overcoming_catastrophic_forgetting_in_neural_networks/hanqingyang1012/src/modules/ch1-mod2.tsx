import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §1 Module 1.2 (P4 chips): three ways to train task B after task A. Gray
// ellipse = 任务A低误差区, cream ellipse = 任务B低误差区, blue start point θ*_A.
// sgd dives straight into the cream region (red); uniform L2 barely moves
// (green, stays in gray, outside cream); EWC lands in the overlap (green).
// Chip clicks redraw the path with a 1.2 s eased stroke; two bare numbers
// (任务A误差 / 任务B误差, 方向性示意) update immediately.

const W = 1080;
const H = 280;

const BLUE = '#27446e';
const GREEN = '#228d5c';
const RED = '#c43f52';
const MUTED = '#68778f';
const BORDER = '#d7deea';
const GRAY_FILL = '#dfe3ea';
const GRAY_STROKE = '#a6aeba';
const CREAM_FILL = '#f3ead8';
const CREAM_STROKE = '#d8c69d';

type Mode = 'sgd' | 'l2' | 'ewc';

interface Pt {
  x: number;
  y: number;
}

const START: Pt = { x: 310, y: 100 };
// sgd control point = straight-line midpoint (keeps the quadratic a line)
const CTRL: Record<Mode, Pt> = {
  sgd: { x: 465, y: 135 },
  l2: { x: 330, y: 98 },
  ewc: { x: 390, y: 86 },
};
const END: Record<Mode, Pt> = {
  sgd: { x: 620, y: 170 },
  l2: { x: 348, y: 106 },
  ewc: { x: 430, y: 118 },
};
// [任务A误差, 任务B误差] — 方向性示意
const ERRS: Record<Mode, [number, number]> = {
  sgd: [0.82, 0.1],
  l2: [0.08, 0.55],
  ewc: [0.09, 0.12],
};

interface M2State {
  mode: Mode;
  t0: number;
}

function easeOut(k: number): number {
  return 1 - Math.pow(1 - k, 3);
}

function pointAt(mode: Mode, k: number): Pt {
  const c = CTRL[mode];
  const a = 1 - k;
  return {
    x: a * a * START.x + 2 * a * k * c.x + k * k * END[mode].x,
    y: a * a * START.y + 2 * a * k * c.y + k * k * END[mode].y,
  };
}

function drawSceneLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color: string,
  size = 20
) {
  ctx.fillStyle = color;
  ctx.font = `${size}px "Segoe UI", sans-serif`;
  ctx.fillText(text, x, y);
}

function drawLegend(
  ctx: CanvasRenderingContext2D,
  items: { label: string; color: string }[],
  x: number,
  y: number
) {
  ctx.font = '16px "Segoe UI", sans-serif';
  let yy = y;
  for (const item of items) {
    ctx.fillStyle = item.color;
    ctx.fillRect(x, yy - 11, 12, 12);
    ctx.fillStyle = MUTED;
    ctx.fillText(item.label, x + 18, yy);
    yy += 24;
  }
}

function drawEllipse(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  fill: string,
  stroke: string
) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawArrowHead(ctx: CanvasRenderingContext2D, x: number, y: number, ang: number, color: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(9, 0);
  ctx.lineTo(-4, 5);
  ctx.lineTo(-4, -5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function render(ctx: CanvasRenderingContext2D, s: M2State, now: number) {
  const progress = clamp((now - s.t0) / 1200, 0, 1);
  const k = easeOut(progress);
  const mode = s.mode;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = BORDER;
  ctx.lineWidth = 2;
  ctx.strokeRect(2, 2, W - 4, H - 4);

  drawEllipse(ctx, 310, 100, 135, 62, GRAY_FILL, GRAY_STROKE);
  drawEllipse(ctx, 520, 150, 160, 72, CREAM_FILL, CREAM_STROKE);

  // start point θ*_A (blue dot + label)
  ctx.fillStyle = BLUE;
  ctx.beginPath();
  ctx.arc(START.x, START.y, 6, 0, Math.PI * 2);
  ctx.fill();
  drawSceneLabel(ctx, 'θ*_A', START.x + 12, START.y + 6, BLUE, 20);

  // eased path stroke
  const color = mode === 'sgd' ? RED : GREEN;
  const pt = pointAt(mode, k);
  ctx.strokeStyle = color;
  ctx.lineWidth = 3.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(START.x, START.y);
  ctx.quadraticCurveTo(CTRL[mode].x, CTRL[mode].y, pt.x, pt.y);
  ctx.stroke();

  // arrowhead oriented along the local tangent
  const tx = (1 - k) * (CTRL[mode].x - START.x) + k * (END[mode].x - CTRL[mode].x);
  const ty = (1 - k) * (CTRL[mode].y - START.y) + k * (END[mode].y - CTRL[mode].y);
  drawArrowHead(ctx, pt.x, pt.y, Math.atan2(ty, tx), color);

  // legend
  drawLegend(
    ctx,
    [
      { label: '旧任务区', color: GRAY_FILL },
      { label: '新任务区', color: CREAM_FILL },
      { label: '起点', color: BLUE },
    ],
    760,
    40
  );

  // two bare numbers: 任务A误差 (red dot) / 任务B误差 (blue dot)
  const [ea, eb] = ERRS[mode];
  ctx.fillStyle = RED;
  ctx.fillRect(760, 122, 12, 12);
  drawSceneLabel(ctx, ea.toFixed(2), 780, 133, RED, 20);
  ctx.fillStyle = BLUE;
  ctx.fillRect(760, 150, 12, 12);
  drawSceneLabel(ctx, eb.toFixed(2), 780, 161, BLUE, 20);
}

const MODE_LABELS: Record<Mode, string> = {
  sgd: '普通 SGD',
  l2: '均匀 L2',
  ewc: 'EWC',
};

const MODE_FEEDBACK: Record<Mode, { text: string; cls: string }> = {
  sgd: { text: '只追任务 B：新任务学会了，旧任务区域被彻底抛下——遗忘发生。', cls: 'bad' },
  l2: { text: '所有权重都同样拉紧：旧任务保住了，但步子迈不动，新任务学不好。', cls: 'bad' },
  ewc: { text: '只对重要权重加弹簧：参数停在新旧任务都好的重叠区，两个任务都保住。', cls: 'good' },
};

export const Ch1Mod2: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<M2State>({ mode: 'sgd', t0: 0 });
  const rafRef = useRef<number | null>(null);
  const [mode, setMode] = useState<Mode>('sgd');
  const [feedback, setFeedback] = useState(MODE_FEEDBACK.sgd);

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
      render(ctx, stateRef.current, performance.now());
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
    const start = () => {
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const choose = (m: Mode) => {
    stateRef.current.mode = m;
    stateRef.current.t0 = performance.now();
    setMode(m);
    setFeedback(MODE_FEEDBACK[m]);
  };

  const [ea, eb] = ERRS[mode];

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        <button
          type="button"
          className={'chip' + (mode === 'sgd' ? ' selected' : '')}
          onClick={() => choose('sgd')}
        >
          {MODE_LABELS.sgd}
        </button>
        <button
          type="button"
          className={'chip' + (mode === 'l2' ? ' selected' : '')}
          onClick={() => choose('l2')}
        >
          {MODE_LABELS.l2}
        </button>
        <button
          type="button"
          className={'chip' + (mode === 'ewc' ? ' selected' : '')}
          onClick={() => choose('ewc')}
        >
          {MODE_LABELS.ewc}
        </button>
      </div>
      <div className="compare-row">
        <div className="compare-col">
          <div className="compare-label">任务A误差</div>
          <div className="val" style={{ color: ea > 0.5 ? RED : GREEN }}>
            {ea.toFixed(2)}
          </div>
        </div>
        <div className="compare-col">
          <div className="compare-label">任务B误差</div>
          <div className="val" style={{ color: eb > 0.5 ? RED : GREEN }}>
            {eb.toFixed(2)}
          </div>
        </div>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch1Mod2;
