import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { PAL, clearScene, drawNeedles, drawScarf, drawSceneLabel, attachScrub } from './knitKit';
import type { WidgetProps } from './registry';

const W = 244;
const H = 130;
const LOOP = 3400;
const CARD_X = [92, 146, 200];

export const Ch5A: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
      const fx = 80 + p * 130;
      clearScene(ctx, W, H);

      // three small prompt cards; only those left of the finger are active
      for (let i = 0; i < 3; i++) {
        const active = CARD_X[i] <= fx;
        ctx.fillStyle = PAL.paper;
        ctx.strokeStyle = active ? PAL.blue : PAL.axis;
        ctx.lineWidth = active ? 2 : 1;
        ctx.beginPath();
        ctx.rect(CARD_X[i] - 18, 20, 36, 28);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = active ? PAL.blue : PAL.muted;
        ctx.font = '11px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('a' + (i + 1), CARD_X[i], 38);
        ctx.textAlign = 'left';
      }

      const end = drawScarf(ctx, 20, 96, 10, () => 13, PAL.blue, 11);
      drawNeedles(ctx, end, 96, 0.18, PAL.blue, 3);

      // the finger
      ctx.strokeStyle = PAL.support;
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(fx, 54);
      ctx.lineTo(fx, 70);
      ctx.moveTo(fx - 5, 63);
      ctx.lineTo(fx, 70);
      ctx.lineTo(fx + 5, 63);
      ctx.stroke();
      ctx.lineCap = 'butt';

      drawSceneLabel(ctx, 16, 24, '逐行点');
      drawSceneLabel(ctx, 16, 122, '只看到之前的卡');
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

export default Ch5A;
