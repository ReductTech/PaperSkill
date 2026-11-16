import React, { useRef } from 'react';
import type { WidgetProps } from './registry';
import {
  COLORS,
  clamp,
  clearScene,
  drawClock,
  drawDesks,
  drawTick,
  lerp,
  useCanvas,
} from '../lib/classKit';

// Analogy (560x140): a hand presses the stopwatch, two light points race, the green
// one finishes first and stops. Goal: getting one roll-call done before the other.
const W = 560;
const H = 140;
const PERIOD = 3200;
const TRACK_X0 = 118;
const TRACK_X1 = 512;
const LANE_FAST = 52;
const LANE_SLOW = 86;
const CLOCK_X = 56;
const CLOCK_Y = 76;
const CLOCK_R = 22;

const easeOut = (u: number): number => 1 - Math.pow(1 - clamp(u, 0, 1), 3);

function drawHand(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  dir: -1 | 0 | 1
): void {
  ctx.save();
  ctx.lineCap = 'round';
  // forearm: a short chalk-dim sleeve makes the shape read as a hand at this size
  ctx.strokeStyle = COLORS.chalkDim;
  ctx.lineWidth = 5;
  ctx.beginPath();
  if (dir === 0) {
    ctx.moveTo(x - 10, y - 16);
    ctx.lineTo(x - 2, y - 8);
  } else {
    ctx.moveTo(x - dir * 18, y + 10);
    ctx.lineTo(x - dir * 6, y + 3);
  }
  ctx.stroke();
  // palm
  ctx.fillStyle = COLORS.chalk;
  ctx.beginPath();
  ctx.ellipse(x, y, 6.5, 5.5, dir === 0 ? 0 : 0.2 * dir, 0, Math.PI * 2);
  ctx.fill();
  // fingers
  ctx.strokeStyle = COLORS.chalk;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  for (let i = 0; i < 3; i += 1) {
    if (dir === 0) {
      ctx.moveTo(x - 4 + i * 4, y + 4);
      ctx.lineTo(x - 4 + i * 4, y + 12);
    } else {
      ctx.moveTo(x + dir * 4, y - 3 + i * 3);
      ctx.lineTo(x + dir * 12, y - 4 + i * 3.2);
    }
  }
  ctx.stroke();
  ctx.restore();
}

function drawLight(ctx: CanvasRenderingContext2D, x: number, y: number, color: string): void {
  const halo = ctx.createRadialGradient(x, y, 0, x, y, 15);
  halo.addColorStop(0, color);
  halo.addColorStop(0.45, color);
  halo.addColorStop(1, 'rgba(34,53,47,0)');
  ctx.save();
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(x, y, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = COLORS.chalk;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(x, y, 6.5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

export const Ch9Ana: React.FC<WidgetProps> = () => {
  const stateRef = useRef<{ loop: number }>({ loop: 0 });

  const draw = (ctx: CanvasRenderingContext2D, time: number) => {
    clearScene(ctx, W, H);
    const t = (time % PERIOD) / PERIOD;

    // The stopwatch sits on the teacher's desk; the hand presses its crown.
    drawDesks(ctx, 8, 96, 112, 34, { rows: 1, cols: 1 });
    const press =
      t < 0.07
        ? lerp(14, 44, t / 0.07)
        : t < 0.13
        ? 44
        : t < 0.22
        ? lerp(44, 26, (t - 0.13) / 0.09)
        : 26;
    drawClock(ctx, CLOCK_X, CLOCK_Y, CLOCK_R, { progress: clamp((t - 0.1) / 0.75, 0, 1) });
    if (t < 0.26) drawHand(ctx, CLOCK_X, press, 0);

    ctx.save();
    ctx.strokeStyle = COLORS.axis;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(TRACK_X0, LANE_FAST);
    ctx.lineTo(TRACK_X1, LANE_FAST);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(TRACK_X0, LANE_SLOW);
    ctx.lineTo(TRACK_X1, LANE_SLOW);
    ctx.stroke();
    ctx.setLineDash([4, 5]);
    ctx.strokeStyle = COLORS.chalkDim;
    ctx.beginPath();
    ctx.moveTo(TRACK_X0, 36);
    ctx.lineTo(TRACK_X0, 102);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(TRACK_X1, 30);
    ctx.lineTo(TRACK_X1, 108);
    ctx.stroke();
    ctx.restore();

    const green = easeOut((t - 0.16) / 0.5);
    const blue = easeOut((t - 0.16) / 0.72) * 0.82;
    const gx = lerp(TRACK_X0, TRACK_X1, green);
    const bx = lerp(TRACK_X0, TRACK_X1, blue);
    drawLight(ctx, gx, LANE_FAST, COLORS.fast);
    drawLight(ctx, bx, LANE_SLOW, COLORS.name);
    if (green >= 1) drawTick(ctx, TRACK_X1 + 12, LANE_FAST - 16, { ok: true });
  };

  const { ref } = useCanvas(draw, W, H, stateRef);

  return <canvas id="cv-chap-9-ana" ref={ref} width={W} height={H} />;
};

export default Ch9Ana;
