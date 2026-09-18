import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  C, gameField, drawPictureCard, drawDescriber, drawGuesser, drawQuestionCard,
  drawTimeBadge, drawBars,
} from '../canvas-scene';

const W = 560;
const H = 140;

export const Ana8: React.FC<WidgetProps> = () => {
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
      drawPictureCard(ctx, 30, 22, 90, 'clean');
      drawDescriber(ctx, 150, 120, 56, C.blue);
      drawGuesser(ctx, 430, 120, 56, C.blue);
      // 槽道
      ctx.save();
      ctx.strokeStyle = C.purple;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(190, 76);
      ctx.lineTo(400, 76);
      ctx.stroke();
      ctx.restore();
      // 挡板
      ctx.save();
      ctx.fillStyle = C.frame;
      ctx.fillRect(288, 40, 8, 74);
      ctx.restore();
      // 稿子沿通道滑过；挡板始终遮住画面，学生看不到图
      const x = 196 + 196 * Math.min(1, phase / 0.8);
      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = C.ink;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.rect(x, 64, 52, 20);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      drawBars(ctx, []);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);
    const stop = () => { if (raf) cancelAnimationFrame(raf); raf = null; };
    const start = () => { if (!raf) raf = requestAnimationFrame(render); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);
  return <canvas id="cv-ana-8" ref={ref} width={W} height={H} />;
};
export default Ana8;
