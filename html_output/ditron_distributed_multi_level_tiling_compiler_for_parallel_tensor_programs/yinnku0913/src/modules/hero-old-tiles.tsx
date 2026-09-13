import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { KIT, cyclePhase, dTileGround, dGrid, dHand, dBucket, type TileState } from './ditron-theme-kit';

// Hero, old side: one hand lays tiles in a single lane, because every rank is
// scheduled to start from the same first tile; the other lanes stay blocked.
// One subject (the hand), one verb (lay), one goal (cover the floor).
//
// Timing contract (see cyclePhase in ditron-theme-kit): pass SECONDS, never ms,
// and fade the drawn content with `env` so the loop never snaps.

const W = 340;
const H = 190;
const COLS = 8;
const ROWS = 3;
const CELL = 16;
const GAP = 3;
const GRID_X = 26;
const GRID_Y = 40;
const LOOP = 3.4; // seconds

export const HeroOldTiles: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);

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
      // monotonic inside one cycle: the single active lane fills, capped at COLS
      const laid = Math.min(COLS, Math.floor(t * (COLS + 1)));

      dTileGround(ctx, W, H);

      ctx.save();
      ctx.globalAlpha = env;

      dGrid(
        ctx,
        GRID_X,
        GRID_Y,
        COLS,
        ROWS,
        CELL,
        {
          gap: GAP,
          stateAt: (c, r): TileState => {
            if (r === 0) return c < laid ? 'done' : c === laid ? 'current' : 'idle';
            return 'blocked';
          },
        },
        secs
      );

      // the single lane that is allowed to make progress
      const handCol = Math.min(laid, COLS - 1);
      dHand(ctx, GRID_X + handCol * (CELL + GAP) + CELL / 2, GRID_Y + CELL / 2, secs, KIT.failure);

      ctx.restore();

      dBucket(ctx, W - 34, H - 34);
    };

    // first frame at mount: the card is never a blank box, even off-screen
    render(0);
    canvas.classList.add('is-ready');

    const tick = (now: number) => {
      if (!startRef.current) startRef.current = now;
      render(now - startRef.current);
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

export default HeroOldTiles;
