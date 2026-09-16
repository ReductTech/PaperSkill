import React, { useEffect, useRef } from 'react';
import { setupCanvas, runLoop, clearScene, drawClerk, drawOrderSheet, drawSceneLabel, C } from './studioKit';
import type { WidgetProps } from './registry';

const W = 560, H = 140;

// §4 类比：验货员拿放大镜逐词核对，接地词点亮
export const Ana4: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);
    const stop = runLoop(canvas, ctx, (t) => {
      clearScene(ctx, W, H);
      const k = (t * 0.5) % 1;
      const mx = 40 + k * 380;
      // 单据 token 行
      ctx.fillStyle = C.sheet; ctx.fillRect(20, 40, 420, 60);
      ctx.strokeStyle = C.line; ctx.strokeRect(20, 40, 420, 60);
      for (let i = 0; i < 12; i++) {
        const x = 32 + (i % 6) * 68, y = 52 + Math.floor(i / 6) * 26;
        const grounded = i % 3 === 1;
        const hit = Math.abs(x + 24 - mx) < 34;
        ctx.fillStyle = hit && grounded ? C.orange : grounded ? 'rgba(240,126,71,0.35)' : C.border;
        ctx.fillRect(x, y, 60, 18);
      }
      drawClerk(ctx, 480, 110, mx, 70);
      drawSceneLabel(ctx, '灰色：不看图也写得出', 20, 30, true);
      drawSceneLabel(ctx, '橙点：看图才写得出', 300, 30, true);
    });
    return stop;
  }, []);
  return <canvas ref={ref} className="ana-canvas" style={{ maxWidth: '100%' }} />;
};
