import React, { useEffect, useRef } from 'react';
import { setupCanvas, runLoop, clearScene, drawOrderSheet, drawSceneLabel, C } from './studioKit';
import type { WidgetProps } from './registry';

const W = 560, H = 140;

// §2 类比：散文单据折起收走，摆上三栏结构化单据
export const Ana2: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);
    const stop = runLoop(canvas, ctx, (t) => {
      clearScene(ctx, W, H);
      const k = (Math.sin(t * 1.6) + 1) / 2; // 0..1 变形进度
      const n = 6;
      const rows = Array.from({ length: n }, (_, i) => ({
        boxed: i / n < k,
        filled: i / n < k,
      }));
      drawOrderSheet(ctx, 30, 18, 300, 100, rows);
      ctx.strokeStyle = C.wood; ctx.lineWidth = 2;
      ctx.strokeRect(360, 30, 170, 78);
      drawSceneLabel(ctx, '场景 / 物件 / 关系', 368, 74);
      drawSceneLabel(ctx, '散文 → 三栏', 30, 12);
    });
    return stop;
  }, []);
  return <canvas ref={ref} className="ana-canvas" style={{ maxWidth: '100%' }} />;
};
