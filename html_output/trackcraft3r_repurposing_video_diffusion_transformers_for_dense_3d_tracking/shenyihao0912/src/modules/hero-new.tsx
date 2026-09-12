import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { C, drawSceneBg, drawDog, drawTrail, drawTracker, drawLegend, drawSceneLabel } from './dogKit';
import type { WidgetProps } from './registry';

// Hero new-method panel: anchored single-pass tracking — the green mark rides
// the dog's nose for the whole clip in one forward pass.
const W = 520;
const H = 240;
const LOOP = 3200;

export const HeroNew: React.FC<WidgetProps> = () => {
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
    const groundY = H - 44;
    const dogX = (t: number) => 60 + t * 400;
    // tiny residual error, never accumulates (anchored single pass)
    const err = (t: number) => Math.sin(t * 9) * 3;

    const render = (ms: number) => {
      const t = (ms % LOOP) / LOOP;
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H);
      drawTrail(
        ctx,
        [
          { x: dogX(0), y: groundY - 26 },
          { x: dogX(1), y: groundY - 26 },
        ],
        C.muted
      );
      // green anchored trail hugs the true path
      const pts = [] as { x: number; y: number }[];
      for (let i = 0; i <= 24; i++) {
        const u = (i / 24) * t;
        pts.push({ x: dogX(u), y: groundY - 26 - err(u) });
      }
      drawTrail(ctx, pts, C.green);
      drawDog(ctx, dogX(t), groundY, 1.25, { mood: 'walk', t });
      drawTracker(ctx, dogX(t) + 28, groundY - 32, 6);
      drawSceneLabel(ctx, '锚定', 14, 20, { color: C.green });
      drawLegend(
        ctx,
        [
          ['单步前向', C.green],
          ['潜空间注意力', C.purple],
          ['7.63 GB', C.blue],
        ],
        14,
        H - 16
      );
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

  return <canvas ref={ref} width={W} height={H} className="hero-cv" />;
};

export default HeroNew;
