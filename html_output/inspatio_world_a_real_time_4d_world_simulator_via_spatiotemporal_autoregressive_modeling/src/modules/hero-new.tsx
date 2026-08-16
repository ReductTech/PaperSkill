import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, clearScene, drawRoadH, drawCar, drawAlbum, drawLighthouse, sceneLabel } from './scene-kit';

const W = 280;
const H = 150;

// Hero new-method side: blue car tethered to a roadside roadbook stand; road
// intact to the lighthouse; a green check appears at far right each loop.
// Shares the 3200 ms phase with the old-method side for direct contrast.
export const HeroNew: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
      const roadY = 108;
      drawRoadH(ctx, roadY, 10, 262, 22);
      drawLighthouse(ctx, 252, roadY - 12, 0.9);
      drawAlbum(ctx, 44, 60, 0.9);
      sceneLabel(ctx, '路书', 32, 84, true, 10);
      const carX = 30 + p * 210;
      // taut tether from car roof to the album stand
      ctx.strokeStyle = 'rgba(39,68,110,0.65)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(44, 66);
      ctx.quadraticCurveTo((44 + carX) / 2, 52, carX, roadY - 20);
      ctx.stroke();
      drawCar(ctx, carX, roadY - 2, 0.85, C.blue, Math.sin(p * Math.PI * 8) * 0.8);
      if (p > 0.85) {
        ctx.strokeStyle = C.green;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(238, 40);
        ctx.lineTo(244, 47);
        ctx.lineTo(256, 32);
        ctx.stroke();
      }
      sceneLabel(ctx, '锚定漫游', 12, 30, false, 12);
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

export default HeroNew;
