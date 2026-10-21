import React, { useEffect, useRef } from 'react';
import {
  setupCanvas,
  observeCanvas,
  clamp,
  lerp,
  easeOutBounce,
} from '../lib/canvasKit';
import { C, drawSceneBg, drawSceneLabel, drawValueChip } from './packKit';
import type { WidgetProps } from './registry';

// Ch2 analogy — 同款 T 恤堆: three near-identical tees drop into the pile one
// by one. The first two build it up visibly; the third lands squashed and the
// pile barely rises — one more tee, zero new information (+0 badge).
const W = 560;
const H = 140;
const LOOP = 3400;
const DUR = 0.17;

const FALLS = [
  { t0: 0.05, x: 230, restY: 100 },
  { t0: 0.3, x: 240, restY: 82 },
  { t0: 0.55, x: 224, restY: 76 },
];

export const Ch2Analogy: React.FC<WidgetProps> = () => {
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

    // a soft wrinkly tee (identical every time — that is the point)
    const tee = (cx: number, cy: number, rot: number, sy: number) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rot);
      ctx.scale(1, sy);
      ctx.fillStyle = '#f6e3e6';
      ctx.strokeStyle = C.red;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-23, -11, 46, 22, 5);
      ctx.fill();
      ctx.stroke();
      // neckline hint
      ctx.beginPath();
      ctx.arc(0, -11, 4.5, 0.25, Math.PI - 0.25);
      ctx.stroke();
      ctx.restore();
    };

    const render = (ms: number) => {
      const t = (ms % LOOP) / LOOP;
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H);

      // tees drop one by one; tee 3 squashes in and tee 2 gets pushed down
      const push3 = clamp((t - FALLS[2].t0) / DUR, 0, 1);
      FALLS.forEach((f, k) => {
        if (t < f.t0) return;
        const u = clamp((t - f.t0) / DUR, 0, 1);
        const y = lerp(-26, f.restY, easeOutBounce(u));
        const rot = Math.sin(u * 9) * 0.14 * (1 - u);
        const sy = k === 2 ? lerp(1, 0.6, clamp((u - 0.7) / 0.3, 0, 1)) : 1;
        const dy = k === 1 ? 3 * push3 : 0;
        tee(f.x, y + dy, rot, sy);
      });

      // previous pile-top line: the third tee barely rises above it
      if (t > 0.74) {
        ctx.save();
        ctx.strokeStyle = C.red;
        ctx.globalAlpha = 0.65;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.moveTo(180, 71);
        ctx.lineTo(300, 71);
        ctx.stroke();
        ctx.restore();
      }

      // the red +0 badge pulses beside the pile
      if (t > 0.78) {
        ctx.save();
        ctx.translate(415, 54);
        const s = 1 + 0.06 * Math.sin(ms * 0.006);
        ctx.scale(s, s);
        drawValueChip(ctx, 0, 0, '+0', C.red);
        ctx.restore();
      }

      drawSceneLabel(ctx, '同款 T 恤', 16, 20, { color: C.muted });
      drawSceneLabel(ctx, '第三件 +0 信息', 240, 126, { color: C.red });

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

export default Ch2Analogy;
