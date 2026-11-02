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
  lerp,
} from '../lib/roomKit';

// Analogy (560x140, control-free): one hand runs a thread from a marker box on an object
// to one line of the list. One subject, one verb, one goal. 2.8 s loop.

const W = 560;
const H = 140;
const CYCLE = 2800;

const LX = 330;
const LY = 20;
const LW = 200;
const LH = 96;
const ROWS = 4;
const ROW_H = (LH - 14) / ROWS;
const rowY = (i: number) => LY + 8 + i * ROW_H + ROW_H / 2;
const TARGET = 2;

const BOX_C: [number, number] = [117, 89];
const FROM: [number, number] = [BOX_C[0] + 26, BOX_C[1]];
const LIST_POINT: [number, number] = [LX + 10, rowY(TARGET)];
const START: [number, number] = [196, 106];
const HAND_END: [number, number] = [LX - 10, rowY(TARGET) + 10];

const smooth = (t: number) => t * t * (3 - 2 * t);

export const Ch2Ana: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const stateRef = useRef(0);

  const { ref } = useCanvas<number>(
    (ctx, time) => {
      clearScene(ctx, W, H);

      // the clutter: three things on the table
      drawItem(ctx, 60, 64, 32, 42, { kind: 'bottle' });
      drawItem(ctx, 100, 72, 34, 34, { kind: 'cup' });
      drawItem(ctx, 150, 62, 44, 44, { kind: 'frame' });

      // the list, one line highlighted as the target
      drawLabel(ctx, '清单', LX, LY - 4, { color: COLORS.muted, size: 13 });
      drawList(ctx, LX, LY, LW, LH, { lines: ROWS, active: TARGET });

      const p = (time % CYCLE) / CYCLE;
      let u: number;
      if (p < 0.1) u = 0;
      else if (p < 0.68) u = smooth((p - 0.1) / 0.58);
      else if (p < 0.88) u = 1;
      else u = 1 - smooth((p - 0.88) / 0.12);

      const hx = lerp(START[0], HAND_END[0], u);
      const hy = lerp(START[1], HAND_END[1], u);
      const arrived = p >= 0.68 || (p >= 0.1 && u >= 0.999);

      // the marker on the cup
      drawBox(ctx, BOX_C[0], BOX_C[1], 50, 48, {
        color: arrived ? COLORS.thread : COLORS.box,
        weight: 3,
      });
      ctx.save();
      ctx.beginPath();
      ctx.arc(BOX_C[0] - 25, BOX_C[1] - 24, 4, 0, Math.PI * 2);
      ctx.fillStyle = arrived ? COLORS.thread : COLORS.box;
      ctx.fill();
      ctx.restore();

      // the thread being paid out by the hand
      if (p >= 0.1) {
        drawThread(ctx, FROM, arrived ? LIST_POINT : [hx, hy], { active: true });
      }
      if (arrived) {
        const pulse = 3 + 1.6 * Math.sin(time / 170);
        ctx.save();
        ctx.beginPath();
        ctx.arc(LIST_POINT[0], LIST_POINT[1], pulse, 0, Math.PI * 2);
        ctx.fillStyle = COLORS.thread;
        ctx.fill();
        ctx.restore();
      }

      // the hand holding the thread
      drawPerson(ctx, hx - 11, hy, 0.55, { role: 'searcher' });
    },
    W,
    H,
    stateRef
  );

  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />;
};

export default Ch2Ana;
