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
  useCanvas,
} from '../lib/pitchKit';

// Analogy card (560x140): one hand (single moving subject) runs along card -> pitch -> ring
// -> frame and lights each stop (single goal: connect the chain). Control-free, 3.6 s loop.

const W = 560;
const H = 140;
const LOOP = 3600;

const CARD = { x: 24, y: 48, w: 76, h: 54 };
const FIELD = { x: 126, y: 20, w: 156, h: 100 };
const RING = { x: 256, y: 95 };
const FRAME = { x: 392, y: 78, w: 62, h: 56 };

// Hand stops, left to right: the card, the pitch, the ringed candidate, the confirm frame.
const STOPS = [
  { x: 62, y: 75 },
  { x: 204, y: 70 },
  { x: 256, y: 95 },
  { x: 392, y: 78 },
];
const LIT = [0.16, 0.4, 0.6, 0.82];

const HS = [
  { t: 0, x: 40, y: 132 },
  { t: 0.16, x: STOPS[0].x, y: STOPS[0].y },
  { t: 0.4, x: STOPS[1].x, y: STOPS[1].y },
  { t: 0.6, x: STOPS[2].x, y: STOPS[2].y },
  { t: 0.82, x: STOPS[3].x, y: STOPS[3].y },
  { t: 0.95, x: STOPS[3].x, y: STOPS[3].y },
  { t: 1, x: 40, y: 132 },
];

const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

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
  ctx.strokeStyle = COLORS.ink;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x + 12, y - 18);
  ctx.lineTo(x, y);
  ctx.stroke();
  ctx.fillStyle = COLORS.ring;
  ctx.beginPath();
  ctx.arc(x, y, 2.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.ink;
  ctx.beginPath();
  ctx.ellipse(x + 16, y - 22, 7.5, 5.4, -0.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = COLORS.ink;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + 10, y - 15);
  ctx.lineTo(x + 14, y - 9);
  ctx.stroke();
  ctx.restore();
}

export const Ch7Ana: React.FC<WidgetProps> = () => {
  const stateRef = useRef({});
  const draw = (ctx: CanvasRenderingContext2D, time: number) => {
    const phase = (time % LOOP) / LOOP;
    clearScene(ctx, W, H, '把链接通');
    // the chain being laid down between consecutive stops
    for (let i = 0; i < STOPS.length - 1; i += 1) {
      const a = STOPS[i];
      const b = STOPS[i + 1];
      const on = phase >= LIT[i + 1];
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = on ? COLORS.box : COLORS.axis;
      ctx.lineWidth = on ? 3 : 1.5;
      if (!on) ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.restore();
    }
    // stop 1: the requirements card lights up purple
    drawCard(ctx, CARD.x, CARD.y, CARD.w, CARD.h, { lines: 3 });
    ctx.save();
    ctx.beginPath();
    ctx.rect(CARD.x, CARD.y, CARD.w, CARD.h);
    ctx.strokeStyle = phase >= LIT[0] ? COLORS.fuse : COLORS.line;
    ctx.lineWidth = phase >= LIT[0] ? 3 : 1.5;
    ctx.stroke();
    ctx.restore();
    // stop 2: the pitch lights up blue
    drawPitch(ctx, FIELD.x, FIELD.y, FIELD.w, FIELD.h, {
      rows: 2,
      cols: 3,
      spots: [
        { r: 0, c: 0 },
        { r: 1, c: 2 },
      ],
    });
    ctx.save();
    ctx.beginPath();
    ctx.rect(FIELD.x, FIELD.y, FIELD.w, FIELD.h);
    ctx.strokeStyle = phase >= LIT[1] ? COLORS.box : COLORS.line;
    ctx.lineWidth = phase >= LIT[1] ? 3 : 1.5;
    ctx.stroke();
    ctx.restore();
    // stop 3: the amber candidate ring
    const ringLit = phase >= LIT[2];
    drawRing(ctx, RING.x, RING.y, ringLit ? 15 + Math.sin(time / 180) * 1.4 : 14, {
      color: ringLit ? COLORS.ring : COLORS.muted,
      weight: ringLit ? 3 : 2,
    });
    // stop 4: the confirmation frame around a player
    drawPlayer(ctx, FRAME.x, FRAME.y + 6, 0.9, { kind: 'stand' });
    const frameLit = phase >= LIT[3];
    drawFrame(ctx, FRAME.x, FRAME.y, FRAME.w, FRAME.h, {
      color: frameLit ? COLORS.confirm : COLORS.muted,
      weight: frameLit ? 4 : 2,
    });
    const hand = handAt(phase);
    drawHand(ctx, hand.x, hand.y);
  };
  const { ref } = useCanvas(draw, W, H, stateRef);
  return <canvas ref={ref} width={W} height={H} aria-label="手沿着卡、球场、圈、确认框把链子接通" />;
};

export default Ch7Ana;
