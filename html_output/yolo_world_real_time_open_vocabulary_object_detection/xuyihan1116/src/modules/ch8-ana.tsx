import React, { useRef } from 'react';
import type { WidgetProps } from './registry';
import { COLORS, clearScene, drawLabel, drawRoster, useCanvas, clamp, lerp } from '../lib/classKit';

// Analogy (560x140, control-free): a hand writes names onto a temporary list row by
// row until it hits the list's limit, then stops.
// One moving subject (the hand), one goal (write the list up to its limit).

const W = 560;
const H = 140;
const LOOP = 3200;

const SHEET = { x: 196, y: 12, w: 136, h: 96 };
const ROW_H = (SHEET.h - 10) / 5;
const NAMES = ['小明', '小红', '小刚', '小美'];
const WRITE_AT = [0.1, 0.28, 0.46, 0.63];
const LIMIT_AT = 0.78;

const ease = (t: number): number => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

const lineY = (i: number): number => SHEET.y + 6 + i * ROW_H;
const writeY = (i: number): number => lineY(i) + 20;

/** Piecewise easing over [time, value] keyframes. */
function track(keys: Array<[number, number]>, t: number): number {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i += 1) {
    if (t <= keys[i][0]) {
      const [t0, v0] = keys[i - 1];
      const [t1, v1] = keys[i];
      const p = t1 === t0 ? 1 : (t - t0) / (t1 - t0);
      return lerp(v0, v1, ease(p));
    }
  }
  return keys[keys.length - 1][1];
}

/** A chalk-outlined hand, fingers up. */
function drawHand(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  alpha: number
): void {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.scale(s, s);
  // the hand writes on the cream sheet, so it is inked rather than chalked
  ctx.strokeStyle = COLORS.ink;
  ctx.lineWidth = 2.4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(-7, 5);
  ctx.quadraticCurveTo(-10, -5, -2, -7);
  ctx.quadraticCurveTo(6, -9, 8, -1);
  ctx.lineTo(9, 9);
  ctx.quadraticCurveTo(1, 14, -7, 10);
  ctx.closePath();
  ctx.stroke();
  for (let i = 0; i < 4; i += 1) {
    const fx = -5 + i * 3.8;
    ctx.beginPath();
    ctx.moveTo(fx, -6);
    ctx.lineTo(fx, i === 1 || i === 2 ? -16 : -13);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(-7, 1);
  ctx.lineTo(-14, -3);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-6, 12);
  ctx.lineTo(7, 11);
  ctx.stroke();
  ctx.restore();
}

export const Ch8Ana: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const stateRef = useRef<Record<string, never>>({});

  const { ref } = useCanvas<Record<string, never>>(
    (ctx, time) => {
      const t = (time % LOOP) / LOOP;
      clearScene(ctx, W, H);

      // static prop 1 — the temporary list with five slots
      drawRoster(ctx, SHEET.x, SHEET.y, SHEET.w, SHEET.h, { lines: 5 });

      // names appear one by one as the hand reaches each row
      for (let i = 0; i < NAMES.length; i += 1) {
        const a = clamp((t - WRITE_AT[i]) / 0.08, 0, 1) * clamp((1 - t) / 0.05, 0, 1);
        if (a <= 0.01) continue;
        ctx.save();
        ctx.globalAlpha = a;
        drawLabel(ctx, NAMES[i], SHEET.x + 14, lineY(i) + ROW_H * 0.46, {
          color: COLORS.ink,
          size: 13,
        });
        ctx.restore();
      }

      // the hand: writes rows 0-3, reaches for row 4, is stopped and pulls back
      const hx = track(
        [
          [0, SHEET.x + 130],
          [0.08, SHEET.x + 78],
          [1, SHEET.x + 78],
        ],
        t
      );
      const hy = track(
        [
          [0, writeY(4) + 12],
          [0.1, writeY(0)],
          [0.28, writeY(1)],
          [0.46, writeY(2)],
          [0.63, writeY(3)],
          [LIMIT_AT, writeY(4)],
          [0.86, writeY(4)],
          [0.93, writeY(3) + 6],
          [1, writeY(3) + 6],
        ],
        t
      );
      const alpha = clamp(t / 0.06, 0, 1) * clamp((1 - t) / 0.06, 0, 1);

      // static prop 2 — the limit line that stops the writing
      const limA = clamp((t - LIMIT_AT) / 0.08, 0, 1) * clamp((1 - t) / 0.05, 0, 1);
      if (limA > 0.01) {
        ctx.save();
        ctx.globalAlpha = limA;
        ctx.strokeStyle = COLORS.book;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(SHEET.x - 10, lineY(4));
        ctx.lineTo(SHEET.x + SHEET.w + 10, lineY(4));
        ctx.stroke();
        ctx.restore();
        drawLabel(ctx, '上限', SHEET.x + SHEET.w + 18, lineY(4) + 5, {
          color: COLORS.book,
          size: 13,
        });
      }

      drawHand(ctx, hx, hy, 1.1, alpha);
    },
    W,
    H,
    stateRef
  );

  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />;
};

export default Ch8Ana;
