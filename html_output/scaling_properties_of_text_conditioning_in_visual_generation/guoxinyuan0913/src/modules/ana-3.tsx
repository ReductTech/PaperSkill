import React, { useEffect, useRef } from 'react';
import { setupCanvas, runLoop, clearScene, drawOrderSheet, drawSceneLabel, C } from './studioKit';
import type { WidgetProps } from './registry';

const W = 560, H = 140;

// §3 类比：双面板同步——左散文平线，右清单上行
export const Ana3: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);
    const stop = runLoop(canvas, ctx, (t) => {
      clearScene(ctx, W, H);
      const k = (Math.sin(t * 1.5) + 1) / 2;
      const left = Array.from({ length: 3 + Math.floor(k * 5) }, () => ({ boxed: false, filled: false }));
      const right = Array.from({ length: 4 }, (_, i) => ({ boxed: true, filled: i < Math.floor(k * 4) }));
      drawOrderSheet(ctx, 20, 24, 110, 80, left);
      drawOrderSheet(ctx, 300, 24, 110, 80, right);
      ctx.strokeStyle = C.red; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(150, 100); ctx.lineTo(270, 100); ctx.stroke();
      ctx.strokeStyle = C.green;
      ctx.beginPath(); ctx.moveTo(430, 104); ctx.lineTo(550, 44); ctx.stroke();
      drawSceneLabel(ctx, '散文：重建平线', 20, 16, true);
      drawSceneLabel(ctx, '清单：逐级更准', 300, 16, true);
    });
    return stop;
  }, []);
  return <canvas ref={ref} className="ana-canvas" style={{ maxWidth: '100%' }} />;
};
