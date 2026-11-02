// Chapter 5 analogy (560x140, control-free): one hand lifts the written list and the
// gaze keeps running back and forth between the list and the clutter — you look while
// you search, which is exactly what deep fusion does. Only roomKit helpers are used.
import React, { useRef } from 'react';
import {
  COLORS,
  clearScene,
  drawItem,
  drawLegend,
  drawList,
  drawPerson,
  useCanvas,
  clamp,
  lerp,
} from '../lib/roomKit';
import type { WidgetProps } from './registry';

const W = 560;
const H = 140;

const smooth = (u: number): number => {
  const t = clamp(u, 0, 1);
  return t * t * (3 - 2 * t);
};

function arrowHead(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-8, 4.5);
  ctx.lineTo(-8, -4.5);
  ctx.closePath();
  ctx.fillStyle = COLORS.aux;
  ctx.fill();
  ctx.restore();
}

export const Ch5Ana: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const stateRef = useRef({ loop: 0 });

  const draw = (ctx: CanvasRenderingContext2D, time: number) => {
    clearScene(ctx, W, H, '边找边看');
    const t = (time % 2800) / 2800;
    const lift =
      t < 0.12
        ? 0
        : t < 0.42
        ? smooth((t - 0.12) / 0.3)
        : t < 0.72
        ? 1
        : t < 0.98
        ? 1 - smooth((t - 0.72) / 0.26)
        : 0;

    // the clutter on the table
    drawItem(ctx, 322, 60, 32, 42, { kind: 'bottle' });
    drawItem(ctx, 364, 66, 46, 38, { kind: 'box' });
    drawItem(ctx, 420, 68, 34, 36, { kind: 'cup' });
    drawItem(ctx, 464, 50, 42, 54, { kind: 'plant' });

    // the one moving subject: the hand that lifts the list
    drawPerson(ctx, 50, 80, 0.8);

    const listX = 94;
    const listY = lerp(52, 28, lift);
    const holdY = listY + 44;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(70, 84);
    ctx.lineTo(listX, holdY);
    ctx.strokeStyle = COLORS.ink;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(listX, holdY, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.ink;
    ctx.fill();
    ctx.restore();
    drawList(ctx, listX, listY, 96, 78, { lines: 4, active: 1 });

    // the gaze: a two-way arrow that keeps running between list and clutter
    const a: [number, number] = [listX + 96, listY + 26];
    const b: [number, number] = [318, 76];
    const cx = (a[0] + b[0]) / 2;
    const cy = Math.min(a[1], b[1]) - 24;
    const at = (u: number): [number, number] => {
      const m = 1 - u;
      return [
        m * m * a[0] + 2 * m * u * cx + u * u * b[0],
        m * m * a[1] + 2 * m * u * cy + u * u * b[1],
      ];
    };
    const tangent = (u: number): number => {
      const dx = 2 * (1 - u) * (cx - a[0]) + 2 * u * (b[0] - cx);
      const dy = 2 * (1 - u) * (cy - a[1]) + 2 * u * (b[1] - cy);
      return Math.atan2(dy, dx);
    };
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(a[0], a[1]);
    ctx.quadraticCurveTo(cx, cy, b[0], b[1]);
    ctx.strokeStyle = COLORS.aux;
    ctx.lineWidth = 2;
    ctx.setLineDash([7, 6]);
    ctx.lineDashOffset = -((time / 60) % 26);
    ctx.stroke();
    ctx.restore();
    arrowHead(ctx, b[0], b[1], tangent(1));
    arrowHead(ctx, a[0], a[1], tangent(0) + Math.PI);
    const travel = (t * 1.5) % 1;
    for (const u of [travel, 1 - travel]) {
      const [px, py] = at(u);
      ctx.beginPath();
      ctx.arc(px, py, 3.4, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.aux;
      ctx.fill();
    }

    drawLegend(ctx, 300, 124, [
      { color: COLORS.aux, text: '视线往返' },
      { color: COLORS.muted, text: '杂物堆' },
    ]);
  };

  const { ref } = useCanvas(draw, W, H, stateRef);
  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />;
};

export default Ch5Ana;
