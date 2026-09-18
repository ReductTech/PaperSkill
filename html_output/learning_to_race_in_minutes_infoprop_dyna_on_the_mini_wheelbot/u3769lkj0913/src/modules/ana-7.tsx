import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Analogy ch7: one kart rides exactly on the centerline between the boundaries.
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

export const Ana7: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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

      // straight track band
      ctx.fillStyle = C.track;
      rr(ctx, 20, 46, W - 40, 48, 8);
      ctx.fill();
      // boundary lines
      ctx.strokeStyle = C.edge;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(24, 48);
      ctx.lineTo(W - 24, 48);
      ctx.moveTo(24, 92);
      ctx.lineTo(W - 24, 92);
      ctx.stroke();
      // centerline
      ctx.strokeStyle = C.line;
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.moveTo(24, 70);
      ctx.lineTo(W - 24, 70);
      ctx.stroke();
      ctx.setLineDash([]);

      // kart exactly on the centerline
      const x = 50 + t * (W - 110);
      kart(ctx, x, 70, 0, C.green);
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

export default Ana7;
