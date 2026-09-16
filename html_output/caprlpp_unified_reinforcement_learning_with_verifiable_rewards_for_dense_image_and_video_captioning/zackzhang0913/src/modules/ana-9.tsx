import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  C, gameField, drawPictureCard, drawDescriber, drawGuesser, drawQuestionCard,
  drawTimeBadge, drawBars,
} from '../canvas-scene';

const W = 560;
const H = 140;

export const Ana9: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }
    let raf: number | null = null;
    const t0 = performance.now();
    const render = (t: number) => {
      const phase = ((t - t0) / 3200) % 1;
      gameField(ctx, W, H);
      drawDescriber(ctx, 90, 120, 56, C.blue);
      // 纸条先变长再被折回刻线内
      const grow = Math.min(1, phase / 0.45);
      const fold = Math.max(0, Math.min(1, (phase - 0.55) / 0.35));
      const len = 120 + 300 * grow - 240 * fold;
      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = len > 300 ? C.red : C.green;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.rect(160, 56, len, 26);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      // 两条刻线
      for (const [lx, col] of [[400, C.green], [480, C.red]] as [number, string][]) {
        ctx.save();
        ctx.strokeStyle = col;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.moveTo(lx, 34);
        ctx.lineTo(lx, 106);
        ctx.stroke();
        ctx.restore();
      }
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);
    const stop = () => { if (raf) cancelAnimationFrame(raf); raf = null; };
    const start = () => { if (!raf) raf = requestAnimationFrame(render); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);
  return <canvas id="cv-ana-9" ref={ref} width={W} height={H} />;
};
export default Ana9;
