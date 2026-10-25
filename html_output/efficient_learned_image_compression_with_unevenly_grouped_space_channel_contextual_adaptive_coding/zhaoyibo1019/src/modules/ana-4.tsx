import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import { photo } from './photokit';
import type { WidgetProps } from './registry';

const W = 560;
const H = 140;

// A crisp reference print sits beside the tray; the main print develops toward it.
export const Ana4: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
      const cycle = ((now - t0) % 4800) / 4800;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#fbf6ee';
      ctx.fillRect(0, 0, W, H);

      const t = clamp(cycle * 2 - 0.5, 0, 1);
      photo(ctx, 60, 30, 130, 80, 1);
      photo(ctx, 300, 20, 190, 100, t);

      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = '#27446e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(195, 70);
      ctx.lineTo(296, 70);
      ctx.stroke();
      ctx.setLineDash([]);
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

export default Ana4;
