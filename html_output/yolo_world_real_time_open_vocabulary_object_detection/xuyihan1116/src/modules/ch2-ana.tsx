import React, { useRef } from 'react';
import type { WidgetProps } from './registry';
import {
  COLORS,
  clamp,
  clearScene,
  drawDesks,
  drawKid,
  drawRoster,
  drawTick,
  useCanvas,
} from '../lib/classKit';

// Analogy (560x140): one hand runs a thread from a roster line to one seated child.
// One moving subject (the hand + thread), one goal (the thread reaching the child).
const W = 560;
const H = 140;
const PERIOD = 3200;
const NAMES = ['小明', '小红', '小刚'];

const ROSTER_X = 18;
const ROSTER_Y = 22;
const ROSTER_W = 150;
const ROSTER_H = 96;
const ROW_H = (ROSTER_H - 10) / 3;

const DESK_X = 292;
const DESK_Y = 46;
const DESK_W = 246;
const DESK_H = 74;
const KID_Y = 84;

function rosterLineY(i: number): number {
  return ROSTER_Y + 6 + i * ROW_H + ROW_H * 0.58;
}

function deskKidX(c: number): number {
  return DESK_X + (c + 0.5) * (DESK_W / 2);
}

const FROM: [number, number] = [ROSTER_X + ROSTER_W, rosterLineY(0)];
const TARGET_X = deskKidX(1);
const TO: [number, number] = [TARGET_X, KID_Y - 14];
const CTRL: [number, number] = [(FROM[0] + TO[0]) / 2, 24];

function quadPoint(t: number): [number, number] {
  const mt = 1 - t;
  return [
    mt * mt * FROM[0] + 2 * mt * t * CTRL[0] + t * t * TO[0],
    mt * mt * FROM[1] + 2 * mt * t * CTRL[1] + t * t * TO[1],
  ];
}

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

export const Ch2Ana: React.FC<WidgetProps> = () => {
  const stateRef = useRef<{ loop: number }>({ loop: 0 });

  const draw = (ctx: CanvasRenderingContext2D, time: number) => {
    clearScene(ctx, W, H);
    const t = (time % PERIOD) / PERIOD;
    const travel = clamp((t - 0.12) / 0.55, 0, 1);
    const eased = 1 - Math.pow(1 - travel, 3);
    const done = t > 0.72;

    drawRoster(ctx, ROSTER_X, ROSTER_Y, ROSTER_W, ROSTER_H, {
      lines: 3,
      labels: NAMES,
      active: 0,
    });
    drawDesks(ctx, DESK_X, DESK_Y, DESK_W, DESK_H, {
      rows: 1,
      cols: 2,
      highlight: done ? [{ r: 0, c: 1 }] : [],
    });
    drawKid(ctx, deskKidX(0), KID_Y, 1.25, { kind: 'sit', dim: true });
    drawKid(ctx, TARGET_X, KID_Y, 1.25, { kind: 'sit', highlight: done });

    // The thread unrolls from the selected roster line toward the seated child.
    ctx.save();
    ctx.strokeStyle = COLORS.name;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.globalAlpha = t > 0.94 ? Math.max(0, (1 - t) / 0.06) : 1;
    ctx.beginPath();
    ctx.moveTo(FROM[0], FROM[1]);
    const steps = 36;
    for (let i = 1; i <= steps; i += 1) {
      const p = quadPoint((eased * i) / steps);
      ctx.lineTo(p[0], p[1]);
    }
    ctx.stroke();
    ctx.restore();

    if (t < 0.8) {
      const hand = quadPoint(eased);
      drawHand(ctx, hand[0], hand[1], 1);
    } else if (done) {
      drawTick(ctx, TARGET_X + 16, KID_Y - 32, { ok: true });
    }
  };

  const { ref } = useCanvas(draw, W, H, stateRef);

  return <canvas id="cv-chap-2-ana" ref={ref} width={W} height={H} />;
};

export default Ch2Ana;
