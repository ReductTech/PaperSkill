import React, { useEffect, useRef } from 'react';
import type { WidgetProps } from './registry';
import { C, clearScene, drawDesk, drawJournal, drawLabel, fillRR, drawFlow, startLoop } from './journalKit';

const W = 244;
const H = 130;

export const AnaCh8: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    return startLoop(canvas, W, H, (ctx, now) => {
      const p = (now / 3200) % 1;
      const open = Math.floor(p * 4);
      clearScene(ctx, W, H);
      drawDesk(ctx, W, H);
      drawJournal(ctx, 78, 12, 150, 88, 0, 0.15);
      const names = ['工具', '记忆', '进化', '截断'];
      names.forEach((name, i) => {
        const y = 16 + i * 20;
        const lift = i === open ? 8 : 0;
        fillRR(ctx, 12, y - lift, 64, 18, 4, i === open ? C.purple : C.leather);
        ctx.fillStyle = '#fff';
        ctx.font = '11px "PingFang SC", sans-serif';
        ctx.fillText(name, 24, y + 12 - lift);
      });
      const oy = 16 + open * 20 - 8;
      drawFlow(ctx, { x: 76, y: oy + 9 }, { x: 150, y: 52 }, now, C.purple, 2.6, 10);
      drawLabel(ctx, '打开一个工作抽屉', 12, 122, C.purple, 11);
    });
  }, []);
  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />;
};
