import React, { useRef } from 'react';
import type { WidgetProps } from './registry';
import { COLORS, clearScene, drawItem, drawNote, drawLegend, useCanvas, clamp } from '../lib/roomKit';

// Analogy (560x140, control-free, looping): one hand presses a sticky note onto an
// object, then moves on to the next one. One subject, one verb, one goal.

const W = 560;
const H = 140;
const PERIOD = 3200;

const ITEMS = [
  { x: 132, kind: 'bottle' as const },
  { x: 232, kind: 'cup' as const },
  { x: 332, kind: 'plant' as const },
];
const ITEM_Y = 62;
const ITEM_W = 56;
const ITEM_H = 58;

const NOTE_DY = 12;
// [progress, x, y] — the hand hovers in, presses, waits, then leaves for the next object.
const KEYS: Array<[number, number, number]> = [
  [0.0, 500, 30],
  [0.18, 178, 54],
  [0.26, 176, 74],
  [0.44, 278, 54],
  [0.52, 276, 74],
  [0.7, 378, 54],
  [0.78, 376, 74],
  [0.94, 500, 30],
  [1.0, 500, 30],
];
const NOTE_AT = [0.22, 0.48, 0.74];

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

function drawHand(ctx: CanvasRenderingContext2D, x: number, y: number, spread: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.9);
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

  const [hx, hy] = posAt(p);
  const fade = p > 0.94 ? clamp(1 - (p - 0.94) / 0.06, 0, 1) : 1;

  ITEMS.forEach((item) => {
    const noteX = item.x + ITEM_W - 16;
    const noteY = ITEM_Y + NOTE_DY;
    const near = Math.abs(hx - noteX) < 34 && Math.abs(hy - noteY) < 26;
    drawItem(ctx, item.x, ITEM_Y, ITEM_W, ITEM_H, { kind: item.kind, highlight: near });
  });

  ITEMS.forEach((item, index) => {
    const q = clamp((p - NOTE_AT[index]) / 0.08, 0, 1);
    if (q <= 0 || fade <= 0.01) return;
    const noteX = item.x + ITEM_W - 16;
    const noteY = ITEM_Y + NOTE_DY;
    const settle = 1.35 - 0.35 * q;
    ctx.save();
    ctx.globalAlpha = fade * clamp(q * 3, 0, 1);
    ctx.translate(noteX, noteY);
    ctx.scale(settle, settle);
    drawNote(ctx, 0, 0);
    ctx.restore();
  });

  drawHand(ctx, hx, hy, 8);

  drawLegend(ctx, 40, 26, [
    { color: COLORS.muted, text: '杂物' },
    { color: COLORS.tag, text: '便利贴' },
    { color: COLORS.ink, text: '手' },
  ]);
};

export const Ch7Ana: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const stateRef = useRef({});
  const { ref } = useCanvas(draw, W, H, stateRef);

  return (
    <canvas
      id={`cv-${chapterId}-${moduleId}`}
      ref={ref}
      width={W}
      height={H}
      aria-label="一只手把便利贴贴到杂物上，一张贴完再走向下一件"
    />
  );
};

export default Ch7Ana;
