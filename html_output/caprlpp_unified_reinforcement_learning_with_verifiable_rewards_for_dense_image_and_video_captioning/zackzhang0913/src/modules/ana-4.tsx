import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  C, gameField, drawPictureCard, drawDescriber, drawGuesser, drawQuestionCard,
  drawTimeBadge, drawBars,
} from '../canvas-scene';

const W = 560;
const H = 140;

export const Ana4: React.FC<WidgetProps> = () => {
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
      drawDescriber(ctx, 110, 120, 56, C.blue);
      const cells = [[C.green, '答得对'], [C.purple, '时间戳'], [C.orange, '别太长']];
      const stamped = Math.min(3, Math.floor(phase * 3.4));
      for (let i = 0; i < 3; i++) {
        ctx.save();
        ctx.fillStyle = i < stamped ? cells[i][0] : '#ffffff';
        ctx.strokeStyle = cells[i][0];
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.rect(260 + i * 96, 40, 76, 52);
        if (i < stamped) ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
      // 印章从讲解者移到当前格
      const target = 260 + Math.min(2, stamped) * 96 + 38;
      const sx = 160 + (target - 160) * ((phase * 3.4) % 1);
      ctx.save();
      ctx.fillStyle = C.red;
      ctx.beginPath();
      ctx.arc(sx, 30, 13, 0, Math.PI * 2);
      ctx.fill();
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
  return <canvas id="cv-ana-4" ref={ref} width={W} height={H} />;
};
export default Ana4;
