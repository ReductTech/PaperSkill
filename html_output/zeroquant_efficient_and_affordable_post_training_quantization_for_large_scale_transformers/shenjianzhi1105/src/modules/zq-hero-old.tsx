import React from 'react';
import { clearScene, drawRack, drawGarment, drawTape, drawBar, drawSceneLabel, drawTarget, ZQ, useZqCanvas } from './zq-kit';

const W = 440;
const H = 200;

function drawOld(ctx: CanvasRenderingContext2D, w: number, h: number, t: number): void {
  clearScene(ctx, w, h);
  drawRack(ctx, 30, 40, 380, 120);
  for (let i = 0; i < 5; i++) {
    drawGarment(ctx, 50 + i * 70, 52 + Math.sin(t * 1.5 + i) * 1.5, 52, 74, { fit: 'bad' });
  }
  drawTape(ctx, 410, 50, 100, 0.8, { ok: false });
  drawBar(ctx, 30, 24, 380, 10, 1, ZQ.red);
  drawSceneLabel(ctx, 30, 18, '一把尺子 · 不合身', ZQ.red, 12);
  drawSceneLabel(ctx, 30, 192, '静态范围 / 单一缩放', ZQ.muted, 12);
}

function drawNew(ctx: CanvasRenderingContext2D, w: number, h: number, t: number): void {
  clearScene(ctx, w, h);
  drawRack(ctx, 24, 40, 240, 110);
  for (let i = 0; i < 3; i++) {
    drawGarment(ctx, 36 + i * 74, 52 + Math.sin(t * 1.6 + i) * 1.5, 52, 72, { fit: 'good' });
  }
  drawTape(ctx, 286, 50, 96, 0.75, { ok: true });
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = ZQ.purple;
    ctx.beginPath();
    ctx.arc(330 + i * 26, 168, 6, 0, Math.PI * 2);
    ctx.fill();
  }
  drawBar(ctx, 24, 24, 390, 10, 0.98, ZQ.green);
  drawSceneLabel(ctx, 24, 18, '分组 + 逐人 + 师傅', ZQ.green, 12);
  drawTarget(ctx, 412, 110, 9);
  drawSceneLabel(ctx, 24, 192, '分组纸样 / 动态量体 / LKD', ZQ.muted, 12);
}

export const ZqHeroOld: React.FC<{ chapterId: string; moduleId: string }> = () => {
  const ref = useZqCanvas(drawOld, W, H);
  return <canvas id="cv-hero-old" ref={ref} width={W} height={H} />;
};

export const ZqHeroNew: React.FC<{ chapterId: string; moduleId: string }> = () => {
  const ref = useZqCanvas(drawNew, W, H);
  return <canvas id="cv-hero-new" ref={ref} width={W} height={H} />;
};

export default ZqHeroOld;
