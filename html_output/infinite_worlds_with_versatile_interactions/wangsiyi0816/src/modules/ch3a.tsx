import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { PAL, clearScene, drawNeedles, drawScarf, drawSceneLabel, attachScrub } from './knitKit';
import type { WidgetProps } from './registry';

const W = 244;
const H = 130;
const LOOP = 3200;

export const Ch3A: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
      clearScene(ctx, W, H);
      const end = drawScarf(ctx, 22, 90, 9, () => 15, PAL.blue, 12);
      drawNeedles(ctx, end, 90, 0.18, PAL.blue, 3);

      // the hand holds still at the needle tip
      const hx = end + 30;
      ctx.strokeStyle = PAL.support;
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(hx, 40);
      ctx.lineTo(hx, 60);
      ctx.moveTo(hx - 6, 52);
      ctx.lineTo(hx, 60);
      ctx.lineTo(hx + 6, 52);
      ctx.stroke();
      ctx.lineCap = 'butt';

      // the velocity arrow at the tip: direction sweeps, length pulses
      const ang = -0.5 + 0.3 * Math.sin(p * Math.PI * 2);
      const len = 26 + 5 * Math.sin(p * Math.PI * 4);
      const tx = end + Math.cos(ang) * len;
      const ty = 90 + Math.sin(ang) * len;
      ctx.strokeStyle = PAL.orange;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(end, 90);
      ctx.lineTo(tx, ty);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(tx - Math.cos(ang - 0.45) * 8, ty - Math.sin(ang - 0.45) * 8);
      ctx.moveTo(tx, ty);
      ctx.lineTo(tx - Math.cos(ang + 0.45) * 8, ty - Math.sin(ang + 0.45) * 8);
      ctx.stroke();

      drawSceneLabel(ctx, 18, 24, '停在这一针');
      drawSceneLabel(ctx, 132, 122, '该往哪走');
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

export default Ch3A;
