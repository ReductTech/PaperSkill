import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, easeInOutQuad } from '../lib/canvasKit';
import * as K from './roadKit';
import type { WidgetProps } from './registry';

const W = 300;
const H = 140;

export const HeroOld: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
      const t = ((now - t0) / 4000) % 1;
      // out-and-back: 0→0.5 out, 0.5→1 back
      const leg = t < 0.5 ? t * 2 : (1 - t) * 2;
      const p = easeInOutQuad(leg);
      const returning = t >= 0.75; // near revisit
      K.clearScene(ctx, W, H);
      K.drawRoad(ctx, 14, 104, W - 28, 14);
      // town: mutates on revisit (drift)
      K.drawHouse(ctx, 60, 104, 1, returning ? K.C.bad : K.C.depth);
      K.drawHouse(ctx, 130, 104, 0.8, returning ? K.C.emph : K.C.ground);
      K.drawTree(ctx, returning ? 190 : 210, 104, 1);
      if (returning) K.drawLabel(ctx, '重访：街景变了 ✗', 14, 24, K.C.bad, 11);
      else K.drawLabel(ctx, '开出 → 返回', 14, 24, K.C.muted, 10);
      K.drawCar(ctx, 40 + p * 200, 104, 0.9, returning ? K.C.bad : K.C.muted);
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

export default HeroOld;
