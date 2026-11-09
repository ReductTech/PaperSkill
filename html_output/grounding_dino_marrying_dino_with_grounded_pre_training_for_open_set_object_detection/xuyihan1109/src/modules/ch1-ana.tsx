import React, { useRef } from 'react';
import type { WidgetProps } from './registry';
import {
  COLORS,
  clamp,
  clearScene,
  drawLegend,
  drawPitch,
  drawPlayer,
  drawRoster,
  useCanvas,
} from '../lib/pitchKit';

const W = 560;
const H = 140;
const CYCLE = 3200;
const ROWS = 6;

const BOOK = { x: 34, y: 20, w: 128, h: 100 };
const PITCH = { x: 298, y: 28, w: 230, h: 90 };

interface AnaState {
  phase: number;
}

function rowY(index: number): number {
  const rowH = (BOOK.h - 12) / ROWS;
  return BOOK.y + 8 + (index + 0.5) * rowH;
}

function drawHand(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.strokeStyle = COLORS.ink;
  ctx.fillStyle = COLORS.ink;
  // forearm comes in from the lower right
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(x + 34, y + 26);
  ctx.lineTo(x + 8, y + 8);
  ctx.stroke();
  // palm
  ctx.beginPath();
  ctx.arc(x, y, 7, 0, Math.PI * 2);
  ctx.fill();
  // index finger, reaching left onto the page
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x - 4, y - 2);
  ctx.lineTo(x - 18, y - 6);
  ctx.stroke();
  // thumb
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x - 3, y + 4);
  ctx.lineTo(x - 12, y + 9);
  ctx.stroke();
  ctx.restore();
}

export const Ch1Ana: React.FC<WidgetProps> = () => {
  const stateRef = useRef<AnaState>({ phase: 0 });

  const { ref } = useCanvas<AnaState>((ctx, time) => {
    clearScene(ctx, W, H);

    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const p = reduce ? 1 : (time % CYCLE) / CYCLE;
    const travel = clamp(p / 0.72, 0, 1);
    const eased = travel * travel * (3 - 2 * travel);

    // The goal: the last page of the roster, the entry the scout is hunting for.
    drawRoster(ctx, BOOK.x, BOOK.y, BOOK.w, BOOK.h, { entries: ROWS });
    const lastLine = rowY(ROWS - 1);
    ctx.save();
    ctx.globalAlpha = reduce ? 0.32 : 0.26 + 0.12 * Math.sin(time / 320);
    ctx.fillStyle = COLORS.ring;
    ctx.fillRect(BOOK.x + 12, lastLine - 7, BOOK.w - 24, 14);
    ctx.restore();

    // Two people on the pitch whom the booklet never registered: they stay grey, no ring.
    drawPitch(ctx, PITCH.x, PITCH.y, PITCH.w, PITCH.h, { rows: 2, cols: 3 });
    drawPlayer(ctx, PITCH.x + PITCH.w * 0.26, PITCH.y + PITCH.h * 0.42, 0.95, {
      kind: 'stand',
      dim: true,
    });
    drawPlayer(ctx, PITCH.x + PITCH.w * 0.68, PITCH.y + PITCH.h * 0.66, 0.95, {
      kind: 'run',
      dim: true,
    });
    drawLegend(ctx, PITCH.x, 131, [{ color: COLORS.muted, text: '没登记' }]);

    // One moving subject: the hand leafs down to the last page and rests there.
    const flip = eased * (ROWS - 1);
    const rowNow = Math.min(ROWS - 1, Math.floor(flip));
    const frac = flip - rowNow;
    const open = Math.sin(Math.PI * clamp(frac, 0, 1));
    const handY = rowY(0) + eased * (rowY(ROWS - 1) - rowY(0));
    const spineX = BOOK.x + BOOK.w - 3;
    const leafW = 24 + 16 * open;
    const fade = reduce ? 1 : Math.min(1, p / 0.06, (1 - p) / 0.06);

    ctx.save();
    ctx.globalAlpha = fade;
    // the page being flicked over
    ctx.beginPath();
    ctx.moveTo(spineX, handY - 9);
    ctx.quadraticCurveTo(spineX + leafW * 0.7, handY - 8 - 10 * open, spineX + leafW, handY - 2 + 3 * open);
    ctx.quadraticCurveTo(spineX + leafW * 0.5, handY + 9, spineX, handY + 10);
    ctx.closePath();
    ctx.fillStyle = COLORS.card;
    ctx.fill();
    ctx.strokeStyle = COLORS.line;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    drawHand(ctx, spineX + 12 + leafW * 0.45, handY - 2 - 3 * open);
    ctx.restore();
  }, W, H, stateRef);

  return <canvas ref={ref} width={W} height={H} />;
};

export default Ch1Ana;
