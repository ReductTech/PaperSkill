import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, easeInOutQuad } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, clearScene, drawRoadH, drawCar, sceneLabel } from './scene-kit';

const W = 244;
const H = 130;

// Analogy §9: a hand lifts one suitcase off the roof; the car rises slightly
// and a small speed needle ticks up.
export const Ana9: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
      const lift = easeInOutQuad(Math.min(1, p * 2));
      clearScene(ctx, W, H);
      const roadY = 104;
      drawRoadH(ctx, roadY, 8, 236, 16);
      const rise = lift * 3;
      drawCar(ctx, 110, roadY - 2 - rise, 0.95, C.blue, 0);
      // suitcase lifting off the roof
      const sy = roadY - 30 - lift * 46;
      ctx.fillStyle = C.roadEdge;
      ctx.fillRect(96, sy, 28, 14);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(102, sy);
      ctx.lineTo(102, sy + 14);
      ctx.moveTo(118, sy);
      ctx.lineTo(118, sy + 14);
      ctx.stroke();
      // hand
      ctx.fillStyle = '#e8c9a8';
      ctx.beginPath();
      ctx.ellipse(126, sy - 4, 7, 5, 0.3, 0, Math.PI * 2);
      ctx.fill();
      // speed needle
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = C.border;
      ctx.beginPath();
      ctx.arc(206, 40, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = C.green;
      ctx.lineWidth = 2;
      const na = Math.PI * (1.1 - lift * 0.5);
      ctx.beginPath();
      ctx.moveTo(206, 40);
      ctx.lineTo(206 + Math.cos(na) * 11, 40 - Math.sin(na) * 11);
      ctx.stroke();
      sceneLabel(ctx, '轻装', 14, 28, false, 11);
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

export default Ana9;
