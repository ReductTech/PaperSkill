import React from 'react';
import type { WidgetProps } from './registry';
import { COLORS, clearSized, label, panel, useSizedAnimatedCanvas } from './canvasUtils';

const HERO_W = 760;
const HERO_H = 340;
const ANALOGY_W = 560;
const ANALOGY_H = 220;

function drawCamera(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.fillStyle = color;
  ctx.strokeStyle = COLORS.text;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(x - 58, y - 36, 116, 72, 13);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = COLORS.white;
  ctx.beginPath();
  ctx.arc(x, y, 23, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = COLORS.text;
  ctx.beginPath();
  ctx.arc(x, y, 9, 0, Math.PI * 2);
  ctx.fill();
}

function drawFrame(ctx: CanvasRenderingContext2D, x: number, y: number, focus: number) {
  ctx.strokeStyle = focus > 0.55 ? COLORS.green : COLORS.red;
  ctx.lineWidth = 4;
  ctx.strokeRect(x - 70, y - 50, 140, 100);
  ctx.globalAlpha = 0.25 + focus * 0.75;
  ctx.fillStyle = COLORS.blue;
  ctx.beginPath();
  ctx.arc(x, y, 20 + focus * 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

export const HeroOld: React.FC<WidgetProps> = () => {
  const ref = useSizedAnimatedCanvas(HERO_W, HERO_H, (ctx, time) => {
    clearSized(ctx, HERO_W, HERO_H);
    const phase = (Math.sin(time / 360) + 1) / 2;
    const drift = Math.sin(time / 280) * 9;
    panel(ctx, 24, 22, 712, 294);
    drawCamera(ctx, 160 + drift, 184, COLORS.red);
    drawFrame(ctx, 600, 184, phase < 0.32 ? 0.85 : 0.22);
    ctx.strokeStyle = COLORS.red;
    ctx.lineWidth = 5;
    ctx.setLineDash([12, 12]);
    ctx.beginPath();
    ctx.moveTo(230, 184);
    ctx.lineTo(518, 184);
    ctx.stroke();
    ctx.setLineDash([]);
    label(ctx, '周期混淆', 334, 88, COLORS.red, 22);
    ctx.fillStyle = COLORS.red;
    ctx.globalAlpha = 0.18 + phase * 0.28;
    ctx.beginPath();
    ctx.arc(600, 184, 35 + phase * 14, 0, Math.PI * 2);
    ctx.strokeStyle = COLORS.red;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }, []);
  return <canvas ref={ref} width={HERO_W} height={HERO_H} />;
};

export const HeroNew: React.FC<WidgetProps> = () => {
  const ref = useSizedAnimatedCanvas(HERO_W, HERO_H, (ctx, time) => {
    clearSized(ctx, HERO_W, HERO_H);
    const phase = (Math.sin(time / 520) + 1) / 2;
    const focus = 0.56 + phase * 0.38;
    panel(ctx, 24, 22, 712, 294);
    drawCamera(ctx, 160, 184, COLORS.green);
    drawFrame(ctx, 600, 184, focus);
    ctx.strokeStyle = COLORS.green;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(230, 184);
    ctx.lineTo(518, 184);
    ctx.stroke();
    label(ctx, '稳定定位', 340, 88, COLORS.green, 22);
    // A visible but stable focus pulse: the target stays fixed while its
    // confidence ring breathes and scans, contrasting with the old method's drift.
    ctx.save();
    ctx.strokeStyle = COLORS.green;
    ctx.globalAlpha = 0.28 + phase * 0.38;
    ctx.lineWidth = 4;
    ctx.setLineDash([16, 9]);
    ctx.lineDashOffset = -phase * 44;
    ctx.beginPath();
    ctx.arc(600, 184, 38 + phase * 18, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 0.45 + phase * 0.35;
    ctx.fillStyle = COLORS.green;
    ctx.beginPath();
    ctx.arc(600, 184, 5 + phase * 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }, []);
  return <canvas ref={ref} width={HERO_W} height={HERO_H} />;
};

const sceneById: Record<string, { action: string; accent: string; mode: number }> = {
  'photo-focus': { action: '调焦', accent: COLORS.blue, mode: 0 },
  'photo-dial': { action: '转刻度', accent: COLORS.orange, mode: 1 },
  'photo-level': { action: '校水平', accent: COLORS.green, mode: 2 },
  'photo-search': { action: '找主体', accent: COLORS.red, mode: 3 },
  'photo-slow-ring': { action: '慢刻度', accent: COLORS.green, mode: 1 },
  'photo-diagonal': { action: '斜构图', accent: COLORS.purple, mode: 2 },
  'photo-shutter': { action: '调间隔', accent: COLORS.orange, mode: 1 },
  'photo-compose': { action: '合成设置', accent: COLORS.blue, mode: 2 },
  'photo-review': { action: '回看样片', accent: COLORS.green, mode: 3 },
  'photo-preset': { action: '存预设', accent: COLORS.purple, mode: 0 },
};

export const PhotoAnalogy: React.FC<WidgetProps & { sceneId?: string }> = ({ sceneId }) => {
  const scene = sceneById[sceneId ?? 'photo-focus'] ?? sceneById['photo-focus'];
  const ref = useSizedAnimatedCanvas(ANALOGY_W, ANALOGY_H, (ctx, time) => {
    clearSized(ctx, ANALOGY_W, ANALOGY_H);
    const p = (Math.sin(time / 520) + 1) / 2;
    panel(ctx, 16, 14, 528, 192);
    drawCamera(ctx, 116 + (scene.mode === 3 ? p * 45 : 0), 121, scene.accent);
    if (scene.mode === 1) {
      ctx.strokeStyle = COLORS.line;
      ctx.lineWidth = 13;
      ctx.beginPath();
      ctx.arc(432, 121, 49, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = scene.accent;
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.arc(432, 121, 49, -Math.PI / 2, -Math.PI / 2 + p * Math.PI * 1.5);
      ctx.stroke();
    } else if (scene.mode === 2) {
      ctx.strokeStyle = COLORS.line;
      ctx.lineWidth = 4;
      ctx.strokeRect(365, 67, 134, 108);
      ctx.strokeStyle = scene.accent;
      ctx.beginPath();
      ctx.moveTo(371, 163 - p * 76);
      ctx.lineTo(493, 82 + p * 74);
      ctx.stroke();
    } else {
      drawFrame(ctx, 432, 121, 0.45 + p * 0.5);
    }
    label(ctx, scene.action, 255, 52, scene.accent, 21);
  }, [sceneId]);
  return <canvas ref={ref} width={ANALOGY_W} height={ANALOGY_H} />;
};
