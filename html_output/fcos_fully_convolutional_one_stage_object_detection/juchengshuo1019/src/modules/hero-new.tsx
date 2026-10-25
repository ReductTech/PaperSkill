// Hero right panel (new method): one nail, four tape measures, green box snaps on.
import React, { useRef } from 'react';
import {
  palette, clearScene, drawBoard, drawCarpenter, drawNail, drawTapeLine, drawSceneLabel, drawLegend, useAutoLoop,
} from './carpentry-kit';

export const HeroNew: React.FC<{ chapterId: string; moduleId: string }> = () => {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const draw = React.useCallback((ctx: CanvasRenderingContext2D, t: number) => {
    const W = 560, H = 280;
    clearScene(ctx, W, H);
    const bx = 300, by = 90, bw = 200, bh = 130;
    drawBoard(ctx, bx, by, bw, bh);
    const nx = bx + bw * 0.42, ny = by + bh * 0.45;
    drawNail(ctx, nx, ny, palette.nail, 8);
    // tapes shoot out progressively
    const p = Math.min(1, t * 2.2);
    const ends: Array<[number, number]> = [
      [bx, ny], [nx, by], [bx + bw, ny], [nx, by + bh],
    ];
    ends.forEach(([ex, ey]) => {
      const mx = nx + (ex - nx) * p;
      const my = ny + (ey - ny) * p;
      drawTapeLine(ctx, nx, ny, mx, my);
    });
    if (p >= 1) {
      ctx.strokeStyle = palette.good;
      ctx.lineWidth = 4;
      ctx.strokeRect(bx, by, bw, bh);
    }
    drawCarpenter(ctx, 120, 250, 'measure', 1.4);
    drawSceneLabel(ctx, '一钉四量', 20, 40);
    drawLegend(ctx, [[palette.nail, '钉位'], [palette.good, '画出的框']], 20, 70);
  }, []);
  useAutoLoop(ref, 560, 280, draw, 3000);
  return <canvas ref={ref} aria-label="新法：一钉四量画出框" />;
};
