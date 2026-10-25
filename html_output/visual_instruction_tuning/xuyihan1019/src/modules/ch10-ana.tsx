import React, { useRef } from 'react';
import type { WidgetProps } from './registry';
import {
  COLORS,
  clearScene,
  drawTrail,
  drawLabel,
  drawLegend,
  useCanvas,
  clamp,
  lerp,
} from '../lib/trailKit';

// 类比动画（第 10 章）：一只手按下对比键，两条录音从同一起点跑起来，绿色那条先到。
// 560×140，无控件，一个动作主体（手）+ 一个目标（跑完一次对比）。

const W = 560;
const H = 140;
const LOOP = 3400;

const START_X = 120;
const END_X = 500;
const OURS = 0.673;
const RIVAL = 0.381;

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function drawHand(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.save();
  ctx.strokeStyle = COLORS.ink;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - 30, y + 34);
  ctx.lineTo(x - 8, y + 12);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(x, y, 9, 7, -0.3, 0, Math.PI * 2);
  ctx.fillStyle = COLORS.ink;
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x + 4, y - 3);
  ctx.lineTo(x + 18, y - 10);
  ctx.stroke();
  ctx.restore();
}

function drawPlayButton(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, 18, 0, Math.PI * 2);
  ctx.fillStyle = COLORS.bg;
  ctx.fill();
  ctx.strokeStyle = COLORS.route;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - 5, cy - 8);
  ctx.lineTo(cx + 9, cy);
  ctx.lineTo(cx - 5, cy + 8);
  ctx.closePath();
  ctx.fillStyle = COLORS.route;
  ctx.fill();
  ctx.restore();
}

const draw = (ctx: CanvasRenderingContext2D, time: number): void => {
  clearScene(ctx, W, H);

  const p = (time % LOOP) / LOOP;
  const growO = easeOutCubic(clamp(p / 0.66, 0, 1));
  const growR = easeOutCubic(clamp((p - 0.05) / 0.82, 0, 1));

  drawTrail(
    ctx,
    [
      [START_X, 72],
      [END_X, 72],
    ],
    {}
  );
  drawTrail(
    ctx,
    [
      [START_X, 108],
      [END_X, 108],
    ],
    {}
  );

  const full = END_X - START_X;
  const wO = full * OURS * growO;
  const wR = full * RIVAL * growR;

  ctx.save();
  ctx.fillStyle = COLORS.good;
  ctx.fillRect(START_X, 50, wO, 20);
  ctx.fillStyle = COLORS.muted;
  ctx.fillRect(START_X, 86, wR, 20);
  ctx.restore();

  // 领先标记：绿色那条确实更高时，在它的终点插一面小旗
  if (growO > 0.98) {
    const ex = START_X + wO;
    ctx.save();
    ctx.strokeStyle = COLORS.fader;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ex, 72);
    ctx.lineTo(ex, 38);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(ex, 38);
    ctx.lineTo(ex + 14, 43);
    ctx.lineTo(ex, 48);
    ctx.closePath();
    ctx.fillStyle = COLORS.fader;
    ctx.fill();
    ctx.restore();
  }

  drawPlayButton(ctx, 76, 76);

  const press = clamp(p / 0.16, 0, 1);
  const leave = clamp((p - 0.88) / 0.12, 0, 1);
  const handX = lerp(30, 78, easeInOut(press)) + leave * 34;
  const handY = lerp(114, 82, easeInOut(press)) + leave * 18;
  if (p < 0.995) drawHand(ctx, handX, handY);

  drawLabel(ctx, '播放', 52, 40, { color: COLORS.muted, size: 13 });

  drawLegend(ctx, 40, 128, [
    { color: COLORS.good, text: '本方法' },
    { color: COLORS.muted, text: '对照' },
  ]);
};

export const Ch10Ana: React.FC<WidgetProps> = () => {
  const stateRef = useRef<number>(0);
  const { ref } = useCanvas<number>((ctx, time) => draw(ctx, time), W, H, stateRef);

  return <canvas ref={ref} width={W} height={H} />;
};

export default Ch10Ana;
