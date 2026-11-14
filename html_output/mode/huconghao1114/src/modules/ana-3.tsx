import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { SC, clearStudio, dial, print, lamp, label, hand, mix } from './studio-kit';
import type { WidgetProps } from './registry';

// Analogy 3: one notch of the shared dial degrades two prints at once — the
// group photo ages toward yellow (intra-modal), the landscape turns to snow.
const W = 560;
const H = 140;

export const Ana3: React.FC<WidgetProps> = () => {
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
      // dial turns one notch over the loop
      const cycle = (now / 2800) % 1;
      const notch = cycle < 0.55 ? Math.min(1, cycle / 0.5) : Math.max(0, 1 - (cycle - 0.62) / 0.3);
      const angle = -2.2 + notch * 1.6;
      dial(ctx, 96, 78, 34, angle, notch > 0.6 ? SC.red : undefined);
      hand(ctx, 96 + Math.cos(angle) * 46, 78 + Math.sin(angle) * 46, angle, 20);
      // light box with two prints
      ctx.fillStyle = mix(SC.ground, SC.paper, 0.5);
      ctx.fillRect(196, 22, 336, 92);
      ctx.strokeStyle = SC.shade;
      ctx.strokeRect(196, 22, 336, 92);
      print(ctx, 216, 36, 110, 66, '#8a94a8', notch * 0.85, '#c9a227'); // ages yellow
      print(ctx, 400, 36, 110, 66, SC.green, notch * 0.8, '#9fb8c8'); // turns to snow
      lamp(ctx, 271, 112, 6, notch > 0.5, SC.red);
      lamp(ctx, 455, 112, 6, notch > 0.5, SC.red);
      label(ctx, '合影', 271, 124, SC.muted, 10, 'center');
      label(ctx, '风光', 455, 124, SC.muted, 10, 'center');
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
export default Ana3;
