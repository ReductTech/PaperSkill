import React, { useEffect, useRef } from 'react';
import type { WidgetProps } from './registry';
import { C, clearScene, drawDesk, drawJournal, drawPen, drawRibbon, drawStamp, drawPouch, drawLabel, drawInkRows, startLoop } from './journalKit';

const W = 460;
const H = 160;

export const HeroNew: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    return startLoop(canvas, W, H, (ctx, now) => {
      const p = (now / 2800) % 1;
      const write = Math.min(1, p / 0.78);
      clearScene(ctx, W, H);
      drawDesk(ctx, W, H);
      drawJournal(ctx, 28, 16, 250, 112, 0, 0);
      drawRibbon(ctx, 42, 16, 58, true);
      const tip = drawInkRows(
        ctx,
        [
          { x: 58, y: 48, w: 186 },
          { x: 58, y: 68, w: 164 },
          { x: 58, y: 88, w: 138 },
        ],
        write,
        C.blue,
        2.8
      );
      drawPen(ctx, tip.x + 10, tip.y + 2, -0.42, C.blue);
      drawStamp(ctx, 240, 100, p > 0.82);
      drawPouch(ctx, 330, 72);
      drawLabel(ctx, '活动面板只保留决策相关状态', 28, 148, C.green, 12);
    });
  }, []);
  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />;
};
