import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { SC, clearStudio, print, album, label, mix } from './studio-kit';
import type { WidgetProps } from './registry';

// Analogy 7: a fresh print is compared side-by-side with the factory reference
// on a light box; the deviation bar tightens and turns green over the loop.
const W = 560;
const H = 140;

export const Ana7: React.FC<WidgetProps> = () => {
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
      clearStudio(ctx, W, H, 0.9);
      const cycle = (now / 3000) % 1;
      const settle = Math.min(1, cycle * 1.6); // 0..1 deviation shrinks
      // factory reference album half open
      album(ctx, 24, 28, 110, 86, 0.5 + 0.12 * Math.sin(now / 700));
      // light box with the comparison pair
      ctx.fillStyle = mix(SC.ground, SC.paper, 0.5);
      ctx.fillRect(190, 24, 340, 92);
      ctx.strokeStyle = SC.shade;
      ctx.strokeRect(190, 24, 340, 92);
      print(ctx, 214, 40, 120, 62, SC.green, 0);
      print(ctx, 386, 40, 120, 62, SC.green, (1 - settle) * 0.7);
      label(ctx, '出厂', 274, 122, SC.muted, 10, 'center');
      label(ctx, '新拍', 446, 122, SC.muted, 10, 'center');
      // deviation bar under the pair
      const bw = 260 * (1 - settle * 0.85);
      ctx.fillStyle = mix(SC.orange, SC.green, settle);
      ctx.fillRect(200 + (260 - bw) / 2, 118, bw, 6);
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
export default Ana7;
