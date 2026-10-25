import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, easeOutCubic } from '../lib/canvasKit';
import {
  C,
  drawSceneBg,
  drawCrew,
  drawHome,
  drawNotebook,
  drawVerdict,
  drawSceneLabel,
} from './movingKit';
import type { WidgetProps } from './registry';

// Ch.7 analogy — notebooks are pulled out one by one; the crew's performance
// bar at the unseen home's door sinks with each removal. Pure metaphor loop:
// no numbers, qualitative bar only (the 7.1 module carries the evidence view).
const W = 520;
const H = 240;
const PHASES = 6; // 0..5 notebooks removed
const LOOP = 9600;

const TAGS = ['MM', 'ME', 'CE', 'HL', 'WD'];
const NCOLORS = [C.blue, C.blue, C.blue, C.orange, C.purple];
// Qualitative score of the remaining recipe as notebooks disappear (0..5 removed).
const SCORE = [0.92, 0.66, 0.5, 0.38, 0.28, 0.18];

export const Ch7Analogy: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
      const ph = Math.min(PHASES - 1, Math.floor(t * PHASES));
      const phT = t * PHASES - ph;
      // Continuous "how many notebooks are gone" (0..5).
      let f = ph;
      if (ph < TAGS.length) {
        f = ph + (phT < 0.5 ? easeOutCubic(phT / 0.5) : 1);
      }
      f = clamp(f, 0, TAGS.length);
      const i0 = Math.floor(f);
      const frac = f - i0;
      const score = SCORE[i0] * (1 - frac) + SCORE[Math.min(SCORE.length - 1, i0 + 1)] * frac;

      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H);

      // Five study notebooks on a shelf; removed ones lie tilted and struck.
      TAGS.forEach((tag, k) => {
        const isRemoved = k < ph || (k === ph && ph < TAGS.length && phT >= 0.5);
        const isPulling = k === ph && ph < TAGS.length && phT < 0.5;
        const prog = isPulling ? easeOutCubic(phT / 0.5) : isRemoved ? 1 : 0;
        const x = 46 + k * 52;
        const y = 112 + prog * 28;
        ctx.save();
        if (prog > 0) {
          ctx.translate(x, y);
          ctx.rotate(0.4 * prog);
          ctx.translate(-x, -y);
        }
        drawNotebook(ctx, x, y, 0.85, tag, {
          color: NCOLORS[k],
          dim: isRemoved,
          struck: isRemoved || (isPulling && prog > 0.35),
        });
        ctx.restore();
      });

      // The unseen home + crew at the door.
      drawHome(ctx, 306, 42, 158, 106, {
        familiar: false,
        tidy01: 0.15 + 0.55 * score,
      });
      drawCrew(ctx, 350, 206, 1.45, {
        mode: score > 0.55 ? 'work' : 'shrug',
        t: ms / 280,
        color: C.blue,
      });

      // Performance bar sinking at the door.
      const bx = 486;
      const bw = 16;
      const base = 202;
      const maxH = 128;
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 2;
      ctx.strokeRect(bx, base - maxH, bw, maxH);
      const bh = Math.max(3, score * maxH);
      ctx.fillStyle = score > 0.55 ? C.green : C.red;
      ctx.fillRect(bx + 2, base - bh + 2, bw - 4, bh - 2);
      drawVerdict(ctx, 460, 74, score > 0.55, { r: 13, pulse: t * 3 });

      drawSceneLabel(ctx, '五路功课', 28, 58, { color: C.muted });
      drawSceneLabel(ctx, '新家成绩', bx + bw / 2 + 1, 58, { color: C.muted, align: 'center' });

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

export default Ch7Analogy;
