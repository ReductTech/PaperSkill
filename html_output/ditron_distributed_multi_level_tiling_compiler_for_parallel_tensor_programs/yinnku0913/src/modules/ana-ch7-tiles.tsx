import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { KIT, cyclePhase, dTileGround, dTile, dHand, dLabel } from './ditron-theme-kit';

// §7 analogy: the hand spreads mortar first and only then lays the tile, so the
// tile seats flat — preparation decides whether the pass can continue smoothly.
//
// Timing contract (see cyclePhase in ditron-theme-kit): pass SECONDS, never ms,
// and fade the drawn content with `env` so the loop never snaps.

const W = 560;
const H = 140;
const N = 10;
const CELL = 24;
const GAP = 5;
const X0 = 70;
const Y = 66;
const LOOP = 3.4; // seconds

export const AnaCh7Tiles: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
      // monotonic inside one cycle: one tile per step, spread mortar then seat it
      const idx = Math.min(N - 1, Math.floor(t * N));
      const phase = (t * N) % 1;
      const spreading = phase < 0.5;

      dTileGround(ctx, W, H);

      ctx.save();
      ctx.globalAlpha = env;

      for (let c = 0; c < N; c += 1) {
        let state: 'done' | 'current' | 'idle' = 'idle';
        if (c < idx) state = 'done';
        else if (c === idx) state = 'current';
        dTile(ctx, X0 + c * (CELL + GAP), Y, CELL, state, secs);
      }

      // mortar band under the tile being worked on
      const mx = X0 + idx * (CELL + GAP);
      ctx.fillStyle = KIT.mortar;
      ctx.globalAlpha = env * (spreading ? 0.8 : 0.35);
      ctx.fillRect(mx, Y + CELL - 4, spreading ? CELL * phase * 2 : CELL, 6);
      ctx.globalAlpha = env;

      dHand(ctx, mx + CELL / 2, spreading ? Y + CELL + 6 : Y - 20, secs, spreading ? KIT.support : KIT.success);
      dLabel(ctx, spreading ? '先抹浆' : '再放砖', X0, 36, spreading ? KIT.support : KIT.success);

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

export default AnaCh7Tiles;
