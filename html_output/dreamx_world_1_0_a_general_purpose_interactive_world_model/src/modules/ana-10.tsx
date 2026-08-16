import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, easeOutCubic } from '../lib/canvasKit';
import * as K from './roadKit';
import type { WidgetProps } from './registry';

const W = 244;
const H = 130;

const SCORES = [84.76, 80.79, 80.45]; // Table 3 overall, 5s basic eval
const COLORS = [K.C.good, K.C.guide, K.C.muted];

export const Ana10: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
      const t = ((now - t0) / 3600) % 1;
      const prog = easeOutCubic(Math.min(1, t * 1.5));
      K.clearScene(ctx, W, H);
      // start line
      ctx.strokeStyle = K.C.ink;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(26, 34);
      ctx.lineTo(26, 112);
      ctx.stroke();
      for (let i = 0; i < 3; i++) {
        const y = 48 + i * 30;
        ctx.strokeStyle = K.C.axis;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(26, y + 8);
        ctx.lineTo(224, y + 8);
        ctx.stroke();
        const x = 30 + (SCORES[i] / 100) * 188 * prog;
        K.drawCar(ctx, x, y, 0.62, COLORS[i]);
      }
      if (prog >= 1) {
        // trophy at leader
        ctx.fillStyle = K.C.emph;
        ctx.beginPath();
        ctx.arc(224, 40, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(221, 46, 6, 6);
      }
      K.drawLabel(ctx, '5 秒总分竞速', 30, 20, K.C.muted, 10);
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

export default Ana10;
