import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, clearScene, sceneLabel } from './scene-kit';

const W = 244;
const H = 130;

// Analogy §8: a finger presses the start button; the dashboard glow rises.
export const Ana8: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
    const render = (time: number) => {
      const p = (time % 3000) / 3000;
      const press = p < 0.25 ? Math.sin((p / 0.25) * Math.PI) : 0;
      const glow = p < 0.25 ? 0 : Math.min(1, (p - 0.25) / 0.35);
      clearScene(ctx, W, H);
      // dashboard body
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = C.border;
      ctx.fillRect(28, 40, 188, 66);
      ctx.strokeRect(28, 40, 188, 66);
      // gauges lighting up
      for (let i = 0; i < 3; i++) {
        const gx = 62 + i * 60;
        ctx.strokeStyle = C.border;
        ctx.beginPath();
        ctx.arc(gx, 72, 16, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = glow;
        ctx.strokeStyle = i === 1 ? C.green : C.blue;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(gx, 72, 12, Math.PI * 0.7, Math.PI * (0.7 + 1.2 * glow));
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.lineWidth = 1;
      }
      // start button + finger
      const by = 118 + press * 3;
      ctx.fillStyle = glow > 0 ? C.green : C.blue;
      ctx.beginPath();
      ctx.arc(208, by - 6, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e8c9a8';
      ctx.beginPath();
      ctx.ellipse(214, by - 22 + press * 4, 6, 12, -0.4, 0, Math.PI * 2);
      ctx.fill();
      sceneLabel(ctx, '点火', 30, 30, false, 11);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };
    const tick = (t: number) => {
      render(t);
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

export default Ana8;
