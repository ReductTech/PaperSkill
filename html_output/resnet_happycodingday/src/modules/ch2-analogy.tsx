import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { C, clearScene, drawPage, drawTextLines, drawSceneLabel } from './kit-p1';
import type { WidgetProps } from './registry';

// Ch2 analogy: a reading window sweeps across a paragraph (local reading).
const W = 244;
const H = 130;

export const Ch2Analogy: React.FC<WidgetProps> = () => {
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
      drawPage(ctx, W / 2, 66, 200, 52, 0);
      drawTextLines(ctx, W / 2 - 86, 62, 172, 2, 1, C.ink);
      const wx = W / 2 - 86 + t * 150;
      ctx.strokeStyle = C.blue;
      ctx.lineWidth = 2;
      ctx.strokeRect(wx - 22, 56, 44, 34);
      ctx.fillStyle = 'rgba(39,68,110,0.12)';
      ctx.fillRect(wx - 22, 56, 44, 34);
      drawSceneLabel(ctx, '阅读视窗', 16, 18, C.blue);
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

  return <canvas id="cv-ch2-analogy" ref={canvasRef} width={W} height={H} />;
};

export default Ch2Analogy;
