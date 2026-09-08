import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import * as K from './roadKit';
import type { WidgetProps } from './registry';

const W = 244;
const H = 130;

const ROUTE: [number, number][] = [
  [30, 100], [70, 92], [105, 98], [140, 78], [172, 82], [208, 56],
];

export const Ana4: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
    let raf: number | null = null;
    const t0 = performance.now();

    const frame = (now: number) => {
      const t = ((now - t0) / 3000) % 1;
      K.clearScene(ctx, W, H);
      // map sheet
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = K.C.axis;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(16, 30, W - 32, 86, 5);
      ctx.fill();
      ctx.stroke();
      // sparse traced dots (progressively revealed)
      const total = ROUTE.length - 1;
      const prog = Math.min(1, t * 1.25) * total;
      ctx.fillStyle = K.C.emph;
      for (let i = 0; i < ROUTE.length; i++) {
        if (i <= prog) {
          ctx.beginPath();
          ctx.arc(ROUTE[i][0], ROUTE[i][1], 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      // pen at current position
      const i = Math.min(total - 1, Math.floor(prog));
      const f = prog - i;
      const x = ROUTE[i][0] + (ROUTE[i + 1][0] - ROUTE[i][0]) * f;
      const y = ROUTE[i][1] + (ROUTE[i + 1][1] - ROUTE[i][1]) * f;
      if (t < 0.85) {
        ctx.strokeStyle = K.C.ink;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x + 10, y - 16);
        ctx.lineTo(x, y);
        ctx.stroke();
      }
      K.drawLabel(ctx, '稀疏描点还原路线', 22, 22, K.C.muted, 10);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = null;
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />;
};

export default Ana4;
