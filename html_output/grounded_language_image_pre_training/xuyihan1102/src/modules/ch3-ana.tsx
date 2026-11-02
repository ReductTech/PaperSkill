import React, { useRef } from 'react';
import type { WidgetProps } from './registry';
import {
  COLORS,
  clamp,
  clearScene,
  drawBox,
  drawItem,
  drawLabel,
  drawList,
  drawThread,
  useCanvas,
} from '../lib/roomKit';

const W = 560;
const H = 140;
const CYCLE = 3200;

const OBJECT_X = 262;
const OBJECT_Y = 90;
const START_X = 126;
const LIST = { x: 416, y: 30, w: 100, h: 92 };

function drawHand(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.strokeStyle = COLORS.ink;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x - 48, y + 16);
  ctx.lineTo(x - 14, y + 4);
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

export const Ch3Ana: React.FC<WidgetProps> = () => {
  const stateRef = useRef(null);
  const { ref } = useCanvas<null>((ctx, time) => {
    clearScene(ctx, W, H);

    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const p = reduce ? 1 : (time % CYCLE) / CYCLE;
    const travel = clamp((p - 0.08) / 0.62, 0, 1);
    const eased =
      travel < 0.5 ? 2 * travel * travel : 1 - Math.pow(-2 * travel + 2, 2) / 2;
    const seated = travel >= 0.98;

    // One object in the clutter and the written list it should answer to.
    drawItem(ctx, OBJECT_X - 23, OBJECT_Y - 29, 46, 58, { kind: 'bottle' });
    drawList(ctx, LIST.x, LIST.y, LIST.w, LIST.h, { lines: 3, active: 0 });
    drawLabel(ctx, '清单', LIST.x + 4, LIST.y - 8, { color: COLORS.muted, size: 13 });

    const boxX = START_X + (OBJECT_X - START_X) * eased;
    const boxY = OBJECT_Y;

    // The thread snaps to the matching list line when the box seats on the object.
    if (seated) {
      const rowCenterY = LIST.y + 8 + ((LIST.h - 14) / 3) * 0.5;
      drawThread(ctx, [boxX + 35, boxY], [LIST.x, rowCenterY], { active: true });
    }

    // One moving subject: the hand pushes the marker box across the table.
    drawBox(ctx, boxX, boxY, 70, 76, {
      color: seated ? COLORS.thread : COLORS.box,
      weight: seated ? 3 : 2,
    });
    ctx.beginPath();
    ctx.arc(boxX, boxY, 4, 0, Math.PI * 2);
    ctx.fillStyle = seated ? COLORS.thread : COLORS.box;
    ctx.fill();
    drawHand(ctx, boxX - 38, boxY + 4);

    if (seated) {
      drawLabel(ctx, '套住', 214, 46, { color: COLORS.thread, size: 14, bold: true });
    }
  }, W, H, stateRef);

  return <canvas ref={ref} width={W} height={H} />;
};

export default Ch3Ana;
