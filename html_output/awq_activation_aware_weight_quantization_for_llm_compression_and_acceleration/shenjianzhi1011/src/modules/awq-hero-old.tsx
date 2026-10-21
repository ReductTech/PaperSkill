import React from 'react';
import { clearScene, drawFader, drawMeter, drawBar, drawSceneLabel, drawTarget, AQ, useAwqCanvas } from './awq-kit';

const W = 440;
const H = 200;

function drawOld(ctx: CanvasRenderingContext2D, w: number, h: number, t: number): void {
  clearScene(ctx, w, h);
  for (let i = 0; i < 12; i++) {
    const bob = Math.sin(t * 2 + i) * 1.2;
    drawFader(ctx, 40 + i * 20, 30 + bob, 110, (i % 4) / 3, {});
  }
  drawMeter(ctx, 40, 156, 300, 14, 1, { clip: true });
  drawBar(ctx, 40, 176, 300, 12, 1, AQ.red);
  drawSceneLabel(ctx, 40, 22, '350GB / 14GB', AQ.red, 14);
  drawSceneLabel(ctx, 40, 200, 'FP16 装不下', AQ.muted, 12);
}

function drawNew(ctx: CanvasRenderingContext2D, w: number, h: number, t: number): void {
  clearScene(ctx, w, h);
  const sparkle = Math.floor(t * 2) % 2 === 0;
  for (let i = 0; i < 8; i++) {
    const salient = i === 2 || i === 5;
    const bob = Math.sin(t * 1.6 + i) * 1.0;
    drawFader(ctx, 50 + i * 24, 46 + bob, 92, salient ? 0.85 : 0.4, { salient });
    if (salient && sparkle) drawTarget(ctx, 50 + i * 24, 40, 7);
  }
  drawMeter(ctx, 50, 156, 300, 14, 0.78, {});
  drawBar(ctx, 50, 176, 300, 12, 0.25, AQ.green);
  drawSceneLabel(ctx, 50, 38, '4× 更小', AQ.green, 14);
  drawSceneLabel(ctx, 50, 200, 'INT4 能上端侧', AQ.muted, 12);
}

export const AwqHeroOld: React.FC<{ chapterId: string; moduleId: string }> = () => {
  const ref = useAwqCanvas(drawOld, W, H);
  return <canvas id="cv-hero-old" ref={ref} width={W} height={H} />;
};

export const AwqHeroNew: React.FC<{ chapterId: string; moduleId: string }> = () => {
  const ref = useAwqCanvas(drawNew, W, H);
  return <canvas id="cv-hero-new" ref={ref} width={W} height={H} />;
};

export default AwqHeroOld;
