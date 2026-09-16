import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, easeOutCubic } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 560;
const H = 140;
const PERIOD = 3.2;

const STARS: Array<[number, number]> = [
  [26, 18],
  [76, 30],
  [132, 14],
  [196, 26],
  [252, 16],
  [318, 30],
  [392, 14],
  [452, 28],
  [516, 18],
  [546, 46],
  [40, 52],
  [500, 58],
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

function drawPlate(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, blurry: boolean) {
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#d7deea';
  ctx.lineWidth = 2;
  roundRect(ctx, x, y, s, s, 6);
  ctx.fill();
  ctx.stroke();
  const specks: Array<[number, number]> = [
    [0.22, 0.28],
    [0.5, 0.18],
    [0.76, 0.32],
    [0.34, 0.56],
    [0.62, 0.52],
    [0.28, 0.76],
    [0.58, 0.78],
    [0.8, 0.64],
  ];
  for (const [fx, fy] of specks) {
    const sx = x + fx * s;
    const sy = y + fy * s;
    if (blurry) {
      ctx.fillStyle = 'rgba(33, 50, 74, 0.16)';
      ctx.beginPath();
      ctx.arc(sx, sy, 5.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = '#21324a';
      ctx.beginPath();
      ctx.arc(sx, sy, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawMeter(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#d7deea';
  ctx.lineWidth = 2;
  roundRect(ctx, x, y, 46, 40, 5);
  ctx.fill();
  ctx.stroke();
  const cx = x + 23;
  const cy = y + 27;
  ctx.strokeStyle = '#68778f';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, 13, Math.PI, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = '#c43f52';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx - 11, cy - 7);
  ctx.stroke();
}

function drawMagnifier(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.strokeStyle = '#27446e';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y, 20, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(39, 68, 110, 0.35)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, 14, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = '#92400e';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x + 14, y + 14);
  ctx.lineTo(x + 25, y + 25);
  ctx.stroke();
  ctx.lineCap = 'butt';
}

export const Ana3: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
      const plateY = 26;
      const plateS = 62;
      drawPlate(ctx, 78, plateY, plateS, true);
      drawPlate(ctx, 414, plateY, plateS, false);
      drawMeter(ctx, 502, 26);

      const u = (t % PERIOD) / PERIOD;
      const p = u < 0.5 ? easeOutCubic(u / 0.5) : easeOutCubic((1 - u) / 0.5);
      const mx = lerp(112, 446, p);
      const my = plateY + plateS / 2 + Math.sin(u * Math.PI * 2) * 3;
      const ringAlpha =
        u > 0.44 && u < 0.96
          ? clamp((u - 0.44) / 0.06, 0, 1) * clamp((0.96 - u) / 0.06, 0, 1)
          : 0;
      if (ringAlpha > 0) {
        ctx.strokeStyle = `rgba(34, 141, 92, ${ringAlpha.toFixed(3)})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(445, plateY + plateS / 2, 30, 0, Math.PI * 2);
        ctx.stroke();
      }
      drawMagnifier(ctx, mx, my);
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

export default Ana3;
