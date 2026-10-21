import React, { useEffect, useRef } from 'react';
import {
  setupCanvas,
  observeCanvas,
  clamp,
  easeOutCubic,
  lerp,
  lerpColor,
} from '../lib/canvasKit';
import {
  C,
  drawSceneBg,
  drawPacker,
  drawSuitcase,
  drawClothes,
  drawSceneLabel,
} from './packKit';
import type { WidgetProps } from './registry';

// Ch1 analogy — 塞爆的行李箱: seven days of near-identical clothes, no folding,
// no compression. The packer stuffs harder and harder until the case bursts
// open (fill 0.7 → 1.15), then shrugs — while a pile of the same tees waits.
const W = 560;
const H = 140;
const LOOP = 3200;
const STUFF_END = 0.62;

export const Ch1Analogy: React.FC<WidgetProps> = () => {
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
    let raf = 0;

    const render = (ms: number) => {
      const t = (ms % LOOP) / LOOP;
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H);

      // the suitcase fills up and finally bursts (overflow tees poke out)
      const fill = lerp(0.7, 1.15, easeOutCubic(clamp(t / STUFF_END, 0, 1)));
      const shaking = t > STUFF_END;
      ctx.save();
      if (shaking) ctx.translate(Math.sin(ms * 0.035) * 2.2, 0);
      drawSuitcase(ctx, 160, 62, 108, 44, { fill01: fill, open: true });
      ctx.restore();

      // one wrinkled tee pops out and lands on the floor when it bursts
      if (shaking) {
        const p = clamp((t - STUFF_END) / 0.33, 0, 1);
        const px = 220 + 58 * p;
        const py = 46 - 54 * p + 108 * p * p;
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(p * 1.3);
        ctx.fillStyle = '#f6e3e6';
        ctx.strokeStyle = C.red;
        ctx.lineWidth = 1.75;
        ctx.beginPath();
        ctx.roundRect(-12, -6, 24, 12, 4);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      // packer: stuffing arms → shrug (it just won't close), mood green → red
      drawPacker(ctx, 122, 106, 1.4, {
        mode: shaking ? 'shake' : 'stuff',
        t: ms / 300,
        color: lerpColor(C.green, C.red, clamp(t / STUFF_END, 0, 1)),
      });

      // the pile of near-identical tees waiting beside the case
      drawClothes(ctx, 420, 100, 6, { color: C.red });

      drawSceneLabel(ctx, '不压缩硬塞', 16, 20, { color: C.red });
      drawSceneLabel(ctx, '同款 T 恤', 424, 30, { color: C.muted });

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(render);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
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

  return <canvas ref={ref} width={W} height={H} />;
};

export default Ch1Analogy;
