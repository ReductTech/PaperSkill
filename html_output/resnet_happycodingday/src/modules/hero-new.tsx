import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import { C, clearScene, drawPage, drawTextLines, drawMark, drawTargetStamp, drawSceneLabel } from './kit-p1';
import type { WidgetProps } from './registry';

// Hero new-method: original line kept, small margin corrections accumulate, green stamp appears.
const W = 244;
const H = 130;

export const HeroNew: React.FC<WidgetProps> = () => {
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
      drawPage(ctx, W / 2, 40, 190, 56, 0);
      drawTextLines(ctx, W / 2 - 82, 34, 164, 1, 1, C.ink);
      const marks = Math.floor(t * 4);
      for (let i = 0; i < marks; i++) {
        drawMark(ctx, W / 2 - 70 + i * 36, 50 + (i % 2) * 8, i % 3 === 0 ? 'caret' : 'under', C.red, 14);
      }
      if (t > 0.6) drawTargetStamp(ctx, W / 2 + 74, 78 + Math.sin(t * Math.PI * 2) * 2, 11);
      drawSceneLabel(ctx, '原稿 + 小修，越深越准', W / 2, H - 18, C.green, 'center');
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

  return <canvas id="cv-hero-new" ref={canvasRef} width={W} height={H} />;
};

export default HeroNew;
