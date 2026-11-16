import React, { useRef } from 'react';
import type { WidgetProps } from './registry';
import {
  COLORS,
  clearScene,
  drawDesks,
  drawKid,
  drawRoster,
  drawBeam,
  drawTick,
  drawLabel,
  clamp,
  lerp,
  useCanvas,
} from '../lib/classKit';

// Hero, new side: the very same classroom, but the roster is already snapped into the
// attendance book, so two amber beams reach the two children the old roster missed and
// both seats get a tick. The only moving subject is the beam sweeping to its desk.

const W = 520;
const H = 140;
const LOOP = 2400;

// Geometry is shared verbatim with hero-old so the two panels sit in the same room.
const BOOK = { x: 14, y: 32, w: 102, h: 98, lines: 6 };
const ROOM = { x: 182, y: 30, w: 326, h: 104, rows: 3, cols: 4 };
const CW = ROOM.w / ROOM.cols;
const CH = ROOM.h / ROOM.rows;
const seatX = (c: number) => ROOM.x + c * CW + CW / 2;
const deskTop = (r: number) => ROOM.y + r * CH + CH * 0.62;
const seatY = (r: number) => deskTop(r) + 2;
const ROW_H = (BOOK.h - 10) / BOOK.lines;
const rowY = (i: number) => BOOK.y + 6 + i * ROW_H + ROW_H * 0.58;

// The two names the book now carries, aimed at the seats the old roster missed.
const NAMED: Array<{ r: number; c: number }> = [
  { r: 0, c: 0 },
  { r: 0, c: 1 },
];
const SPINE_X = BOOK.x + BOOK.w + 4;
const beamFrom: Array<[number, number]> = [1, 3].map((i) => [SPINE_X, rowY(i)] as [number, number]);
const beamTo: Array<[number, number]> = NAMED.map(
  (n) => [seatX(n.c), seatY(n.r) - 6] as [number, number]
);

export const HeroNew: React.FC<WidgetProps> = () => {
  const stateRef = useRef<Record<string, never>>({});
  const { ref } = useCanvas<Record<string, never>>(
    (ctx, time) => {
      const s = (time % LOOP) / LOOP;
      clearScene(ctx, W, H);
      drawLabel(ctx, '一眼点名', 14, 22, { color: COLORS.fast, size: 14, bold: true });

      // Same seats as the old side: this time both back-row seats are lit.
      for (let r = 0; r < ROOM.rows; r += 1) {
        for (let c = 0; c < ROOM.cols; c += 1) {
          drawKid(ctx, seatX(c), seatY(r), 1);
        }
      }
      drawDesks(ctx, ROOM.x, ROOM.y, ROOM.w, ROOM.h, { rows: ROOM.rows, cols: ROOM.cols });

      // The roster, already snapped into the attendance book: one amber frame, no flipping.
      drawRoster(ctx, BOOK.x, BOOK.y, BOOK.w, BOOK.h, { lines: BOOK.lines, locked: true });

      // First beam is in place; the second one is the moving subject of the loop.
      drawBeam(ctx, beamFrom[0], beamTo[0], { width: 2 });
      const sweep = clamp(s / 0.5, 0, 1);
      const p = 1 - Math.pow(1 - sweep, 3);
      const fade = s > 0.86 ? clamp(1 - (s - 0.86) / 0.14, 0, 1) : 1;
      const head: [number, number] = [
        lerp(beamFrom[1][0], beamTo[1][0], p),
        lerp(beamFrom[1][1], beamTo[1][1], p),
      ];
      ctx.save();
      ctx.globalAlpha = fade;
      if (p > 0.03) {
        drawBeam(ctx, beamFrom[1], head, { width: 3 });
        ctx.beginPath();
        ctx.arc(head[0], head[1], 3.2, 0, Math.PI * 2);
        ctx.fillStyle = COLORS.book;
        ctx.fill();
      }
      ctx.restore();

      // Name -> child matched: both seats are ticked.
      NAMED.forEach((n) => drawTick(ctx, seatX(n.c) + 15, seatY(n.r) - 15));
    },
    W,
    H,
    stateRef
  );
  return <canvas ref={ref} width={W} height={H} />;
};

export default HeroNew;
