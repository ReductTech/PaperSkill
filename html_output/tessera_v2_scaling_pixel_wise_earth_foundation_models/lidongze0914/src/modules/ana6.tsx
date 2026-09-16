import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, easeOutCubic } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 560;
const H = 140;
const CYCLE = 3200;
const FRAMES = 6;
const BOX_X = 78;
const BOX_Y = 74;
const PLATE_X = 430;
const PLATE_Y = 66;
const PLATE_S = 84;
const FLY_START = 0.08;
const FLY_STEP = 0.105;
const FLY_DUR = 0.085;

function clearScene(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#f5f8f0';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#b8c9a7';
  ctx.fillRect(0, H - 22, W, 22);
  ctx.strokeStyle = '#76906a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, H - 22);
  ctx.lineTo(W, H - 22);
  ctx.stroke();
}

function drawSky(ctx: CanvasRenderingContext2D, count: number): void {
  let s = 47;
  ctx.fillStyle = '#68778f';
  for (let i = 0; i < count; i += 1) {
    s = (s * 9301 + 49297) % 233280;
    const x = 16 + (s / 233280) * (W - 32);
    s = (s * 9301 + 49297) % 233280;
    const y = 10 + (s / 233280) * 32;
    ctx.beginPath();
    ctx.arc(x, y, 1.4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPlate(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string): void {
  const half = size / 2;
  ctx.fillStyle = 'rgba(215,222,234,0.25)';
  ctx.fillRect(x - half, y - half, size, size);
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.strokeRect(x - half, y - half, size, size);
}

function drawTarget(ctx: CanvasRenderingContext2D, x: number, y: number, color: string): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, 4, 0, Math.PI * 2);
  ctx.fill();
}

function drawBeam(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function renderScene(ctx: CanvasRenderingContext2D, now: number): void {
  const p = (now % CYCLE) / CYCLE;
  let landed = 0;
  for (let i = 0; i < FRAMES; i += 1) {
    if (p > FLY_START + i * FLY_STEP + FLY_DUR) landed += 1;
  }
  const fade = p < 0.86 ? 1 : 1 - clamp((p - 0.86) / 0.14, 0, 1);

  clearScene(ctx);
  drawSky(ctx, 6);
  ctx.save();
  ctx.globalAlpha = fade;

  for (let i = 0; i < 5; i += 1) {
    drawPlate(ctx, BOX_X + i * 3, BOX_Y + i * 3, 42, '#27446e');
  }

  for (let i = 0; i < FRAMES; i += 1) {
    const local = (p - (FLY_START + i * FLY_STEP)) / FLY_DUR;
    if (local > 0 && local < 1) {
      const t = easeOutCubic(local);
      drawPlate(ctx, lerp(BOX_X + 24, PLATE_X, t), lerp(BOX_Y - 4, PLATE_Y, t), 34, '#27446e');
    }
  }

  drawPlate(ctx, PLATE_X, PLATE_Y, PLATE_S, '#27446e');

  const noise = Math.round(26 * (1 - landed / FRAMES));
  let seed = 17;
  ctx.fillStyle = '#68778f';
  for (let i = 0; i < noise; i += 1) {
    seed = (seed * 9301 + 49297) % 233280;
    const nx = PLATE_X - PLATE_S / 2 + 8 + (seed / 233280) * (PLATE_S - 16);
    seed = (seed * 9301 + 49297) % 233280;
    const ny = PLATE_Y - PLATE_S / 2 + 8 + (seed / 233280) * (PLATE_S - 16);
    ctx.fillRect(nx, ny, 1.5, 1.5);
  }

  if (landed >= FRAMES) {
    drawTarget(ctx, PLATE_X, PLATE_Y, '#228d5c');
    drawTarget(ctx, PLATE_X + 30, PLATE_Y + 30, '#228d5c');
    drawBeam(ctx, PLATE_X + 30, PLATE_Y + 30, PLATE_X + 58, PLATE_Y + 42, '#228d5c');
  } else {
    ctx.save();
    ctx.globalAlpha = fade * (0.2 + (0.8 * landed) / FRAMES);
    ctx.fillStyle = '#27446e';
    ctx.beginPath();
    ctx.arc(PLATE_X, PLATE_Y, 2 + (4 * landed) / FRAMES, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}

export const Ana6: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
      aria-label="曝光帧逐张叠到成像板上的动画"
    />
  );
};

export default Ana6;
