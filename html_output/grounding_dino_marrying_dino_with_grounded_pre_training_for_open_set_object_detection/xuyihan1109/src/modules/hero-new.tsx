import React, { useRef } from 'react';
import type { WidgetProps } from './registry';
import {
  COLORS,
  clearScene,
  drawPitch,
  drawPlayer,
  drawCard,
  drawRing,
  drawFrame,
  drawLabel,
  clamp,
  lerp,
  useCanvas,
} from '../lib/pitchKit';

// Cover hero, right panel — same pitch, same players, but the scout holds a written
// requirements card. Amber rings sit on several candidates and one confirmation
// frame tightens onto the best one. ONE moving subject: the hand tracing the ring.
// 520×140 intrinsic, one continuous 2.4 s loop.

const W = 520;
const H = 140;
const LOOP = 2400;
const TAU = Math.PI * 2;

const PITCH = { x: 132, y: 22, w: 372, h: 96 };
const CARD = { x: 16, y: 18, w: 100, h: 80 };
const RING_R = 18;
const FIG = 0.95;
const START = -Math.PI / 3;
const BEST = 1;
const RINGED = [0, 2];

// Same five players as the old side, so the two panels line up instantly.
const SPOTS = [
  { x: 169, y: 48, dim: false },
  { x: 244, y: 96, dim: false },
  { x: 318, y: 48, dim: false },
  { x: 392, y: 96, dim: true },
  { x: 467, y: 48, dim: true },
];

const smooth = (a: number, b: number, v: number): number => {
  const t = clamp((v - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

/** The single moving subject: a hand holding a pen, tracing the candidate ring. */
function drawHand(ctx: CanvasRenderingContext2D, x: number, y: number, ang: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.strokeStyle = COLORS.ink;
  ctx.fillStyle = COLORS.ink;
  ctx.lineWidth = 2.6;
  ctx.lineCap = 'round';
  // pen shaft running back out of the ring, its end clear of the fist
  ctx.beginPath();
  ctx.moveTo(1, 0);
  ctx.lineTo(22, 0);
  ctx.stroke();
  // nib, right on the line being drawn
  ctx.beginPath();
  ctx.arc(0, 0, 2.4, 0, TAU);
  ctx.fill();
  // fist around the shaft
  ctx.beginPath();
  ctx.ellipse(12, 1, 5.8, 4.8, 0, 0, TAU);
  ctx.fill();
  // thumb
  ctx.beginPath();
  ctx.ellipse(8.6, -4.6, 3.2, 2.2, -0.6, 0, TAU);
  ctx.fill();
  ctx.restore();
}

export const HeroNew: React.FC<WidgetProps> = () => {
  const stateRef = useRef<Record<string, never>>({});
  const { ref } = useCanvas<Record<string, never>>(
    (ctx, time) => {
      const q = (time % LOOP) / LOOP;
      const best = SPOTS[BEST];
      const cx = best.x;
      const cy = best.y - 2;
      const trace = clamp((q - 0.06) / 0.72, 0, 1);

      clearScene(ctx, W, H);
      drawPitch(ctx, PITCH.x, PITCH.y, PITCH.w, PITCH.h, { rows: 2, cols: 5 });

      SPOTS.forEach((p) => {
        drawPlayer(ctx, p.x, p.y, FIG, { dim: p.dim });
      });

      // the scout holds the written requirements card, clauses kept apart
      drawCard(ctx, CARD.x, CARD.y, CARD.w, CARD.h, { lines: 3, split: 1 });

      // amber rings snapped onto the other candidates
      RINGED.forEach((i) => {
        const p = SPOTS[i];
        drawRing(ctx, p.x, p.y - 2, RING_R, { color: COLORS.ring, weight: 3 });
      });

      // the best candidate: the pen draws its ring over the pending guide line
      ctx.save();
      ctx.globalAlpha = 0.42;
      drawRing(ctx, cx, cy, RING_R, { color: COLORS.ring, weight: 2, dashed: true });
      ctx.restore();
      if (trace > 0.004) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, RING_R, START, START + TAU * trace);
        ctx.strokeStyle = COLORS.ring;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.stroke();
        ctx.restore();
      }

      const appear = smooth(0.34, 0.46, q);
      if (appear > 0.01) {
        const fit = smooth(0.5, 0.86, q);
        ctx.save();
        ctx.globalAlpha = appear;
        drawFrame(ctx, cx, cy, lerp(48, 22, fit), lerp(58, 30, fit), {
          color: COLORS.confirm,
          weight: 2 + fit,
        });
        ctx.restore();
      }

      const ang = START + TAU * trace;
      drawHand(ctx, cx + (RING_R + 2) * Math.cos(ang), cy + (RING_R + 2) * Math.sin(ang), ang);

      drawLabel(ctx, '照卡圈人', CARD.x, 126, { color: COLORS.good, size: 13, bold: true });
    },
    W,
    H,
    stateRef
  );
  return <canvas ref={ref} width={W} height={H} />;
};

export default HeroNew;
