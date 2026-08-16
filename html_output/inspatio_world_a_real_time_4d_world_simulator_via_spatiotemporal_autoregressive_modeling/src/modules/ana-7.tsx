import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, clearScene, drawCar, sceneLabel } from './scene-kit';

const W = 244;
const H = 130;

// Analogy §7: the car weaves an S-line through three cones on a practice
// ground, leaving a fading blue trace.
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
    const path = (t: number) => ({
      x: 20 + t * 200,
      y: 84 + Math.sin(t * Math.PI * 3) * 22,
    });
    const render = (time: number) => {
      const p = (time % 3400) / 3400;
      clearScene(ctx, W, H);
      // practice ground
      ctx.fillStyle = C.road;
      ctx.fillRect(8, 52, 228, 66);
      ctx.strokeStyle = C.border;
      ctx.strokeRect(8, 52, 228, 66);
      // cones
      for (let i = 0; i < 3; i++) {
        const cx = 62 + i * 66;
        ctx.fillStyle = C.orange;
        ctx.beginPath();
        ctx.moveTo(cx - 6, 90);
        ctx.lineTo(cx, 74);
        ctx.lineTo(cx + 6, 90);
        ctx.closePath();
        ctx.fill();
      }
      // fading trace
      ctx.lineWidth = 2;
      for (let t = 0; t < p; t += 0.02) {
        const a = Math.max(0, 0.5 - (p - t));
        ctx.strokeStyle = `rgba(39,68,110,${a})`;
        const p1 = path(t);
        const p2 = path(Math.min(p, t + 0.02));
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
      const cp = path(p);
      drawCar(ctx, cp.x, cp.y, 0.65, C.blue, 0);
      sceneLabel(ctx, '训练场', 14, 30, false, 11);
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

export default Ana7;
