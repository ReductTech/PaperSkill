import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, easeOutBounce } from '../lib/canvasKit';
import { C, drawSceneBg, drawChef, drawTokenChip } from './chefKit';
import type { WidgetProps } from './registry';

// Analogy card §3: the chef flips the spatula once — the same motion turns into
// a string of purple numeric command tokens dropping onto paper, one by one.
// Auto-looping 560x140.
const W = 560;
const H = 140;
const TOKENS = [1, 128, 91, 241, 5, 101, 127];

export const Ch3Analogy: React.FC<WidgetProps> = () => {
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
      // subject: the chef waves the spatula once during the first half of the loop
      drawChef(ctx, 96, 112, 1.3, { mode: 'cook', t: clamp(p * 2, 0, 1) });
      // static prop: the paper strip the tokens land on
      ctx.fillStyle = C.white;
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1.75;
      ctx.beginPath();
      ctx.roundRect(218, 92, 316, 26, 4);
      ctx.fill();
      ctx.stroke();
      // the motion becomes tokens: they drop onto the paper one by one
      TOKENS.forEach((v, i) => {
        const appear = 0.1 + i * 0.11;
        if (p <= appear) return;
        const q = clamp((p - appear) / 0.16, 0, 1);
        const y = 42 + easeOutBounce(q) * 62;
        ctx.save();
        ctx.globalAlpha = 0.35 + 0.65 * q;
        drawTokenChip(ctx, 244 + i * 44, y, String(v), q < 1 ? C.orange : C.purple);
        ctx.restore();
      });
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

export default Ch3Analogy;
