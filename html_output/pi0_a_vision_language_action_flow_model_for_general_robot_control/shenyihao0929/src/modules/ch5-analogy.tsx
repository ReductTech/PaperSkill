import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import {
  C,
  drawSceneBg,
  drawWheel,
  drawClay,
  drawLegend,
  drawSceneLabel,
  drawCheckMark,
} from './potteryKit';
import type { WidgetProps } from './registry';

// Ch5 analogy (560x140, looping): a ten-cell progress strip lights up one cell
// per Euler step while the clay on the spinning wheel morphs through the same
// ten stages (τ = k/10: noise blob -> vase). Green = done, orange = current.
const W = 560;
const H = 140;
const STEP_MS = 340;
const HOLD_MS = 1300;
const LOOP = STEP_MS * 10 + HOLD_MS;

export const Ch5Analogy: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
      const elapsed = ms % LOOP;
      const k = Math.min(10, Math.floor(elapsed / STEP_MS));
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H, { ground: false });

      // spinning wheel + clay at τ = k/10
      drawWheel(ctx, 96, 102, 36, { spin: (ms / 240) % (Math.PI * 2) });
      drawClay(ctx, 96, 80, k / 10, { size: 1.3, t: ms / 900 });

      // ten-cell progress strip
      const x0 = 186;
      const x1 = 544;
      const span = x1 - x0;
      const cw = span / 10 - 4;
      for (let i = 0; i < 10; i++) {
        const cx = x0 + (i * span) / 10;
        ctx.beginPath();
        ctx.roundRect(cx, 58, cw, 22, 4);
        ctx.fillStyle = i < k ? C.green : i === k && k < 10 ? C.orange : '#e3e9f2';
        ctx.fill();
      }
      drawSceneLabel(ctx, `τ=${(k / 10).toFixed(1)}`, x0, 38, { color: C.orange });
      if (k >= 10) drawCheckMark(ctx, 524, 38, 9);
      drawLegend(ctx, [['已成', C.green], ['当前', C.orange]], x0, 102);

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

  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />;
};

export default Ch5Analogy;
