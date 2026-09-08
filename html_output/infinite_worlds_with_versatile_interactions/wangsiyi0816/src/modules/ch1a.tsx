import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import {
  PAL,
  clearScene,
  drawBasket,
  drawNeedles,
  drawScarf,
  drawSceneLabel,
  drawTargetWidthGuide,
  drawYarnBall,
  attachScrub,
} from './knitKit';
import type { WidgetProps } from './registry';

const W = 244;
const H = 130;
const LOOP = 3400;

export const Ch1A: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
      const rows = 1 + Math.round(p * 9);
      clearScene(ctx, W, H);
      drawTargetWidthGuide(ctx, 34, 214, 86, 17);
      drawBasket(ctx, 24, 86, Math.min(3, Math.floor(rows / 4)));
      const end = drawScarf(
        ctx,
        38,
        86,
        rows,
        (i) => 17 + 20 * Math.pow(i / 10, 2),
        rows > 6 ? PAL.red : PAL.blue,
        17
      );
      drawYarnBall(ctx, 40, 112, time);
      drawNeedles(ctx, end, 86, 0.18, rows > 6 ? PAL.red : PAL.blue, 3);
      drawSceneLabel(ctx, 20, 122, '已织');
      drawSceneLabel(ctx, 186, 26, '针上');
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

export default Ch1A;
