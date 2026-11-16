import React, { useRef } from 'react';
import type { WidgetProps } from './registry';
import {
  COLORS,
  clamp,
  clearScene,
  drawDesks,
  drawGlance,
  drawKid,
  drawRoster,
  drawTick,
  useCanvas,
} from '../lib/classKit';

// Analogy (560x140): one hand takes a small slip from a child's desk and writes one
// line back onto the roster. One moving subject (the hand + slip), one goal (the row updated).
const W = 560;
const H = 140;
const PERIOD = 3400;
const NAMES = ['小明', '小红', '小刚'];

const ROSTER_X = 16;
const ROSTER_Y = 20;
const ROSTER_W = 172;
const ROSTER_H = 100;
const ROW_H = (ROSTER_H - 10) / 3;

const DESK_X = 292;
const DESK_Y = 40;
const DESK_W = 246;
const DESK_H = 76;
const KID_X = DESK_X + 0.5 * (DESK_W / 2);
const KID_Y = 78;

function rosterLineY(i: number): number {
  return ROSTER_Y + 6 + i * ROW_H + ROW_H * 0.58;
}

const TO: [number, number] = [ROSTER_X + ROSTER_W, rosterLineY(0)];
const FROM: [number, number] = [KID_X + 18, KID_Y + 11];
const CTRL: [number, number] = [(FROM[0] + TO[0]) / 2, (FROM[1] + TO[1]) / 2 - 26];

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

function drawSlip(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.save();
  ctx.fillStyle = COLORS.roster;
  ctx.strokeStyle = COLORS.axis;
  ctx.lineWidth = 1;
  ctx.fillRect(x - 9, y - 6, 18, 12);
  ctx.strokeRect(x - 9, y - 6, 18, 12);
  ctx.strokeStyle = COLORS.ink;
  ctx.beginPath();
  ctx.moveTo(x - 5, y - 2);
  ctx.lineTo(x + 5, y - 2);
  ctx.moveTo(x - 5, y + 2);
  ctx.lineTo(x + 3, y + 2);
  ctx.stroke();
  ctx.restore();
}

export const Ch6Ana: React.FC<WidgetProps> = () => {
  const stateRef = useRef<{ loop: number }>({ loop: 0 });

  const draw = (ctx: CanvasRenderingContext2D, time: number) => {
    clearScene(ctx, W, H);
    const t = (time % PERIOD) / PERIOD;
    const carry = clamp((t - 0.14) / 0.5, 0, 1);
    const eased = 1 - Math.pow(1 - carry, 3);
    const hand = quadPoint(eased);
    const writing = clamp((t - 0.66) / 0.2, 0, 1);
    const done = t > 0.86;

    drawDesks(ctx, DESK_X, DESK_Y, DESK_W, DESK_H, { rows: 1, cols: 2 });
    drawKid(ctx, KID_X, KID_Y, 1.3, { kind: 'look', highlight: done });
    drawKid(ctx, DESK_X + 1.5 * (DESK_W / 2), KID_Y, 1.3, { kind: 'sit', dim: true });
    drawRoster(ctx, ROSTER_X, ROSTER_Y, ROSTER_W, ROSTER_H, {
      lines: 3,
      labels: NAMES,
      active: t > 0.6 ? 0 : undefined,
    });

    // The return path from the desk to the roster: the hand carries the slip along it.
    drawGlance(ctx, FROM, TO, { active: true });

    if (t < 0.66) {
      if (t < 0.12) drawSlip(ctx, FROM[0] + 10, FROM[1] - 2);
      else drawSlip(ctx, hand[0] + 10, hand[1] - 2);
    }

    // At the roster the hand sweeps left along the row, writing the line back in.
    const ry = rosterLineY(0);
    const writeX = ROSTER_X + ROSTER_W - 16 - (ROSTER_W - 32) * writing;
    if (writing > 0) {
      ctx.save();
      ctx.strokeStyle = COLORS.back;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(ROSTER_X + ROSTER_W - 16, ry);
      ctx.lineTo(writeX, ry);
      ctx.stroke();
      ctx.restore();
    }

    if (t < 0.64) {
      drawHand(ctx, hand[0], hand[1], -1);
    } else if (t < 0.92) {
      drawHand(ctx, writeX, ry - 8, 0);
    }

    if (done) drawTick(ctx, ROSTER_X + ROSTER_W - 18, rosterLineY(0) - 14, { ok: true });
  };

  const { ref } = useCanvas(draw, W, H, stateRef);

  return <canvas id="cv-chap-6-ana" ref={ref} width={W} height={H} />;
};

export default Ch6Ana;
