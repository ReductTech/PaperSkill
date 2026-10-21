import React from 'react';
import { clearScene, drawTile, drawLevel, drawBar, drawSceneLabel, drawTarget, GQ, useGptqCanvas } from './gptq-kit';

const W = 440;
const H = 200;

function drawOld(ctx: CanvasRenderingContext2D, w: number, h: number, t: number): void {
  clearScene(ctx, w, h);
  for (let i = 0; i < 8; i++) {
    const jitter = Math.sin(t * 2 + i) * 1.6;
    const state = i % 3 === 0 ? { cracked: true } : i % 2 === 0 ? { snap: true } : {};
    drawTile(ctx, 24 + i * 48, 60 + jitter + (i % 2) * 6, 40, state);
  }
  drawBar(ctx, 24, 40, 380, 12, 1, GQ.red);
  drawSceneLabel(ctx, 24, 32, '326GB / 5 张卡', GQ.red, 13);
  drawSceneLabel(ctx, 24, 190, '砖块不齐 · 路面坑洼', GQ.muted, 12);
}

function drawNew(ctx: CanvasRenderingContext2D, w: number, h: number, t: number): void {
  clearScene(ctx, w, h);
  const bob = Math.sin(t * 1.6) * 0.8;
  for (let i = 0; i < 8; i++) drawTile(ctx, 24 + i * 48, 70 + bob, 40, { filled: true });
  drawLevel(ctx, 214, 130, 200, 0, true);
  drawBar(ctx, 24, 40, 380, 12, 0.25, GQ.green);
  drawSceneLabel(ctx, 24, 32, '4× 更小 / 单卡', GQ.green, 13);
  drawTarget(ctx, 400, 90, 11);
  drawSceneLabel(ctx, 24, 190, '标准砖 · 逐块垫平', GQ.muted, 12);
}

export const GptqHeroOld: React.FC<{ chapterId: string; moduleId: string }> = () => {
  const ref = useGptqCanvas(drawOld, W, H);
  return <canvas id="cv-hero-old" ref={ref} width={W} height={H} />;
};

export const GptqHeroNew: React.FC<{ chapterId: string; moduleId: string }> = () => {
  const ref = useGptqCanvas(drawNew, W, H);
  return <canvas id="cv-hero-new" ref={ref} width={W} height={H} />;
};

export default GptqHeroOld;
