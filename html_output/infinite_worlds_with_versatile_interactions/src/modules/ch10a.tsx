import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { PAL, clearScene, drawBasket, drawScarf, drawSceneLabel, attachScrub } from './knitKit';
import type { WidgetProps } from './registry';

const W = 244;
const H = 130;
const LOOP = 3400;

export const Ch10A: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
      const rows = Math.max(1, Math.round(p * 14));

      clearScene(ctx, W, H);
      drawBasket(ctx, 22, 92, 6);
      const end = drawScarf(ctx, 36, 92, rows, () => 13, PAL.green, 13);

      // tick row appearing under the revealed part
      ctx.strokeStyle = PAL.axis;
      ctx.lineWidth = 1;
      for (let i = 0; i < rows; i++) {
        const x = 36 + i * 13;
        ctx.beginPath();
        ctx.moveTo(x, 112);
        ctx.lineTo(x, 117);
        ctx.stroke();
      }

      // the hand unrolling it flat
      ctx.strokeStyle = PAL.support;
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(end + 8, 52);
      ctx.lineTo(end + 8, 70);
      ctx.moveTo(end + 2, 62);
      ctx.lineTo(end + 8, 70);
      ctx.lineTo(end + 14, 62);
      ctx.stroke();
      ctx.lineCap = 'butt';

      drawSceneLabel(ctx, 16, 24, '摊开');
      drawSceneLabel(ctx, 16, 122, '从头看到尾');
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

export default Ch10A;
