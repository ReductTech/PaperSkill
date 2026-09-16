import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, easeInOutQuad } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Chapter 10 analogy — 两张修复好的照片并排显影，一张走到清晰（并排显影，高下判）.
// Direct two-photo comparison: one moving subject per panel (the developer ripple), both
// panels run on the same time basis. Border colour alone labels the two sides
// (red #c43f52 stops at 40% clarity, green #228d5c develops to full clarity + green check).

const W = 560;
const H = 140;
const PERIOD = 3400;

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

function clearScene(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.fillStyle = '#f5f8f0';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#b8c9a7';
  ctx.fillRect(0, h - 26, w, 26);
  ctx.strokeStyle = '#76906a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, h - 23);
  ctx.lineTo(w, h - 23);
  ctx.stroke();
}

/** Deterministic pseudo-random so damage speckles never flicker between frames. */
function hash(i: number): number {
  const v = Math.sin(i * 127.1 + 13.7) * 43758.5453;
  return v - Math.floor(v);
}

function drawPhoto(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  damage: number,
  stateColor?: string
): void {
  const border = stateColor ?? '#d7deea';
  roundRectPath(ctx, x, y, w, h, 6);
  ctx.fillStyle = '#ffffff';
  ctx.fill();

  const inset = 5;
  ctx.save();
  roundRectPath(ctx, x + inset, y + inset, w - inset * 2, h - inset * 2, 3);
  ctx.clip();

  const d = clamp(damage, 0, 1);
  const specks = Math.round(140 * d);
  for (let i = 0; i < specks; i++) {
    const px = x + inset + hash(i * 3 + 1) * (w - inset * 2);
    const py = y + inset + hash(i * 3 + 2) * (h - inset * 2);
    const size = 1 + hash(i * 3 + 3) * 2;
    ctx.fillStyle = i % 2 === 0 ? '#76906a' : '#b8c9a7';
    ctx.globalAlpha = 0.7;
    ctx.fillRect(px, py, size, size);
  }
  ctx.globalAlpha = 1;

  const cracks = d > 0.03 ? Math.max(1, Math.round(4 * d)) : 0;
  ctx.strokeStyle = '#68778f';
  ctx.lineWidth = 2;
  for (let c = 0; c < cracks; c++) {
    const sx = x + inset + hash(c * 7 + 31) * (w - inset * 2);
    const sy = y + inset + hash(c * 7 + 32) * (h - inset * 2);
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + (hash(c * 7 + 33) - 0.5) * 40, sy + (hash(c * 7 + 34) - 0.5) * 22);
    ctx.lineTo(sx + (hash(c * 7 + 35) - 0.5) * 64, sy + (hash(c * 7 + 36) - 0.5) * 30);
    ctx.stroke();
  }
  ctx.restore();

  roundRectPath(ctx, x + 1.5, y + 1.5, w - 3, h - 3, 6);
  ctx.strokeStyle = border;
  ctx.lineWidth = 3;
  ctx.stroke();
}

/** The target motif: a clear face, green check once it is fully developed. */
function drawFace(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  clarity: number
): void {
  const c = clamp(clarity, 0, 1);
  ctx.save();
  ctx.globalAlpha = 0.15 + 0.85 * c;
  ctx.strokeStyle = '#21324a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#21324a';
  ctx.beginPath();
  ctx.arc(cx - r * 0.36, cy - r * 0.22, 2.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + r * 0.36, cy - r * 0.22, 2.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy + r * 0.12, r * 0.5, Math.PI * 0.18, Math.PI * 0.82);
  ctx.stroke();
  ctx.restore();

  if (c >= 0.95) {
    ctx.save();
    ctx.strokeStyle = '#228d5c';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(cx - 9, cy + r + 5);
    ctx.lineTo(cx - 2, cy + r + 12);
    ctx.lineTo(cx + 10, cy + r - 3);
    ctx.stroke();
    ctx.restore();
  }
}

function drawTray(ctx: CanvasRenderingContext2D, x: number, y: number, w: number): void {
  roundRectPath(ctx, x, y, w, 22, 6);
  ctx.fillStyle = '#76906a';
  ctx.fill();
  ctx.strokeStyle = '#27446e';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x + 9, y + 11);
  ctx.lineTo(x + w - 9, y + 11);
  ctx.stroke();
}

/** One moving subject per panel: the developer liquid ripple, shared phase across panels. */
function drawRipple(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  phase: number
): void {
  ctx.save();
  ctx.strokeStyle = 'rgba(39,68,110,0.55)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let i = 0; i <= 40; i++) {
    const u = i / 40;
    const px = x + 10 + u * (w - 20);
    const py = y + 11 + Math.sin(u * Math.PI * 3 + phase) * 3;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.restore();
}

function drawLamp(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.save();
  ctx.fillStyle = '#76906a';
  ctx.beginPath();
  ctx.ellipse(x, y + 34, 20, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#92400e';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(x, y + 32);
  ctx.lineTo(x, y - 6);
  ctx.stroke();
  ctx.fillStyle = '#b8c9a7';
  ctx.beginPath();
  ctx.moveTo(x - 18, y - 6);
  ctx.lineTo(x + 18, y - 6);
  ctx.lineTo(x + 11, y - 26);
  ctx.lineTo(x - 11, y - 26);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export const Ch10Ana: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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

    let elapsed = 0;
    let last = -1;
    let raf: number | null = null;

    const render = (t: number) => {
      ctx.clearRect(0, 0, W, H);
      clearScene(ctx, W, H);
      drawLamp(ctx, 44, 84);

      const dev = easeInOutQuad(clamp(t / 0.72, 0, 1));
      const leftClarity = clamp(dev, 0, 0.4);
      const rightClarity = dev;
      const phase = t * Math.PI * 4;

      drawTray(ctx, 86, 96, 160);
      drawPhoto(ctx, 96, 16, 140, 84, (1 - leftClarity) * 0.7, '#c43f52');
      drawFace(ctx, 166, 56, 21, leftClarity);
      drawRipple(ctx, 86, 96, 160, phase);

      drawTray(ctx, 306, 96, 160);
      drawPhoto(ctx, 316, 16, 140, 84, (1 - rightClarity) * 0.7, '#228d5c');
      drawFace(ctx, 386, 56, 21, rightClarity);
      drawRipple(ctx, 306, 96, 160, phase);
    };

    const tick = (now: number) => {
      if (last < 0) last = now;
      const dt = Math.min(now - last, 64);
      last = now;
      elapsed = (elapsed + dt) % PERIOD;
      render(elapsed / PERIOD);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf !== null) cancelAnimationFrame(raf);
      raf = null;
      last = -1;
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

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
    </div>
  );
};

export default Ch10Ana;
