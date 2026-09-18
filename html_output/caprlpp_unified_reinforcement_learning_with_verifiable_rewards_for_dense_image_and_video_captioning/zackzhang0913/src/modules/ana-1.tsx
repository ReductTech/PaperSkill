import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, gameField, drawPictureCard, drawDescriber, drawGuesser, drawQuestionCard } from '../canvas-scene';

// 第 1 章 类比动画：讲解者照参考范文写下一句越来越短的话，蒙眼学生把题卡翻成红牌。
const W = 560;
const H = 140;

export const Ana1: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let raf: number | null = null;
    const t0 = performance.now();

    const render = (t: number) => {
      const phase = ((t - t0) / 3000) % 1; // 3.0 秒循环
      gameField(ctx, W, H);
      drawPictureCard(ctx, 26, 18, 76, 'clean');
      drawDescriber(ctx, 148, 116, 60, C.blue);

      // 描述纸条：随相位变短
      const w = 120 * (1 - 0.55 * Math.min(1, phase / 0.55));
      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = C.frame;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.rect(196, 34, w, 26);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = C.muted;
      for (let i = 0; i < 3; i++) {
        const lw = w * (i === 0 ? 0.7 : i === 1 ? 0.5 : 0.32);
        if (lw > 4) ctx.fillRect(202, 40 + i * 7, lw, 2);
      }
      ctx.restore();

      drawGuesser(ctx, 420, 116, 60, C.blue);
      // 翻牌：phase>0.55 后逐张变红
      const revealed = phase > 0.55 ? Math.min(3, Math.floor((phase - 0.55) / 0.12) + 1) : 0;
      for (let i = 0; i < 3; i++) {
        drawQuestionCard(ctx, 468, 24 + i * 34, 68, i < revealed ? 'wrong' : 'idle');
      }
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = null;
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(render);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  return <canvas id="cv-ana-1" ref={ref} width={W} height={H} />;
};

export default Ana1;
