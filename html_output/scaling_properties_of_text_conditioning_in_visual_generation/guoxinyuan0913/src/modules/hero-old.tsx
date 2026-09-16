import React, { useEffect, useRef } from 'react';
import { setupCanvas, runLoop, clearScene, drawBoard, drawPainter, drawOrderSheet, drawTargetMark, drawSceneLabel, drawNested, C } from './studioKit';
import type { WidgetProps } from './registry';

const W = 460, H = 160;

// Hero 旧方法侧：散文单据越写越长。
// 第一笔就画出圆、方、三角三种图形（细节不足），之后只是反复堆同一种劣质细节，
// 原有画板内容几乎不变——饱和但无有效信息增加。
export const HeroOld: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);
    const stop = runLoop(canvas, ctx, (t) => {
      clearScene(ctx, W, H);
      const nRows = 3 + Math.floor((Math.sin(t * 0.55) * 0.5 + 0.5) * 9); // 3..12，约 11s 周期
      const rows = Array.from({ length: nRows }, () => ({ boxed: false, filled: false }));
      drawOrderSheet(ctx, 24, 22, 150, 96, rows);
      drawBoard(ctx, 282, 36, 110, 84);
      // 画板：三种图形第一笔就有（粗糙），之后堆劣质重复笔触，底图不变
      drawNested(ctx, 337, 78, 30, {
        circle: true, square: true, triangle: true,
        junk: Math.max(0, nRows - 4),
      });
      drawPainter(ctx, 246, 152, -0.9 + Math.sin(t * 2.2) * 0.08);
      drawTargetMark(ctx, 410, 46, false);
      drawSceneLabel(ctx, '散文单据', 24, 16);
      drawSceneLabel(ctx, '一次全出·细节不足', 24, 132, true);
      drawSceneLabel(ctx, '劣质饱和·无新信息', 300, 16, true);
    });
    return stop;
  }, []);
  return <canvas ref={ref} className="ana-canvas" style={{ maxWidth: '100%' }} />;
};
