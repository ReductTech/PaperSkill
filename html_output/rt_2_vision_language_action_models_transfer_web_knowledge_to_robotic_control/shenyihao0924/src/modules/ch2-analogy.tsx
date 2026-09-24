import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { C, drawSceneBg, drawChef, drawCookbook } from './chefKit';
import type { WidgetProps } from './registry';

// Analogy card §2: the chef holding a cookbook; the book stack gently rises and
// falls; a speech bubble loops 「这是什么食材？」→「番茄」. Auto-looping 560x140.
const W = 560;
const H = 140;

const drawBubble = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
  color: string
) => {
  ctx.save();
  ctx.font = '13px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
  const w = ctx.measureText(text).width + 24;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x - w / 2, y - 15, w, 30, 8);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x - 9, y + 13);
  ctx.lineTo(x - 2, y + 25);
  ctx.lineTo(x + 5, y + 13);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = C.white;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y + 1);
  ctx.restore();
};

export const Ch2Analogy: React.FC<WidgetProps> = () => {
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

    const render = (ms: number) => {
      const p = (ms % 3000) / 3000;
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H);
      // static prop 1: the photo the question is about (a tomato)
      ctx.fillStyle = C.white;
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1.75;
      ctx.beginPath();
      ctx.roundRect(36, 70, 46, 36, 4);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = C.red;
      ctx.beginPath();
      ctx.arc(59, 92, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = C.green;
      ctx.beginPath();
      ctx.ellipse(59, 80, 5, 2.5, 0.5, 0, Math.PI * 2);
      ctx.fill();
      // static prop 2: cookbook stack with a light bob (pages flipping over)
      drawCookbook(ctx, 452, 106 + Math.sin(p * Math.PI * 2) * 2, 1);
      // subject: the chef reading, breathing slightly
      drawChef(ctx, 168, 106 + Math.sin(p * Math.PI * 2 + 0.5) * 1.5, 1.15, {
        mode: 'read',
        t: p,
      });
      // looping bubble: question first, answer after
      if (p < 0.5) drawBubble(ctx, 318, 28, '这是什么食材？', C.blue);
      else drawBubble(ctx, 318, 28, '番茄', C.green);
    };

    const rafRef = { current: 0 };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const tick = () => {
      render(performance.now());
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  return <canvas ref={ref} width={W} height={H} />;
};

export default Ch2Analogy;
