import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, easeOutCubic } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 560;
const H = 140;
const CYCLE = 3400;
const REF_X = 150;
const REF_Y = 62;
const PLATE = 72;
const START_X = 430;
const START_Y = 88;
const CTRL_X = 300;
const CTRL_Y = 8;

interface Pt {
  x: number;
  y: number;
}

const MATCHED: Pt[] = [
  { x: -20, y: -14 },
  { x: -8, y: 10 },
  { x: 2, y: -20 },
  { x: 12, y: 4 },
  { x: 20, y: -4 },
];

const REF_EXTRA: Pt[] = [
  { x: -24, y: 18 },
  { x: 8, y: 16 },
  { x: 24, y: 14 },
];

function scatter(count: number): Pt[] {
  const out: Pt[] = [];
  let s = 71;
  for (let i = 0; i < count; i += 1) {
    s = (s * 9301 + 49297) % 233280;
    const x = -26 + (s / 233280) * 52;
    s = (s * 9301 + 49297) % 233280;
    const y = -26 + (s / 233280) * 52;
    out.push({ x, y });
  }
  return out;
}

const DOTS_8 = scatter(3);
const DOTS_16 = scatter(11);

function clearScene(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#f5f8f0';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#b8c9a7';
  ctx.fillRect(0, H - 18, W, 18);
  ctx.strokeStyle = '#76906a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, H - 18);
  ctx.lineTo(W, H - 18);
  ctx.stroke();
}

function drawSky(ctx: CanvasRenderingContext2D): void {
  let s = 29;
  ctx.fillStyle = '#68778f';
  for (let i = 0; i < 6; i += 1) {
    s = (s * 9301 + 49297) % 233280;
    const x = 14 + (s / 233280) * (W - 28);
    s = (s * 9301 + 49297) % 233280;
    const y = 8 + (s / 233280) * 30;
    ctx.beginPath();
    ctx.arc(x, y, 1.3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPlate(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string
): void {
  const half = size / 2;
  ctx.fillStyle = 'rgba(215,222,234,0.25)';
  ctx.fillRect(x - half, y - half, size, size);
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.strokeRect(x - half, y - half, size, size);
}

function drawDot(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color: string
): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function drawCornerFrame(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
  const h = size / 2 + 10;
  const len = 10;
  const corners: [number, number, number, number][] = [
    [-h, -h, 1, 1],
    [h, -h, -1, 1],
    [h, h, -1, -1],
    [-h, h, 1, -1],
  ];
  ctx.strokeStyle = '#68778f';
  ctx.lineWidth = 2;
  corners.forEach(([cx, cy, sx, sy]) => {
    ctx.beginPath();
    ctx.moveTo(x + cx + sx * len, y + cy);
    ctx.lineTo(x + cx, y + cy);
    ctx.lineTo(x + cx, y + cy + sy * len);
    ctx.stroke();
  });
}

function drawHand(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  const knuckles: Pt[] = [
    { x: 18, y: -30 },
    { x: 28, y: -33 },
    { x: 37, y: -30 },
  ];
  knuckles.forEach((k) => drawDot(ctx, x + k.x, y + k.y, 4.5, '#92400e'));
  drawDot(ctx, x + 12, y - 18, 4.5, '#92400e');
  drawDot(ctx, x + 26, y - 24, 9, '#92400e');
}

function bezier(t: number): Pt {
  const a: Pt = { x: lerp(START_X, CTRL_X, t), y: lerp(START_Y, CTRL_Y, t) };
  const b: Pt = { x: lerp(CTRL_X, REF_X, t), y: lerp(CTRL_Y, REF_Y, t) };
  return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) };
}

function renderScene(ctx: CanvasRenderingContext2D, now: number): void {
  const p = (now % CYCLE) / CYCLE;
  let q: number;
  if (p < 0.08) q = 0;
  else if (p < 0.4) q = easeOutCubic((p - 0.08) / 0.32);
  else if (p < 0.62) q = 1;
  else if (p < 0.88) q = 1 - easeOutCubic((p - 0.62) / 0.26);
  else q = 0;
  const viewLength = Math.floor(now / CYCLE) % 2 === 0 ? 8 : 16;
  const stripFade = p > 0.62 ? clamp(1 - (p - 0.62) / 0.24, 0, 1) : 1;
  const pos = bezier(q);

  clearScene(ctx);
  drawSky(ctx);
  drawCornerFrame(ctx, REF_X, REF_Y, PLATE);
  drawPlate(ctx, REF_X, REF_Y, PLATE, '#27446e');
  MATCHED.forEach((s) => drawDot(ctx, REF_X + s.x, REF_Y + s.y, 3.2, '#27446e'));
  REF_EXTRA.forEach((s) => drawDot(ctx, REF_X + s.x, REF_Y + s.y, 3.2, '#27446e'));

  const dots = viewLength === 8 ? DOTS_8 : DOTS_16;
  drawPlate(ctx, pos.x, pos.y, PLATE, q > 0.95 ? '#228d5c' : '#27446e');
  MATCHED.forEach((s) => drawDot(ctx, pos.x + s.x, pos.y + s.y, 3.2, '#27446e'));
  dots.forEach((s) => drawDot(ctx, pos.x + s.x, pos.y + s.y, 2.2, '#68778f'));

  if (q > 0.5) {
    const t = clamp((q - 0.5) / 0.5, 0, 1);
    ctx.save();
    ctx.globalAlpha = t;
    ctx.strokeStyle = '#228d5c';
    ctx.lineWidth = 2.5;
    MATCHED.forEach((s) => {
      ctx.beginPath();
      ctx.arc(pos.x + s.x, pos.y + s.y, 5.5, 0, Math.PI * 2);
      ctx.stroke();
      drawDot(ctx, pos.x + s.x, pos.y + s.y, 3.6, '#228d5c');
    });
    ctx.restore();
  }

  const stripW = 8 * 14 + 7 * 3;
  const stripX = REF_X - stripW / 2;
  for (let i = 0; i < 8; i += 1) {
    const x = stripX + i * 17;
    ctx.globalAlpha = 0.85 * stripFade * (1 - q);
    ctx.fillStyle = '#c43f52';
    ctx.fillRect(x, 108, 14, 10);
    ctx.globalAlpha = 0.85 * stripFade * q;
    ctx.fillStyle = '#228d5c';
    ctx.fillRect(x, 108, 14, 10);
  }
  ctx.globalAlpha = 1;

  drawHand(ctx, pos.x, pos.y);
}

export const Ana7: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

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
      renderScene(ctx, performance.now());
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
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

  return (
    <canvas
      id={`cv-${chapterId}-${moduleId}`}
      ref={canvasRef}
      width={W}
      height={H}
      aria-label="戴手套的手把第二张同天区底片推近参考片并对齐的动画"
    />
  );
};

export default Ana7;
