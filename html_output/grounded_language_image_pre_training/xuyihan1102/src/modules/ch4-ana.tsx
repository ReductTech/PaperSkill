import React, { useRef } from 'react';
import type { WidgetProps } from './registry';
import { COLORS, clearScene, drawList, drawLegend, useCanvas, clamp } from '../lib/roomKit';

// Analogy (560x140, control-free, looping): one hand tears one list line into three
// word chips in a row. One moving subject (the hand), one visible goal (the three chips
// laid out), one action verb (tear).

const W = 560;
const H = 140;
const PERIOD = 3000;

const LIST = { x: 16, y: 16, w: 186, h: 96 };
const ROW_H = (LIST.h - 14) / 4;
const LINE_Y = LIST.y + 8 + ROW_H + ROW_H * 0.55;

const CHIP_Y = 56;
const CHIP_W = 64;
const CHIP_H = 26;
const CHIPS = [
  { cx: 262, at: 0.4 },
  { cx: 336, at: 0.5 },
  { cx: 410, at: 0.6 },
];

// Hand keyframes: [progress, x, y]. It grabs the line end, tugs, then lays the chips down.
const KEYS: Array<[number, number, number]> = [
  [0.0, 496, 104],
  [0.14, 210, LINE_Y],
  [0.24, 216, LINE_Y],
  [0.34, 240, CHIP_Y],
  [0.4, 262, CHIP_Y],
  [0.5, 336, CHIP_Y],
  [0.6, 410, CHIP_Y],
  [0.7, 470, CHIP_Y],
  [1.0, 470, CHIP_Y],
];

function ease(t: number): number {
  return t * t * (3 - 2 * t);
}

function posAt(p: number): [number, number] {
  for (let i = 0; i < KEYS.length - 1; i += 1) {
    const a = KEYS[i];
    const b = KEYS[i + 1];
    if (p >= a[0] && p <= b[0]) {
      const span = b[0] - a[0] || 1;
      const e = ease((p - a[0]) / span);
      return [a[1] + (b[1] - a[1]) * e, a[2] + (b[2] - a[2]) * e];
    }
  }
  const last = KEYS[KEYS.length - 1];
  return [last[1], last[2]];
}

function chipPath(ctx: CanvasRenderingContext2D, cx: number, cy: number, w: number, h: number): void {
  const x = cx - w / 2;
  const y = cy - h / 2;
  const r = 6;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawChip(ctx: CanvasRenderingContext2D, cx: number, cy: number, scale: number, alpha: number): void {
  if (alpha <= 0.01 || scale <= 0.01) return;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  ctx.globalAlpha = clamp(alpha, 0, 1);
  chipPath(ctx, 0, 0, CHIP_W, CHIP_H);
  ctx.fillStyle = 'rgba(217,139,31,0.32)';
  ctx.fill();
  ctx.strokeStyle = COLORS.tag;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
}

function drawHand(ctx: CanvasRenderingContext2D, x: number, y: number, spread: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = 0.92;
  ctx.fillStyle = COLORS.ink;
  ctx.strokeStyle = COLORS.ink;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.ellipse(0, 0, 10, 8, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 4;
  for (let i = 0; i < 3; i += 1) {
    const fy = -6 + i * 6;
    const reach = i === 1 ? 1 : 0.7;
    ctx.beginPath();
    ctx.moveTo(-4, fy);
    ctx.lineTo(-4 - 13 - spread * reach, fy - 4 + i * 2);
    ctx.stroke();
  }
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(8, 2);
  ctx.lineTo(23, 6);
  ctx.stroke();
  ctx.restore();
}

const draw = (ctx: CanvasRenderingContext2D, time: number): void => {
  const p = (time % PERIOD) / PERIOD;
  clearScene(ctx, W, H);

  // The list of descriptions; the active line is the one being torn, the last line
  // has no match and stays struck through.
  drawList(ctx, LIST.x, LIST.y, LIST.w, LIST.h, { lines: 4, active: 1, struck: 3 });

  // Dashed remnants of the line being pulled apart, one per chip that is emerging.
  CHIPS.forEach((chip, index) => {
    const q = (p - chip.at) / 0.1;
    if (q <= 0 || q >= 1) return;
    const from: [number, number] = index === 0 ? [LIST.x + LIST.w - 4, LINE_Y] : [CHIPS[index - 1].cx, CHIP_Y];
    ctx.save();
    ctx.globalAlpha = (1 - q) * 0.8;
    ctx.setLineDash([5, 4]);
    ctx.lineWidth = 2;
    ctx.strokeStyle = COLORS.tag;
    ctx.beginPath();
    ctx.moveTo(from[0], from[1]);
    ctx.lineTo(chip.cx, CHIP_Y);
    ctx.stroke();
    ctx.restore();
  });

  CHIPS.forEach((chip) => {
    const q = clamp((p - chip.at) / 0.1, 0, 1);
    if (q <= 0) return;
    const scale = 0.45 + 0.55 * q + Math.sin(q * Math.PI) * 0.16;
    drawChip(ctx, chip.cx, CHIP_Y, scale, clamp(q * 2, 0, 1));
  });

  const [hx, hy] = posAt(p);
  const tug = p > 0.14 && p < 0.24 ? Math.sin(((p - 0.14) / 0.1) * Math.PI * 3) * 5 : 0;
  const pinch = p > 0.13 && p < 0.26 ? 3 : 8;
  drawHand(ctx, hx + tug, hy, pinch);

  drawLegend(ctx, 236, 120, [
    { color: COLORS.muted, text: '清单' },
    { color: COLORS.tag, text: '词块' },
    { color: COLORS.ink, text: '手' },
  ]);
};

export const Ch4Ana: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const stateRef = useRef({});
  const { ref } = useCanvas(draw, W, H, stateRef);

  return (
    <canvas
      id={`cv-${chapterId}-${moduleId}`}
      ref={ref}
      width={W}
      height={H}
      aria-label="一只手把清单上的一行撕成三个词块，排成一排"
    />
  );
};

export default Ch4Ana;
