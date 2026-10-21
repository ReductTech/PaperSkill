import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 560;
const H = 140;

// A light beam sweeps onto a film strip; a latent silhouette fades in.
export const Ana2: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
      const cycle = ((now - t0) % 4600) / 4600;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#fbf6ee';
      ctx.fillRect(0, 0, W, H);

      // film strip
      const fx = 80;
      const fy = 100;
      const fw = 400;
      const fh = 26;
      ctx.fillStyle = '#3a2f2a';
      ctx.fillRect(fx, fy, fw, fh);
      ctx.fillStyle = '#fbf6ee';
      for (let i = 0; i < 8; i++) {
        ctx.fillRect(fx + 14 + i * 48, fy + 4, 20, 6);
        ctx.fillRect(fx + 14 + i * 48, fy + 16, 20, 6);
      }

      // light beam sweeping
      const b = Math.min(1, Math.max(0, cycle * 3 - 0.5));
      const bx = 60 + b * 440;
      ctx.fillStyle = 'rgba(247, 230, 176, 0.6)';
      ctx.beginPath();
      ctx.moveTo(bx, 20);
      ctx.lineTo(bx - 46, 100);
      ctx.lineTo(bx + 46, 100);
      ctx.closePath();
      ctx.fill();

      // latent silhouette fades in on the film
      const t = Math.min(1, Math.max(0, cycle * 3 - 1.2));
      ctx.fillStyle = 'rgba(33, 50, 74, ' + (0.75 * t).toFixed(3) + ')';
      ctx.fillRect(fx + 160, fy - 52, 14, 52);
      ctx.beginPath();
      ctx.moveTo(fx + 150, fy - 40);
      ctx.lineTo(fx + 167, fy - 46);
      ctx.lineTo(fx + 184, fy - 40);
      ctx.closePath();
      ctx.fill();
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

export default Ana2;
