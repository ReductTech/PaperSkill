import React from 'react';
import { clearScene, drawPole, drawPerson, drawBalance, drawBar, drawSceneLabel, drawTarget, SQ, useSqCanvas } from './sq-kit';

const W = 440;
const H = 200;

function drawOld(ctx: CanvasRenderingContext2D, w: number, h: number, t: number): void {
  clearScene(ctx, w, h);
  const wob = Math.sin(t * 2.4) * 0.02;
  drawPerson(ctx, 220, 90, 60, 0.18);
  drawPole(ctx, 80, 52, 280, 0.18 + wob, { leftRocks: 3, rightRocks: 2, leftOutlier: true });
  drawBalance(ctx, 220, 172, 180, 0.18 + wob, false);
  drawBar(ctx, 30, 24, 380, 12, 1, SQ.red);
  drawSceneLabel(ctx, 30, 18, '350GB / 多卡', SQ.red, 13);
  drawSceneLabel(ctx, 30, 196, '前筐巨石 · 挑不稳', SQ.muted, 12);
}

function drawNew(ctx: CanvasRenderingContext2D, w: number, h: number, t: number): void {
  clearScene(ctx, w, h);
  const bob = Math.sin(t * 1.6) * 0.015;
  drawPerson(ctx, 220, 90, 60, 0);
  drawPole(ctx, 80, 52, 280, bob, { leftRocks: 4, rightRocks: 4, leftHighlight: true, rightHighlight: true });
  drawBalance(ctx, 220, 172, 180, 0, true);
  drawBar(ctx, 30, 24, 380, 12, 0.5, SQ.green);
  drawSceneLabel(ctx, 30, 18, '2× 省显存 / 1.56×', SQ.green, 13);
  drawTarget(ctx, 405, 190, 10);
  drawSceneLabel(ctx, 30, 196, '两筐配平 · 走得稳', SQ.muted, 12);
}

export const SqHeroOld: React.FC<{ chapterId: string; moduleId: string }> = () => {
  const ref = useSqCanvas(drawOld, W, H);
  return <canvas id="cv-hero-old" ref={ref} width={W} height={H} />;
};

export const SqHeroNew: React.FC<{ chapterId: string; moduleId: string }> = () => {
  const ref = useSqCanvas(drawNew, W, H);
  return <canvas id="cv-hero-new" ref={ref} width={W} height={H} />;
};

export default SqHeroOld;
