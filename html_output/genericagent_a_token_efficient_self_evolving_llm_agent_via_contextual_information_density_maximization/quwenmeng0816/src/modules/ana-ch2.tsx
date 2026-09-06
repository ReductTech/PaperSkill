import React, { useEffect, useRef } from 'react';
import type { WidgetProps } from './registry';
import { C, clearScene, drawDesk, drawJournal, drawPen, drawPouch, drawLabel, drawInkRows, startLoop } from './journalKit';

const W = 244;
const H = 130;

export const AnaCh2: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    return startLoop(canvas, W, H, (ctx, now) => {
      const p = (now / 2800) % 1;
      clearScene(ctx, W, H);
      drawDesk(ctx, W, H);
      drawJournal(ctx, 10, 10, 148, 90, 0, 0);
      const tip = drawInkRows(
        ctx,
        [
          { x: 32, y: 38, w: 108 },
          { x: 32, y: 54, w: 96 },
          { x: 32, y: 70, w: 84 },
        ],
        p,
        C.blue,
        2.4
      );
      drawPen(ctx, tip.x + 8, tip.y + 1, -0.4, C.blue);
      drawPouch(ctx, 176, 58);
      drawLabel(ctx, '活动区只写索引', 10, 122, C.blue, 11);
    });
  }, []);
  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />;
};
