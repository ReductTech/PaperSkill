import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, clearScene, drawRoadH, drawCar, sceneLabel } from './scene-kit';

const W = 244;
const H = 130;

// Analogy §6: the car cruises past milestone posts at constant speed while a
// small dashboard dial stays steady in its band.
export const Ana6: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
      const roadY = 100;
      drawRoadH(ctx, roadY, 8, 236, 18);
      // milestones scroll left to imply constant motion
      for (let i = 0; i < 4; i++) {
        const mx = ((i * 70 - p * 70) % 280 + 280) % 280 - 20;
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = C.border;
        ctx.fillRect(mx, roadY - 30, 10, 18);
        ctx.strokeRect(mx, roadY - 30, 10, 18);
        ctx.strokeStyle = C.roadEdge;
        ctx.beginPath();
        ctx.moveTo(mx + 5, roadY - 12);
        ctx.lineTo(mx + 5, roadY - 8);
        ctx.stroke();
      }
      drawCar(ctx, 118, roadY - 2, 0.75, C.blue, Math.sin(p * Math.PI * 6) * 0.5);
      // steady dial
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = C.border;
      ctx.beginPath();
      ctx.arc(118, 36, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = C.green;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(118, 36, 12, Math.PI * 0.75, Math.PI * 1.35);
      ctx.stroke();
      ctx.strokeStyle = C.text;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(118, 36);
      const na = -Math.PI / 2 + Math.sin(p * Math.PI * 4) * 0.06;
      ctx.lineTo(118 + Math.cos(na) * 11, 36 + Math.sin(na) * 11);
      ctx.stroke();
      sceneLabel(ctx, '匀速巡航', 12, 24, false, 11);
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

export default Ana6;
