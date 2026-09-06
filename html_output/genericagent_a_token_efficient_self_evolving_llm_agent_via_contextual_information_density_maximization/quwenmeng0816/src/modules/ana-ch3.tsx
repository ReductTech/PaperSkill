import React, { useEffect, useRef } from 'react';
import type { WidgetProps } from './registry';
import { C, clearScene, drawDesk, drawJournal, drawStamp, drawCard, drawPen, drawLabel, drawInkRows, startLoop } from './journalKit';

const W = 244;
const H = 130;

export const AnaCh3: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    return startLoop(canvas, W, H, (ctx, now) => {
      const p = (now / 3600) % 1;
      const mode = p < 0.33 ? 0 : p < 0.66 ? 1 : 2;
      clearScene(ctx, W, H);
      drawDesk(ctx, W, H);
      drawJournal(ctx, 10, 10, 120, 88, mode === 0 ? 0.7 : 0, mode === 0 ? 0.15 : 0);
      if (mode === 1) drawCard(ctx, 138, 28, 92, 52, C.red, '执行任务', '缺少约束');
      if (mode === 2) {
        drawCard(ctx, 138, 28, 92, 52, C.green, '', '');
        const local = (p - 0.66) / 0.34;
        const tip = drawInkRows(ctx, [{ x: 152, y: 48, w: 64 }, { x: 152, y: 64, w: 52 }], local, C.green, 2.2);
        drawPen(ctx, tip.x + 6, tip.y, -0.35, C.green);
      }
      drawStamp(ctx, 210, 96, mode === 2 && p > 0.88);
      drawLabel(ctx, ['日志过量', '状态缺失', '可以决策'][mode], 10, 122, mode === 2 ? C.green : C.red, 11);
    });
  }, []);
  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />;
};
