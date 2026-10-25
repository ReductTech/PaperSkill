import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import {
  C,
  drawSceneBg,
  drawCrew,
  drawHome,
  drawSceneLabel,
  drawValueChip,
} from './movingKit';
import type { WidgetProps } from './registry';

// Ch6 analogy — 走过的路: the trail of homes the crew has worked at grows
// 3 -> 12 -> 22 -> 53 -> 82 -> 104 while the score bar on the unfamiliar
// new home rises in sync. 560x140 loop.
const W = 560;
const H = 140;
const LOOP = 6600;
const STOPS = [3, 12, 22, 53, 82, 104];
const SHOWN_CAP = 8;

export const Ch6Analogy: React.FC<WidgetProps> = () => {
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
      const seg = Math.max(0, Math.min(STOPS.length - 1, Math.floor(t * STOPS.length)));
      const stop = STOPS[seg];
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H);

      // trail of visited homes (capped), each stop adds more
      const shown = Math.min(stop, SHOWN_CAP);
      for (let k = 0; k < shown; k++) {
        const fade = k === shown - 1 ? 1 : 0.55 + 0.45 * (k / Math.max(1, shown - 1));
        ctx.save();
        ctx.globalAlpha = fade;
        drawHome(ctx, 18 + k * 40, 74, 34, 28, { familiar: true, tidy01: 0.9 });
        ctx.restore();
      }
      // actual count chip
      drawValueChip(ctx, 18 + shown * 40 + 8, 88, `×${stop}`, C.blue);

      // crew marching toward the next unfamiliar home
      drawCrew(ctx, 396, 104, 1.15, { mode: 'coach', t: ms / 350, color: C.green });

      // the unfamiliar new home with a rising score bar
      const frac = clamp((seg + 1) / STOPS.length, 0, 1);
      drawHome(ctx, 428, 44, 112, 62, { familiar: false, tidy01: 0.15 + 0.8 * frac });
      // score bar above it
      ctx.save();
      ctx.fillStyle = C.border;
      ctx.beginPath();
      ctx.roundRect(428, 28, 112, 10, 5);
      ctx.fill();
      ctx.fillStyle = C.green;
      ctx.beginPath();
      ctx.roundRect(428, 28, Math.max(8, 112 * frac), 10, 5);
      ctx.fill();
      ctx.restore();

      drawSceneLabel(ctx, '走过的家', 16, 22, { color: C.blue });
      drawSceneLabel(ctx, '新家成绩', 556, 22, { color: C.muted, align: 'right' });

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(render);
    };
    const stopFn = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };
    const startFn = () => {
      if (!raf) raf = requestAnimationFrame(render);
    };
    const disconnect = observeCanvas(canvas, startFn, stopFn);
    return () => {
      stopFn();
      disconnect();
    };
  }, []);

  return <canvas ref={ref} width={W} height={H} />;
};

export default Ch6Analogy;
