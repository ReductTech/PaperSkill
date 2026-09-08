import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import * as K from './roadKit';
import type { WidgetProps } from './registry';

const W = 244;
const H = 130;

export const Ana3: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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

    // curved route: quadratic bezier from (24,100) via (120,108) to (216,44)
    const px = (t: number) =>
      (1 - t) * (1 - t) * 24 + 2 * (1 - t) * t * 120 + t * t * 216;
    const py = (t: number) =>
      (1 - t) * (1 - t) * 100 + 2 * (1 - t) * t * 112 + t * t * 40;

    const frame = (now: number) => {
      const t = ((now - t0) / 3000) % 1;
      K.clearScene(ctx, W, H);
      // guided route (blue dashed)
      ctx.strokeStyle = K.C.guide;
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(px(0), py(0));
      for (let i = 1; i <= 24; i++) ctx.lineTo(px(i / 24), py(i / 24));
      ctx.stroke();
      ctx.setLineDash([]);
      K.drawSign(ctx, 150, 92, K.C.guide, t > 0.35 && t < 0.75);
      const tt = Math.min(1, t * 1.1);
      K.drawCar(ctx, px(tt), py(tt), 0.85, K.C.guide);
      K.drawLabel(ctx, '跟随路牌过弯', 12, 20, K.C.muted, 10);
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

export default Ana3;
