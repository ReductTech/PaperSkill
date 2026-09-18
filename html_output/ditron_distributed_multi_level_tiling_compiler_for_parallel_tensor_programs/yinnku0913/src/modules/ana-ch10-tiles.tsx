import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { KIT, cyclePhase, dTileGround, dTile, dHand, dRule, dLabel } from './ditron-theme-kit';

// §10 analogy: two hands lay the same floor with two different orders; the
// rank-aware one finishes first, and a straightedge then verifies the result.
// (A direct comparison may use one subject per panel.)
//
// Timing contract (see cyclePhase in ditron-theme-kit): pass SECONDS, never ms,
// and fade the drawn content with `env` so the loop never snaps.

const W = 560;
const H = 140;
const COLS = 8;
const ROWS = 2;
const CELL = 18;
const GAP = 3;
const LANE_Y = [30, 78];
const X0 = 96;
const LOOP = 3.6; // seconds

export const AnaCh10Tiles: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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

      dTileGround(ctx, W, H);

      ctx.save();
      ctx.globalAlpha = env;

      // lane 0: sequential order, only one rank works first (monotonic, capped)
      const seq = Math.min(COLS, Math.floor(t * 1.2 * (COLS + 1)));
      let h0x = X0;
      for (let c = 0; c < COLS; c += 1) {
        const state = c < seq ? 'done' : c === seq ? 'current' : 'idle';
        if (state === 'current') h0x = X0 + c * (CELL + GAP) + CELL / 2;
        dTile(ctx, X0 + c * (CELL + GAP), LANE_Y[0], CELL, state, secs);
      }
      // lane 1: rank-aware diagonal order finishes earlier (monotonic, capped)
      const diag = Math.min(COLS * ROWS, Math.floor(t * (COLS * ROWS + 1)));
      let h1x = X0;
      let h1y = LANE_Y[1];
      for (let c = 0; c < COLS; c += 1) {
        for (let r = 0; r < ROWS; r += 1) {
          const order = c * ROWS + r;
          const state = order < diag ? 'done' : order === diag ? 'current' : 'idle';
          if (state === 'current') {
            h1x = X0 + c * (CELL + GAP) + CELL / 2;
            h1y = LANE_Y[1] - 16;
          }
          dTile(ctx, X0 + c * (CELL + GAP), LANE_Y[0] + (r + 1) * (CELL + GAP), CELL, state, secs);
        }
      }

      dLabel(ctx, '无重排', 14, LANE_Y[0] + 14, KIT.failure);
      dLabel(ctx, '有重排', 14, LANE_Y[1] + 34, KIT.success);

      dHand(ctx, h0x, LANE_Y[0] - 14, secs, KIT.failure);
      dHand(ctx, h1x, h1y, secs, KIT.success);

      // the verification straightedge eases in instead of popping on
      if (t > 0.72) {
        ctx.globalAlpha = env * Math.min(1, (t - 0.72) / 0.1);
        dRule(
          ctx,
          X0 - 8,
          LANE_Y[0] + 2 * (CELL + GAP) + 8,
          X0 + COLS * (CELL + GAP),
          LANE_Y[0] + 2 * (CELL + GAP) + 8,
          KIT.support
        );
        ctx.globalAlpha = env;
      }

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

export default AnaCh10Tiles;
