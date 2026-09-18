import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 520;
const H = 200;
const PERIOD = 2.8;

const STARS: Array<[number, number]> = [
  [22, 18],
  [58, 44],
  [96, 16],
  [140, 30],
  [196, 14],
  [244, 38],
  [286, 16],
  [338, 26],
  [384, 42],
  [428, 18],
  [470, 34],
  [502, 52],
  [34, 76],
  [490, 84],
  [28, 118],
  [494, 122],
  [64, 158],
  [452, 156],
  [258, 168],
];

const PLATE_X = 152;
const PLATE_Y = 30;
const PLATE_W = 216;
const PLATE_H = 140;

const STRIPES = [0.14, 0.3, 0.46, 0.62, 0.86];
const SEAMS_Y = [0.3, 0.62];

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
    ctx.arc(x, y, 1.3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPlate(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#d7deea';
  ctx.lineWidth = 2;
  roundRect(ctx, PLATE_X, PLATE_Y, PLATE_W, PLATE_H, 8);
  ctx.fill();
  ctx.stroke();

  const specks: Array<[number, number]> = [
    [0.18, 0.2],
    [0.42, 0.14],
    [0.7, 0.24],
    [0.3, 0.46],
    [0.56, 0.52],
    [0.82, 0.44],
    [0.24, 0.72],
    [0.5, 0.8],
    [0.76, 0.68],
  ];
  ctx.fillStyle = '#68778f';
  for (const [fx, fy] of specks) {
    ctx.beginPath();
    ctx.arc(PLATE_X + fx * PLATE_W, PLATE_Y + fy * PLATE_H, 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

export const HeroOld: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
      const u = (t % PERIOD) / PERIOD;
      const p = clamp((u - 0.08) / 0.62, 0, 1);

      clearScene(ctx);
      drawSky(ctx);
      drawPlate(ctx);

      STRIPES.forEach((fx, i) => {
        const a = clamp((p - i * 0.06) / 0.5, 0, 1) * 0.55;
        if (a <= 0) return;
        ctx.strokeStyle = `rgba(196, 63, 82, ${a.toFixed(3)})`;
        ctx.lineWidth = i % 2 === 0 ? 3 : 2;
        ctx.beginPath();
        ctx.moveTo(PLATE_X + fx * PLATE_W, PLATE_Y + 4);
        ctx.lineTo(PLATE_X + fx * PLATE_W, PLATE_Y + PLATE_H - 4);
        ctx.stroke();
      });

      SEAMS_Y.forEach((fy, i) => {
        const a = clamp((p - 0.25 - i * 0.12) / 0.5, 0, 1) * 0.4;
        if (a <= 0) return;
        ctx.strokeStyle = `rgba(104, 119, 143, ${a.toFixed(3)})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(PLATE_X + 4, PLATE_Y + fy * PLATE_H);
        ctx.lineTo(PLATE_X + PLATE_W - 4, PLATE_Y + fy * PLATE_H);
        ctx.stroke();
      });

      const seamA = clamp((p - 0.45) / 0.5, 0, 1);
      if (seamA > 0) {
        ctx.strokeStyle = `rgba(104, 119, 143, ${(seamA * 0.4).toFixed(3)})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(PLATE_X + 0.72 * PLATE_W, PLATE_Y + 4);
        ctx.lineTo(PLATE_X + 0.72 * PLATE_W, PLATE_Y + PLATE_H - 4);
        ctx.stroke();
      }

      ctx.fillStyle = '#21324a';
      ctx.font = '20px "Segoe UI", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('128', PLATE_X + 14, PLATE_Y + PLATE_H - 14);
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

export default HeroOld;
