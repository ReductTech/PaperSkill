import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Analogy ch4: one wiper sweeps a fogged visor; each pass reveals the track flag behind.
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

function flag(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.save();
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y - 20);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - 20);
  ctx.lineTo(x + 14, y - 14);
  ctx.lineTo(x, y - 8);
  ctx.closePath();
  ctx.fill();
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
    let t0 = 0;

    const render = (time: number) => {
      const t = (time % 3.0) / 3.0;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);

      const vx = 150;
      const vy = 16;
      const vw = 260;
      const vh = 108;

      // visor frame
      ctx.fillStyle = '#e9eef5';
      ctx.strokeStyle = C.edge;
      ctx.lineWidth = 3;
      rr(ctx, vx, vy, vw, vh, 26);
      ctx.fill();
      ctx.stroke();
      // flag behind the fog (revealed as wiper passes)
      flag(ctx, vx + 150, vy + 88, C.green);

      // wiper sweeps left-right; revealed window follows it
      const sweep = -(Math.cos(t * Math.PI * 2) * 0.5) + 0.5; // 0..1
      const wx = vx + 20 + sweep * (vw - 40);
      // fog everywhere except the cleared swipe band around wx
      ctx.save();
      ctx.beginPath();
      rr(ctx, vx + 3, vy + 3, vw - 6, vh - 6, 24);
      ctx.clip();
      const grad = ctx.createLinearGradient(wx - 70, 0, wx + 70, 0);
      grad.addColorStop(0, 'rgba(214,222,234,0.92)');
      grad.addColorStop(0.35, 'rgba(214,222,234,0.25)');
      grad.addColorStop(0.65, 'rgba(214,222,234,0.25)');
      grad.addColorStop(1, 'rgba(214,222,234,0.92)');
      ctx.fillStyle = grad;
      ctx.fillRect(vx, vy, vw, vh);
      ctx.restore();
      // wiper arm
      ctx.strokeStyle = C.ink;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(vx + vw / 2, vy + vh + 14);
      ctx.lineTo(wx, vy + 16);
      ctx.stroke();
      ctx.fillStyle = C.ink;
      ctx.beginPath();
      ctx.arc(vx + vw / 2, vy + vh + 14, 4, 0, Math.PI * 2);
      ctx.fill();
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

export default Ana4;
