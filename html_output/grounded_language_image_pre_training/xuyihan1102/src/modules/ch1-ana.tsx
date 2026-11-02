import React, { useRef } from 'react';
import type { WidgetProps } from './registry';
import { COLORS, clamp, clearScene, drawHandbook, drawLabel, useCanvas } from '../lib/roomKit';

const W = 560;
const H = 140;
const CYCLE = 3200;

function drawHand(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.strokeStyle = COLORS.ink;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x - 52, y + 18);
  ctx.lineTo(x - 14, y + 5);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x - 6, y, 7, 0, Math.PI * 2);
  ctx.fillStyle = COLORS.ink;
  ctx.fill();
  ctx.strokeStyle = COLORS.accent;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x - 1, y - 2);
  ctx.lineTo(x + 12, y - 7);
  ctx.stroke();
  ctx.restore();
}

export const Ch1Ana: React.FC<WidgetProps> = () => {
  const stateRef = useRef(null);
  const { ref } = useCanvas<null>((ctx, time) => {
    clearScene(ctx, W, H);

    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const p = reduce ? 1 : (time % CYCLE) / CYCLE;

    // A thick, closed classification handbook: several page cards make the stack read as thick.
    const bookX = 270;
    const bookY = 84;
    const scale = 1.3;
    ctx.save();
    for (let i = 3; i >= 1; i -= 1) {
      ctx.beginPath();
      ctx.rect(bookX - 26 * scale + i * 5, bookY - 34 * scale + i * 4, 52 * scale, 68 * scale);
      ctx.fillStyle = COLORS.paper;
      ctx.fill();
      ctx.strokeStyle = COLORS.rule;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    ctx.restore();
    drawHandbook(ctx, bookX, bookY, scale, { closed: true });

    // One visible goal: the last page pulled out of the closed handbook.
    const pageX = 308;
    const pageY = 52;
    const pageW = 48;
    const pageH = 64;
    ctx.save();
    ctx.beginPath();
    ctx.rect(pageX, pageY, pageW, pageH);
    ctx.fillStyle = COLORS.paper;
    ctx.fill();
    ctx.strokeStyle = COLORS.warn;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
    drawLabel(ctx, '末页', pageX + 8, pageY - 8, { color: COLORS.warn, size: 14, bold: true });

    // Page-flip motion at the book edge while the hand travels.
    if (p > 0.1 && p < 0.74) {
      ctx.save();
      ctx.strokeStyle = COLORS.rule;
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 3; i += 1) {
        const wobble = Math.sin(time / 110 + i) * 4;
        ctx.beginPath();
        ctx.moveTo(bookX + 18, bookY - 28 + i * 12);
        ctx.quadraticCurveTo(
          bookX + 36 + wobble,
          bookY - 24 + i * 12,
          bookX + 22,
          bookY - 14 + i * 12
        );
        ctx.stroke();
      }
      ctx.restore();
    }

    // One moving subject: the hand leafs across and stops on the last page.
    const travel = clamp((p - 0.08) / 0.6, 0, 1);
    const eased =
      travel < 0.5 ? 2 * travel * travel : 1 - Math.pow(-2 * travel + 2, 2) / 2;
    const handX = 206 + (342 - 206) * eased;
    const handY = 96 - Math.sin(eased * Math.PI) * 10;
    drawHand(ctx, handX, handY);
  }, W, H, stateRef);

  return <canvas ref={ref} width={W} height={H} />;
};

export default Ch1Ana;
