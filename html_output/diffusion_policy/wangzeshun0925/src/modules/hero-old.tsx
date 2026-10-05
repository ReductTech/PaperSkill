import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, easeOutCubic, easeInOutQuad } from '../lib/canvasKit';
import { clearScene, drawBoard, drawPlane, drawModeMark, drawShavings, BAD } from './woodKit';
import type { WidgetProps } from './registry';

// Hero left panel (560x200, 3.2 s automatic loop, shared time base with hero-new):
// the explicit-regression plane starts off leaning left, folds back, and settles in
// the middle between the two valid planing routes; its blade lands between the two
// raised areas and cuts a BAD-coloured hollow that gets a little deeper every loop.

const W = 560;
const H = 200;
const LOOP = 3200;

const BOARD_X = 40;
const BOARD_TOP = 104;
const BOARD_W = 480;
const BOARD_H = 64;
const STOP_X = BOARD_X + BOARD_W / 2;
const LEFT_X = STOP_X - 80;
const START_X = STOP_X + 16;
const PLANE_LEN = 54;
const HOLLOW_HALF = 84;
const HOLLOW_MAX = 13;

/** Two raised areas with a low middle: where the two valid routes meet. */
function bumpProfile(n: number, amp: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1);
    const d = Math.min(Math.abs(u - 0.22), Math.abs(u - 0.78));
    out.push(amp * Math.max(0, 1 - d / 0.2));
  }
  return out;
}

function heightAt(profile: number[], x: number): number {
  const t = clamp((x - BOARD_X) / BOARD_W, 0, 1);
  return Math.max(0, profile[Math.round(t * (profile.length - 1))]);
}

/** Depth of the scooped hollow at x, matching the quadratic that draws it. */
function hollowAt(x: number, depth: number): number {
  const s = clamp((x - (STOP_X - HOLLOW_HALF)) / (2 * HOLLOW_HALF), 0, 1);
  return 4 * depth * s * (1 - s);
}

export const HeroOld: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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

    const profile = bumpProfile(64, 14);

    const render = (u: number, loops: number) => {
      clearScene(ctx, W, H);
      drawBoard(ctx, BOARD_X, BOARD_TOP, BOARD_W, BOARD_H, profile);

      // The hollow deepens once per loop, at the moment the plane settles.
      const target = Math.min(4 + 1.6 * loops, HOLLOW_MAX);
      const previous = Math.min(4 + 1.6 * Math.max(0, loops - 1), HOLLOW_MAX);
      const cut = easeOutCubic(clamp((u - 0.72) / 0.18, 0, 1));
      const depth = lerp(previous, target, cut);
      ctx.fillStyle = BAD;
      ctx.beginPath();
      ctx.moveTo(STOP_X - HOLLOW_HALF, BOARD_TOP);
      ctx.quadraticCurveTo(STOP_X, BOARD_TOP + depth * 2, STOP_X + HOLLOW_HALF, BOARD_TOP);
      ctx.closePath();
      ctx.fill();

      drawModeMark(ctx, 148, 74, 'left');
      drawModeMark(ctx, 412, 74, 'right');

      let planeX = STOP_X;
      if (u < 0.34) planeX = lerp(START_X, LEFT_X, easeInOutQuad(u / 0.34));
      else if (u < 0.72) planeX = lerp(LEFT_X, STOP_X, easeInOutQuad((u - 0.34) / 0.38));
      const planeY = BOARD_TOP - heightAt(profile, planeX) + hollowAt(planeX, depth);

      drawPlane(ctx, LEFT_X, BOARD_TOP - heightAt(profile, LEFT_X), {
        length: PLANE_LEN,
        ghost: true,
      });
      drawPlane(ctx, planeX, planeY, { length: PLANE_LEN });

      if (cut > 0 && cut < 1) {
        drawShavings(ctx, STOP_X + 36, BOARD_TOP - 6, u * 2, 2);
      }
    };

    const tick = () => {
      const now = performance.now();
      render((now % LOOP) / LOOP, Math.floor(now / LOOP));
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

export default HeroOld;
