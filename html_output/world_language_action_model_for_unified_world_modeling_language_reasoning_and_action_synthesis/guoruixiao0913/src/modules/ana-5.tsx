import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, lerpColor, easeOutCubic } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  BALL_R,
  FELT,
  FELT_DARK,
  GUIDE,
  TEXT_MUTED,
  clearScene,
  drawBall,
  drawCue,
  drawSceneLabel,
  drawTable,
} from './billiardsKit';

// §5 analogy (560x140): a hand rubs chalk on the cue tip twice; the tip goes from
// grey to blue. The cue and the ball never move. Purely time-driven ambient loop
// (3.0 s), paused off-screen by observeCanvas — no controls, no copy.

const W = 560;
const H = 140;
const CYCLE = 3000;
const BALL_X = 140;
const BALL_Y = 70;
const TIP_X = 214;
const TIP_Y = 70;
const RUB_END = 0.82;

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** The hand holding the chalk cube, drawn above the cue tip. */
function drawChalkHand(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.save();
  // chalk cube (巧粉)
  ctx.fillStyle = FELT_DARK;
  ctx.strokeStyle = TEXT_MUTED;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.rect(x - 9, y - 9, 18, 18);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = FELT;
  ctx.fillRect(x - 5, y - 5, 10, 10);

  // hand (fist) above the cube
  ctx.fillStyle = '#e3bb92';
  ctx.strokeStyle = '#b98f68';
  ctx.lineWidth = 1.5;
  roundRectPath(ctx, x - 24, y - 30, 48, 22, 8);
  ctx.fill();
  ctx.stroke();

  // two fingers wrapping the cube
  ctx.beginPath();
  ctx.moveTo(x - 9, y - 22);
  ctx.lineTo(x - 9, y - 3);
  ctx.moveTo(x + 9, y - 22);
  ctx.lineTo(x + 9, y - 3);
  ctx.stroke();
  ctx.restore();
}

export const Ana5: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (elapsed: number) => {
      const p = (elapsed % CYCLE) / CYCLE;
      const rub = clamp(p / RUB_END, 0, 1);
      const lift = clamp((p - RUB_END) / (1 - RUB_END), 0, 1);
      const chalkX = TIP_X + Math.sin(rub * Math.PI * 4) * 17 + lift * 12;
      const chalkY = TIP_Y - 17 - lift * 15;
      const tipColor = lerpColor(TEXT_MUTED, GUIDE, easeOutCubic(rub));

      clearScene(ctx, W, H);
      drawTable(ctx, W, H, { bandTop: 34, bandBottom: 106, pockets: [] });

      // the ball and the cue stay put
      drawBall(ctx, BALL_X, BALL_Y, BALL_R, GUIDE);
      drawCue(ctx, TIP_X, TIP_Y, Math.PI, 300, { tipColor, width: 6 });

      // chalk dust settled around the tip while rubbing
      if (rub > 0) {
        ctx.save();
        ctx.globalAlpha = rub * 0.55;
        ctx.fillStyle = GUIDE;
        [
          [TIP_X - 13, TIP_Y - 12],
          [TIP_X + 12, TIP_Y + 13],
          [TIP_X - 10, TIP_Y + 14],
          [TIP_X + 14, TIP_Y - 11],
        ].forEach(([dx, dy]) => {
          ctx.beginPath();
          ctx.arc(dx, dy, 1.6, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.restore();
      }

      drawChalkHand(ctx, chalkX, chalkY);
      drawSceneLabel(ctx, '杆头', TIP_X - 20, 20, { color: TEXT_MUTED, size: 12 });
    };

    const tick = (now: number) => {
      if (!startRef.current) startRef.current = now;
      render(now - startRef.current);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
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

  return (
    <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
  );
};

export default Ana5;
