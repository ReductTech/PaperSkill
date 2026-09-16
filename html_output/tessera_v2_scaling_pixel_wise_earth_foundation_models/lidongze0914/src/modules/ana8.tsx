import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, easeOutCubic } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §8 analogy — a hand slides two half star-chart plates together along the seam;
// the seam stars line up and the joined chart glows green, then the half is pulled
// apart and the loop repeats. Automatic loop, no controls.

const W = 560;
const H = 140;
const CYCLE = 3200;
const SEAM_X = 230;
const PLATE_Y = 66;
const HALF_W = 32;
const HALF_H = 36;
const REST_DX = 136;

const BLUE = '#27446e';
const GREEN = '#228d5c';
const PURPLE = '#7c3aed';
const BROWN = '#92400e';

interface Pt {
  x: number;
  y: number;
}

function scatter(count: number, seed: number, minX: number, maxX: number): Pt[] {
  const out: Pt[] = [];
  let s = seed;
  for (let i = 0; i < count; i += 1) {
    s = (s * 9301 + 49297) % 233280;
    const x = minX + (s / 233280) * (maxX - minX);
    s = (s * 9301 + 49297) % 233280;
    const y = -HALF_H + 8 + (s / 233280) * (HALF_H * 2 - 16);
    out.push({ x, y });
  }
  return out;
}

const LEFT_DOTS = scatter(7, 41, -HALF_W + 7, -6);
const RIGHT_DOTS = scatter(7, 97, 6, HALF_W - 7);
const SEAM_Y = [-18, 2, 20];

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
  for (let i = 0; i < 7; i += 1) {
    s = (s * 9301 + 49297) % 233280;
    const x = 16 + (s / 233280) * (W - 32);
    s = (s * 9301 + 49297) % 233280;
    const y = 8 + (s / 233280) * 26;
    ctx.beginPath();
    ctx.arc(x, y, 1.3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawCornerFrame(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
  const hw = HALF_W + 10;
  const hh = HALF_H + 10;
  const len = 11;
  const corners: [number, number, number, number][] = [
    [-hw, -hh, 1, 1],
    [hw, -hh, -1, 1],
    [hw, hh, -1, -1],
    [-hw, hh, 1, -1],
  ];
  ctx.strokeStyle = '#76906a';
  ctx.lineWidth = 2;
  corners.forEach(([x, y, sx, sy]) => {
    ctx.beginPath();
    ctx.moveTo(cx + x + sx * len, cy + y);
    ctx.lineTo(cx + x, cy + y);
    ctx.lineTo(cx + x, cy + y + sy * len);
    ctx.stroke();
  });
}

function drawPlate(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string
): void {
  ctx.fillStyle = 'rgba(215,222,234,0.25)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.strokeRect(x, y, w, h);
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

function drawHand(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.fillStyle = BROWN;
  ctx.beginPath();
  ctx.ellipse(x + 30, y + 8, 20, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x, y, 10, 13, 0, 0, Math.PI * 2);
  ctx.fill();
  [-10, -1, 8].forEach((dy) => {
    ctx.beginPath();
    ctx.ellipse(x - 10, y + dy, 6, 4, 0, 0, Math.PI * 2);
    ctx.fill();
  });
}

function renderScene(ctx: CanvasRenderingContext2D, now: number): void {
  const p = (now % CYCLE) / CYCLE;
  let q: number;
  if (p < 0.1) q = 0;
  else if (p < 0.42) q = easeOutCubic((p - 0.1) / 0.32);
  else if (p < 0.62) q = 1;
  else if (p < 0.88) q = 1 - easeOutCubic((p - 0.62) / 0.26);
  else q = 0;

  const dx = REST_DX * (1 - q);
  const joined = q > 0.985;
  const chart = joined ? GREEN : BLUE;
  const glow = joined ? Math.min(1, (q - 0.985) * 60) : 0;
  const rx = SEAM_X + dx;

  clearScene(ctx);
  drawSky(ctx);
  drawCornerFrame(ctx, SEAM_X, PLATE_Y);

  drawPlate(ctx, SEAM_X - HALF_W, PLATE_Y - HALF_H, HALF_W, HALF_H * 2, chart);
  LEFT_DOTS.forEach((d) => drawDot(ctx, SEAM_X + d.x, PLATE_Y + d.y, 2.8, chart));

  drawPlate(ctx, rx, PLATE_Y - HALF_H, HALF_W, HALF_H * 2, chart);
  RIGHT_DOTS.forEach((d) => drawDot(ctx, rx + d.x, PLATE_Y + d.y, 2.8, chart));

  SEAM_Y.forEach((y) => {
    drawDot(ctx, SEAM_X - 2, PLATE_Y + y, 3.4, chart);
    drawDot(ctx, rx + 2, PLATE_Y + y, 3.4, chart);
    if (glow > 0) {
      ctx.strokeStyle = GREEN;
      ctx.globalAlpha = glow;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(SEAM_X, PLATE_Y + y, 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  });

  ctx.strokeStyle = PURPLE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(rx, PLATE_Y - HALF_H);
  ctx.lineTo(rx, PLATE_Y + HALF_H);
  ctx.stroke();

  drawHand(ctx, rx + HALF_W + 8, PLATE_Y + 10);
}

export const Ana8: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
      aria-label="一只手把两张半张星图沿中缝推拢拼成一张完整星图的动画"
    />
  );
};

export default Ana8;
