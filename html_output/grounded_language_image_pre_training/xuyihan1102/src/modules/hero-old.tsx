import React, { useRef } from 'react';
import type { WidgetProps } from './registry';
import { COLORS, clearScene, drawItem, drawHandbook, drawPerson, drawLabel, useCanvas } from '../lib/roomKit';

// Hero, left panel: someone leafs a thick closed handbook while the room stays unmarked.
// One moving subject — the top page folding over from the fore-edge — on a 2.4 s loop.

const W = 520;
const H = 140;
const LOOP = 2400;
const TAU = Math.PI * 2;

type RoomObj = {
  x: number;
  y: number;
  w: number;
  h: number;
  kind: 'bottle' | 'cup' | 'plant' | 'frame' | 'box';
};

// The room both hero panels share: five things standing on the table.
const ROOM: RoomObj[] = [
  { x: 258, y: 58, w: 16, h: 34, kind: 'bottle' },
  { x: 292, y: 74, w: 24, h: 24, kind: 'cup' },
  { x: 338, y: 50, w: 28, h: 40, kind: 'plant' },
  { x: 390, y: 68, w: 28, h: 28, kind: 'frame' },
  { x: 452, y: 76, w: 32, h: 24, kind: 'box' },
];

// Handbook geometry: centre (176, 66) at scale 1.15, half-width 26.
const COVER = 176 + 26 * 1.15; // fore-edge of the closed handbook

export const HeroOld: React.FC<WidgetProps> = () => {
  const stateRef = useRef<Record<string, never>>({});
  const { ref } = useCanvas<Record<string, never>>(
    (ctx, time) => {
      const p = (((time % LOOP) + LOOP) % LOOP) / LOOP;
      const lift = Math.pow(0.5 - 0.5 * Math.cos(TAU * p), 0.85); // 0 → 1 → 0, no seam

      clearScene(ctx, W, H);

      // The room: five things on the table, every one of them left grey.
      ROOM.forEach((o) => drawItem(ctx, o.x, o.y, o.w, o.h, { kind: o.kind }));

      drawPerson(ctx, 110, 52, 1.7);
      drawHandbook(ctx, 176, 66, 1.15);

      // The moving subject: the top page folded over from the fore-edge, then let fall back.
      const reach = 32 * lift;
      if (reach > 0.4) {
        const fx = COVER - reach;
        const topY = 32 - 5 * lift;
        const botY = 100 - 8 * lift;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(COVER, 29);
        ctx.quadraticCurveTo(fx + reach * 0.55, 29 - 5 * lift, fx, topY);
        ctx.quadraticCurveTo(fx + 7 * lift, (topY + botY) / 2, fx, botY); // the free edge bows
        ctx.quadraticCurveTo(fx + reach * 0.5, 103 + 2 * lift, COVER, 103);
        ctx.closePath();
        ctx.globalAlpha = 0.72;
        ctx.fillStyle = COLORS.room;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = COLORS.rule;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
      }

      // Nothing in the room is marked: that is the old method's blind spot.
      drawLabel(ctx, '翻手册', 14, 24, { color: COLORS.warn, size: 15, bold: true });
    },
    W,
    H,
    stateRef
  );
  return <canvas ref={ref} width={W} height={H} />;
};

export default HeroOld;
