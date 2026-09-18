import React, { useEffect, useRef } from 'react';
import { setupCanvas, runLoop, clearScene, drawEasel, drawPainter, drawOrderSheet, drawTargetMark, drawSceneLabel, C } from './studioKit';
import type { WidgetProps } from './registry';

const W = 560, H = 140;

// §1 类比：画师面对越写越长的散文单据，画布内容不变
export const Ana1: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);
    const stop = runLoop(canvas, ctx, (t) => {
      clearScene(ctx, W, H);
      const nRows = 3 + Math.floor(((t * 0.55) % 1) * 9);
      const rows = Array.from({ length: nRows }, () => ({ boxed: false, filled: false }));
      drawOrderSheet(ctx, 20, 16, 130, 92, rows);
      drawEasel(ctx, 320, 108, 1.2);
      drawPainter(ctx, 268, 112, -0.9 + Math.sin(t * 2.4) * 0.1);
      drawTargetMark(ctx, 386, 46, false);
      drawSceneLabel(ctx, '越写越长', 20, 12);
      drawSceneLabel(ctx, '画面不变', 360, 12, true);
    });
    return stop;
  }, []);
  return <canvas ref={ref} className="ana-canvas" style={{ maxWidth: '100%' }} />;
};
