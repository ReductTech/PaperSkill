import React, { useEffect, useRef } from 'react';
import type { WidgetProps } from './registry';
import { C, clearScene, drawDesk, drawJournal, drawReceipt, drawStamp, drawLabel, startLoop } from './journalKit';

const W = 244;
const H = 130;

export const AnaCh1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    return startLoop(canvas, W, H, (ctx, now) => {
      const p = (now / 2800) % 1;
      clearScene(ctx, W, H);
      drawDesk(ctx, W, H);
      drawJournal(ctx, 12, 10, 150, 90, p, 1 - p);
      drawReceipt(ctx, 40 + p * 80, 4 + p * 36, -0.3, 1);
      drawStamp(ctx, 198, 52, p < 0.3);
      drawLabel(ctx, '原始日志覆盖任务面板', 12, 122, C.red, 11);
    });
  }, []);
  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />;
};
