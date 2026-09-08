import React, { useEffect, useRef } from 'react';
import type { WidgetProps } from './registry';
import { C, clearScene, drawDesk, drawJournal, drawPen, drawRibbon, drawLabel, drawInkPath, startLoop, type Pt } from './journalKit';

const W = 244;
const H = 130;

export const AnaCh4: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    return startLoop(canvas, W, H, (ctx, now) => {
      const p = (now / 3000) % 1;
      const over = p > 0.72;
      clearScene(ctx, W, H);
      drawDesk(ctx, W, H);
      drawJournal(ctx, 12, 10, 150, 90, 0, 0);
      ctx.strokeStyle = C.orange;
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(22, 82);
      ctx.lineTo(150, 82);
      ctx.stroke();
      const trail: Pt[] = [];
      for (let i = 0; i <= 16; i++) {
        const t = i / 16;
        trail.push({ x: 44 + Math.sin(t * 10) * 4, y: 28 + t * 62 });
      }
      const tip = drawInkPath(ctx, trail, p, over ? C.red : C.blue, 2.6);
      drawPen(ctx, tip.x + 8, tip.y, -0.25, over ? C.red : C.blue);
      drawRibbon(ctx, 22, 10, 36, !over);
      drawLabel(ctx, over ? '越过预算线' : '写向预算线', 12, 122, over ? C.red : C.orange, 11);
    });
  }, []);
  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />;
};
