import React, { useEffect, useRef } from 'react';
import type { WidgetProps } from './registry';
import { C, clearScene, drawDesk, drawJournal, drawReceipt, drawStamp, drawLabel, startLoop } from './journalKit';

const W = 460;
const H = 160;

export const HeroOld: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    return startLoop(canvas, W, H, (ctx, now) => {
      const p = (now / 3200) % 1;
      const clutter = Math.min(1, p * 1.15);
      clearScene(ctx, W, H);
      drawDesk(ctx, W, H);
      drawJournal(ctx, 28, 16, 280, 112, clutter, 1 - clutter);
      const fly = 1 - Math.min(1, p * 1.4);
      if (fly > 0) drawReceipt(ctx, 120 + fly * 180, 8 + fly * 20, -0.4, 3);
      drawStamp(ctx, 370, 70, clutter < 0.35);
      drawLabel(ctx, '原始日志盖住当前任务状态', 28, 148, C.red, 12);
    });
  }, []);
  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />;
};
