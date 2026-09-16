import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, easeOutCubic } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 560;
const H = 140;
const LOOP = 3.4;
const ARRIVE = 2.2;
const HOLD_END = 2.85;
const START_X = 74;
const TARGET_X = 505;

const LANES_Y = [30, 58, 86, 114];
const APERTURES = [9, 7, 4, 8];
const REACHES = [0.55, 0.72, 1, 0.8];

function clearScene(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#f5f8f0';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#b8c9a7';
  ctx.fillRect(0, H - 16, W, 16);
  ctx.strokeStyle = '#76906a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, H - 16);
  ctx.lineTo(W, H - 16);
  ctx.stroke();
}

function drawScope(ctx: CanvasRenderingContext2D, x: number, y: number, aperture: number) {
  ctx.fillStyle = '#27446e';
  ctx.fillRect(x, y - aperture / 2, 34, aperture);
  ctx.beginPath();
  ctx.arc(x + 34, y, aperture * 0.7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(x - 5, y - 3, 5, 6);
}

function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.lineTo(x + r * 0.45, y);
  ctx.lineTo(x, y + r);
  ctx.lineTo(x - r * 0.45, y);
  ctx.closePath();
  ctx.fill();
}

function drawTrophy(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = '#f07e47';
  ctx.beginPath();
  ctx.moveTo(x - 7, y - 10);
  ctx.lineTo(x + 7, y - 10);
  ctx.lineTo(x + 4, y - 2);
  ctx.lineTo(x - 4, y - 2);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(x - 1.5, y - 2, 3, 5);
  ctx.fillRect(x - 5, y + 3, 10, 2.5);
}

function render(ctx: CanvasRenderingContext2D, t: number) {
  clearScene(ctx);
  const tt = t % LOOP;

  ctx.strokeStyle = '#f07e47';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(70, 12);
  ctx.lineTo(70, 128);
  ctx.stroke();

  const arrived = tt >= ARRIVE;
  drawStar(ctx, TARGET_X, 70, 13, arrived ? '#228d5c' : '#68778f');

  const extend = clamp(tt / ARRIVE, 0, 1);
  const retract =
    tt > HOLD_END ? 1 - easeOutCubic(clamp((tt - HOLD_END) / 0.45, 0, 1)) : 1;

  for (let i = 0; i < 4; i++) {
    const y = LANES_Y[i];
    drawScope(ctx, 40, y, APERTURES[i]);
    const winner = i === 2;
    const p = (winner ? easeOutCubic(extend) : extend * REACHES[i]) * retract;
    const tipX = lerp(START_X, TARGET_X, p);
    const tipY = lerp(y, 70, p);
    ctx.strokeStyle = winner ? '#228d5c' : '#68778f';
    ctx.lineWidth = winner ? 3 : 2;
    ctx.beginPath();
    ctx.moveTo(START_X, y);
    ctx.lineTo(tipX, tipY);
    ctx.stroke();
  }

  if (arrived) drawTrophy(ctx, TARGET_X, 42);
}

export const Ana10: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const t0 = performance.now();
    let raf: number | null = null;
    const tick = () => {
      render(ctx, (performance.now() - t0) / 1000);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const start = () => {
      if (raf === null) raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf !== null) cancelAnimationFrame(raf);
      raf = null;
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
    </div>
  );
};

export default Ana10;
