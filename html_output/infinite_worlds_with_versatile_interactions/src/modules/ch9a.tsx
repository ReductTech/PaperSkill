import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { PAL, clearScene, drawBasket, drawSceneLabel, attachScrub } from './knitKit';
import type { WidgetProps } from './registry';

const W = 244;
const H = 130;
const LOOP = 3400;
/** Two non-adjacent old rows: relevance, not recency. */
const PICK = [2, 6];

export const Ch9A: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
      const hx = 44 + p * 150;

      clearScene(ctx, W, H);
      drawBasket(ctx, 26, 92, 4);

      for (let i = 0; i < 10; i++) {
        const x = 44 + i * 15;
        const lit = PICK.includes(i) && x <= hx;
        ctx.strokeStyle = lit ? PAL.blue : PAL.envLight;
        ctx.lineWidth = lit ? 2.5 : 1.5;
        ctx.globalAlpha = lit ? 1 : 0.6;
        ctx.beginPath();
        ctx.moveTo(x, 78);
        ctx.lineTo(x, 106);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      ctx.strokeStyle = PAL.support;
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(hx, 44);
      ctx.lineTo(hx, 62);
      ctx.moveTo(hx - 6, 54);
      ctx.lineTo(hx, 62);
      ctx.lineTo(hx + 6, 54);
      ctx.stroke();
      ctx.lineCap = 'butt';

      drawSceneLabel(ctx, 16, 24, '挑出用得上的');
      drawSceneLabel(ctx, 16, 122, '不按新旧');
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

export default Ch9A;
