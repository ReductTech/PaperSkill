import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import { C, clearScene, drawPage, drawTextLines, drawMark, drawSceneLabel } from './kit-p1';
import type { WidgetProps } from './registry';

// Ch3 analogy: two columns — left full rewrite (degrades, red), right original + margin fix (improves, green).
const W = 244;
const H = 130;

export const Ch3Analogy: React.FC<WidgetProps> = () => {
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
      // left: rewriting the whole line — clarity drops
      const leftClarity = clamp(1 - t * 0.8, 0.2, 1);
      drawPage(ctx, 64, 66, 108, 56, 0);
      drawTextLines(ctx, 18, 60, 90, 2, leftClarity, C.red);
      drawSceneLabel(ctx, '重写整段', 64, 20, C.red, 'center');
      // right: original kept + margin correction
      drawPage(ctx, 182, 66, 108, 56, 0);
      drawTextLines(ctx, 136, 60, 90, 2, 1, C.ink);
      const marks = Math.floor(t * 3);
      for (let i = 0; i < marks; i++) {
        drawMark(ctx, 142 + i * 30, 72 + (i % 2) * 6, 'under', C.red, 14);
      }
      drawSceneLabel(ctx, '原句+批注', 182, 20, C.green, 'center');
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

  return <canvas id="cv-ch3-analogy" ref={canvasRef} width={W} height={H} />;
};

export default Ch3Analogy;
