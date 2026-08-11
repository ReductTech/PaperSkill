import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { C, clearScene, drawPage, drawSceneLabel } from './kit-p3';
import type { WidgetProps } from './registry';

// Ch8 analogy: manuscript pages bound into a book — same layout, growing spine.
const W = 244;
const H = 130;

export const Ch8Analogy: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const t0 = performance.now();
    const render = (now: number) => {
      clearScene(ctx, W, H);
      const t = ((now - t0) / 3400) % 1;
      const n = Math.floor(t * 8) + 1;
      for (let i = 0; i < n; i++) {
        const y = 110 - i * 3;
        drawPage(ctx, W / 2 - 30 + i * 0.6, y, 60, 36, (i % 2 === 0 ? -1 : 1) * 0.04);
      }
      // spine
      ctx.fillStyle = C.pencil;
      ctx.fillRect(W / 2 + 34, 106 - n * 3, 7, n * 3 + 4);
      drawSceneLabel(ctx, `${n} 页 · 同一版式`, W / 2, 16, C.blue, 'center');
    };
    const tick = () => {
      render(performance.now());
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  return <canvas id="cv-ch8-analogy" ref={canvasRef} width={W} height={H} />;
};

export default Ch8Analogy;
