import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { KIT, cyclePhase, dTileGround, dTile, dHand, dLabel } from './ditron-theme-kit';

// §9 analogy: the ground itself changes material half-way across, and the same
// hand with the same tool keeps laying tiles on it.
//
// Timing contract (see cyclePhase in ditron-theme-kit): pass SECONDS, never ms,
// and fade the drawn content with `env` so the loop never snaps.

const W = 560;
const H = 140;
const CELL = 22;
const GAP = 4;
const X0 = 60;
const Y = 62;
const N = 12;
const SPLIT = 7;
const LOOP = 3.4; // seconds

export const AnaCh9Tiles: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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

      // second ground material (scale-out / different accelerator) beside the
      // first: the floor itself is scenery and never fades
      ctx.fillStyle = KIT.mortar;
      ctx.fillRect(X0 + SPLIT * (CELL + GAP) - 6, 34, W - (X0 + SPLIT * (CELL + GAP)) - 20, 78);
      ctx.strokeStyle = KIT.support;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(X0 + SPLIT * (CELL + GAP) - 6, 34);
      ctx.lineTo(X0 + SPLIT * (CELL + GAP) - 6, 112);
      ctx.stroke();

      ctx.save();
      ctx.globalAlpha = env;

      // monotonic inside one cycle: one tile per step across both ground materials
      const done = Math.floor(t * (N + 1));
      for (let c = 0; c < N; c += 1) {
        const state = c < done ? 'done' : c === done ? 'current' : 'idle';
        dTile(ctx, X0 + c * (CELL + GAP), Y, CELL, state, secs);
      }
      const cx = X0 + Math.min(done, N - 1) * (CELL + GAP) + CELL / 2;
      dHand(ctx, cx, Y - 22, secs, cx > X0 + SPLIT * (CELL + GAP) ? KIT.auxiliary : KIT.success);
      dLabel(ctx, done > SPLIT ? '换场地' : '沿地面铺', X0, 30, KIT.text);

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

export default AnaCh9Tiles;
