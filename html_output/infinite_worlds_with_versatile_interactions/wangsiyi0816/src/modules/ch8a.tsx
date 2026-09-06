import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { PAL, clearScene, drawNeedles, drawScarf, drawSceneLabel, attachScrub } from './knitKit';
import type { WidgetProps } from './registry';

const W = 244;
const H = 130;
const LOOP = 3400;

export const Ch8A: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
      const dip = Math.sin(Math.min(1, p / 0.6) * Math.PI);
      const added = p > 0.6;

      clearScene(ctx, W, H);

      // the static "says what comes next" card
      ctx.fillStyle = PAL.paper;
      ctx.strokeStyle = PAL.purple;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.rect(18, 18, 62, 26);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = PAL.purple;
      ctx.font = '11px "Segoe UI", sans-serif';
      ctx.fillText('说下一段', 26, 35);

      const rows = added ? 11 : 10;
      const end = drawScarf(ctx, 20, 96, rows, () => 14, added ? PAL.green : PAL.blue, 11);
      drawNeedles(ctx, end, 96, 0.18, added ? PAL.green : PAL.blue, 3);

      // the single moving subject: the hand dipping to add a row
      const hy = 52 + dip * 18;
      ctx.strokeStyle = PAL.support;
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(end + 4, hy);
      ctx.lineTo(end + 4, hy + 18);
      ctx.moveTo(end - 2, hy + 11);
      ctx.lineTo(end + 4, hy + 18);
      ctx.lineTo(end + 10, hy + 11);
      ctx.stroke();
      ctx.lineCap = 'butt';

      drawSceneLabel(ctx, 18, 122, '一人说');
      drawSceneLabel(ctx, 168, 122, '一手做');
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

export default Ch8A;
