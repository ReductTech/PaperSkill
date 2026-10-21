import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import { photo, roundRect } from './photokit';
import type { WidgetProps } from './registry';

const W = 560;
const H = 140;

// A photo develops region by region while a timer dial spins.
export const Ana5: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const t0 = performance.now();

    const render = () => {
      const now = performance.now();
      const cycle = ((now - t0) % 5000) / 5000;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#fbf6ee';
      ctx.fillRect(0, 0, W, H);

      const x = 60;
      const y = 20;
      const w = 300;
      const h = 100;
      const prog = clamp(cycle * 2 - 0.3, 0, 1);
      photo(ctx, x, y, w, h, 1);
      if (prog < 1) {
        const fogW = w * (1 - prog);
        ctx.save();
        roundRect(ctx, x, y, w, h, 7);
        ctx.clip();
        ctx.fillStyle = 'rgba(184, 201, 167, 0.62)';
        ctx.fillRect(x + w - fogW, y, fogW, h);
        ctx.restore();
      }

      const cx = 470;
      const cy = 70;
      const r = 34;
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
      const ang = -Math.PI / 2 + cycle * Math.PI * 2;
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(ang) * r * 0.8, cy + Math.sin(ang) * r * 0.8);
      ctx.stroke();
    };

    const tick = () => {
      render();
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />;
};

export default Ana5;
