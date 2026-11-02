import React, { useRef } from 'react';
import type { WidgetProps } from './registry';
import {
  COLORS,
  clearScene,
  drawItem,
  drawBox,
  drawList,
  drawPerson,
  drawLabel,
  useCanvas,
} from '../lib/roomKit';

// Analogy (560x140, control-free): one hand keeps writing new lines onto the list, and
// more and more objects get marked. One subject, one verb, one goal. 3.2 s loop.

const W = 560;
const H = 140;
const CYCLE = 3200;

const LX = 336;
const LY = 14;
const LW = 200;
const ROW_H = 17;
const BASE_LINES = 3;

const ITEMS = [
  { x: 56, y: 66, w: 34, h: 44, kind: 'bottle' as const },
  { x: 112, y: 74, w: 32, h: 36, kind: 'cup' as const },
  { x: 166, y: 62, w: 44, h: 48, kind: 'frame' as const },
];

const listHeight = (lines: number) => 14 + lines * ROW_H;

export const Ch6Ana: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const stateRef = useRef(0);

  const { ref } = useCanvas<number>(
    (ctx, time) => {
      clearScene(ctx, W, H);

      ITEMS.forEach((it) => {
        drawItem(ctx, it.x, it.y, it.w, it.h, { kind: it.kind });
      });

      const p = (time % CYCLE) / CYCLE;
      let f = 0;
      if (p >= 0.06 && p < 0.9) f = ((p - 0.06) / 0.84) * 3;
      else if (p >= 0.9) f = 3;

      const lines = Math.min(BASE_LINES + 3, BASE_LINES + Math.round(f));
      const marks = Math.min(ITEMS.length, 1 + (lines - BASE_LINES));

      drawLabel(ctx, '清单', LX, LY - 4, { color: COLORS.muted, size: 13 });
      drawList(ctx, LX, LY, LW, listHeight(lines), { lines });

      // newly matched things get a marker as the list grows
      ITEMS.forEach((it, i) => {
        if (i >= marks) return;
        const cx = it.x + it.w / 2;
        const cy = it.y + it.h / 2;
        drawBox(ctx, cx, cy, it.w + 18, it.h + 18, { color: COLORS.thread, weight: 3 });
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx - (it.w + 18) / 2, cy - (it.h + 18) / 2, 3.6, 0, Math.PI * 2);
        ctx.fillStyle = COLORS.thread;
        ctx.fill();
        ctx.restore();
      });

      // the hand, writing at the end of the newest line
      const handY = LY + 8 + f * ROW_H + 8.5;
      drawPerson(ctx, LX + LW - 34, handY + 3, 0.5, { role: 'searcher' });
      if (p >= 0.06) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(LX + LW - 22, handY, 3, 0, Math.PI * 2);
        ctx.fillStyle = COLORS.tag;
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

export default Ch6Ana;
