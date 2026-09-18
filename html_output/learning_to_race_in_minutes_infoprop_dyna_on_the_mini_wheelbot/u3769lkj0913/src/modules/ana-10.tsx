import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Analogy ch10: two karts sprint from the same start line; the green one (paper method)
// reaches the finish flag clearly ahead. Two subjects are allowed for the result race.
const W = 560;
const H = 140;

const C = {
  bg: '#f5f8f0', track: '#b8c9a7', edge: '#76906a', line: '#92400e',
  blue: '#27446e', green: '#228d5c', red: '#c43f52', orange: '#f07e47',
  ink: '#21324a', muted: '#68778f', border: '#d7deea',
};

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function kart(ctx: CanvasRenderingContext2D, x: number, y: number, ang: number, accent: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = 2;
  rr(ctx, -11, -6, 22, 12, 4);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = C.ink;
  ctx.fillRect(-8, -9, 5, 3);
  ctx.fillRect(3, -9, 5, 3);
  ctx.fillRect(-8, 6, 5, 3);
  ctx.fillRect(3, 6, 5, 3);
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.arc(2, 0, 2.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
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
    let raf: number | null = null;
    let t0 = 0;

    const render = (time: number) => {
      const t = (time % 3.0) / 3.0;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);

      // two parallel lanes
      ctx.fillStyle = C.track;
      rr(ctx, 20, 34, W - 40, 42, 8);
      ctx.fill();
      rr(ctx, 20, 84, W - 40, 42, 8);
      ctx.fill();
      // start line
      ctx.strokeStyle = C.ink;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(52, 30);
      ctx.lineTo(52, 130);
      ctx.stroke();
      // finish flag
      ctx.strokeStyle = C.ink;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(W - 40, 30);
      ctx.lineTo(W - 40, 130);
      ctx.stroke();
      ctx.fillStyle = C.green;
      ctx.beginPath();
      ctx.moveTo(W - 40, 34);
      ctx.lineTo(W - 58, 42);
      ctx.lineTo(W - 40, 50);
      ctx.closePath();
      ctx.fill();

      // AMPC kart (orange, slower): progress with easeOut
      const p1 = 1 - Math.pow(1 - Math.min(1, t * 0.72), 1.6);
      kart(ctx, 60 + p1 * (W - 120), 55, 0, C.orange);
      // racing agent kart (green, faster)
      const p2 = 1 - Math.pow(1 - Math.min(1, t * 1.05), 1.3);
      kart(ctx, 60 + p2 * (W - 120), 105, 0, C.green);
    };

    const tick = (now: number) => {
      if (!t0) t0 = now;
      render((now - t0) / 1000);
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

  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />;
};

export default Ana10;
