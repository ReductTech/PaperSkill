import React, { useRef } from 'react';
import type { WidgetProps } from './registry';
import {
  COLORS,
  clearScene,
  drawDesks,
  drawKid,
  drawRoster,
  useCanvas,
  clamp,
  lerp,
} from '../lib/classKit';

// Analogy (560x140, control-free): a hand holds one roster line up and sweeps it
// across a single column of desks, and that column lights up.
// One moving subject (the hand + the slip it holds), one goal (the target column).

const W = 560;
const H = 140;
const LOOP = 2800;

const ease = (t: number): number => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

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
  ctx.strokeStyle = COLORS.chalk;
  ctx.lineWidth = 2.2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  // palm
  ctx.beginPath();
  ctx.moveTo(-7, 5);
  ctx.quadraticCurveTo(-10, -5, -2, -7);
  ctx.quadraticCurveTo(6, -9, 8, -1);
  ctx.lineTo(9, 9);
  ctx.quadraticCurveTo(1, 14, -7, 10);
  ctx.closePath();
  ctx.stroke();
  // fingers
  for (let i = 0; i < 4; i += 1) {
    const fx = -5 + i * 3.8;
    ctx.beginPath();
    ctx.moveTo(fx, -6);
    ctx.lineTo(fx, i === 1 || i === 2 ? -16 : -13);
    ctx.stroke();
  }
  // thumb
  ctx.beginPath();
  ctx.moveTo(-7, 1);
  ctx.lineTo(-14, -3);
  ctx.stroke();
  // cuff
  ctx.beginPath();
  ctx.moveTo(-6, 12);
  ctx.lineTo(7, 11);
  ctx.stroke();
  ctx.restore();
}

export const Ch5Ana: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const stateRef = useRef<Record<string, never>>({});

  const { ref } = useCanvas<Record<string, never>>(
    (ctx, time) => {
      const t = (time % LOOP) / LOOP;
      clearScene(ctx, W, H);

      // static prop 1 — the roster the teacher reads from
      drawRoster(ctx, 16, 30, 96, 78, { lines: 3, labels: ['小明', '小红', '小刚'] });

      // static prop 2 — the classroom
      const dx = 250;
      const dy = 22;
      const dw = 270;
      const dh = 96;
      drawDesks(ctx, dx, dy, dw, dh, { rows: 2, cols: 3 });
      const cw = dw / 3;
      const target = 1;
      const lit = clamp((t - 0.4) / 0.16, 0, 1) * clamp((1 - t) / 0.06, 0, 1);

      for (let r = 0; r < 2; r += 1) {
        for (let c = 0; c < 3; c += 1) {
          drawKid(ctx, dx + c * cw + cw / 2, dy + r * 48 + 26, 1.05, {
            kind: c === target && lit > 0.45 ? 'hand' : 'sit',
            highlight: c === target && lit > 0.45,
          });
        }
      }

      // the column the names land on lights up
      if (lit > 0.01) {
        ctx.save();
        ctx.globalAlpha = 0.18 * lit;
        ctx.fillStyle = COLORS.book;
        ctx.fillRect(dx + target * cw, dy, cw, dh);
        ctx.restore();
      }

      // the hand path: lift from the book, over the column, sweep down it
      const from: [number, number] = [126, 86];
      const over: [number, number] = [dx + target * cw + cw / 2 + 6, 44];
      const down: [number, number] = [dx + target * cw + cw / 2 + 6, 102];
      let hx = from[0];
      let hy = from[1];
      if (t >= 0.12 && t < 0.44) {
        const p = ease((t - 0.12) / 0.32);
        hx = lerp(from[0], over[0], p);
        hy = lerp(from[1], over[1], p);
      } else if (t >= 0.44 && t < 0.76) {
        const p = ease((t - 0.44) / 0.32);
        hx = lerp(over[0], down[0], p);
        hy = lerp(over[1], down[1], p);
      } else if (t >= 0.76) {
        hx = down[0];
        hy = down[1];
      }
      const alpha = clamp(t / 0.08, 0, 1) * clamp((1 - t) / 0.08, 0, 1);

      // the roster line held up in the hand
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = COLORS.roster;
      ctx.strokeStyle = COLORS.axis;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.rect(hx - 16, hy - 48, 32, 36);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = COLORS.ink;
      ctx.lineWidth = 1.6;
      for (let i = 0; i < 3; i += 1) {
        ctx.beginPath();
        ctx.moveTo(hx - 11, hy - 40 + i * 9);
        ctx.lineTo(hx + 10, hy - 40 + i * 9);
        ctx.stroke();
      }
      ctx.restore();

      drawHand(ctx, hx, hy, 1.35, alpha);
    },
    W,
    H,
    stateRef
  );

  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />;
};

export default Ch5Ana;
