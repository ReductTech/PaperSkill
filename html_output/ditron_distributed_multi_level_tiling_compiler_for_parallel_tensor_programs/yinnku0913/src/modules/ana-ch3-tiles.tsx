import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { KIT, cyclePhase, dTileGround, dTile, dHand, dLabel } from './ditron-theme-kit';

// §3 analogy: the same floor and the same tiles, but the hand starts from its own
// row offset and sweeps diagonally, so progress happens everywhere at once.
//
// Timing contract (see cyclePhase in ditron-theme-kit): pass SECONDS, never ms,
// and fade the drawn content with `env` so the loop never snaps.

const W = 560;
const H = 140;
const COLS = 9;
const ROWS = 3;
const CELL = 20;
const GAP = 3;
const X0 = 130;
const Y0 = 40;
const LOOP = 3.2; // seconds

export const AnaCh3Tiles: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
      // monotonic inside one cycle: the diagonal order advances one step at a time
      const k = Math.floor(t * (COLS * ROWS + 1));

      dTileGround(ctx, W, H);

      ctx.save();
      ctx.globalAlpha = env;

      let hx = X0;
      let hy = Y0;
      for (let c = 0; c < COLS; c += 1) {
        for (let r = 0; r < ROWS; r += 1) {
          // diagonal order = rank-aware offset: column major, one row per step
          const order = c * ROWS + r;
          const state = order < k ? 'done' : order === k ? 'current' : 'idle';
          const x = X0 + c * (CELL + GAP);
          const y = Y0 + r * (CELL + GAP);
          if (state === 'current') {
            hx = x + CELL / 2;
            hy = y - 16;
          }
          dTile(ctx, x, y, CELL, state, secs);
        }
      }
      dHand(ctx, hx, hy, secs, KIT.success);
      dLabel(ctx, '换起铺点', 20, 40, KIT.text);

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

export default AnaCh3Tiles;
