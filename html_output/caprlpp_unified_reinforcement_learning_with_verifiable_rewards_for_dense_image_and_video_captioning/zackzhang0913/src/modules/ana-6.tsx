import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  C, gameField, drawPictureCard, drawDescriber, drawGuesser, drawQuestionCard,
  drawTimeBadge, drawBars,
} from '../canvas-scene';

const W = 560;
const H = 140;

export const Ana6: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }
    let raf: number | null = null;
    const t0 = performance.now();
    const render = (t: number) => {
      const phase = ((t - t0) / 3300) % 1;
      gameField(ctx, W, H);
      drawDescriber(ctx, 90, 120, 56, C.blue);
      drawGuesser(ctx, 470, 120, 56, C.blue);
      const travel = Math.min(1, phase / 0.3);
      const sx = 130 + (400 - 130) * travel;
      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = C.frame;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.rect(sx, 70, 76, 22);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      const n = phase > 0.3 ? Math.min(3, Math.floor((phase - 0.3) / 0.16) + 1) : 0;
      for (let i = 0; i < 3; i++) drawQuestionCard(ctx, 210 + i * 70, 22, 58, i < n ? 'right' : 'idle');
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);
    const stop = () => { if (raf) cancelAnimationFrame(raf); raf = null; };
    const start = () => { if (!raf) raf = requestAnimationFrame(render); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);
  return <canvas id="cv-ana-6" ref={ref} width={W} height={H} />;
};
export default Ana6;
