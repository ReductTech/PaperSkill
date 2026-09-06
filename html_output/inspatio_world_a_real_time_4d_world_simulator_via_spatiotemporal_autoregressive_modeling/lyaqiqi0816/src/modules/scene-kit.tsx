import React from 'react';
import type { WidgetProps } from './registry';

// Shared road-trip drawing kit for the InSpatio-World tutorial.
// Colors follow the tutorial-wide semantic palette (contract §5 roles):
// neutrals #f5f8f0/#b8c9a7/#76906a, route #92400e, blue #27446e guidance,
// green #228d5c success, red #c43f52 failure, orange #d97706 emphasis.

export const C = {
  bg: '#f5f8f0',
  hill: '#b8c9a7',
  hillDark: '#76906a',
  road: '#e7e3d8',
  roadEdge: '#92400e',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#d97706',
  purple: '#7c3aed',
  text: '#21324a',
  muted: '#68778f',
  border: '#d7deea',
};

export function clearScene(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, w, h);
  const hy = h * 0.42;
  ctx.fillStyle = C.hill;
  ctx.beginPath();
  ctx.moveTo(0, hy + 14);
  ctx.quadraticCurveTo(w * 0.25, hy - 16, w * 0.5, hy + 4);
  ctx.quadraticCurveTo(w * 0.75, hy + 20, w, hy - 8);
  ctx.lineTo(w, hy + 30);
  ctx.lineTo(0, hy + 30);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = C.hillDark;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, hy + 14);
  ctx.quadraticCurveTo(w * 0.25, hy - 16, w * 0.5, hy + 4);
  ctx.quadraticCurveTo(w * 0.75, hy + 20, w, hy - 8);
  ctx.stroke();
}

export function drawRoadH(
  ctx: CanvasRenderingContext2D,
  y: number,
  x0: number,
  x1: number,
  width = 26
): void {
  ctx.fillStyle = C.road;
  ctx.fillRect(x0, y - width / 2, x1 - x0, width);
  ctx.strokeStyle = C.roadEdge;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x0, y - width / 2);
  ctx.lineTo(x1, y - width / 2);
  ctx.moveTo(x0, y + width / 2);
  ctx.lineTo(x1, y + width / 2);
  ctx.stroke();
  ctx.strokeStyle = C.border;
  ctx.lineWidth = 1;
  ctx.setLineDash([8, 8]);
  ctx.beginPath();
  ctx.moveTo(x0, y);
  ctx.lineTo(x1, y);
  ctx.stroke();
  ctx.setLineDash([]);
}

export function drawCar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  bodyColor: string,
  bob = 0
): void {
  const s = scale;
  const yy = y + bob;
  ctx.save();
  ctx.translate(x, yy);
  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  const w = 34 * s;
  const h = 12 * s;
  const r = 4 * s;
  ctx.moveTo(-w / 2 + r, -h);
  ctx.lineTo(w / 2 - r, -h);
  ctx.quadraticCurveTo(w / 2, -h, w / 2, -h + r);
  ctx.lineTo(w / 2, 0);
  ctx.lineTo(-w / 2, 0);
  ctx.lineTo(-w / 2, -h + r);
  ctx.quadraticCurveTo(-w / 2, -h, -w / 2 + r, -h);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-9 * s, -h);
  ctx.quadraticCurveTo(-7 * s, -h - 8 * s, 0, -h - 8 * s);
  ctx.quadraticCurveTo(8 * s, -h - 8 * s, 10 * s, -h);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = C.bg;
  ctx.fillRect(-5 * s, -h - 6 * s, 9 * s, 5 * s);
  ctx.fillStyle = C.text;
  ctx.beginPath();
  ctx.arc(-10 * s, 1 * s, 4 * s, 0, Math.PI * 2);
  ctx.arc(10 * s, 1 * s, 4 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawAlbum(ctx: CanvasRenderingContext2D, x: number, y: number, scale = 1): void {
  const s = scale;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = C.border;
  ctx.lineWidth = 1;
  for (let i = 2; i >= 0; i--) {
    ctx.fillRect(-14 * s + i * 2, -18 * s + i * 2, 28 * s, 22 * s);
    ctx.strokeRect(-14 * s + i * 2, -18 * s + i * 2, 28 * s, 22 * s);
  }
  ctx.fillStyle = C.hill;
  ctx.fillRect(-11 * s, -15 * s, 22 * s, 12 * s);
  ctx.fillStyle = C.green;
  ctx.fillRect(-3 * s, -14 * s, 4 * s, 10 * s);
  ctx.fillStyle = C.orange;
  ctx.beginPath();
  ctx.arc(-1 * s, -13 * s, 1.6 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawLighthouse(ctx: CanvasRenderingContext2D, x: number, y: number, scale = 1): void {
  const s = scale;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = C.hillDark;
  ctx.beginPath();
  ctx.moveTo(-6 * s, 0);
  ctx.lineTo(-4 * s, -26 * s);
  ctx.lineTo(4 * s, -26 * s);
  ctx.lineTo(6 * s, 0);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-4.6 * s, -18 * s, 9.2 * s, 4 * s);
  ctx.fillStyle = C.orange;
  ctx.beginPath();
  ctx.arc(0, -29 * s, 3 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawFlag(ctx: CanvasRenderingContext2D, x: number, y: number, scale = 1): void {
  const s = scale;
  ctx.strokeStyle = C.roadEdge;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y - 28 * s);
  ctx.stroke();
  ctx.fillStyle = C.orange;
  ctx.beginPath();
  ctx.moveTo(x, y - 28 * s);
  ctx.lineTo(x + 16 * s, y - 23 * s);
  ctx.lineTo(x, y - 18 * s);
  ctx.closePath();
  ctx.fill();
}

export function drawFog(
  ctx: CanvasRenderingContext2D,
  x0: number,
  x1: number,
  y: number,
  h: number,
  alpha: number
): void {
  if (alpha <= 0) return;
  const grad = ctx.createLinearGradient(x0 - 30, 0, x0 + 20, 0);
  grad.addColorStop(0, 'rgba(221,225,221,0)');
  grad.addColorStop(1, `rgba(221,225,221,${Math.min(alpha, 0.92)})`);
  ctx.fillStyle = grad;
  ctx.fillRect(x0 - 30, y, x0 + 20 - (x0 - 30), h);
  ctx.fillStyle = `rgba(221,225,221,${Math.min(alpha, 0.92)})`;
  ctx.fillRect(x0 + 20, y, x1 - (x0 + 20), h);
}

export function drawMirror(ctx: CanvasRenderingContext2D, x: number, y: number, scale = 1): void {
  const s = scale;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = C.text;
  ctx.beginPath();
  const w = 22 * s;
  const h = 10 * s;
  const r = 4 * s;
  ctx.moveTo(-w / 2 + r, -h / 2);
  ctx.arcTo(w / 2, -h / 2, w / 2, h / 2, r);
  ctx.arcTo(w / 2, h / 2, -w / 2, h / 2, r);
  ctx.arcTo(-w / 2, h / 2, -w / 2, -h / 2, r);
  ctx.arcTo(-w / 2, -h / 2, w / 2, -h / 2, r);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = C.road;
  ctx.fillRect(-w / 2 + 2 * s, -h / 2 + 2 * s, w - 4 * s, h - 4 * s);
  ctx.strokeStyle = C.roadEdge;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-w / 2 + 3 * s, 0);
  ctx.lineTo(w / 2 - 3 * s, 0);
  ctx.stroke();
  ctx.restore();
}

export function sceneLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  muted = false,
  size = 11
): void {
  ctx.fillStyle = muted ? C.muted : C.text;
  ctx.font = `${size}px "Microsoft YaHei", "PingFang SC", sans-serif`;
  ctx.fillText(text, x, y);
}

export function inset(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
): void {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = C.border;
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, w, h);
}

// Trivial component so the assembler can register this shared file safely.
export const SceneKitBadge: React.FC<WidgetProps> = () => null;

export default SceneKitBadge;
