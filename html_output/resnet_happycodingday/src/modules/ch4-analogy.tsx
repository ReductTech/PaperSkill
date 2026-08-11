import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { C, clearScene, drawPage, drawTextLines, drawMark, drawTargetStamp, drawSceneLabel } from './kit-p2';
import type { WidgetProps } from './registry';

// Ch4 analogy: margin note merges into the original sentence (x + F(x) = y).
const W = 244;
const H = 130;

export const Ch4Analogy: React.FC<WidgetProps> = () => {
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
      const t = ((now - t0) / 3200) % 1;
      drawPage(ctx, W / 2, 70, 200, 48, 0);
      drawTextLines(ctx, W / 2 - 86, 66, 172, 1, 1, C.ink);
      // margin note approaches and merges
      const nx = W / 2 + 70 - t * 130;
      const ny = 78 + t * 20;
      if (t < 0.7) drawMark(ctx, nx, ny, 'note', C.red, 16);
      if (t > 0.45) {
        drawMark(ctx, W / 2 - 60 + t * 80, 92, 'under', C.red, 26);
      }
      if (t > 0.75) drawTargetStamp(ctx, W / 2 + 80, 60, 11);
      drawSceneLabel(ctx, 'y = F(x) + x', W / 2, 16, C.blue, 'center');
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

  return <canvas id="cv-ch4-analogy" ref={canvasRef} width={W} height={H} />;
};

export default Ch4Analogy;
