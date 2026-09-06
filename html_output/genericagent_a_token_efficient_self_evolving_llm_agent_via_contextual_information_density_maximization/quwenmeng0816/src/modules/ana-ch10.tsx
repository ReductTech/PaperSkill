import React, { useEffect, useRef } from 'react';
import type { WidgetProps } from './registry';
import { C, clearScene, drawDesk, drawJournal, drawStamp, drawLabel, drawInkPath, startLoop } from './journalKit';

const W = 244;
const H = 130;

export const AnaCh10: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    return startLoop(canvas, W, H, (ctx, now) => {
      const p = (now / 2400) % 1;
      clearScene(ctx, W, H);
      drawDesk(ctx, W, H);
      drawJournal(ctx, 8, 12, 100, 86, 0.75, 0.1);
      drawJournal(ctx, 122, 12, 100, 86, 0, 0);
      const route = [
        { x: 142, y: 36 },
        { x: 168, y: 48 },
        { x: 154, y: 64 },
        { x: 178, y: 80 },
      ];
      const tip = drawInkPath(ctx, route, p, C.green, 2.6);
      drawStamp(ctx, tip.x, tip.y, p > 0.7);
      drawLabel(ctx, '完成率与成本一起核对', 8, 122, C.green, 11);
    });
  }, []);
  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />;
};
