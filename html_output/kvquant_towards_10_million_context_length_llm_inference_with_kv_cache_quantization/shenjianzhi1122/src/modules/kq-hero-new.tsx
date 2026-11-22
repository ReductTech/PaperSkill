import React from 'react';
import { clearScene, drawCase, drawItem, drawCube, drawHardBox, drawPouch, drawBar, drawSceneLabel, drawTarget, KQ, useKqCanvas } from './kq-kit';

const W = 440;
const H = 200;

function drawOld(ctx: CanvasRenderingContext2D, w: number, h: number, t: number): void {
  clearScene(ctx, w, h);
  drawCase(ctx, 60, 40, 230, 130, 1);
  for (let i = 0; i < 5; i++) drawItem(ctx, 78 + (i % 3) * 66, 62 + Math.floor(i / 3) * 42, 52, 34, { big: i % 2 === 0 });
  drawItem(ctx, 120, 26 + Math.sin(t * 1.5) * 1.5, 90, 52, { big: true });
  drawBar(ctx, 40, 22, 360, 10, 1, KQ.red);
  drawSceneLabel(ctx, 40, 16, '箱子合不上', KQ.red, 12);
  drawSceneLabel(ctx, 40, 192, '全精度 / 4bit 以下崩', KQ.muted, 12);
}

function drawNew(ctx: CanvasRenderingContext2D, w: number, h: number, t: number): void {
  clearScene(ctx, w, h);
  drawCase(ctx, 60, 40, 230, 130, 0.55);
  for (let i = 0; i < 3; i++) drawCube(ctx, 78 + i * 62, 66, 48, 40, { });
  drawHardBox(ctx, 78, 118, 60, 34);
  drawPouch(ctx, 220, 118, 54, 34);
  drawBar(ctx, 40, 22, 360, 10, 0.4, KQ.green);
  drawSceneLabel(ctx, 40, 16, '按类别/按件 + 硬盒', KQ.green, 12);
  drawTarget(ctx, 408, 120, 9);
  drawSceneLabel(ctx, 40, 192, '3bit + 1% 硬盒 + 证件包', KQ.muted, 12);
}

export const KqHeroOld: React.FC<{ chapterId: string; moduleId: string }> = () => {
  const ref = useKqCanvas(drawOld, W, H);
  return <canvas id="cv-hero-old" ref={ref} width={W} height={H} />;
};

export const KqHeroNew: React.FC<{ chapterId: string; moduleId: string }> = () => {
  const ref = useKqCanvas(drawNew, W, H);
  return <canvas id="cv-hero-new" ref={ref} width={W} height={H} />;
};

export default KqHeroOld;
