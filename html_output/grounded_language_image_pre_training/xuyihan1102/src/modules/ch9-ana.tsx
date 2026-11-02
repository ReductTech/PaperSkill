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
  useCanvas,
  lerp,
} from '../lib/roomKit';

// Analogy (560x140, control-free): the same room, the same hand — only the list is swapped
// for a more specific one, and the object finally matches a line. 3.4 s loop.

const W = 560;
const H = 140;
const CYCLE = 3400;

const LX = 318;
const LY = 24;
const LW = 206;
const LH = 96;
const ROW_H = (LH - 14) / 3;
const rowY = (i: number) => LY + 8 + i * ROW_H + ROW_H / 2;

const VAGUE = ['那个东西', '随便找点', '看看这里'];
const SPECIFIC = ['两个注射器', '小药瓶', '那块表'];

const BOX_C: [number, number] = [88, 85];
const FROM: [number, number] = [BOX_C[0] + 27, BOX_C[1]];
const TO: [number, number] = [LX + 10, rowY(0)];

const smooth = (t: number) => t * t * (3 - 2 * t);

export const Ch9Ana: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const stateRef = useRef(0);

  const { ref } = useCanvas<number>(
    (ctx, time) => {
      clearScene(ctx, W, H);

      drawItem(ctx, 70, 62, 36, 46, { kind: 'bottle' });
      drawItem(ctx, 140, 58, 44, 50, { kind: 'frame' });

      const q = (time % CYCLE) / CYCLE;
      const specific = q >= 0.42;

      // the marker: grey and dashed until the list is specific enough
      drawBox(ctx, BOX_C[0], BOX_C[1], 54, 62, {
        color: specific ? COLORS.thread : COLORS.muted,
        weight: specific ? 3 : 2,
        dashed: !specific,
      });

      drawList(ctx, LX, LY, LW, LH, {
        lines: 3,
        active: specific ? 0 : undefined,
        labels: specific ? SPECIFIC : VAGUE,
      });

      // the wipe as the old line is rubbed out and rewritten
      if (q >= 0.42 && q < 0.6) {
        const k = 1 - (q - 0.42) / 0.18;
        ctx.save();
        ctx.globalAlpha = 0.22 * k;
        ctx.fillStyle = COLORS.accent;
        ctx.fillRect(LX + 4, LY + 6, LW - 8, LH - 12);
        ctx.restore();
      }

      // one hand, sliding down the list as it rewrites it
      let hy = lerp(44, 104, smooth(Math.min(q / 0.82, 1)));
      if (q > 0.94) hy = lerp(104, 44, (q - 0.94) / 0.06);
      drawPerson(ctx, 300, hy, 0.55, { role: 'searcher' });

      // the line and the object finally line up
      if (q >= 0.68) {
        drawThread(ctx, FROM, TO, { active: true });
        const pulse = 3 + 1.4 * Math.sin(time / 180);
        ctx.save();
        ctx.beginPath();
        ctx.arc(TO[0], TO[1], pulse, 0, Math.PI * 2);
        ctx.fillStyle = COLORS.thread;
        ctx.fill();
        ctx.restore();
      }
    },
    W,
    H,
    stateRef
  );

  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />;
};

export default Ch9Ana;
