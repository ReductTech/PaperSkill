import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, easeInOutQuad } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, clearScene, drawCar, drawLighthouse, sceneLabel } from './scene-kit';

const W = 244;
const H = 130;

// Analogy §4: the road is split into 5 tiles; the car eases tile to tile and
// the tile beneath it glows blue.
export const Ana4: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
      const p = (time % 3500) / 3500;
      clearScene(ctx, W, H);
      const roadY = 96;
      const seg = 5;
      const x0 = 14;
      const segW = 40;
      const idxF = p * seg;
      const idx = Math.min(seg - 1, Math.floor(idxF));
      for (let i = 0; i < seg; i++) {
        const sx = x0 + i * (segW + 4);
        if (i < idx) ctx.fillStyle = C.hill;
        else if (i === idx) ctx.fillStyle = 'rgba(39,68,110,0.85)';
        else ctx.fillStyle = '#ffffff';
        ctx.fillRect(sx, roadY - 10, segW, 20);
        ctx.strokeStyle = i > idx ? C.border : C.roadEdge;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(sx, roadY - 10, segW, 20);
      }
      drawLighthouse(ctx, 232, roadY - 14, 0.7);
      const within = easeInOutQuad(idxF - idx);
      const carX = x0 + idx * (segW + 4) + within * segW + 8;
      drawCar(ctx, carX, roadY - 12, 0.7, C.blue, 0);
      sceneLabel(ctx, '一段一段生成', 14, 30, false, 11);
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

export default Ana4;
