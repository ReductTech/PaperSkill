import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { KIT, cyclePhase, dTileGround, dTile, dHand, dRule, dLabel } from './ditron-theme-kit';

// §8 analogy: the hand raises one straightedge and pulls a single datum line
// across the floor — the shared structure every later tile is aligned to.
//
// Timing contract (see cyclePhase in ditron-theme-kit): pass SECONDS, never ms,
// and fade the drawn content with `env` so the loop never snaps.

const W = 560;
const H = 140;
const CELL = 22;
const GAP = 4;
const X0 = 60;
const Y = 62;
const N = 8;
const LOOP = 3.4; // seconds

export const AnaCh8Tiles: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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

      // two rows already laid, aligned to a datum line that is being established
      for (let c = 0; c < N; c += 1) {
        dTile(ctx, X0 + c * (CELL + GAP), Y, CELL, 'done', secs);
        dTile(ctx, X0 + c * (CELL + GAP), Y + CELL + GAP, CELL, 'idle', secs);
      }

      // monotonic inside one cycle: the rule only ever extends, never retracts
      const span = 40 + (W - X0 - 110) * Math.min(1, t * 1.4);
      dRule(ctx, X0 - 10, Y + CELL + GAP - 6, X0 - 10 + span, Y + CELL + GAP - 6, KIT.support);

      const hx = X0 - 10 + span;
      dHand(ctx, hx, Y - 18, secs, KIT.support);
      dLabel(ctx, '拉基准线', X0, 36, KIT.text);

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

export default AnaCh8Tiles;
