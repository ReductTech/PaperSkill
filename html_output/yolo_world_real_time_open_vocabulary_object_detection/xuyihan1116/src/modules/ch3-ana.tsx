import React, { useRef } from 'react';
import type { WidgetProps } from './registry';
import {
  COLORS,
  clamp,
  clearScene,
  drawLabel,
  drawLegend,
  drawRoster,
  lerp,
  useCanvas,
} from '../lib/classKit';

// Analogy card for §3: one hand folds a filled name sheet and snaps it into the attendance
// book's fixed sleeve, then the page-turning hand stops. 560x140, control-free, 3.2 s loop.

const W = 560;
const H = 140;
const LOOP = 3200;

const BOOK = { x: 306, y: 10, w: 236, h: 120 };
const PAGE = { x: 326, y: 18, w: 208, h: 104 };
const SLEEVE = { x: 342, y: 72, w: 180, h: 46 };
const SHEET = { x: 44, y: 34, w: 160, h: 64 };
const FOLDED_H = 32;
const SLOT = { x: 348, y: 78 };
const NAMES = ['小红', '小明'];

/** The teacher's hand: a small palm with three fingers. */
function drawHand(ctx: CanvasRenderingContext2D, x: number, y: number, tilt: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  const mitt = () => {
    // fingers point left, so the palm sits to the right of whatever is being held
    ctx.beginPath();
    ctx.moveTo(8, 6);
    ctx.quadraticCurveTo(9, -2, 5, -5);
    ctx.quadraticCurveTo(2, -6, 0, -5);
    ctx.quadraticCurveTo(-2, -11, -5, -10);
    ctx.quadraticCurveTo(-7, -9, -6, -5);
    ctx.quadraticCurveTo(-9, -10, -11, -8);
    ctx.quadraticCurveTo(-12, -6, -9, -3);
    ctx.quadraticCurveTo(-13, -5, -14, -2);
    ctx.quadraticCurveTo(-14, 1, -10, 2);
    ctx.quadraticCurveTo(-9, 7, -2, 8);
    ctx.quadraticCurveTo(5, 8, 8, 6);
    ctx.closePath();
  };
  // chalk body with a dark ink rim: readable over paper and over the board
  mitt();
  ctx.fillStyle = COLORS.chalk;
  ctx.fill();
  ctx.strokeStyle = COLORS.ink;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-5, -1);
  ctx.lineTo(1, -1);
  ctx.moveTo(-6, 3);
  ctx.lineTo(1, 3);
  ctx.stroke();
  ctx.restore();
}

export const Ch3Ana: React.FC<WidgetProps> = () => {
  const stateRef = useRef({ loop: 0 });

  const { ref } = useCanvas<{ loop: number }>((ctx, time) => {
    clearScene(ctx, W, H, '录一次，一直用');

    const p = (time % LOOP) / LOOP;
    const fold = clamp(p / 0.26, 0, 1);
    const move = clamp((p - 0.3) / 0.32, 0, 1);
    const snap = clamp((p - 0.63) / 0.12, 0, 1);
    const rest = clamp((p - 0.72) / 0.2, 0, 1);

    const visH = lerp(SHEET.h, FOLDED_H, fold);
    const sx = lerp(SHEET.x, SLOT.x, move);
    const sy = lerp(SHEET.y, SLOT.y, move);

    // the attendance book: hard cover + its ruled page
    ctx.save();
    ctx.beginPath();
    ctx.rect(BOOK.x, BOOK.y, BOOK.w, BOOK.h);
    ctx.fillStyle = COLORS.board2;
    ctx.fill();
    ctx.strokeStyle = COLORS.book;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(BOOK.x + 8, BOOK.y + 3);
    ctx.lineTo(BOOK.x + 8, BOOK.y + BOOK.h - 3);
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.restore();
    drawRoster(ctx, PAGE.x, PAGE.y, PAGE.w, PAGE.h, { lines: 2 });

    // the fixed sleeve on the page: a clear pocket with a dark lip
    ctx.save();
    ctx.beginPath();
    ctx.rect(SLEEVE.x, SLEEVE.y, SLEEVE.w, SLEEVE.h);
    ctx.strokeStyle = COLORS.book;
    ctx.lineWidth = 2.5 + 1.5 * snap;
    ctx.setLineDash([7, 5]);
    ctx.stroke();
    if (snap > 0) {
      ctx.beginPath();
      ctx.rect(SLEEVE.x - 4, SLEEVE.y - 4, SLEEVE.w + 8, SLEEVE.h + 8);
      ctx.globalAlpha = 0.35 * snap;
      ctx.setLineDash([]);
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    ctx.restore();

    // the name sheet: filled in on the left, folded up, then carried into the pocket
    ctx.save();
    ctx.beginPath();
    ctx.rect(sx, sy, SHEET.w, visH);
    ctx.clip();
    drawRoster(ctx, sx, sy, SHEET.w, SHEET.h, { lines: NAMES.length });
    const rowH = (SHEET.h - 10) / NAMES.length;
    drawLabel(ctx, NAMES[0], sx + 14, sy + 6 + rowH * 0.46, { color: COLORS.ink, size: 13 });
    // the lower name fades out exactly as the fold crease reaches it, so no glyph is ever cut
    const fade2 = clamp((visH - 47.5) / 5, 0, 1);
    if (fade2 > 0.03) {
      ctx.save();
      ctx.globalAlpha = fade2;
      drawLabel(ctx, NAMES[1], sx + 14, sy + 6 + rowH + rowH * 0.46, { color: COLORS.ink, size: 13 });
      ctx.restore();
    }
    ctx.restore();
    // fold crease + the turned-up flap edge
    ctx.beginPath();
    ctx.moveTo(sx, sy + visH);
    ctx.lineTo(sx + SHEET.w, sy + visH);
    ctx.strokeStyle = COLORS.axis;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(sx + 3, sy + visH - 5);
    ctx.lineTo(sx + SHEET.w - 3, sy + visH - 5);
    ctx.strokeStyle = COLORS.chalkDim;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // the pocket lip in front of the inserted sheet
    ctx.save();
    ctx.beginPath();
    ctx.rect(SLEEVE.x, SLEEVE.y + SLEEVE.h - 10, SLEEVE.w, 10);
    ctx.fillStyle = COLORS.desk;
    ctx.fill();
    ctx.strokeStyle = COLORS.axis;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    // one hand: folds the sheet, tucks it in, then settles still at the book corner
    const restX = BOOK.x + BOOK.w - 22;
    const restY = BOOK.y + 20;
    const hx = lerp(sx + SHEET.w + 8, restX, rest);
    const hy = lerp(sy + visH - 4, restY, rest);
    if (rest < 0.98) {
      ctx.save();
      ctx.globalAlpha = 0.4 * (1 - rest);
      ctx.strokeStyle = COLORS.chalkDim;
      ctx.lineWidth = 1.5;
      [-0.9, 0.9].forEach((off) => {
        ctx.beginPath();
        ctx.arc(restX, restY, 14, -Math.PI / 2 + off, -Math.PI / 2 + off + 0.45);
        ctx.stroke();
      });
      ctx.restore();
    }
    drawHand(ctx, hx, hy, -0.2 + 0.12 * Math.sin(p * Math.PI * 2) * (1 - rest));

    drawLegend(ctx, SHEET.x, 128, [
      { color: COLORS.book, text: '扣进夹层' },
      { color: COLORS.chalkDim, text: '手停了' },
    ]);
  }, W, H, stateRef);

  return <canvas ref={ref} width={W} height={H} />;
};

export default Ch3Ana;
