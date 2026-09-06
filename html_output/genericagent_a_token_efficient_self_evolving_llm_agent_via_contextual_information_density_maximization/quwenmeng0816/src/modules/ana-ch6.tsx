import React, { useEffect, useRef } from 'react';
import type { WidgetProps } from './registry';
import { C, clearScene, drawDesk, drawJournal, drawPen, drawStamp, drawLabel, drawInkPath, checkPts, startLoop } from './journalKit';

const W = 244;
const H = 130;

export const AnaCh6: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    return startLoop(canvas, W, H, (ctx, now) => {
      const p = (now / 3200) % 1;
      const cur = Math.min(3, Math.floor(p * 4));
      const local = (p * 4) % 1;
      clearScene(ctx, W, H);
      drawDesk(ctx, W, H);
      drawJournal(ctx, 12, 10, 148, 90, 0, 0);
      const stops = ['组装', '调用', '执行', '沉淀'];
      drawInkPath(
        ctx,
        [
          { x: 32, y: 32 },
          { x: 32, y: 32 + Math.min(3, cur + local) * 16 },
        ],
        1,
        C.green,
        2.6
      );
      stops.forEach((name, i) => {
        const y = 32 + i * 16;
        ctx.strokeStyle = i <= cur ? C.green : C.axis;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(32, y, 6, 0, Math.PI * 2);
        ctx.stroke();
        if (i < cur) drawInkPath(ctx, checkPts(32, y), 1, C.green, 2.2);
        else if (i === cur) drawInkPath(ctx, checkPts(32, y), local, C.blue, 2.2);
        ctx.fillStyle = i === cur ? C.blue : i < cur ? C.green : C.muted;
        ctx.font = '11px "PingFang SC", sans-serif';
        ctx.fillText(name, 44, y + 4);
      });
      drawPen(ctx, 118, 32 + (cur + local * 0.4) * 16, -0.5, C.blue);
      drawStamp(ctx, 200, 58, cur === 3 && local > 0.55);
      drawLabel(ctx, '逐步更新执行状态', 12, 122, C.blue, 11);
    });
  }, []);
  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />;
};
