import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, lerp, easeOutCubic } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 560;
const H = 140;
const LOOP = 3.2;
const CX = 290;
const R = 30;

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

function drawDome(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, Math.PI, 0);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(x - r - 2, y, 2 * r + 4, 4);
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

function drawDisc(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  rot: number,
  rim: string,
  fill: string | null
) {
  if (fill) {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = rim;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
  for (let i = 0; i < 3; i++) {
    const a = rot + (i * Math.PI) / 3;
    ctx.beginPath();
    ctx.moveTo(x - Math.cos(a) * r, y - Math.sin(a) * r);
    ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    ctx.stroke();
  }
}

function render(ctx: CanvasRenderingContext2D, t: number) {
  clearScene(ctx);
  ctx.strokeStyle = '#76906a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(CX - 110, 124);
  ctx.lineTo(CX + 110, 124);
  ctx.stroke();
  drawDome(ctx, 74, 108, 22, '#27446e');

  const p = (t % LOOP) / LOOP;
  let rot: number;
  if (p < 0.5) rot = lerp(-1.0, 0, easeOutCubic(p / 0.5));
  else if (p < 0.78) rot = 0;
  else rot = lerp(0, -1.0, (p - 0.78) / 0.22);

  const refY = 86;
  const chartY = 60;
  drawDisc(ctx, CX, refY, R, 0, '#27446e', '#d7deea');
  for (let i = 0; i < 6; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 3;
    drawStar(ctx, CX + Math.cos(a) * 19, refY + Math.sin(a) * 19, 6, '#228d5c');
  }

  ctx.globalAlpha = 0.85;
  drawDisc(ctx, CX, chartY, R, rot, '#21324a', '#f5f8f0');
  ctx.globalAlpha = 1;
  const tt = t % LOOP;
  for (let i = 0; i < 6; i++) {
    const a = -Math.PI / 2 + rot + (i * Math.PI) / 3;
    const green = tt > 1.6 + i * 0.1 && tt < 2.55;
    drawStar(
      ctx,
      CX + Math.cos(a) * 19,
      chartY + Math.sin(a) * 19,
      6,
      green ? '#228d5c' : '#c43f52'
    );
  }
  const kx = CX + Math.sin(rot) * R;
  const ky = chartY - Math.cos(rot) * R;
  ctx.fillStyle = '#92400e';
  ctx.beginPath();
  ctx.arc(kx, ky, 4, 0, Math.PI * 2);
  ctx.fill();
}

export const Ana9: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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

export default Ana9;
