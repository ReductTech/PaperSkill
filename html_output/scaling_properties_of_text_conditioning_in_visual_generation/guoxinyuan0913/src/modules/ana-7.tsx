import React, { useEffect, useRef } from 'react';
import { setupCanvas, runLoop, clearScene, drawOrderSheet, drawSceneLabel, C } from './studioKit';
import type { WidgetProps } from './registry';

const W = 560, H = 140;

// §7 类比：墙上 L5-L10 五张图纸逐张点亮，成品画逐幅变完整
export const Ana7: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);
    const stop = runLoop(canvas, ctx, (t) => {
      clearScene(ctx, W, H);
      const lit = Math.floor(((t * 0.55) % 1) * 6);
      for (let i = 0; i < 5; i++) {
        const x = 30 + i * 62;
        const rows = Array.from({ length: 4 }, (_, r) => ({ boxed: true, filled: i < lit - r }));
        drawOrderSheet(ctx, x, 20, 50, 84, rows);
        drawSceneLabel(ctx, 'L' + (5 + i), x + 14, 118, true);
      }
      // 成品画随级数变完整
      ctx.strokeStyle = C.green; ctx.lineWidth = 2;
      ctx.strokeRect(370, 24, 160, 84);
      for (let i = 0; i < lit; i++) {
        ctx.beginPath();
        ctx.arc(400 + (i % 4) * 30, 50 + Math.floor(i / 4) * 30, 7, 0, Math.PI * 2);
        ctx.stroke();
      }
      drawSceneLabel(ctx, '字段组逐级点亮', 30, 12);
    });
    return stop;
  }, []);
  return <canvas ref={ref} className="ana-canvas" style={{ maxWidth: '100%' }} />;
};
