import React, { useRef } from 'react';
import type { WidgetProps } from './registry';
import {
  COLORS,
  clearScene,
  drawItem,
  drawBox,
  drawList,
  drawThread,
  drawPerson,
  drawLabel,
  useCanvas,
} from '../lib/roomKit';

// Hero, right panel: the same room, but the list is in hand — everything that answers a line
// gets a marker box, and a thread ties it to that line. One moving subject: the fingertip
// tracing a thread, on the same 2.4 s loop as the left panel.

const W = 520;
const H = 140;
const LOOP = 2400;
const TAU = Math.PI * 2;

type RoomObj = {
  x: number;
  y: number;
  w: number;
  h: number;
  kind: 'bottle' | 'cup' | 'plant' | 'frame' | 'box';
};

// Same five things in the same places as the left panel.
const ROOM: RoomObj[] = [
  { x: 258, y: 58, w: 16, h: 34, kind: 'bottle' },
  { x: 292, y: 74, w: 24, h: 24, kind: 'cup' },
  { x: 338, y: 50, w: 28, h: 40, kind: 'plant' },
  { x: 390, y: 68, w: 28, h: 28, kind: 'frame' },
  { x: 452, y: 76, w: 32, h: 24, kind: 'box' },
];

const LIST = { x: 132, y: 20, w: 96, h: 68 };
const ROWS = 4;
const ROW_H = (LIST.h - 14) / ROWS;
const listEdge = LIST.x + LIST.w;
const lineY = (i: number) => LIST.y + 8 + i * ROW_H + ROW_H * 0.55;

// Which list line each thing answers to; the top line answers the frame and the box.
const LINE_OF = [3, 2, 1, 0, 0];
const ACTIVE_OBJ = 2; // the plant sits mid-room, so its thread is the one being traced

const boxW = (o: RoomObj) => o.w + 8;
const boxH = (o: RoomObj) => o.h + 8;
const threadFrom = (o: RoomObj): [number, number] => [
  o.x + o.w / 2 - boxW(o) / 2,
  o.y + o.h / 2,
];
const threadTo = (i: number): [number, number] => [listEdge, lineY(LINE_OF[i])];

const cubic = (a: number, b: number, c: number, d: number, u: number): number => {
  const m = 1 - u;
  return m * m * m * a + 3 * m * m * u * b + 3 * m * u * u * c + u * u * u * d;
};

export const HeroNew: React.FC<WidgetProps> = () => {
  const stateRef = useRef<Record<string, never>>({});
  const { ref } = useCanvas<Record<string, never>>(
    (ctx, time) => {
      const p = (((time % LOOP) + LOOP) % LOOP) / LOOP;
      const u = 0.5 - 0.5 * Math.cos(TAU * p); // fingertip runs out along the thread and back

      clearScene(ctx, W, H);

      drawList(ctx, LIST.x, LIST.y, LIST.w, LIST.h, { lines: ROWS, active: LINE_OF[ACTIVE_OBJ] });
      drawPerson(ctx, 110, 52, 1.7);

      // A thread ties every marker box to the line that asked for it.
      ROOM.forEach((o, i) => drawThread(ctx, threadFrom(o), threadTo(i), { active: i === ACTIVE_OBJ }));

      // The things themselves, then a marker box on each one that answers a line.
      ROOM.forEach((o) => drawItem(ctx, o.x, o.y, o.w, o.h, { kind: o.kind }));
      ROOM.forEach((o, i) =>
        drawBox(ctx, o.x + o.w / 2, o.y + o.h / 2, boxW(o), boxH(o), {
          color: COLORS.box,
          weight: i === ACTIVE_OBJ ? 3 : 2,
        })
      );

      // The moving subject: the fingertip, partway along the traced thread.
      const from = threadFrom(ROOM[ACTIVE_OBJ]);
      const to = threadTo(ACTIVE_OBJ);
      const mx = (from[0] + to[0]) / 2;
      const dotX = cubic(from[0], mx, mx, to[0], u);
      const dotY = cubic(from[1], from[1], to[1], to[1], u);
      ctx.save();
      ctx.beginPath();
      ctx.arc(dotX, dotY, 6, 0, TAU);
      ctx.fillStyle = COLORS.thread;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = COLORS.room;
      ctx.stroke();
      ctx.restore();

      drawLabel(ctx, '照清单', 14, 24, { color: COLORS.thread, size: 15, bold: true });
    },
    W,
    H,
    stateRef
  );
  return <canvas ref={ref} width={W} height={H} />;
};

export default HeroNew;
