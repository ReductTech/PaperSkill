import React, { useEffect, useRef } from 'react';
import type { WidgetProps } from './registry';
import { C, clearScene, drawDesk, drawJournal, drawRibbon, drawPouch, drawCard, drawLabel, drawInkPath, startLoop } from './journalKit';

const W = 244;
const H = 130;

export const AnaCh5: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    return startLoop(canvas, W, H, (ctx, now) => {
      const p = (now / 2600) % 1;
      const cx = 150 - p * 70;
      clearScene(ctx, W, H);
      drawDesk(ctx, W, H);
      drawJournal(ctx, 10, 12, 118, 86, 0, 0.15);
      drawRibbon(ctx, 22, 12, 34, true);
      drawInkPath(
        ctx,
        [
          { x: 208, y: 72 },
          { x: 170, y: 58 },
          { x: cx + 40, y: 50 },
        ],
        Math.min(1, p * 1.2),
        C.green,
        2.4
      );
      drawCard(ctx, cx, 32, 86, 44, C.green, '浓缩规则', '165 token');
      drawPouch(ctx, 186, 68);
      drawLabel(ctx, '写入活动索引', 10, 122, C.green, 11);
    });
  }, []);
  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />;
};
