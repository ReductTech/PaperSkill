import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { C, drawSceneBg, drawTokenChip } from './chefKit';
import type { WidgetProps } from './registry';

// Analogy card §4: a row of command tokens; one chip keeps flipping over, its
// number rolling 0→255 — like a volume knob allowed to stop only on integer
// notches. Auto-looping 560x140.
const W = 560;
const H = 140;
const STATIC_TOKENS = [1, 128, 91, 241, 5, 101, 127];

export const Ch4Analogy: React.FC<WidgetProps> = () => {
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
      STATIC_TOKENS.forEach((v, i) => {
        drawTokenChip(ctx, 84 + i * 56, 72, String(v), C.purple);
      });
      // the flipping chip: edge-on at half-turn, number rolls 0→255
      const flip = Math.abs(Math.cos(p * Math.PI * 2));
      ctx.save();
      ctx.translate(84 + 7 * 56, 72);
      ctx.scale(Math.max(flip, 0.08), 1);
      drawTokenChip(ctx, 0, 0, String(Math.floor(p * 256) % 256), C.orange);
      ctx.restore();
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

export default Ch4Analogy;
