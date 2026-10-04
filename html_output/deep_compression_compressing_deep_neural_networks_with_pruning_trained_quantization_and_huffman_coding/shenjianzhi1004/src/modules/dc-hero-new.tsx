import React from 'react';
import { clearScene, drawAlbumFrame, drawPhotoTile, drawBar, drawSceneLabel, drawTarget, DC, useDcCanvas } from './dc-kit';

const W = 440;
const H = 200;

function drawOld(ctx: CanvasRenderingContext2D, w: number, h: number, t: number): void {
  clearScene(ctx, w, h);
  drawAlbumFrame(ctx, 18, 24, 210, 150, true);
  const cols = 4;
  const rows = 3;
  for (let i = 0; i < cols * rows; i++) {
    const cx = 26 + (i % cols) * 49;
    const cy = 32 + Math.floor(i / cols) * 47;
    const jitter = i % 3 === 0 ? Math.sin(t * 2.2 + i) * 1.5 : 0;
    drawPhotoTile(ctx, cx, cy + jitter, 42, 40, { blur: i % 3 === 0 });
  }
  // overflow photos bouncing off the right edge
  for (let k = 0; k < 3; k++) {
    const phase = (t * 0.8 + k * 0.33) % 1;
    const x = 228 + phase * 60;
    const alpha = 1 - phase;
    ctx.globalAlpha = alpha;
    drawPhotoTile(ctx, x, 70 + k * 26, 40, 38, { blur: true });
    ctx.globalAlpha = 1;
  }
  drawBar(ctx, 250, 120, 170, 16, 1, DC.red);
  drawSceneLabel(ctx, 250, 110, '240MB 塞不下', DC.red, 14);
  drawSceneLabel(ctx, 250, 168, '32 位浮点 · 只能放 DRAM', DC.muted, 12);
}

function drawNew(ctx: CanvasRenderingContext2D, w: number, h: number, t: number): void {
  clearScene(ctx, w, h);
  drawAlbumFrame(ctx, 18, 60, 210, 90);
  const groups = [DC.blue, DC.purple, DC.deskDark, DC.blue];
  for (let i = 0; i < 4; i++) {
    const cx = 30 + i * 50;
    const bob = Math.sin(t * 1.6 + i) * 1.2;
    drawPhotoTile(ctx, cx, 72 + bob, 42, 46, { emphasis: i === 0, tag: '#' + (i + 1) });
  }
  drawBar(ctx, 250, 100, 170, 16, 0.03, DC.green);
  drawSceneLabel(ctx, 250, 90, '6.9MB 装得下', DC.green, 14);
  drawSceneLabel(ctx, 250, 148, '剪枝 + 共享 + 霍夫曼', DC.muted, 12);
  if (Math.floor(t) % 2 === 0) drawTarget(ctx, 415, 40, 12);
}

export const DcHeroOld: React.FC<{ chapterId: string; moduleId: string }> = () => {
  const ref = useDcCanvas(drawOld, W, H);
  return <canvas id="cv-hero-old" ref={ref} width={W} height={H} />;
};

export const DcHeroNew: React.FC<{ chapterId: string; moduleId: string }> = () => {
  const ref = useDcCanvas(drawNew, W, H);
  return <canvas id="cv-hero-new" ref={ref} width={W} height={H} />;
};

export default DcHeroOld;
