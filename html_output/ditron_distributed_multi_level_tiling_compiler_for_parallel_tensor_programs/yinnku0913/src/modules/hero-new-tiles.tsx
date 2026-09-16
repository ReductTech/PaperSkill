import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { KIT, cyclePhase, dTileGround, dTile, dHand, dBucket, type TileState } from './ditron-theme-kit';

// Hero, new side: the same floor, but the hand follows a diagonal (rank-aware)
// order, so every lane makes progress at the same time.
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

export const HeroNewTiles: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
      // monotonic inside one cycle: the diagonal order advances to the end
      const steps = COLS * ROWS;
      const k = Math.floor(t * (steps + 1));

      dTileGround(ctx, W, H);

      ctx.save();
      ctx.globalAlpha = env;

      ctx.strokeStyle = KIT.border;
      ctx.lineWidth = 1;
      ctx.strokeRect(GRID_X - 6, GRID_Y - 6, COLS * (CELL + GAP) + 10, ROWS * (CELL + GAP) + 10);

      let handLane = 0;
      let handCol = 0;
      for (let r = 0; r < ROWS; r += 1) {
        for (let c = 0; c < COLS; c += 1) {
          // diagonal order: column major, one lane per step (rank-aware offset)
          const order = c * ROWS + r;
          const state: TileState = order < k ? 'done' : order === k ? 'current' : 'idle';
          if (state === 'current') {
            handLane = r;
            handCol = c;
          }
          dTile(ctx, GRID_X + c * (CELL + GAP), GRID_Y + r * (CELL + GAP), CELL, state, secs);
        }
      }

      dHand(
        ctx,
        GRID_X + handCol * (CELL + GAP) + CELL / 2,
        GRID_Y + handLane * (CELL + GAP) + CELL / 2,
        secs,
        KIT.success
      );

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

export default HeroNewTiles;
