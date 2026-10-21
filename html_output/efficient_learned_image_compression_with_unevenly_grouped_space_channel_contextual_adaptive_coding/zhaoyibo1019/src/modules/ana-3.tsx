import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import { photo, roundRect } from './photokit';
import type { WidgetProps } from './registry';

const W = 560;
const H = 140;

// Structure appears first (dark silhouette), then color/detail fills in.
export const Ana3: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
      const cycle = ((now - t0) % 5200) / 5200;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#fbf6ee';
      ctx.fillRect(0, 0, W, H);

      const x = W / 2 - 95;
      const y = 20;
      const w = 190;
      const h = 100;
      photo(ctx, x, y, w, h, 0);

      const s = clamp(cycle * 2.6 - 0.3, 0, 1);
      const d = clamp(cycle * 2.6 - 1.2, 0, 1);

      ctx.save();
      roundRect(ctx, x + 7, y + 7, w - 14, h - 14, 4);
      ctx.clip();
      ctx.fillStyle = 'rgba(33, 50, 74, ' + (0.85 * s).toFixed(3) + ')';
      ctx.fillRect(x + 55, y + 30, 20, 55);
      ctx.beginPath();
      ctx.moveTo(x, y + h);
      ctx.lineTo(x, y + h * 0.6);
      ctx.lineTo(x + w * 0.5, y + h * 0.56);
      ctx.lineTo(x + w, y + h * 0.64);
      ctx.lineTo(x + w, y + h);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      photo(ctx, x, y, w, h, d);
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

export default Ana3;
