import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  C, gameField, drawPictureCard, drawDescriber, drawGuesser, drawQuestionCard,
  drawTimeBadge, drawBars,
} from '../canvas-scene';

const W = 560;
const H = 140;

export const Ana7: React.FC<WidgetProps> = () => {
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
      const scores = [0.5, 0.82, 0.3];
      const best = 1;
      const slide = Math.max(0, Math.min(1, (phase - 0.5) / 0.35));
      for (let i = 0; i < 3; i++) {
        const y = 26 + i * 32;
        const dx = i === best ? -60 * slide : 0;
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = i === best ? C.green : C.red;
        ctx.lineWidth = i === best ? 3 : 2;
        ctx.beginPath();
        ctx.rect(180 + dx, y, 90, 24);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = C.axis;
        ctx.fillRect(300, y + 8, 120, 8);
        ctx.fillStyle = i === best ? C.green : C.red;
        ctx.fillRect(300, y + 8, 120 * scores[i], 8);
        ctx.restore();
      }
      drawDescriber(ctx, 90, 120, 56, C.blue);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);
    const stop = () => { if (raf) cancelAnimationFrame(raf); raf = null; };
    const start = () => { if (!raf) raf = requestAnimationFrame(render); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);
  return <canvas id="cv-ana-7" ref={ref} width={W} height={H} />;
};
export default Ana7;
