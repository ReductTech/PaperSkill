import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, clearScene, drawRoadH, drawCar, drawAlbum, drawMirror, sceneLabel } from './scene-kit';

const W = 244;
const H = 130;

// Analogy §3: the car drives while a blue tether links it to the roadside
// roadbook stand; a small mirror above shows the road just passed.
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
    const render = (time: number) => {
      const p = (time % 3000) / 3000;
      clearScene(ctx, W, H);
      const roadY = 98;
      drawRoadH(ctx, roadY, 8, 236, 18);
      drawAlbum(ctx, 34, 52, 0.8);
      sceneLabel(ctx, '路书', 22, 74, true, 10);
      const carX = 50 + p * 160;
      ctx.strokeStyle = 'rgba(39,68,110,0.65)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(34, 58);
      ctx.quadraticCurveTo((34 + carX) / 2, 42, carX, roadY - 16);
      ctx.stroke();
      drawMirror(ctx, carX, roadY - 30, 0.9);
      drawCar(ctx, carX, roadY - 2, 0.7, C.blue, Math.sin(p * Math.PI * 8) * 0.6);
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

export default Ana3;
