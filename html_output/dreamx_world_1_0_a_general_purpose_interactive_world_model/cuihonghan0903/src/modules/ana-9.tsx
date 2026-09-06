import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, easeOutCubic } from '../lib/canvasKit';
import * as K from './roadKit';
import type { WidgetProps } from './registry';

const W = 244;
const H = 130;

export const Ana9: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
      // gauge
      const tuned = easeOutCubic(Math.min(1, t * 1.4));
      K.drawGauge(ctx, 170, 96, 34, tuned);
      K.drawLabel(ctx, '调校', 152, 34, K.C.muted, 10);
      // wrench turning a bolt
      const ang = tuned * Math.PI * 1.5;
      ctx.save();
      ctx.translate(70, 84);
      ctx.rotate(ang * 0.3 - 0.3);
      ctx.strokeStyle = K.C.ink;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(-22, 0);
      ctx.lineTo(10, 0);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(14, 0, 7, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      // bolt
      ctx.fillStyle = K.C.road;
      ctx.beginPath();
      ctx.arc(70, 84, 5, 0, Math.PI * 2);
      ctx.fill();
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

export default Ana9;
