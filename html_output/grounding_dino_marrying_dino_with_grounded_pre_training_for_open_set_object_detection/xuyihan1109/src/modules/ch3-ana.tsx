import React, { useRef } from 'react';
import type { WidgetProps } from './registry';
import {
  COLORS,
  clamp,
  clearScene,
  drawCard,
  drawLabel,
  drawLink,
  drawPitch,
  drawPlayer,
  drawRing,
  useCanvas,
} from '../lib/pitchKit';

const W = 560;
const H = 140;
const CYCLE = 3000;

const CARD = { x: 42, y: 50, w: 108, h: 64 };
const PITCH = { x: 296, y: 30, w: 230, h: 92 };
const LIFT = 14;

interface AnaState {
  phase: number;
}

function drawHand(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.strokeStyle = COLORS.ink;
  ctx.fillStyle = COLORS.ink;
  // forearm rises from the lower left
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(x - 24, y + 20);
  ctx.lineTo(x - 6, y + 7);
  ctx.stroke();
  // palm
  ctx.beginPath();
  ctx.arc(x, y, 7, 0, Math.PI * 2);
  ctx.fill();
  // two fingers grip the bottom edge of the card
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(x - 3, y - 1);
  ctx.lineTo(x - 10, y - 14);
  ctx.stroke();
  ctx.restore();
}

function drawArrowHead(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  color: string
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-10, -5);
  ctx.lineTo(-10, 5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export const Ch3Ana: React.FC<WidgetProps> = () => {
  const stateRef = useRef<AnaState>({ phase: 0 });

  const { ref } = useCanvas<AnaState>((ctx, time) => {
    clearScene(ctx, W, H);

    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const p = reduce ? 1 : (time % CYCLE) / CYCLE;
    const lift = clamp(p / 0.34, 0, 1);
    const eased = lift * lift * (3 - 2 * lift);
    const cardY = CARD.y - LIFT * eased;

    // The pitch: one candidate waits under an amber ring.
    drawPitch(ctx, PITCH.x, PITCH.y, PITCH.w, PITCH.h, { rows: 2, cols: 3 });
    const spots = [
      { x: 0.2, y: 0.34, ring: false },
      { x: 0.52, y: 0.44, ring: true },
      { x: 0.8, y: 0.7, ring: false },
    ];
    spots.forEach((spot) => {
      const px = PITCH.x + spot.x * PITCH.w;
      const py = PITCH.y + spot.y * PITCH.h;
      drawPlayer(ctx, px, py, 0.9, {});
      if (spot.ring) drawRing(ctx, px, py - 2, 18, { color: COLORS.ring, weight: 2.5 });
    });

    // The card goes up, still readable: one hand, one lift.
    drawCard(ctx, CARD.x, cardY, CARD.w, CARD.h, { lines: 3 });
    drawHand(ctx, CARD.x + 24, cardY + CARD.h + 2);

    // The gaze runs both ways between the card and the pitch.
    const from: [number, number] = [CARD.x + CARD.w, cardY + CARD.h / 2];
    const to: [number, number] = [PITCH.x - 4, PITCH.y + PITCH.h / 2];
    const backFrom: [number, number] = [from[0], from[1] + 12];
    const backTo: [number, number] = [to[0], to[1] + 12];

    ctx.save();
    ctx.globalAlpha = reduce ? 1 : 0.72 + 0.28 * Math.sin(time / 240);
    drawLink(ctx, from, to, { active: true, twoWay: true });
    ctx.restore();
    drawArrowHead(ctx, to[0], to[1], Math.atan2(to[1] - from[1], to[0] - from[0]), COLORS.fuse);
    drawArrowHead(
      ctx,
      backFrom[0],
      backFrom[1],
      Math.atan2(backFrom[1] - backTo[1], backFrom[0] - backTo[0]),
      COLORS.fuse
    );

    const flow = reduce ? 0.5 : (time % 1500) / 1500;
    ctx.save();
    ctx.fillStyle = COLORS.fuse;
    ctx.beginPath();
    ctx.arc(from[0] + (to[0] - from[0]) * flow, from[1] + (to[1] - from[1]) * flow, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(
      backTo[0] + (backFrom[0] - backTo[0]) * flow,
      backTo[1] + (backFrom[1] - backTo[1]) * flow,
      4,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.restore();

    drawLabel(ctx, '双向', (from[0] + to[0]) / 2 - 10, Math.min(from[1], to[1]) - 12, {
      color: COLORS.fuse,
      size: 14,
      bold: true,
    });
  }, W, H, stateRef);

  return <canvas ref={ref} width={W} height={H} />;
};

export default Ch3Ana;
