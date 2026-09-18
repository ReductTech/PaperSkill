import React, { useEffect, useRef } from 'react';
import { setupCanvas, runLoop, clearScene, drawApprentice, drawOrderSheet, drawSceneLabel, C } from './studioKit';
import type { WidgetProps } from './registry';

const W = 560, H = 140;

// §6 类比：学徒逐格填写单据，铅笔细节闪紫
export const Ana6: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);
    const stop = runLoop(canvas, ctx, (t) => {
      clearScene(ctx, W, H);
      const lit = Math.floor(((t * 0.7) % 1) * 7);
      const rows = Array.from({ length: 6 }, (_, i) => ({
        boxed: true,
        filled: i < lit,
        color: i % 2 === 0 ? C.blue : C.purple,
      }));
      drawOrderSheet(ctx, 60, 20, 240, 100, rows);
      drawApprentice(ctx, 360, 112, -0.7 + Math.sin(t * 3) * 0.12);
      drawSceneLabel(ctx, '蓝=明确要求', 60, 14);
      drawSceneLabel(ctx, '紫=合理补全', 200, 14, true);
    });
    return stop;
  }, []);
  return <canvas ref={ref} className="ana-canvas" style={{ maxWidth: '100%' }} />;
};
