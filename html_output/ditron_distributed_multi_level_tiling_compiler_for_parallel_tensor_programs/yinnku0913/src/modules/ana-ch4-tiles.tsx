import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { KIT, cyclePhase, dTileGround, dTile, dHand, dRule, dLabel } from './ditron-theme-kit';

// §4 analogy: the row does not divide evenly, so the hand cuts the last tile to
// the remaining width before laying it.
//
// Timing contract (see cyclePhase in ditron-theme-kit): pass SECONDS, never ms,
// and fade the drawn content with `env` so the loop never snaps.

const W = 560;
const H = 140;
const CELL = 28;
const GAP = 5;
const X0 = 70;
const Y = 62;
const FULL = 7;
const LOOP = 3.2; // seconds

export const AnaCh4Tiles: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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

      for (let c = 0; c < FULL; c += 1) {
        dTile(ctx, X0 + c * (CELL + GAP), Y, CELL, 'done', secs);
      }
      // the remaining edge strip is narrower than a full tile; it is trimmed
      // continuously, never in a jump
      const edgeX = X0 + FULL * (CELL + GAP);
      const cut = t < 0.55 ? 1 : 1 - (t - 0.55) / 0.45;
      const edgeW = 8 + (CELL - 8) * cut;
      ctx.fillStyle = KIT.emphasis;
      ctx.globalAlpha = env * 0.9;
      ctx.fillRect(edgeX, Y, edgeW, CELL);
      ctx.globalAlpha = env;
      ctx.strokeStyle = KIT.text;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(edgeX, Y, edgeW, CELL);

      // the datum line eases in once the cut starts instead of popping on
      if (t >= 0.5) {
        ctx.globalAlpha = env * Math.min(1, (t - 0.5) / 0.12);
        dRule(ctx, edgeX + CELL + 4, Y - 12, edgeX + CELL + 4, Y + CELL + 12, KIT.failure);
        ctx.globalAlpha = env;
      }
      dHand(ctx, edgeX + edgeW / 2, Y - 22, secs, KIT.emphasis);
      dLabel(ctx, '裁边砖', X0, 34, KIT.text);

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

export default AnaCh4Tiles;
