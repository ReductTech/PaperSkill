import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  C, gameField, drawPictureCard, drawDescriber, drawGuesser, drawQuestionCard,
  drawTimeBadge, drawBars,
} from '../canvas-scene';

const W = 560;
const H = 140;

export const Ana3: React.FC<WidgetProps> = () => {
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
      drawDescriber(ctx, 160, 120, 56, C.blue);
      // 参考纸条：前半段在桌上，随后滑出画面
      const slipX = 200 - 260 * Math.max(0, (phase - 0.35) / 0.4);
      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = C.red;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.rect(slipX, 40, 100, 26);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      // 题卡：后半段推上桌
      const n = phase > 0.45 ? Math.min(4, Math.floor((phase - 0.45) / 0.1) + 1) : 0;
      for (let i = 0; i < n; i++) drawQuestionCard(ctx, 300 + i * 60, 36, 52, 'right');
      drawGuesser(ctx, 470, 120, 56, C.blue);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);
    const stop = () => { if (raf) cancelAnimationFrame(raf); raf = null; };
    const start = () => { if (!raf) raf = requestAnimationFrame(render); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);
  return <canvas id="cv-ana-3" ref={ref} width={W} height={H} />;
};
export default Ana3;
