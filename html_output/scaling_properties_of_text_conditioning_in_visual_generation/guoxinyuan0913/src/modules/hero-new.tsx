import React, { useEffect, useRef } from 'react';
import { setupCanvas, runLoop, clearScene, drawBoard, drawPainter, drawOrderSheet, drawTargetMark, drawSceneLabel, drawNestedGood, C } from './studioKit';
import type { WidgetProps } from './registry';

const W = 460, H = 160;

// Hero 新方法侧：结构化字段逐条点亮，画板按 6 步交替补全——
// ①圆出现 ②精修圆细节 ③嵌套方出现 ④精修方细节 ⑤嵌套三角出现 ⑥精修三角细节。
// 每一步都是有效信息增加，与旧方法的劣质饱和形成对照。
export const HeroNew: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);
    const stop = runLoop(canvas, ctx, (t) => {
      clearScene(ctx, W, H);
      const lit = Math.floor(((t * 0.45) % 1) * 7); // 0..6，约 15.6s 循环
      const rows = Array.from({ length: 6 }, (_, i) => ({ boxed: true, filled: i < lit }));
      drawOrderSheet(ctx, 24, 22, 150, 96, rows);
      drawBoard(ctx, 282, 36, 110, 84);
      drawNestedGood(ctx, 337, 78, 30, {
        circle: lit >= 1,
        circleDetail: lit >= 2,
        square: lit >= 3,
        squareDetail: lit >= 4,
        triangle: lit >= 5,
        triangleDetail: lit >= 6,
      });
      drawPainter(ctx, 246, 152, -0.9 + Math.sin(t * 2.2) * 0.08);
      drawTargetMark(ctx, 410, 46, lit >= 6);
      drawSceneLabel(ctx, '结构化字段', 24, 16);
      const stepText = [
        '待填单',
        '① 圆出现', '② 精修圆细节',
        '③ 嵌套方出现', '④ 精修方细节',
        '⑤ 嵌套三角出现', '⑥ 精修三角细节',
      ][lit];
      drawSceneLabel(ctx, stepText, 284, 138, lit === 0);
      drawSceneLabel(ctx, '逐级补全', 380, 16, true);
    });
    return stop;
  }, []);
  return <canvas ref={ref} className="ana-canvas" style={{ maxWidth: '100%' }} />;
};
