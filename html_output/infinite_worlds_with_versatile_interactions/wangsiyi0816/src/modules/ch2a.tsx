import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { PAL, clearScene, drawNeedles, drawScarf, drawSceneLabel, attachScrub } from './knitKit';
import type { WidgetProps } from './registry';

const W = 244;
const H = 130;
const LOOP = 3200;

export const Ch2A: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
      // the needles rotate; the ghost extension shows where the next row would go
      const tilt = 0.5 * Math.sin(p * Math.PI * 2);
      clearScene(ctx, W, H);
      const end = drawScarf(ctx, 20, 92, 10, () => 14, PAL.blue, 11);
      drawNeedles(ctx, end, 92, tilt, PAL.blue, 3);

      // ghost next rows along the current tilt
      ctx.strokeStyle = 'rgba(39,68,110,0.35)';
      ctx.lineWidth = 2;
      const ca = Math.cos(tilt);
      const sa = Math.sin(tilt);
      for (let k = 1; k <= 2; k++) {
        const gx = end + ca * (k * 13);
        const gy = 92 + sa * (k * 13);
        ctx.beginPath();
        ctx.moveTo(gx + sa * 14, gy - ca * 14);
        ctx.lineTo(gx - sa * 14, gy + ca * 14);
        ctx.stroke();
      }

      drawSceneLabel(ctx, 18, 24, '转针');
      drawSceneLabel(ctx, 138, 122, '下一行往哪走');
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

export default Ch2A;
