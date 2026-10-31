import React from 'react';
import { clearScene, drawBasin, drawGarment, drawBar, drawSceneLabel, drawTarget, LI, useLiCanvas } from './li-kit';

const W = 440;
const H = 200;

function drawOld(ctx: CanvasRenderingContext2D, w: number, h: number, t: number): void {
  clearScene(ctx, w, h);
  drawBasin(ctx, 50, 50, 220, 110, { fill: 1 });
  for (let i = 0; i < 6; i++) drawGarment(ctx, 70 + (i % 3) * 55, 62 + Math.floor(i / 3) * 38, 44, 30, {});
  drawGarment(ctx, 95, 48 + Math.sin(t * 2) * 2, 85, 62, { big: true });
  drawGarment(ctx, 200, 40, 62, 52, { big: true });
  drawBar(ctx, 40, 26, 360, 12, 1, LI.red);
  drawSceneLabel(ctx, 40, 20, 'FP16 装不下', LI.red, 13);
  drawSceneLabel(ctx, 40, 196, '一个盆 · 超大件溢出', LI.muted, 12);
}

function drawNew(ctx: CanvasRenderingContext2D, w: number, h: number, t: number): void {
  clearScene(ctx, w, h);
  drawBasin(ctx, 30, 60, 190, 100, { fill: 0.6 });
  for (let i = 0; i < 5; i++) drawGarment(ctx, 48 + (i % 3) * 52, 70 + Math.floor(i / 3) * 34, 40, 28, {});
  drawBasin(ctx, 250, 78, 150, 82, { fill: 0.4, highlight: true });
  drawGarment(ctx, 290, 80 + Math.sin(t * 1.6) * 2, 66, 52, { big: true });
  drawBar(ctx, 30, 26, 380, 12, 0.5, LI.green);
  drawSceneLabel(ctx, 30, 20, '显存约减半', LI.green, 13);
  drawTarget(ctx, 405, 150, 10);
  drawSceneLabel(ctx, 30, 196, '主盆 + 轻柔盆', LI.muted, 12);
}

export const LiHeroOld: React.FC<{ chapterId: string; moduleId: string }> = () => {
  const ref = useLiCanvas(drawOld, W, H);
  return <canvas id="cv-hero-old" ref={ref} width={W} height={H} />;
};

export const LiHeroNew: React.FC<{ chapterId: string; moduleId: string }> = () => {
  const ref = useLiCanvas(drawNew, W, H);
  return <canvas id="cv-hero-new" ref={ref} width={W} height={H} />;
};

export default LiHeroOld;
