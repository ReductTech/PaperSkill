import React, { useEffect, useRef } from 'react';
import { setupCanvas, runLoop, clearScene, drawPainter, drawSceneLabel, C } from './studioKit';
import type { WidgetProps } from './registry';

const W = 580, H = 118;

// §8 类比：画师沿画室流程墙逐房间行走（紧凑自适应版）
export const Ana8: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);
    canvas.style.width = '100%';
    canvas.style.maxWidth = W + 'px';
    canvas.style.height = 'auto';
    const stop = runLoop(canvas, ctx, (t) => {
      clearScene(ctx, W, H);
      const px = 22 + ((t * 55) % 548);
      // 五个房间（100 宽，间距 12，恰好收进画布）
      const rooms = ['标注', '测量', '训练', '委托', '评审'];
      rooms.forEach((r, i) => {
        const x = 22 + i * 112;
        const hot = px > x && px < x + 100;
        ctx.strokeStyle = hot ? C.blue : C.border;
        ctx.lineWidth = hot ? 2.5 : 1.5;
        ctx.strokeRect(x, 34, 100, 52);
        ctx.fillStyle = C.text;
        ctx.font = (hot ? '700 ' : '') + '13px "Microsoft YaHei", sans-serif';
        ctx.fillText(r, x + (100 - ctx.measureText(r).width) / 2, 66);
      });
      drawPainter(ctx, Math.min(px, 566), 110, -0.6);
      drawSceneLabel(ctx, '训练时图像造单，推理时请求造单', 22, 18, true);
    });
    return stop;
  }, []);
  return <canvas ref={ref} className="ana-canvas" />;
};
