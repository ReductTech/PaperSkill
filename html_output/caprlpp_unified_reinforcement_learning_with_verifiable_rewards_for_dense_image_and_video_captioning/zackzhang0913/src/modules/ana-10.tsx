import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  C, gameField, drawPictureCard, drawDescriber, drawGuesser, drawQuestionCard,
  drawTimeBadge, drawBars,
} from '../canvas-scene';

const W = 560;
const H = 140;

export const Ana10: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }
    let raf: number | null = null;
    const t0 = performance.now();
    const render = (t: number) => {
      const phase = ((t - t0) / 3400) % 1;
      gameField(ctx, W, H);
      const vals = [0.62, 0.86, 0.94, 1.0];
      const cols = [C.red, C.blue, C.muted, C.green];
      for (let i = 0; i < 4; i++) {
        const y = 18 + i * 26;
        ctx.save();
        ctx.fillStyle = C.axis;
        ctx.fillRect(150, y, 320, 14);
        ctx.fillStyle = cols[i];
        ctx.fillRect(150, y, 320 * vals[i] * Math.min(1, phase / 0.8), 14);
        ctx.restore();
      }
      // 终点线
      ctx.save();
      ctx.strokeStyle = C.frame;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(470, 12);
      ctx.lineTo(470, 124);
      ctx.stroke();
      ctx.restore();
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);
    const stop = () => { if (raf) cancelAnimationFrame(raf); raf = null; };
    const start = () => { if (!raf) raf = requestAnimationFrame(render); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);
  return <canvas id="cv-ana-10" ref={ref} width={W} height={H} />;
};
export default Ana10;
