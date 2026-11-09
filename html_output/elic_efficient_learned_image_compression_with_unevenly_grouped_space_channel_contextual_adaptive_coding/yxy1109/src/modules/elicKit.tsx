import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp } from '../lib/canvasKit';

export const C = {
  bg: '#f5f8f0',
  env: '#b8c9a7',
  depth: '#76906a',
  support: '#92400e',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#d97706',
  purple: '#7c3aed',
  ink: '#21324a',
  muted: '#68778f',
  axis: '#d7deea',
};

export function setupResponsive(canvas: HTMLCanvasElement, w: number, h: number) {
  const ctx = setupCanvas(canvas, w, h);
  canvas.style.width = '100%';
  canvas.style.height = 'auto';
  canvas.style.aspectRatio = `${w} / ${h}`;
  return ctx;
}

export function useElicCanvas(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  w: number,
  h: number,
  draw: (ctx: CanvasRenderingContext2D, t: number) => void
) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupResponsive(canvas, w, h);
    } catch {
      return;
    }
    let raf: number | null = null;
    const startAt = performance.now();
    const tick = (now: number) => {
      ctx.clearRect(0, 0, w, h);
      draw(ctx, now - startAt);
      canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = null;
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, [canvasRef, w, h, draw]);
}

export function roundRect(
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

export function drawPhoto(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  clarity: number,
  tone: 'blue' | 'green' | 'red' | 'neutral' = 'neutral'
) {
  ctx.save();
  roundRect(ctx, x, y, w, h, 6);
  ctx.fillStyle = C.bg;
  ctx.fill();
  ctx.clip();

  const sky = ctx.createLinearGradient(0, y, 0, y + h);
  sky.addColorStop(0, '#dce8f2');
  sky.addColorStop(1, '#eef4df');
  ctx.fillStyle = sky;
  ctx.fillRect(x, y, w, h);

  ctx.fillStyle = '#f4c45b';
  ctx.beginPath();
  ctx.arc(x + w * 0.78, y + h * 0.28, h * 0.12, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = C.env;
  ctx.beginPath();
  ctx.moveTo(x, y + h * 0.72);
  const peaks = 1 + Math.round(clarity * 3);
  for (let i = 0; i <= peaks; i++) {
    const px = x + (w * i) / peaks;
    const ph = y + h * (0.72 - 0.12 - (i % 2) * 0.22 * clarity);
    ctx.lineTo(px, ph);
  }
  ctx.lineTo(x + w, y + h * 0.72);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = C.depth;
  ctx.fillRect(x, y + h * 0.8, w, h * 0.2);

  if (clarity < 0.55) {
    ctx.fillStyle = 'rgba(245, 248, 240, 0.5)';
    ctx.fillRect(x, y, w, h);
  }
  ctx.restore();

  roundRect(ctx, x, y, w, h, 6);
  ctx.lineWidth = 2;
  ctx.strokeStyle =
    tone === 'blue' ? C.blue : tone === 'green' ? C.green : tone === 'red' ? C.red : C.axis;
  ctx.stroke();
}

export function drawBars(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  values: { v: number; color: string; label?: string }[],
  max: number
) {
  const gap = 6;
  const bw = (w - gap * (values.length - 1)) / values.length;
  values.forEach((it, i) => {
    const bh = clamp(it.v / max, 0, 1) * h;
    const bx = x + i * (bw + gap);
    ctx.fillStyle = it.color;
    roundRect(ctx, bx, y + h - bh, bw, bh, 3);
    ctx.fill();
    if (it.label) {
      ctx.fillStyle = C.muted;
      ctx.font = '16px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(it.label, bx + bw / 2, y + h + 18);
    }
  });
}

export function drawAxisLabels(ctx: CanvasRenderingContext2D, text: string, x: number, y: number) {
  ctx.fillStyle = C.ink;
  ctx.font = '18px "Segoe UI", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(text, x, y);
}

export function drawGaussian(
  ctx: CanvasRenderingContext2D,
  cx: number,
  baseY: number,
  amp: number,
  sigma: number
) {
  ctx.beginPath();
  for (let i = 0; i <= 80; i++) {
    const x = cx - 180 + (360 * i) / 80;
    const z = (x - cx) / sigma;
    const y = baseY - amp * Math.exp(-0.5 * z * z);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.lineTo(cx + 180, baseY);
  ctx.lineTo(cx - 180, baseY);
  ctx.closePath();
}

export function ease(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}
