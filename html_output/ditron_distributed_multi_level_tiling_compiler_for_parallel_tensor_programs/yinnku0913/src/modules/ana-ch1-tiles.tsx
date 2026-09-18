import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { KIT, cyclePhase, dTileGround, dTile, dHand, dBucket, dLabel, type TileState } from './ditron-theme-kit';

// §1 analogy: one hand lays tiles in a row, but the material for the next slot
// has not arrived, so the hand stalls — compute units idle while waiting.
//
// Timing contract for every automatic scene in this tutorial:
//   cyclePhase(seconds, period) — pass SECONDS (elapsedMs / 1000), never ms, and
//   fade the drawn content with the returned `env` so the loop never snaps.

const W = 560;
const H = 140;
const N = 12;
const CELL = 24;
const GAP = 5;
const X0 = 60;
const Y = 62;
const LOOP = 3.4; // seconds
const LAY_UNTIL = 0.62; // fraction of the cycle spent laying tiles

export const AnaCh1Tiles: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
      const stalled = t >= LAY_UNTIL;
      // monotonic inside one cycle: the row fills to N-2, then waits
      const laid = stalled ? N - 2 : Math.floor((t / LAY_UNTIL) * (N - 2));

      dTileGround(ctx, W, H);

      ctx.save();
      ctx.globalAlpha = env;
      for (let c = 0; c < N; c += 1) {
        let state: TileState = 'idle';
        if (c < laid) state = 'done';
        else if (c === laid) state = stalled ? 'blocked' : 'current';
        if (c <= laid + 1 && stalled && c > laid) state = 'blocked';
        dTile(ctx, X0 + c * (CELL + GAP), Y, CELL, state, secs);
      }
      const handCol = Math.min(laid, N - 1);
      dHand(
        ctx,
        X0 + handCol * (CELL + GAP) + CELL / 2,
        Y - 22,
        secs,
        stalled ? KIT.failure : KIT.guidance
      );
      dLabel(ctx, stalled ? '料没到' : '继续铺', X0, 34, stalled ? KIT.failure : KIT.text);
      ctx.restore();

      dBucket(ctx, W - 46, H - 30);
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

export default AnaCh1Tiles;
