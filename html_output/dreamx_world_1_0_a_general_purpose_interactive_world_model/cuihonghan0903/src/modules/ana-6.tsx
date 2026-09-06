import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, lerp, easeInOutQuad } from '../lib/canvasKit';
import * as K from './roadKit';
import type { WidgetProps } from './registry';

const W = 244;
const H = 130;

export const Ana6: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
    const MILES = [80, 140, 200];

    const frame = (now: number) => {
      const t = ((now - t0) / 3400) % 1;
      K.clearScene(ctx, W, H);
      K.drawRoad(ctx, 12, 92, W - 24, 14);
      const x = lerp(24, 206, easeInOutQuad(Math.min(1, t * 1.12)));
      MILES.forEach((mx) => K.drawMilestone(ctx, mx, 92, x >= mx - 4));
      K.drawCar(ctx, x, 92, 0.85, K.C.guide);
      K.drawLabel(ctx, '逐块前进，逐站记录', 12, 20, K.C.muted, 10);
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

export default Ana6;
