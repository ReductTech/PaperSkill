import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { KIT, cyclePhase, dTileGround, dTile, dHand, dLabel } from './ditron-theme-kit';

// §2 analogy: one hand carries tiles from the far pile and stacks them into three
// nearer piles — the three tiling levels, each sized for its own distance.
//
// Timing contract (see cyclePhase in ditron-theme-kit): pass SECONDS, never ms.
// One continuous 4-leg cycle — the hand never teleports inside a cycle:
//   legs 0-2 carry a tile out from the far pile to near pile 0/1/2 in turn
//   (right to left) and fill it; leg 3 is the empty-handed return trip back to
//   the far pile. The near piles keep their tiles during the return leg; the
//   `env` envelope clears the whole group at the cycle boundary.

const W = 560;
const H = 140;
const CELL = 18;
const GAP = 2;
const FAR_X = 470;
const NEAR_X = [300, 210, 120];
const LOOP = 3.4; // seconds
const LEGS = 4;

export const AnaCh2Tiles: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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

    // hand stops in visiting order: the far pile, then each near pile
    const stops = [FAR_X - 24, ...NEAR_X.map((nx) => nx - 14)];

    const render = (elapsedMs: number) => {
      const secs = elapsedMs / 1000;
      const { t, env } = cyclePhase(secs, LOOP);
      const legF = t * LEGS;
      const leg = Math.min(LEGS - 1, Math.floor(legF));
      const legT = legF - leg;
      const returning = leg === LEGS - 1;

      dTileGround(ctx, W, H);

      ctx.save();
      ctx.globalAlpha = env;

      // far pile (slow link) stays large; three near piles fill one by one
      for (let r = 0; r < 5; r += 1) {
        for (let c = 0; c < 3; c += 1) {
          dTile(ctx, FAR_X + c * (CELL + GAP), 34 + r * (CELL + GAP), CELL, 'remote', secs);
        }
      }
      // monotonic inside a leg: a pile is filled while its leg is running, and
      // every pile already served keeps its tiles — including the return leg
      const filledFor = (si: number): number => {
        if (returning || si < leg) return 3;
        if (si > leg) return 0;
        return Math.min(3, Math.floor(legT * 4));
      };
      NEAR_X.forEach((nx, si) => {
        const filled = filledFor(si);
        for (let c = 0; c < 3; c += 1) {
          dTile(ctx, nx + c * (CELL + GAP), 62, CELL, c < filled ? 'done' : 'idle', secs);
        }
      });

      // one uninterrupted path: three carry legs outward, one return leg home
      const from = stops[leg];
      const to = stops[returning ? 0 : leg + 1];
      dHand(ctx, from + (to - from) * legT, 44, secs, KIT.guidance);
      dLabel(ctx, '分级备料', 20, 30, KIT.text);

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

export default AnaCh2Tiles;
