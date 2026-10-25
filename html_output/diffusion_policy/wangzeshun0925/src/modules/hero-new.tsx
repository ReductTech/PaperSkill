import React, { useEffect, useRef } from 'react';
import {
  setupCanvas,
  observeCanvas,
  clamp,
  lerp,
  lerpColor,
  easeOutCubic,
  easeInOutQuad,
} from '../lib/canvasKit';
import {
  clearScene,
  drawBoard,
  drawPlane,
  drawStraightedge,
  drawShavings,
  seeded,
  BAD,
  INK,
} from './woodKit';
import type { WidgetProps } from './registry';

// Hero right panel (560x200, 3.2 s automatic loop, shared time base with hero-old):
// starting from a jagged noise profile the plane makes three passes; the part of the
// surface it has already passed is flat, so the profile visibly converges until the
// straightedge can be laid down flush with a green OK hairline.

const W = 560;
const H = 200;
const LOOP = 3200;

const BOARD_X = 40;
const BOARD_TOP = 104;
const BOARD_W = 480;
const BOARD_H = 64;
const N = 64;
const PLANE_LEN = 54;
const PX0 = BOARD_X + PLANE_LEN / 2;
const PX1 = BOARD_X + BOARD_W - PLANE_LEN / 2;
const AMP = [13, 6, 2.5, 0];
const PASS_START = [0.04, 0.32, 0.6];
const PASS_DUR = 0.26;

/** Reproducible noise surface: the starting state of the board. */
function jaggedProfile(n: number, seed: number): number[] {
  const rnd = seeded(seed);
  const raw: number[] = [];
  for (let i = 0; i < n; i++) raw.push(rnd() * 2 - 1);
  return raw.map(
    (v, i) => (raw[Math.max(0, i - 1)] + 2 * v + raw[Math.min(n - 1, i + 1)]) / 4
  );
}

function heightAt(profile: number[], x: number): number {
  const t = clamp((x - BOARD_X) / BOARD_W, 0, 1);
  return Math.max(0, profile[Math.round(t * (profile.length - 1))]);
}

export const HeroNew: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const base = jaggedProfile(N, 20230341);

    const render = (u: number) => {
      let completed = 0;
      let pass = -1;
      for (let p = 0; p < 3; p++) {
        if (u >= PASS_START[p] + PASS_DUR) completed = p + 1;
        if (u >= PASS_START[p] && u < PASS_START[p] + PASS_DUR) pass = p;
      }

      let planeX = completed >= 3 ? PX1 : PX0;
      let reached = -1;
      if (pass >= 0) {
        const k = easeInOutQuad(clamp((u - PASS_START[pass]) / PASS_DUR, 0, 1));
        planeX = lerp(PX0, PX1, k);
        reached = planeX;
      }

      // Everything the current pass has already gone over is one level flatter.
      const heights = base.map((v, i) => {
        const xi = BOARD_X + (BOARD_W * i) / (N - 1);
        const level = pass < 0 ? completed : xi <= reached ? pass + 1 : pass;
        return v * AMP[level];
      });

      clearScene(ctx, W, H);
      drawBoard(ctx, BOARD_X, BOARD_TOP, BOARD_W, BOARD_H, heights, {
        profileColor: lerpColor(BAD, INK, clamp(completed / 3, 0, 1)),
      });

      drawPlane(ctx, planeX, BOARD_TOP - heightAt(heights, planeX), { length: PLANE_LEN });
      if (pass >= 0) {
        drawShavings(ctx, planeX - 30, BOARD_TOP - 6, u * 3, 2);
      }

      if (completed >= 3) {
        const k = easeOutCubic(clamp((u - 0.86) / 0.09, 0, 1));
        drawStraightedge(ctx, BOARD_X, BOARD_TOP - 34 * (1 - k), BOARD_W, 0);
      }
    };

    const tick = () => {
      render((performance.now() % LOOP) / LOOP);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
    </div>
  );
};

export default HeroNew;
