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
} from './knitKit';
import type { WidgetProps } from './registry';

const W = 272;
const H = 150;
const LOOP = 3600;

export const HeroOld: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
    canvas.style.width = '100%';
    canvas.style.height = 'auto';

    const render = (time: number) => {
      const p = (time % LOOP) / LOOP;
      const rows = 6 + Math.round(p * 12);
      clearScene(ctx, W, H);
      drawTargetWidthGuide(ctx, 20, 250, 104, 20);
      drawBasket(ctx, 14, 104, 4);
      // At p->0 every row is exactly half-width 20, identical to the new side.
      const end = drawScarf(
        ctx,
        26,
        104,
        rows,
        (i) => 20 + 26 * Math.pow(i / 18, 2) * p,
        PAL.red,
        11
      );
      drawYarnBall(ctx, 30, 132, time);
      drawNeedles(ctx, end, 104, 0.18, PAL.red, 3);
      drawSceneLabel(ctx, 26, 26, '数分钟后');
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
    };
  }, []);

  return (
    <canvas
      id={`cv-${chapterId}-${moduleId}`}
      ref={canvasRef}
      width={W}
      height={H}
      style={{ width: '100%', height: 'auto' }}
    />
  );
};

export default HeroOld;
