import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, clearScene, drawRoadH, drawCar, drawFog, sceneLabel } from './scene-kit';

const W = 280;
const H = 150;

// Hero old-method side: a red-tinted car drives into fog; the road beyond
// mid-canvas dissolves and the car's path bends off the road (drift).
export const HeroOld: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
      drawRoadH(ctx, roadY, 10, 150, 22);
      // dissolving road: dashes with fading alpha
      for (let x = 150; x < 270; x += 16) {
        const a = Math.max(0, 0.8 - (x - 150) / 130);
        ctx.strokeStyle = `rgba(146,64,14,${a})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, roadY - 11 + Math.sin(x * 0.3 + p * 6) * 4);
        ctx.lineTo(x + 9, roadY - 11 + Math.sin((x + 9) * 0.3 + p * 6) * 4);
        ctx.moveTo(x, roadY + 11 + Math.cos(x * 0.25 + p * 6) * 5);
        ctx.lineTo(x + 9, roadY + 11 + Math.cos((x + 9) * 0.25 + p * 6) * 5);
        ctx.stroke();
      }
      const carX = 30 + p * 210;
      const driftY = carX > 150 ? (carX - 150) * 0.22 : 0;
      ctx.globalAlpha = carX > 150 ? Math.max(0.4, 1 - (carX - 150) / 160) : 1;
      drawCar(ctx, carX, roadY - 2 + driftY, 0.85, C.red, Math.sin(p * Math.PI * 8) * 0.8);
      ctx.globalAlpha = 1;
      drawFog(ctx, 165, W, 40, H - 40, 0.55 + 0.2 * Math.sin(p * Math.PI * 2));
      sceneLabel(ctx, '长程漂移', 190, 30, false, 12);
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

export default HeroOld;
