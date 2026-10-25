import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import { photo } from './photokit';
import type { WidgetProps } from './registry';

const W = 560;
const H = 140;

// Developer is poured onto the print; it sharpens as the liquid reaches it.
export const Ana7: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
      const cycle = ((now - t0) % 4000) / 4000;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#fbf6ee';
      ctx.fillRect(0, 0, W, H);

      const prog = clamp(cycle * 1.5 - 0.2, 0, 1);
      photo(ctx, 190, 20, 300, 100, prog);

      ctx.fillStyle = '#d7deea';
      ctx.fillRect(40, 28, 60, 40);
      ctx.fillStyle = '#76906a';
      ctx.fillRect(46, 38, 48, 30);
      const sway = Math.sin(cycle * Math.PI * 2) * 3;
      ctx.strokeStyle = '#76906a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(100, 68);
      ctx.quadraticCurveTo(140, 92 + sway, 190, 54);
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

export default Ana7;
