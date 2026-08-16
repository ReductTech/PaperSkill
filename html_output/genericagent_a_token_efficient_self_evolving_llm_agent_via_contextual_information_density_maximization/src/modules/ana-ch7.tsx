import React, { useEffect, useRef } from 'react';
import type { WidgetProps } from './registry';
import { C, clearScene, drawDesk, drawJournal, drawPen, drawCard, drawLabel, drawInkRows, drawInkPath, startLoop } from './journalKit';

const W = 244;
const H = 130;

export const AnaCh7: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    return startLoop(canvas, W, H, (ctx, now) => {
      const p = (now / 3000) % 1;
      clearScene(ctx, W, H);
      drawDesk(ctx, W, H);
      drawJournal(ctx, 8, 12, 100, 86, 0.5 * (1 - p), 0);
      drawInkRows(ctx, [{ x: 26, y: 40, w: 64 }, { x: 26, y: 56, w: 52 }], Math.min(1, p * 1.4), C.blue, 2);
      drawCard(ctx, 122, 28, 104, 56, p > 0.55 ? C.green : C.orange, '', '');
      drawInkPath(
        ctx,
        [
          { x: 100, y: 48 },
          { x: 118, y: 50 },
          { x: 132, y: 48 },
        ],
        Math.min(1, p * 1.6),
        C.orange,
        2.4
      );
      const tip = drawInkRows(
        ctx,
        [
          { x: 136, y: 48, w: 74 },
          { x: 136, y: 64, w: 62 },
        ],
        p,
        p > 0.55 ? C.green : C.orange,
        2.2
      );
      drawPen(ctx, tip.x + 8, tip.y, -0.28, C.orange);
      drawLabel(ctx, '轨迹结晶为脚本', 8, 122, C.orange, 11);
    });
  }, []);
  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />;
};
