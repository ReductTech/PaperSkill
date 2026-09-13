import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { KIT, cyclePhase, dTileGround, dTile, dHand, dLabel } from './ditron-theme-kit';

// §6 analogy: the hand never leaves the floor — it lays tile after tile in one
// continuous pass instead of stopping and re-entering the room each time.
//
// Timing contract (see cyclePhase in ditron-theme-kit): pass SECONDS, never ms,
// and fade the drawn content with `env` so the loop never snaps.

const W = 560;
const H = 140;
const N = 14;
const CELL = 22;
const GAP = 4;
const X0 = 60;
const Y = 64;
const LOOP = 3.2; // seconds

export const AnaCh6Tiles: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const t0Ref = useRef(0);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (elapsedMs: number) => {
      const secs = elapsedMs / 1000;
      const { t, env } = cyclePhase(secs, LOOP);
      // monotonic inside one cycle: one tile per step, never a step back
      const done = Math.floor(t * (N + 1));

      dTileGround(ctx, W, H);

      ctx.save();
      ctx.globalAlpha = env;

      for (let c = 0; c < N; c += 1) {
        const state = c < done ? 'done' : c === done ? 'current' : 'idle';
        dTile(ctx, X0 + c * (CELL + GAP), Y, CELL, state, secs);
      }
      const cx = X0 + Math.min(done, N - 1) * (CELL + GAP) + CELL / 2;
      dHand(ctx, cx, Y - 22, secs, KIT.success);
      dLabel(ctx, '一次铺完', X0, 36, KIT.text);

      // a thin progress trace shows the uninterrupted pass
      ctx.strokeStyle = KIT.success;
      ctx.lineWidth = 2;
      ctx.globalAlpha = env * 0.5;
      ctx.beginPath();
      ctx.moveTo(X0, Y + CELL + 12);
      ctx.lineTo(cx, Y + CELL + 12);
      ctx.stroke();
      ctx.globalAlpha = env;

      ctx.restore();
    };

    // first frame at mount: the card is never a blank box, even off-screen
    render(0);
    canvas.classList.add('is-ready');

    const tick = (now: number) => {
      if (!t0Ref.current) t0Ref.current = now;
      render(now - t0Ref.current);
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

  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />;
};

export default AnaCh6Tiles;
