import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import { C, drawSceneBg, drawDog, drawTracker, drawFilmStrip, drawSceneLabel } from './dogKit';
import type { WidgetProps } from './registry';

// Ch9 analogy card — 分段回放: a playhead sweeps a 5-segment timeline; every
// segment corner carries the same pinned green frame-0 thumbnail (the anchor),
// which never changes across the whole sweep.
const W = 560;
const H = 140;
const LOOP = 3200;

export const Ch9Analogy: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let raf = 0;
    const stripX = 36;
    const stripY = 84;
    const cell = 46;
    const gap = 8;
    const stripW = 5 * cell + 4 * gap;

    const render = (ms: number) => {
      const t = (ms % LOOP) / LOOP;
      // playhead sweeps across the segments for ~78% of the loop, then rests
      const sweep = clamp(t / 0.78, 0, 1);
      const cellIdx = Math.min(4, Math.floor(sweep * 5));
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H);

      // anchor pins: the same green dot at each segment corner
      for (let k = 0; k < 5; k++) {
        ctx.fillStyle = C.green;
        ctx.beginPath();
        ctx.arc(stripX + k * (cell + gap) + 4, stripY - 16, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // the 5-segment timeline; the cell under the playhead lights up softly
      drawFilmStrip(ctx, stripX, stripY, 5, cellIdx);

      // sweeping playhead with a small marker
      const px = stripX + sweep * stripW;
      ctx.strokeStyle = C.orange;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(px, stripY - 26);
      ctx.lineTo(px, stripY + 46);
      ctx.stroke();
      ctx.fillStyle = C.orange;
      ctx.beginPath();
      ctx.moveTo(px - 6, stripY - 34);
      ctx.lineTo(px + 6, stripY - 34);
      ctx.lineTo(px, stripY - 24);
      ctx.closePath();
      ctx.fill();

      // corner pin: the frame-0 thumbnail, pinned once, never changes
      const tx = 448;
      const ty = 22;
      ctx.fillStyle = C.white;
      ctx.strokeStyle = C.green;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(tx, ty, 74, 52, 6);
      ctx.fill();
      ctx.stroke();
      drawDog(ctx, tx + 16, ty + 42, 0.62, { mood: 'idle', t });
      drawTracker(ctx, tx + 30.3, ty + 26.5, 3.4);
      ctx.strokeStyle = C.muted;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(tx + 37, ty - 2);
      ctx.lineTo(tx + 41, ty + 10);
      ctx.stroke();
      ctx.fillStyle = C.orange;
      ctx.beginPath();
      ctx.arc(tx + 37, ty - 4, 3.5, 0, Math.PI * 2);
      ctx.fill();
      drawSceneLabel(ctx, '第 0 帧', tx + 37, ty + 66, { align: 'center', color: C.green });

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(render);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(render);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  return <canvas ref={ref} width={W} height={H} />;
};

export default Ch9Analogy;
