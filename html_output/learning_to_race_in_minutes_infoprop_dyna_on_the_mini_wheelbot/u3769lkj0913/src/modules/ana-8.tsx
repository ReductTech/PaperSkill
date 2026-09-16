import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Analogy ch3: without prediction the kart can only fail by real trial and error —
// a retry loop with a cost meter that climbs every attempt.
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

function flag(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.save();
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y - 18);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - 18);
  ctx.lineTo(x + 13, y - 13);
  ctx.lineTo(x, y - 8);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export const Ana8: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
      const t = (time % 3.6) / 3.6;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);

      // track band with a corner
      ctx.strokeStyle = C.track;
      ctx.lineWidth = 40;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(24, 86);
      ctx.quadraticCurveTo(230, 86, 330, 44);
      ctx.stroke();
      ctx.strokeStyle = C.line;
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.moveTo(24, 86);
      ctx.quadraticCurveTo(230, 86, 330, 44);
      ctx.stroke();
      ctx.setLineDash([]);

      // corner flag: the goal the attempts keep missing
      flag(ctx, 348, 52, C.green);

      // the attempt: kart veers inside the corner (red), fails, resets
      const u = Math.min(1, t * 1.6);
      const x = 40 + u * 250;
      const y = 86 + u * u * 26 - u * 10;
      const ang = u * 0.5;
      kart(ctx, x, y, ang, C.red);
      if (t > 0.62) {
        ctx.strokeStyle = C.red;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x + 16, y - 16);
        ctx.lineTo(x + 28, y - 28);
        ctx.moveTo(x + 28, y - 16);
        ctx.lineTo(x + 16, y - 28);
        ctx.stroke();
      }

      // cost meter on the right: grows with every retry
      const met = 436;
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 2;
      rr(ctx, met, 24, 100, 92, 8);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = C.muted;
      ctx.font = '12px "Segoe UI", sans-serif';
      ctx.fillText('成本', met + 12, 44);
      const attempts = Math.floor(t * 3) + 1;
      ctx.fillStyle = C.orange;
      ctx.fillRect(met + 12, 120 - attempts * 22, 76, attempts * 22);
      ctx.strokeStyle = C.red;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(met + 12, 120 - attempts * 22, 76, attempts * 22);
      ctx.fillStyle = C.red;
      ctx.font = 'bold 13px "Segoe UI", sans-serif';
      ctx.fillText('第 ' + attempts + ' 次', met + 12, 112);
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

export default Ana8;
