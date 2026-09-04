import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { PAL, clearScene, drawNeedles, drawScarf, drawSceneLabel, attachScrub } from './knitKit';
import type { WidgetProps } from './registry';

const W = 244;
const H = 130;
const LOOP = 3400;

export const Ch6A: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
      const firstHalf = p < 0.5;
      const local = firstHalf ? p / 0.5 : (p - 0.5) / 0.5;
      const motions = firstHalf ? 8 : 2;
      const amp = firstHalf ? 10 : 30;
      const hx = 150 + Math.sin(local * motions * Math.PI * 2) * amp;
      const done = local > 0.9;

      clearScene(ctx, W, H);
      const end = drawScarf(ctx, 24, 92, 9, () => 15, done ? PAL.green : PAL.blue, 13);
      drawNeedles(ctx, end, 92, 0.18, done ? PAL.green : PAL.blue, 3);

      ctx.strokeStyle = PAL.support;
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(hx, 44);
      ctx.lineTo(hx, 64);
      ctx.moveTo(hx - 6, 56);
      ctx.lineTo(hx, 64);
      ctx.lineTo(hx + 6, 56);
      ctx.stroke();
      ctx.lineCap = 'butt';

      drawSceneLabel(ctx, 18, 24, firstHalf ? '8 手' : '2 手');
      drawSceneLabel(ctx, 172, 122, '同一行');
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

export default Ch6A;
