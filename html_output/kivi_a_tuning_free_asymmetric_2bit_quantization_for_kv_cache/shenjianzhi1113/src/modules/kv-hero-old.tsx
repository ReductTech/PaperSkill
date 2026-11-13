import React from 'react';
import { clearScene, drawShelf, drawFolder, drawCard, drawStack, drawBar, drawSceneLabel, drawTarget, KV, useKvCanvas } from './kv-kit';

const W = 440;
const H = 200;

function drawOld(ctx: CanvasRenderingContext2D, w: number, h: number, t: number): void {
  clearScene(ctx, w, h);
  drawShelf(ctx, 30, 40, 370, 120, 3);
  for (let r = 0; r < 3; r++) {
    for (let i = 0; i < 7; i++) {
      drawFolder(ctx, 44 + i * 50, 46 + r * 38 + Math.sin(t * 1.4 + i) * 1.2, 42, 32, { tone: i === 4 ? 'hot' : 'normal' });
    }
  }
  drawBar(ctx, 30, 24, 380, 10, 1, KV.red);
  drawSceneLabel(ctx, 30, 18, '案卷塞满 · 全精度', KV.red, 12);
  drawSceneLabel(ctx, 30, 192, 'KV cache 随 token 线性长', KV.muted, 12);
}

function drawNew(ctx: CanvasRenderingContext2D, w: number, h: number, t: number): void {
  clearScene(ctx, w, h);
  drawShelf(ctx, 24, 44, 240, 112, 2);
  drawCard(ctx, 38, 52, 100, 38, 6);
  drawCard(ctx, 148, 52, 100, 38, 6);
  for (let i = 0; i < 4; i++) drawFolder(ctx, 38 + i * 28, 102, 24, 30, { tone: 'old' });
  drawStack(ctx, 300, 62, 110, 92, 5);
  drawSceneLabel(ctx, 300, 54, '桌面留一叠', KV.purple, 12);
  drawBar(ctx, 24, 24, 390, 10, 0.38, KV.green);
  drawSceneLabel(ctx, 24, 18, '按列/按行 · 2bit', KV.green, 12);
  drawTarget(ctx, 412, 130, 9);
  drawSceneLabel(ctx, 24, 192, '索引卡 + 正文 + 残差窗口', KV.muted, 12);
}

export const KvHeroOld: React.FC<{ chapterId: string; moduleId: string }> = () => {
  const ref = useKvCanvas(drawOld, W, H);
  return <canvas id="cv-hero-old" ref={ref} width={W} height={H} />;
};

export const KvHeroNew: React.FC<{ chapterId: string; moduleId: string }> = () => {
  const ref = useKvCanvas(drawNew, W, H);
  return <canvas id="cv-hero-new" ref={ref} width={W} height={H} />;
};

export default KvHeroOld;
