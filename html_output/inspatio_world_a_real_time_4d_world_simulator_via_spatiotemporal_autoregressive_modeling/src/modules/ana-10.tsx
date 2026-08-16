import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, easeInOutQuad } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, clearScene, drawRoadH, drawCar, drawFlag, sceneLabel } from './scene-kit';

const W = 244;
const H = 130;

// Analogy §10: two cars leave the same start; the blue one reaches the flag,
// the red one stops short with a wobble (Chapter-10 race exception).
export const Ana10: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
      const p = easeInOutQuad((time % 3600) / 3600);
      clearScene(ctx, W, H);
      drawRoadH(ctx, 66, 8, 224, 16);
      drawRoadH(ctx, 104, 8, 224, 16);
      drawFlag(ctx, 222, 66 - 8, 0.8);
      drawFlag(ctx, 222, 104 - 8, 0.8);
      const blueX = 24 + p * 190;
      const redX = 24 + Math.min(p, 0.62) * 190;
      const wob = p > 0.62 ? Math.sin(time * 0.02) * 1.6 : 0;
      drawCar(ctx, blueX, 64, 0.65, C.blue, 0);
      drawCar(ctx, redX, 102 + wob, 0.65, C.red, 0);
      sceneLabel(ctx, '终点', 214, 34, true, 10);
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

export default Ana10;
