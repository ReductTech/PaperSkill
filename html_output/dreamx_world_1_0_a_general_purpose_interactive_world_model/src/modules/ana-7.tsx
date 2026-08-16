import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, easeInOutQuad } from '../lib/canvasKit';
import * as K from './roadKit';
import type { WidgetProps } from './registry';

const W = 244;
const H = 130;

export const Ana7: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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

    const lineX = (t: number) => 24 + t * 196;
    const lineY = (t: number) => 96 - Math.sin(t * Math.PI * 1.5) * 26;

    const frame = (now: number) => {
      const t = ((now - t0) / 3000) % 1;
      K.clearScene(ctx, W, H);
      // coach's white line
      ctx.strokeStyle = 'rgba(39,68,110,0.45)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(lineX(0), lineY(0));
      for (let i = 1; i <= 30; i++) ctx.lineTo(lineX(i / 30), lineY(i / 30));
      ctx.stroke();
      K.drawFlag(ctx, 224, lineY(1) + 8, K.C.good);
      const tt = easeInOutQuad(Math.min(1, t * 1.12));
      K.drawCar(ctx, lineX(tt), lineY(tt) - 2, 0.85, K.C.emph);
      K.drawLabel(ctx, '沿白线练车', 12, 20, K.C.muted, 10);
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

export default Ana7;
