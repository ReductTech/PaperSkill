import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { KIT, cyclePhase, dTileGround, dTile, dHand, dLabel, type TileState } from './ditron-theme-kit';

// §5 analogy: the same delivery can be made in one whole trip or in two halves;
// the hand alternates between the two ways of carrying the material.
//
// Timing contract (see cyclePhase in ditron-theme-kit): pass SECONDS, never ms.
// One continuous 4-phase cycle — the hand never teleports inside a cycle:
//   0    → 0.38 carry one whole tile out       (label 整块搬)
//   0.38 → 0.50 walk back empty-handed
//   0.50 → 0.88 carry the two halves out       (label 分两趟)
//   0.88 → 1    walk back empty-handed
// The destination row fills monotonically and keeps its tiles during the
// returns; the `env` envelope clears everything at the cycle boundary.

const W = 560;
const H = 140;
const CELL = 26;
const SRC_X = 90;
const DST_X = 400;
const LOOP = 3.6; // seconds
const WHOLE_END = 0.38; // whole tile is seated here
const HALF_START = 0.5; // second delivery leaves the source
const HALF_END = 0.88; // both halves are seated here
const HAND_X0 = SRC_X + 30;
const HAND_X1 = DST_X - 10;

export const AnaCh5Tiles: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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

      const whole = t < WHOLE_END; // carrying the whole tile
      const halves = t >= HALF_START && t < HALF_END; // carrying the two halves
      const outbound = whole || halves; // otherwise: walking back empty-handed
      // progress along the current phase; 0/1 at both ends, so nothing jumps
      const legT = whole
        ? t / WHOLE_END
        : halves
          ? (t - HALF_START) / (HALF_END - HALF_START)
          : t < HALF_START
            ? (t - WHOLE_END) / (HALF_START - WHOLE_END)
            : (t - HALF_END) / (1 - HALF_END);
      const travel = outbound ? legT : 1 - legT;
      const handX = HAND_X0 + (HAND_X1 - HAND_X0) * travel;

      dTileGround(ctx, W, H);

      ctx.save();
      ctx.globalAlpha = env;

      // source pile and destination row
      for (let i = 0; i < 3; i += 1) {
        dTile(ctx, SRC_X, 40 + i * (CELL + 4), CELL, 'remote', secs);
      }
      // monotonic: slot 0 is seated by the whole trip, slots 1-2 by the two halves
      const second = t >= HALF_START;
      const firstHalfSeated = second && (!halves || legT >= 0.5);
      const destState = (c: number): TileState => {
        if (c === 0) return t < WHOLE_END ? 'current' : 'done';
        if (c === 1) return firstHalfSeated ? 'done' : second ? 'current' : 'idle';
        return t >= HALF_END ? 'done' : second && legT >= 0.5 ? 'current' : 'idle';
      };
      for (let c = 0; c < 3; c += 1) {
        dTile(ctx, DST_X + c * (CELL + 4), 62, CELL, destState(c), secs);
      }

      // carried material: one whole tile (guidance) or two halves (auxiliary).
      // Fades in on pickup and out on hand-over instead of popping in mid-air.
      if (outbound) {
        const carryEnv = Math.max(0, Math.min(1, Math.min(legT, 1 - legT) / 0.08));
        ctx.globalAlpha = env * carryEnv;
        const halfW = CELL / 2 - 2;
        ctx.fillStyle = whole ? KIT.guidance : KIT.auxiliary;
        if (whole) {
          ctx.fillRect(handX - CELL / 2, 46, CELL, CELL);
        } else {
          ctx.fillRect(handX - CELL / 2, 46, halfW, CELL);
          ctx.fillRect(handX + 2, 46, halfW, CELL);
        }
        ctx.strokeStyle = KIT.text;
        ctx.lineWidth = 1.5;
        if (whole) {
          ctx.strokeRect(handX - CELL / 2, 46, CELL, CELL);
        } else {
          ctx.strokeRect(handX - CELL / 2, 46, halfW, CELL);
          ctx.strokeRect(handX + 2, 46, halfW, CELL);
        }
        ctx.globalAlpha = env;
      }

      dHand(ctx, handX, 24, secs, t < HALF_START ? KIT.guidance : KIT.auxiliary);
      dLabel(ctx, t < HALF_START ? '整块搬' : '分两趟', 20, 34, t < HALF_START ? KIT.guidance : KIT.auxiliary);

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

export default AnaCh5Tiles;
