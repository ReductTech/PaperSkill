import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 560;
const H = 140;
const PERIOD = 3.0;

const STARS: Array<[number, number]> = [
  [30, 20],
  [84, 32],
  [140, 16],
  [200, 30],
  [340, 18],
  [400, 32],
  [470, 14],
  [530, 26],
  [24, 58],
  [352, 44],
];

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function clearScene(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#f5f8f0';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#b8c9a7';
  ctx.fillRect(0, H - 24, W, 24);
  ctx.strokeStyle = '#76906a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, H - 24);
  ctx.lineTo(W, H - 24);
  ctx.stroke();
}

function drawSky(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = 'rgba(104, 119, 143, 0.5)';
  for (const [x, y] of STARS) {
    ctx.beginPath();
    ctx.arc(x, y, 1.2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawScope(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#27446e';
  roundRect(ctx, 36, 84, 114, 24, 10);
  ctx.fill();
  ctx.fillStyle = '#21324a';
  roundRect(ctx, 150, 84, 92, 16, 8);
  ctx.fill();
  ctx.strokeStyle = '#92400e';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(95, 108);
  ctx.lineTo(95, 116);
  ctx.stroke();
}

function drawKnob(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number) {
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#d7deea';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.strokeStyle = '#92400e';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -9);
  ctx.stroke();
  ctx.restore();
  ctx.lineCap = 'butt';
}

function drawEyepiece(ctx: CanvasRenderingContext2D, focus: number) {
  const cx = 280;
  const cy = 64;
  const r = 42;
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#d7deea';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(184, 201, 167, 0.9)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, r - 6, 0, Math.PI * 2);
  ctx.stroke();

  const blur = Math.abs(focus);
  const sharp = blur < 0.3;
  const col = sharp ? '#228d5c' : '#c43f52';
  const len = 18 - blur * 7;
  ctx.globalAlpha = sharp ? 1 : 0.75;
  ctx.strokeStyle = col;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx - len, cy);
  ctx.lineTo(cx + len, cy);
  ctx.moveTo(cx, cy - len);
  ctx.lineTo(cx, cy + len);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, 3 + blur * 4, 0, Math.PI * 2);
  ctx.fillStyle = col;
  ctx.fill();
  if (sharp) {
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.arc(cx, cy, 9, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawFocusChart(ctx: CanvasRenderingContext2D, focus: number) {
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.strokeStyle = '#d7deea';
  ctx.lineWidth = 2;
  roundRect(ctx, 374, 14, 178, 100, 8);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = '#d7deea';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(388, 100);
  ctx.lineTo(536, 100);
  ctx.moveTo(388, 24);
  ctx.lineTo(388, 100);
  ctx.stroke();

  const apexX = 462;
  const apexY = 44;
  const k = 0.01022;
  ctx.strokeStyle = '#27446e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i <= 74; i++) {
    const dx = i * 2 - 74;
    const x = apexX + dx;
    const y = apexY + k * dx * dx;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  const dx = focus * 68;
  const dotX = apexX + dx;
  const dotY = clamp(apexY + k * dx * dx, 24, 100);
  const sharp = Math.abs(focus) < 0.3;
  ctx.fillStyle = sharp ? '#228d5c' : '#c43f52';
  ctx.beginPath();
  ctx.arc(dotX, dotY, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.translate(apexX, apexY);
  ctx.rotate(Math.PI / 4);
  ctx.fillStyle = '#228d5c';
  ctx.fillRect(-4.5, -4.5, 9, 9);
  ctx.restore();
}

export const Ana4: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
    let raf: number | null = null;
    const t0 = performance.now();

    const render = (t: number) => {
      clearScene(ctx);
      drawSky(ctx);
      const u = (t % PERIOD) / PERIOD;
      const focus = Math.sin(u * Math.PI * 2);
      drawScope(ctx);
      drawKnob(ctx, 60, 96, focus * 0.9);
      drawEyepiece(ctx, focus);
      drawFocusChart(ctx, focus);
    };

    const tick = (now: number) => {
      render((now - t0) / 1000);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf !== null) cancelAnimationFrame(raf);
      raf = null;
    };
    const start = () => {
      if (raf === null) raf = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />;
};

export default Ana4;
