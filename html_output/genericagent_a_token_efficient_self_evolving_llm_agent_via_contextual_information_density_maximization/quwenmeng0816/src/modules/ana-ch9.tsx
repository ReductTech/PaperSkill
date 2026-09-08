import React, { useEffect, useRef } from 'react';
import type { WidgetProps } from './registry';
import { C, clearScene, drawDesk, drawJournal, drawLabel, fillRR, drawInkPath, startLoop } from './journalKit';

const W = 244;
const H = 130;

export const AnaCh9: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    return startLoop(canvas, W, H, (ctx, now) => {
      const p = (now / 2600) % 1;
      const mid = 0.2 + 0.8 * Math.abs(Math.sin(p * Math.PI));
      clearScene(ctx, W, H);
      drawDesk(ctx, W, H);
      drawJournal(ctx, 10, 14, 88, 78, 0, 0.2);
      fillRR(ctx, 112, 40, 118, 28, 3, C.page);
      ctx.strokeStyle = C.support;
      ctx.lineWidth = 1.6;
      ctx.strokeRect(112, 40, 118, 28);
      ctx.fillStyle = C.blue;
      ctx.font = '10px sans-serif';
      ctx.fillText('HEAD', 118, 58);
      ctx.fillText('TAIL', 196, 58);
      ctx.globalAlpha = mid;
      ctx.fillStyle = C.red;
      ctx.fillRect(148, 42, 44, 24);
      ctx.globalAlpha = 1;
      drawInkPath(
        ctx,
        [
          { x: 148, y: 38 },
          { x: 170, y: 54 },
          { x: 192, y: 38 },
        ],
        Math.min(1, p * 1.4),
        C.red,
        2.4
      );
      ctx.fillStyle = '#fff';
      ctx.fillText('…', 164, 58);
      drawLabel(ctx, '裁掉中段', 10, 122, C.orange, 11);
    });
  }, []);
  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />;
};
