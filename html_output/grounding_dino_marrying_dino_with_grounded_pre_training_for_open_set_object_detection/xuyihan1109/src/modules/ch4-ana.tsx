import React, { useRef } from 'react';
import type { WidgetProps } from './registry';
import { COLORS, clearScene, drawPitch, drawRing, useCanvas } from '../lib/pitchKit';

// Analogy card (560x140): one hand (single moving subject) quickly draws amber rings
// around a few players (single goal: circle a small shortlist). Control-free, 3.2 s loop.

const W = 560;
const H = 140;
const LOOP = 3200;

const FIELD = { x: 26, y: 26, w: 508, h: 88 };
const ROWS = 2;
const COLS = 6;
const CW = FIELD.w / COLS;
const CH = FIELD.h / ROWS;

const SPOTS = [
  { r: 0, c: 0 },
  { r: 0, c: 2 },
  { r: 1, c: 4 },
  { r: 1, c: 1 },
  { r: 0, c: 5 },
];

const CENTER = SPOTS.map((p) => ({
  x: FIELD.x + (p.c + 0.5) * CW,
  y: FIELD.y + (p.r + 0.5) * CH,
}));

// The three players that get ringed, in the order the hand visits them.
const RING_AT = [0, 1, 2];
const RING_T = [0.16, 0.4, 0.64];

const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

const HS = [
  { t: 0, x: CENTER[0].x + 26, y: 132 },
  { t: 0.18, x: CENTER[0].x + 12, y: CENTER[0].y + 7 },
  { t: 0.42, x: CENTER[1].x + 12, y: CENTER[1].y + 7 },
  { t: 0.66, x: CENTER[2].x + 12, y: CENTER[2].y + 7 },
  { t: 0.9, x: CENTER[2].x + 12, y: CENTER[2].y + 7 },
  { t: 1, x: CENTER[0].x + 26, y: 132 },
];

function handAt(phase: number): { x: number; y: number } {
  for (let i = 0; i < HS.length - 1; i += 1) {
    const a = HS[i];
    const b = HS[i + 1];
    if (phase >= a.t && phase <= b.t) {
      const q = ease((phase - a.t) / Math.max(0.0001, b.t - a.t));
      return { x: a.x + (b.x - a.x) * q, y: a.y + (b.y - a.y) * q };
    }
  }
  const last = HS[HS.length - 1];
  return { x: last.x, y: last.y };
}

function drawHand(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.save();
  ctx.lineCap = 'round';
  // pen shaft, tip touching the grass
  ctx.strokeStyle = COLORS.ink;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x + 12, y - 18);
  ctx.lineTo(x, y);
  ctx.stroke();
  // pen nib
  ctx.fillStyle = COLORS.ring;
  ctx.beginPath();
  ctx.arc(x, y, 2.6, 0, Math.PI * 2);
  ctx.fill();
  // palm
  ctx.fillStyle = COLORS.ink;
  ctx.beginPath();
  ctx.ellipse(x + 15, y - 21, 6.4, 4.8, -0.6, 0, Math.PI * 2);
  ctx.fill();
  // thumb
  ctx.strokeStyle = COLORS.ink;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + 10, y - 15);
  ctx.lineTo(x + 14, y - 9);
  ctx.stroke();
  ctx.restore();
}

export const Ch4Ana: React.FC<WidgetProps> = () => {
  const stateRef = useRef({});
  const draw = (ctx: CanvasRenderingContext2D, time: number) => {
    const phase = (time % LOOP) / LOOP;
    clearScene(ctx, W, H, '先圈苗子');
    drawPitch(ctx, FIELD.x, FIELD.y, FIELD.w, FIELD.h, {
      rows: ROWS,
      cols: COLS,
      spots: SPOTS,
    });
    // rings snap on one after another, then the loop releases them
    RING_AT.forEach((idx, i) => {
      const q = Math.min(1, Math.max(0, (phase - RING_T[i]) / 0.12));
      if (q <= 0) return;
      const grow = 1 - Math.pow(1 - q, 3);
      const alpha = Math.min(1, Math.max(0, (1 - phase) / 0.08));
      ctx.globalAlpha = alpha;
      drawRing(ctx, CENTER[idx].x, CENTER[idx].y, 8 + 9 * grow, {
        color: COLORS.ring,
        weight: 3,
      });
      ctx.globalAlpha = 1;
    });
    const hand = handAt(phase);
    drawHand(ctx, hand.x, hand.y);
  };
  const { ref } = useCanvas(draw, W, H, stateRef);
  return <canvas ref={ref} width={W} height={H} aria-label="球探在训练场上快速圈出几个苗子" />;
};

export default Ch4Ana;
