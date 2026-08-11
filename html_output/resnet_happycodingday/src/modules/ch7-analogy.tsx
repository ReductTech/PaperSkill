import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import { C, clearScene, drawPage, drawTextLines, drawPen, drawSceneLabel } from './kit-p3';
import type { WidgetProps } from './registry';

// Ch7 analogy: pen pressure — too heavy tears the paper, too light leaves no trace, moderate is clean.
const W = 244;
const H = 130;

export const Ch7Analogy: React.FC<WidgetProps> = () => {
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
      const t = ((now - t0) / 3600) % 1;
      // pressure cycles: light -> moderate -> heavy
      const phase = (t * 3) % 1;
      const mode = Math.floor(t * 3);
      const pressure = mode === 0 ? 0.15 : mode === 1 ? 0.55 : 1;
      drawPage(ctx, W / 2, 76, 190, 46, 0);
      drawTextLines(ctx, W / 2 - 82, 72, 150, 1, 1, C.ink);
      const lw = mode === 0 ? 1 : mode === 1 ? 3 : 7;
      const col = mode === 0 ? C.muted : mode === 1 ? C.green : C.red;
      ctx.strokeStyle = col;
      ctx.lineWidth = lw;
      ctx.beginPath();
      ctx.moveTo(W / 2 - 70 + phase * 110, 96);
      ctx.lineTo(W / 2 - 50 + phase * 110, 96);
      ctx.stroke();
      drawPen(ctx, W / 2 - 80 + phase * 130, 92 + Math.sin(phase * 20) * 4, -0.15);
      drawSceneLabel(ctx, mode === 0 ? '太轻 · 改不动' : mode === 1 ? '适中 · 清晰' : '太重 · 划破纸', W / 2, 18, col, 'center');
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

  return <canvas id="cv-ch7-analogy" ref={canvasRef} width={W} height={H} />;
};

export default Ch7Analogy;
