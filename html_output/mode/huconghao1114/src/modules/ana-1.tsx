import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { SC, clearStudio, dial, wallPrint, lamp, label, hand } from './studio-kit';
import type { WidgetProps } from './registry';

// Analogy 1: a hand turns the shared preset dial toward the answer mark; the
// landscape print on the wall shifts hue while the new-order lamp lights up.
const W = 560;
const H = 140;
const BLUE_ANGLE = -0.45;
const GREEN_ANGLE = 2.5;

export const Ana1: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let raf = 0;

    const render = (now: number) => {
      clearStudio(ctx, W, H, 0.86);
      const cycle = (now / 3000) % 1;
      const t = cycle < 0.5 ? cycle * 2 : 2 - cycle * 2;
      const angle = GREEN_ANGLE + (BLUE_ANGLE - GREEN_ANGLE) * t;
      const shift = Math.max(0, t - 0.15) / 0.85;
      wallPrint(ctx, 420, 22, 92, 96, shift * 0.9);
      lamp(ctx, 532, 26, 7, t > 0.6, SC.blue);
      dial(ctx, 130, 84, 36, angle, shift > 0.6 ? SC.red : undefined);
      const mb = { x: 130 + Math.cos(BLUE_ANGLE) * 46, y: 84 + Math.sin(BLUE_ANGLE) * 46 };
      const mg = { x: 130 + Math.cos(GREEN_ANGLE) * 46, y: 84 + Math.sin(GREEN_ANGLE) * 46 };
      ctx.fillStyle = SC.blue;
      ctx.beginPath();
      ctx.arc(mb.x, mb.y, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = SC.green;
      ctx.beginPath();
      ctx.arc(mg.x, mg.y, 3.5, 0, Math.PI * 2);
      ctx.fill();
      hand(ctx, 130 + Math.cos(angle) * (36 + 11), 84 + Math.sin(angle) * (36 + 11), angle, 22);
      label(ctx, '答题', mb.x + 6, mb.y - 6, SC.blue, 11);
      label(ctx, '出图', mg.x - 6, mg.y + 14, SC.green, 11);
    };

    const tick = () => {
      render(performance.now());
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} width={W} height={H} />;
};
export default Ana1;
