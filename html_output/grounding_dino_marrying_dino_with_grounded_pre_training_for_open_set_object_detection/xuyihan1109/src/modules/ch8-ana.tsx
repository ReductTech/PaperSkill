import React, { useRef } from 'react';
import type { WidgetProps } from './registry';
import {
  COLORS,
  clamp,
  clearScene,
  drawPitch,
  drawPlayer,
  drawRing,
  useCanvas,
} from '../lib/pitchKit';

const W = 560;
const H = 140;
const LOOP = 3000;

// One hand nudges the ring until it sits exactly on the player; then a tick appears.
function drawPushingHand(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.save();
  ctx.strokeStyle = COLORS.ink;
  ctx.fillStyle = COLORS.ink;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - 30, y + 22);
  ctx.lineTo(x - 7, y + 5);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(x, y, 6, 5, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x + 3, y - 4);
  ctx.lineTo(x + 10, y - 6);
  ctx.moveTo(x + 4, y);
  ctx.lineTo(x + 11, y - 1);
  ctx.stroke();
  ctx.restore();
}

export const Ch8Ana: React.FC<WidgetProps> = () => {
  const stateRef = useRef({});

  const draw = (ctx: CanvasRenderingContext2D, time: number) => {
    const t = (time % LOOP) / LOOP;
    const k = clamp(t / 0.72, 0, 1);
    const e = k * k * (3 - 2 * k);
    const cx = 212 + (300 - 212) * e;
    const cy = 56 + (78 - 56) * e;

    clearScene(ctx, W, H);
    drawPitch(ctx, 14, 10, 532, 120, { rows: 3, cols: 9 });

    drawPlayer(ctx, 120, 50, 1.1, { kind: 'stand', dim: true });
    drawPlayer(ctx, 190, 110, 1.1, { kind: 'run', dim: true });
    drawPlayer(ctx, 470, 54, 1.1, { kind: 'jump', dim: true });
    drawPlayer(ctx, 510, 106, 1.1, { kind: 'stand', dim: true });

    drawPlayer(ctx, 300, 78, 1.5, { kind: 'run', highlight: true });

    const retreat = clamp((t - 0.72) / 0.14, 0, 1);
    drawPushingHand(ctx, cx - 36 - 30 * retreat, cy + 6);
    drawRing(ctx, cx, cy, 30, { color: COLORS.ring, weight: 4 });

    const tick = clamp((t - 0.78) / 0.1, 0, 1);
    if (tick > 0) {
      ctx.save();
      ctx.globalAlpha = tick;
      ctx.strokeStyle = COLORS.good;
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(316, 40);
      ctx.lineTo(323, 47);
      ctx.lineTo(335, 31);
      ctx.stroke();
      ctx.restore();
    }
  };

  const { ref } = useCanvas(draw, W, H, stateRef);
  return <canvas ref={ref} width={W} height={H} />;
};

export default Ch8Ana;
