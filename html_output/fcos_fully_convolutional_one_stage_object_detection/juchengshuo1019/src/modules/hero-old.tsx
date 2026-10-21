// Hero left panel (old method): carpenter tries template frames on a board; they never fit.
import React, { useRef } from 'react';
import {
  palette, clearScene, drawBoard, drawCarpenter, drawTemplateFrame, drawSceneLabel, drawLegend, useAutoLoop,
} from './carpentry-kit';

export const HeroOld: React.FC<{ chapterId: string; moduleId: string }> = () => {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const draw = React.useCallback((ctx: CanvasRenderingContext2D, t: number) => {
    const W = 560, H = 280;
    clearScene(ctx, W, H);
    const bx = 300, by = 90, bw = 200, bh = 130;
    drawBoard(ctx, bx, by, bw, bh);
    // cycle through 3 frame sizes, none fits
    const sizes = [
      [150, 90],
      [230, 140],
      [190, 170],
    ];
    const idx = Math.floor(t * 3) % 3;
    const [fw, fh] = sizes[idx];
    const fx = bx + bw / 2 - fw / 2 + Math.sin(t * Math.PI * 6) * 8;
    const fy = by + bh / 2 - fh / 2;
    drawTemplateFrame(ctx, fx, fy, fw, fh, palette.bad, 4);
    // red gap flashes
    ctx.fillStyle = palette.bad;
    ctx.globalAlpha = 0.25 + 0.35 * Math.abs(Math.sin(t * Math.PI * 6));
    ctx.fillRect(bx + bw + 4, by, 10, bh);
    ctx.globalAlpha = 1;
    drawCarpenter(ctx, 120, 250, 'fit', 1.4);
    drawSceneLabel(ctx, '套锚框', 20, 40);
    drawLegend(ctx, [[palette.bad, '预制锚框'], [palette.wood, '目标']], 20, 70);
  }, []);
  useAutoLoop(ref, 560, 280, draw, 3000);
  return <canvas ref={ref} aria-label="旧法：预制锚框难以匹配目标" />;
};
