import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, easeOutCubic } from '../lib/canvasKit';
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

const COLS = [80, 200, 320, 440];
const APERTURES = [6, 9, 12, 15];
const RINGS = [44, 33, 22, 12];
const SELECTED = 1;
const CY = 128;

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

function drawTube(ctx: CanvasRenderingContext2D, cx: number, aperture: number) {
  const y = 52;
  ctx.fillStyle = '#27446e';
  roundRect(ctx, cx - 44, y - aperture, 88, aperture * 2, aperture);
  ctx.fill();
  ctx.strokeStyle = '#92400e';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(cx, y + aperture);
  ctx.lineTo(cx, y + aperture + 9);
  ctx.moveTo(cx - 11, y + aperture + 9);
  ctx.lineTo(cx + 11, y + aperture + 9);
  ctx.stroke();
}

function drawFamily(
  ctx: CanvasRenderingContext2D,
  cx: number,
  selected: boolean,
  u: number,
  p: number
) {
  for (let j = 0; j < RINGS.length; j++) {
    const s = RINGS[j];
    const isPrefix32 = j === 2;
    ctx.strokeStyle = isPrefix32 ? '#228d5c' : '#27446e';
    ctx.globalAlpha = isPrefix32 ? 1 : 0.85 - j * 0.15;
    ctx.lineWidth = isPrefix32 ? 3 : 2;
    roundRect(ctx, cx - s / 2, CY - s / 2, s, s, 3);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#228d5c';
  ctx.beginPath();
  ctx.arc(cx, CY, 2.5, 0, Math.PI * 2);
  ctx.fill();

  if (!selected) return;
  const r = 32 + 1.5 * Math.sin(u * Math.PI * 2);
  ctx.globalAlpha = clamp(p, 0, 1);
  ctx.strokeStyle = '#f07e47';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, CY, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx, CY - r - 8);
  ctx.lineTo(cx, CY - r + 2);
  ctx.moveTo(cx, CY + r - 2);
  ctx.lineTo(cx, CY + r + 8);
  ctx.moveTo(cx - r - 8, CY);
  ctx.lineTo(cx - r + 2, CY);
  ctx.moveTo(cx + r - 2, CY);
  ctx.lineTo(cx + r + 8, CY);
  ctx.stroke();
  ctx.fillStyle = '#21324a';
  ctx.font = '18px "Segoe UI", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('32', cx + r + 10, CY + 6);
  ctx.globalAlpha = 1;
}

export const HeroNew: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
      const p = easeOutCubic(clamp(u / 0.4, 0, 1));

      clearScene(ctx);
      drawSky(ctx);

      for (let i = 0; i < COLS.length; i++) {
        drawTube(ctx, COLS[i], APERTURES[i]);
      }
      for (let i = 0; i < COLS.length; i++) {
        drawFamily(ctx, COLS[i], i === SELECTED, u, p);
      }
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

export default HeroNew;
