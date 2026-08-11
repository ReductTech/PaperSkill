import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { C, clearScene, drawPage, drawTextLines, drawPen, drawTargetStamp, drawSceneLabel } from './kit-p2';
import type { WidgetProps } from './registry';

// Ch6 analogy: copying out a fair copy line by line, green tick after each completed line.
const W = 244;
const H = 130;

export const Ch6Analogy: React.FC<WidgetProps> = () => {
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
      drawPage(ctx, W / 2, 76, 190, 52, 0);
      const progress = t * 3;
      for (let i = 0; i < 3; i++) {
        const done = i < Math.floor(progress) || (i === Math.floor(progress) && t > 0.2);
        drawTextLines(ctx, W / 2 - 82, 72 + i * 14, done ? 150 : 150 * ((progress - i) % 1), 1, done ? 1 : 0.9, C.ink);
        if (i < Math.floor(progress) || (i === 2 && t > 0.85)) drawTargetStamp(ctx, W / 2 + 86, 78 + i * 14, 7);
      }
      drawPen(ctx, W / 2 - 80 + t * 150, 106, -0.1);
      drawSceneLabel(ctx, '誊清稿', 16, 18, C.blue);
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

  return <canvas id="cv-ch6-analogy" ref={canvasRef} width={W} height={H} />;
};

export default Ch6Analogy;
