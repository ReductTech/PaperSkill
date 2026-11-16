import React, { useRef } from 'react';
import type { WidgetProps } from './registry';
import {
  COLORS,
  clearScene,
  drawDesks,
  drawKid,
  drawRoster,
  drawLabel,
  useCanvas,
} from '../lib/classKit';

// Hero, old side: the teacher keeps leafing the same fixed roster. Two children in the
// back row are not on it, so they stay dim with no tick. The only moving subject is the
// page being turned; the book and the classroom are static props.

const W = 520;
const H = 140;
const LOOP = 2400;

// Geometry is shared verbatim with hero-new so the two panels sit in the same room.
const BOOK = { x: 14, y: 32, w: 102, h: 98, lines: 6 };
const ROOM = { x: 182, y: 30, w: 326, h: 104, rows: 3, cols: 4 };
const CW = ROOM.w / ROOM.cols;
const CH = ROOM.h / ROOM.rows;
const seatX = (c: number) => ROOM.x + c * CW + CW / 2;
const deskTop = (r: number) => ROOM.y + r * CH + CH * 0.62;
const seatY = (r: number) => deskTop(r) + 2;
const ROW_H = (BOOK.h - 10) / BOOK.lines;
const rowY = (i: number) => BOOK.y + 6 + i * ROW_H + ROW_H * 0.58;

// The two names this old roster never learned: back row, closest to the book.
const UNSET: Array<{ r: number; c: number }> = [
  { r: 0, c: 0 },
  { r: 0, c: 1 },
];

/** The single moving subject: a page lifts off the book and falls back. */
function drawTurningPage(ctx: CanvasRenderingContext2D, s: number): void {
  // 0 at both ends of the loop, 1 in the middle.
  const p = 0.5 - 0.5 * Math.cos(2 * Math.PI * s);
  const th = 2.25 * p; // hinge angle around the book's right edge
  const hinge = BOOK.x + BOOK.w;
  const sheetW = BOOK.w - 20; // keep the amber binding uncovered
  const farX = hinge - sheetW * Math.cos(th);
  const y0 = BOOK.y + 4;
  const y1 = BOOK.y + BOOK.h - 4;
  const tilt = 6 * Math.abs(Math.sin(th));
  const farTop = y0 + tilt;
  const farBot = y1 - tilt;
  const mapY = (y: number) => farTop + ((y - y0) * (farBot - farTop)) / (y1 - y0);

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(hinge, y0);
  ctx.lineTo(farX, farTop);
  ctx.lineTo(farX, farBot);
  ctx.lineTo(hinge, y1);
  ctx.closePath();
  // Past the hinge the sheet shows its back, so it reads a shade darker.
  ctx.globalAlpha = Math.cos(th) >= 0 ? 0.96 : 0.7;
  ctx.fillStyle = COLORS.roster;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = COLORS.axis;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.clip();

  // The ruling travels with the sheet, so the turn stays legible at 520 px.
  ctx.strokeStyle = COLORS.axis;
  ctx.globalAlpha = 0.9 * Math.abs(Math.cos(th));
  for (let i = 0; i < BOOK.lines; i += 1) {
    ctx.beginPath();
    ctx.moveTo(hinge, rowY(i));
    ctx.lineTo(farX, mapY(rowY(i)));
    ctx.stroke();
  }
  ctx.restore();
}

export const HeroOld: React.FC<WidgetProps> = () => {
  const stateRef = useRef<Record<string, never>>({});
  const { ref } = useCanvas<Record<string, never>>(
    (ctx, time) => {
      const s = (time % LOOP) / LOOP;
      clearScene(ctx, W, H);
      drawLabel(ctx, '翻旧册', 14, 22, { color: COLORS.bad, size: 14, bold: true });

      // The classroom: same seats as the new side, two of them left in the dark.
      for (let r = 0; r < ROOM.rows; r += 1) {
        for (let c = 0; c < ROOM.cols; c += 1) {
          const dim = UNSET.some((u) => u.r === r && u.c === c);
          drawKid(ctx, seatX(c), seatY(r), 1, { dim });
        }
      }
      drawDesks(ctx, ROOM.x, ROOM.y, ROOM.w, ROOM.h, { rows: ROOM.rows, cols: ROOM.cols });

      // A fixed old roster: no extra names, no bookmarks, no ticks.
      drawRoster(ctx, BOOK.x, BOOK.y, BOOK.w, BOOK.h, { lines: BOOK.lines });
      drawTurningPage(ctx, s);
    },
    W,
    H,
    stateRef
  );
  return <canvas ref={ref} width={W} height={H} />;
};

export default HeroOld;
