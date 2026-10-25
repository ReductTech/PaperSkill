import React, { useRef } from 'react';
import type { WidgetProps } from './registry';
import {
  COLORS,
  clearScene,
  drawLandmark,
  drawTrail,
  drawWalker,
  drawLabel,
  useCanvas,
  clamp,
  lerp,
} from '../lib/trailKit';

// 类比动画（第 5 章）：一只手依次翻过三块路牌——先把路标认全，再上路。
// 560×140，无控件，一个动作主体（手）+ 一个目标（三块路牌都认过）。

const W = 560;
const H = 140;
const LOOP = 3000;

const SIGNS = [150, 265, 380];

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function drawHand(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.save();
  ctx.strokeStyle = COLORS.ink;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  // 小臂
  ctx.beginPath();
  ctx.moveTo(x - 46, y + 36);
  ctx.lineTo(x - 10, y + 12);
  ctx.stroke();
  // 手掌
  ctx.beginPath();
  ctx.ellipse(x, y, 12, 9, -0.35, 0, Math.PI * 2);
  ctx.fillStyle = COLORS.ink;
  ctx.fill();
  // 食指与拇指，指向路牌
  ctx.beginPath();
  ctx.moveTo(x + 6, y - 4);
  ctx.lineTo(x + 25, y - 14);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + 2, y + 5);
  ctx.lineTo(x + 19, y + 1);
  ctx.stroke();
  ctx.restore();
}

const draw = (ctx: CanvasRenderingContext2D, time: number): void => {
  clearScene(ctx, W, H);

  const p = (time % LOOP) / LOOP;
  // 手从左向右扫过三块路牌，最后停在最右一块上。
  const sweep = easeInOut(clamp((p - 0.06) / 0.82, 0, 1));
  const handX = lerp(100, 400, sweep);
  const handY = 66 + Math.sin(p * Math.PI * 6) * 3;

  drawTrail(
    ctx,
    [
      [96, 112],
      [452, 112],
    ],
    { dashed: true }
  );

  SIGNS.forEach((x) => {
    const read = handX > x - 30;
    drawLandmark(ctx, x, 106, 'sign', { highlight: read });
  });

  // 同伴在原地等着：路标认全了才上路。
  drawWalker(ctx, 486, 94);

  drawHand(ctx, handX, handY);
  drawLabel(ctx, '认路标', 20, 24, { color: COLORS.muted, size: 13 });
};

export const Ch5Ana: React.FC<WidgetProps> = () => {
  const stateRef = useRef<number>(0);
  const { ref } = useCanvas<number>((ctx, time) => draw(ctx, time), W, H, stateRef);

  return <canvas ref={ref} width={W} height={H} />;
};

export default Ch5Ana;
