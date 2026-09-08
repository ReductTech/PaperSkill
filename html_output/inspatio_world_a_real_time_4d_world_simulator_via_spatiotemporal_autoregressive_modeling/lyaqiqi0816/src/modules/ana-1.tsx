import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, clearScene, drawRoadH, drawCar, drawFog, sceneLabel } from './scene-kit';

const W = 244;
const H = 130;

// Analogy §1: one car drives right into a fog bank; the road beyond fades.
export const Ana1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
      const p = (time % 3200) / 3200;
      clearScene(ctx, W, H);
      const roadY = 96;
      drawRoadH(ctx, roadY, 8, 148, 18);
      for (let x = 148; x < 236; x += 14) {
        const a = Math.max(0, 0.7 - (x - 148) / 110);
        ctx.strokeStyle = `rgba(146,64,14,${a})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x, roadY - 9);
        ctx.lineTo(x + 8, roadY - 9);
        ctx.moveTo(x, roadY + 9);
        ctx.lineTo(x + 8, roadY + 9);
        ctx.stroke();
      }
      const carX = 24 + p * 180;
      ctx.globalAlpha = carX > 150 ? Math.max(0.45, 1 - (carX - 150) / 120) : 1;
      drawCar(ctx, carX, roadY - 2, 0.7, C.blue, Math.sin(p * Math.PI * 8) * 0.6);
      ctx.globalAlpha = 1;
      drawFog(ctx, 158, W, 30, H - 30, 0.6);
      sceneLabel(ctx, '出发', 16, 40, true, 10);
      sceneLabel(ctx, '浓雾', 190, 42, false, 10);
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

export default Ana1;
