import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, easeOutCubic } from '../lib/canvasKit';
import { PAL, clearScene, drawNeedles, drawPatternCard, drawScarf, drawSceneLabel, attachScrub } from './knitKit';
import type { WidgetProps } from './registry';

const W = 244;
const H = 130;
const LOOP = 3400;

export const Ch4A: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
    // Let the pointer take over this loop so the motion can be inspected.
    const scrub = attachScrub(canvas, LOOP);

    const render = (time: number) => {
      const p = scrub.phase(time);
      const slide = easeOutCubic(Math.min(1, p / 0.7));
      clearScene(ctx, W, H);
      const end = drawScarf(ctx, 20, 96, 9, () => 13, PAL.blue, 11);
      drawNeedles(ctx, end, 96, 0.18, PAL.blue, 3);
      drawPatternCard(ctx, 118, 26, '自回归', true);
      // card B slides in and ends aligned beside card A
      drawPatternCard(ctx, 218 - slide * 36, 26, '双向', slide > 0.92);
      drawSceneLabel(ctx, 18, 24, '两张卡');
      drawSceneLabel(ctx, 18, 122, '并排比');
    };

    const tick = (t: number) => {
      render(t);
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
      scrub.detach();
    };
  }, []);

  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />;
};

export default Ch4A;
