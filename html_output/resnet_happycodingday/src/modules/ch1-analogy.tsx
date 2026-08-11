import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import { C, clearScene, drawPage, drawTextLines, drawPen, drawSceneLabel } from './kit-p1';
import type { WidgetProps } from './registry';

// Ch1 analogy: a pencil repeatedly copies the same paragraph — clarity drops as copies stack up.
const W = 244;
const H = 130;

export const Ch1Analogy: React.FC<WidgetProps> = () => {
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
      const clarity = clamp(1 - t * 0.9, 0.15, 1);
      drawPage(ctx, W / 2, 66, 190, 58, 0);
      drawTextLines(ctx, W / 2 - 82, 60, 164, 2, clarity, C.ink);
      drawPen(ctx, W / 2 - 84 + t * 170, 100, -0.12);
      drawSceneLabel(ctx, '原稿', W / 2 + 82, 18, C.muted, 'right');
      drawSceneLabel(ctx, '抄写次数 ↑', 16, 18, C.blue);
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

  return <canvas id="cv-ch1-analogy" ref={canvasRef} width={W} height={H} />;
};

export default Ch1Analogy;
