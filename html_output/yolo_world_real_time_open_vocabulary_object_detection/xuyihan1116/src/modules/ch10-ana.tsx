import React, { useRef } from 'react';
import type { WidgetProps } from './registry';
import { COLORS, clearScene, drawLabel, drawRoster, drawTick, useCanvas, clamp, lerp } from '../lib/classKit';

// Analogy (560x140, control-free): a hand closes the attendance book at the end of term,
// while a results sheet and a short "names still not reachable" list sit on the desk.
// One moving subject (the hand), one goal (book shut).

const W = 560;
const H = 140;
const LOOP = 3000;

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

export const Ch10Ana: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const stateRef = useRef<Record<string, never>>({});

  const { ref } = useCanvas<Record<string, never>>(
    (ctx, time) => {
      const t = (time % LOOP) / LOOP;
      clearScene(ctx, W, H);

      // the teacher's desk
      ctx.save();
      ctx.fillStyle = COLORS.desk;
      ctx.fillRect(8, 118, 544, 14);
      ctx.strokeStyle = COLORS.desk;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(8, 120);
      ctx.lineTo(552, 120);
      ctx.stroke();
      ctx.restore();

      // results sheet on the desk
      ctx.save();
      ctx.fillStyle = COLORS.roster;
      ctx.strokeStyle = COLORS.axis;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.rect(300, 46, 128, 72);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      for (let i = 0; i < 3; i += 1) {
        ctx.save();
        ctx.strokeStyle = COLORS.axis;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(332, 76 + i * 15);
        ctx.lineTo(416, 76 + i * 15);
        ctx.stroke();
        ctx.restore();
        drawTick(ctx, 318, 76 + i * 15 - 6, { ok: true });
      }
      drawLabel(ctx, '成绩单', 300, 40, { color: COLORS.chalkDim, size: 12 });

      // the short list of names that still cannot be called
      drawRoster(ctx, 452, 32, 92, 84, { lines: 2, struck: 0, labels: ['小强', '小新'] });
      drawLabel(ctx, '还点不到的名字', 452, 26, { color: COLORS.chalkDim, size: 12 });

      // the open book
      ctx.save();
      ctx.fillStyle = COLORS.roster;
      ctx.strokeStyle = COLORS.axis;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.rect(56, 56, 50, 58);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.rect(110, 56, 50, 58);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = COLORS.axis;
      ctx.lineWidth = 1.2;
      for (let i = 0; i < 4; i += 1) {
        ctx.beginPath();
        ctx.moveTo(62, 68 + i * 11);
        ctx.lineTo(100, 68 + i * 11);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(116, 68 + i * 11);
        ctx.lineTo(154, 68 + i * 11);
        ctx.stroke();
      }
      ctx.strokeStyle = COLORS.book;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(108, 54);
      ctx.lineTo(108, 116);
      ctx.stroke();
      ctx.restore();

      // the hand closes the book: the cover sweeps over from the right edge
      const cover = ease(clamp((t - 0.3) / 0.34, 0, 1));
      if (cover > 0.01) {
        const cw = 116 * cover;
        ctx.save();
        ctx.globalAlpha = 0.92;
        ctx.fillStyle = COLORS.book;
        ctx.fillRect(170 - cw, 54, cw, 62);
        ctx.globalAlpha = 1;
        ctx.strokeStyle = COLORS.chalk;
        ctx.lineWidth = 2;
        ctx.strokeRect(170 - cw, 54, cw, 62);
        ctx.restore();
      }

      // the hand path: come down, push the cover shut, then settle on the book
      let hx = 566;
      let hy = 104;
      if (t >= 0.08 && t < 0.3) {
        const p = ease((t - 0.08) / 0.22);
        hx = lerp(566, 196, p);
        hy = lerp(104, 76, p);
      } else if (t >= 0.3 && t < 0.66) {
        const p = ease((t - 0.3) / 0.36);
        hx = lerp(196, 126, p);
        hy = lerp(76, 76, p);
      } else if (t >= 0.66 && t < 0.88) {
        const p = ease((t - 0.66) / 0.22);
        hx = lerp(126, 154, p);
        hy = lerp(76, 72, p);
      } else if (t >= 0.88) {
        hx = 154;
        hy = 72;
      }
      const alpha = clamp(t / 0.06, 0, 1) * clamp((1 - t) / 0.06, 0, 1);
      drawHand(ctx, hx, hy, 1.15, alpha);
    },
    W,
    H,
    stateRef
  );

  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />;
};

export default Ch10Ana;
