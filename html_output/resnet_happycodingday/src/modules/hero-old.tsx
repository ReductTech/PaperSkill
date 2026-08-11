import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import { C, clearScene, drawPage, drawTextLines, drawSceneLabel } from './kit-p1';
import type { WidgetProps } from './registry';

// Hero old-method: repeated full rewriting of a manuscript — each layer garbles it more (red).
const W = 244;
const H = 130;

export const HeroOld: React.FC<WidgetProps> = () => {
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
      const t = ((now - t0) / 3000) % 1;
      const layers = 4;
      for (let i = 0; i < layers; i++) {
        const clarity = clamp(1 - (i + t) / layers, 0.12, 1);
        const y = 16 + i * 26;
        drawPage(ctx, W / 2, y, 168, 24, 0);
        drawTextLines(ctx, W / 2 - 74, y - 5, 148, 1, clarity, C.red);
      }
      drawSceneLabel(ctx, '层层重写，越深越乱', W / 2, H - 18, C.red, 'center');
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

  return <canvas id="cv-hero-old" ref={canvasRef} width={W} height={H} />;
};

export default HeroOld;
