import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { C, drawSceneBg, drawWheel, drawPotter, drawValueChip } from './potteryKit';
import type { WidgetProps } from './registry';

// Ch6 analogy (560x140, looping): the wheel never stops while the potter pulls
// one long clay strip of fifty little segments, hand moving back and forth —
// 拉一段、演一段. A bare "50" chip stamps the strip when it completes.
const W = 560;
const H = 140;
const SEGS = 50;
const FILL_MS = 3000;
const HOLD_MS = 1200;
const LOOP = FILL_MS + HOLD_MS;

export const Ch6Analogy: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
      const n = Math.min(SEGS, Math.floor((elapsed / FILL_MS) * SEGS));
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H, { ground: false });

      // the wheel never stops
      drawWheel(ctx, 82, 100, 38, { spin: (ms / 190) % (Math.PI * 2) });
      // potter with both hands on the strip, oscillating
      drawPotter(ctx, 150, 126, 1.5, { mode: 'shape', t: ms / 420 });

      // fifty-segment clay strip, wiggling as it is pulled
      const x0 = 180;
      const x1 = 544;
      const step = (x1 - x0) / SEGS;
      for (let i = 0; i < SEGS; i++) {
        const dy = Math.sin(i * 0.55 + ms / 300) * 1.6;
        ctx.beginPath();
        ctx.roundRect(x0 + i * step, 88 + dy, step - 1.2, 16, 2);
        if (i < n) {
          ctx.fillStyle = C.green;
          ctx.globalAlpha = 0.9;
          ctx.fill();
          ctx.globalAlpha = 1;
        } else {
          ctx.fillStyle = '#e3e9f2';
          ctx.fill();
        }
      }
      if (n >= SEGS) drawValueChip(ctx, 518, 40, '50', C.green);

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

export default Ch6Analogy;
