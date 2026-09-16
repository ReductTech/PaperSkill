import React, { useEffect, useRef } from 'react';
import { setupCanvas, runLoop, clearScene, drawNestedGood, drawSceneLabel, C } from './studioKit';
import type { WidgetProps } from './registry';

const W = 920, H = 130;

// 原始图像（目标画板）：圆 → 方 → 三角 三级嵌套，每个图形都带工整细节。
// 置于 Hero 两张对比卡上方，作为传统方法与本文方法共同的对标参考。
export const HeroTarget: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);
    const stop = runLoop(canvas, ctx, () => {
      clearScene(ctx, W, H);
      // 画板本体（带支架的小画板）
      const bx = 398, by = 14, bw = 124, bh = 92;
      ctx.fillStyle = '#e8e2d2';
      ctx.fillRect(bx, by, bw, bh);
      ctx.strokeStyle = C.wood;
      ctx.lineWidth = 3;
      ctx.strokeRect(bx, by, bw, bh);
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(bx + 14, by + bh);
      ctx.lineTo(bx + 4, by + bh + 20);
      ctx.moveTo(bx + bw - 14, by + bh);
      ctx.lineTo(bx + bw - 4, by + bh + 20);
      ctx.stroke();
      // 三级嵌套构图
      drawNestedGood(ctx, bx + bw / 2, by + bh / 2 + 2, 36, {
        circle: true, circleDetail: true,
        square: true, squareDetail: true,
        triangle: true, triangleDetail: true,
      });
      // 旁边批注：原始图像
      ctx.strokeStyle = C.muted;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(bx + bw + 6, by + bh / 2);
      ctx.lineTo(bx + bw + 40, by + bh / 2);
      ctx.stroke();
      drawSceneLabel(ctx, '原始图像', bx + bw + 48, by + bh / 2 + 5);
      // 补充说明（淡色）
      drawSceneLabel(ctx, '圆 · 方 · 三角 逐级嵌套，各带细节', bx + bw + 48, by + bh / 2 + 26, true);
    });
    return stop;
  }, []);
  return <canvas ref={ref} className="ana-canvas" style={{ maxWidth: '100%' }} />;
};
