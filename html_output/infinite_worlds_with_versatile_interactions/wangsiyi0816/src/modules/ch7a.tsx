import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, easeInOutQuad } from '../lib/canvasKit';
import { PAL, clearScene, drawNeedles, drawScarf, drawSceneLabel, attachScrub } from './knitKit';
import type { WidgetProps } from './registry';

const W = 244;
const H = 130;
const LOOP = 3400;

export const Ch7A: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
      const drop = easeInOutQuad(Math.min(1, p / 0.7));
      const sy = 34 + drop * 50;
      const contact = drop > 0.92;

      clearScene(ctx, W, H);
      const end = drawScarf(ctx, 22, 96, 10, () => 14, PAL.blue, 12);
      drawNeedles(ctx, end, 96, 0.18, PAL.blue, 3);

      // the sample swatch drifting down onto the fabric
      ctx.fillStyle = contact ? 'rgba(34,141,92,0.20)' : PAL.paper;
      ctx.strokeStyle = PAL.green;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.rect(150, sy, 30, 22);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = PAL.green;
      ctx.lineWidth = 1.2;
      for (let k = 0; k < 3; k++) {
        ctx.beginPath();
        ctx.moveTo(155 + k * 8, sy + 5);
        ctx.lineTo(155 + k * 8, sy + 17);
        ctx.stroke();
      }

      drawSceneLabel(ctx, 18, 24, '样布');
      drawSceneLabel(ctx, 18, 122, '比对手感');
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

export default Ch7A;
