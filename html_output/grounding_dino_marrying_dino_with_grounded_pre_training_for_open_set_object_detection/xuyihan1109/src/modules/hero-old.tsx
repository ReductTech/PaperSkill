import React, { useRef } from 'react';
import type { WidgetProps } from './registry';
import {
  COLORS,
  clearScene,
  drawPitch,
  drawPlayer,
  drawRing,
  drawRoster,
  drawLabel,
  clamp,
  lerp,
  useCanvas,
} from '../lib/pitchKit';

// Cover hero, left panel — the scout leafs through the fixed training-camp roster.
// ONE moving subject: a page of the roster turning over its spine. The two players
// who are not on the list stay dim and un-ring-ed; the grey rings only mark the
// entries the book already knows. 520×140 intrinsic, one continuous 2.4 s loop.

const W = 520;
const H = 140;
const LOOP = 2400;

const PITCH = { x: 132, y: 22, w: 372, h: 96 };
const BOOK = { x: 16, y: 18, w: 100, h: 80 };
const RING_R = 18;
const FIG = 0.95;

const SPINE_X = BOOK.x + 9;
const PAGE_RIGHT = BOOK.x + BOOK.w - 10;
const PAGE_TOP = BOOK.y + 6;
const PAGE_BOT = BOOK.y + BOOK.h - 6;

// Five players on the token pitch; the last two are never listed in the roster.
const SPOTS = [
  { x: 169, y: 48, dim: false },
  { x: 244, y: 96, dim: false },
  { x: 318, y: 48, dim: false },
  { x: 392, y: 96, dim: true },
  { x: 467, y: 48, dim: true },
];

const LISTED = [0, 1, 2];

/** The single moving subject: the page sweeps off the spine and turns edge-on. */
function drawTurningPage(ctx: CanvasRenderingContext2D, q: number): void {
  const p = clamp((q - 0.08) / 0.84, 0, 1);
  const span = PAGE_RIGHT - SPINE_X;
  const freeX = PAGE_RIGHT - span * p;
  const lift = Math.sin(Math.PI * p);
  const freeTop = PAGE_TOP - 8 * lift;
  const freeBot = PAGE_BOT - 2 * lift;
  if (freeX - SPINE_X < 1.5) return;

  const edgeY = (u: number, f: number): number =>
    lerp(lerp(PAGE_TOP, freeTop, u), lerp(PAGE_BOT, freeBot, u), f);

  ctx.save();
  // the sheet itself
  ctx.beginPath();
  ctx.moveTo(SPINE_X, PAGE_TOP);
  ctx.lineTo(freeX, freeTop);
  ctx.lineTo(freeX, freeBot);
  ctx.lineTo(SPINE_X, PAGE_BOT);
  ctx.closePath();
  ctx.fillStyle = COLORS.card;
  ctx.fill();
  ctx.strokeStyle = COLORS.line;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // its ruled lines, squashed as the sheet goes edge-on
  ctx.strokeStyle = COLORS.line;
  ctx.lineWidth = 1.5;
  [0.24, 0.5, 0.76].forEach((f) => {
    ctx.beginPath();
    ctx.moveTo(lerp(SPINE_X, freeX, 0.12), edgeY(0.12, f));
    ctx.lineTo(lerp(SPINE_X, freeX, 0.88), edgeY(0.88, f));
    ctx.stroke();
  });
  // the lifted free edge, so the sheet reads against the page underneath
  ctx.beginPath();
  ctx.moveTo(freeX, freeTop);
  ctx.lineTo(freeX, freeBot);
  ctx.strokeStyle = COLORS.muted;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

export const HeroOld: React.FC<WidgetProps> = () => {
  const stateRef = useRef<Record<string, never>>({});
  const { ref } = useCanvas<Record<string, never>>(
    (ctx, time) => {
      clearScene(ctx, W, H);
      drawPitch(ctx, PITCH.x, PITCH.y, PITCH.w, PITCH.h, { rows: 2, cols: 5 });

      SPOTS.forEach((p) => {
        drawPlayer(ctx, p.x, p.y, FIG, { dim: p.dim });
      });
      LISTED.forEach((i) => {
        const p = SPOTS[i];
        drawRing(ctx, p.x, p.y - 2, RING_R, { color: COLORS.muted, weight: 2 });
      });

      drawRoster(ctx, BOOK.x, BOOK.y, BOOK.w, BOOK.h, { entries: 6 });
      drawTurningPage(ctx, (time % LOOP) / LOOP);

      drawLabel(ctx, '翻登记册', BOOK.x, 126, { color: COLORS.bad, size: 13, bold: true });
    },
    W,
    H,
    stateRef
  );
  return <canvas ref={ref} width={W} height={H} />;
};

export default HeroOld;
