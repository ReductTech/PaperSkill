import React from 'react';
import type { WidgetProps } from './registry';

export const COLORS = {
  bg: '#f5f8f0',
  env: '#b8c9a7',
  envDark: '#76906a',
  route: '#92400e',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#f07e47',
  purple: '#7c3aed',
  ink: '#21324a',
  muted: '#68778f',
  line: '#d7deea',
};

export function clearScene(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, w, h);
}

export function drawPaperSheet(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = COLORS.line;
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, w, h);
  ctx.strokeStyle = '#e8efe3';
  for (let yy = y + 14; yy < y + h; yy += 14) {
    ctx.beginPath();
    ctx.moveTo(x + 6, yy);
    ctx.lineTo(x + w - 6, yy);
    ctx.stroke();
  }
}

export function drawPen(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, color: string): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = '#7b8794';
  ctx.fillRect(-44, -3, 44, 6);
  ctx.fillStyle = '#33404d';
  ctx.fillRect(-48, -3.5, 10, 7);
  ctx.beginPath();
  ctx.moveTo(-48, -3.5);
  ctx.lineTo(-56, 0);
  ctx.lineTo(-48, 3.5);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

export function drawMagnifier(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + r * 0.7, y + r * 0.7);
  ctx.lineTo(x + r * 1.5, y + r * 1.5);
  ctx.stroke();
  ctx.fillStyle = 'rgba(39,68,110,0.10)';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

export function drawStamp(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, label: string): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  if (!label) return;
  const family = '"PingFang SC", sans-serif';
  const maxW = r * 1.6;
  let size = r * 0.9;
  ctx.font = 'bold ' + size + 'px ' + family;
  const w = ctx.measureText(label).width;
  if (w > maxW) {
    size = Math.max(7, size * (maxW / w));
    ctx.font = 'bold ' + size + 'px ' + family;
  }
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x, y + 1);
  ctx.textAlign = 'start';
  ctx.textBaseline = 'alphabetic';
}

// A verdict badge grows with its own text, so a longer Simplified-Chinese label
// can never spill white glyphs onto the light canvas background. The round stamp
// above is only legible while the label still fits inside the circle.
export function drawVerdictBadge(
  ctx: CanvasRenderingContext2D,
  right: number,
  y: number,
  color: string,
  label: string,
  size: number = 22,
  padX: number = 16,
  padY: number = 9
): void {
  const family = '"PingFang SC", sans-serif';
  ctx.font = 'bold ' + size + 'px ' + family;
  const w = ctx.measureText(label).width + padX * 2;
  const h = size + padY * 2;
  const r = h / 2;
  const left = right - w;
  const top = y - h / 2;
  const bottom = y + h / 2;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(left + r, top);
  ctx.lineTo(right - r, top);
  ctx.quadraticCurveTo(right, top, right, top + r);
  ctx.lineTo(right, bottom - r);
  ctx.quadraticCurveTo(right, bottom, right - r, bottom);
  ctx.lineTo(left + r, bottom);
  ctx.quadraticCurveTo(left, bottom, left, bottom - r);
  ctx.lineTo(left, top + r);
  ctx.quadraticCurveTo(left, top, left + r, top);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold ' + size + 'px ' + family;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, left + w / 2, y + 1);
  ctx.textAlign = 'start';
  ctx.textBaseline = 'alphabetic';
}

export function drawBar(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, p: number, color: string): void {
  const v = Math.max(0, Math.min(1, p));
  ctx.fillStyle = '#edf1ea';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w * v, h);
}

export function drawRuler(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, color: string): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
  ctx.fillStyle = color;
  for (let i = 0; i <= 5; i++) {
    const t = i / 5;
    const x = x0 + (x1 - x0) * t;
    const y = y0 + (y1 - y0) * t;
    ctx.fillRect(x - 1, y - 4, 2, 8);
  }
}

export function drawArrow(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, color: string): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
  const a = Math.atan2(y1 - y0, x1 - x0);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x1 - 10 * Math.cos(a - 0.4), y1 - 10 * Math.sin(a - 0.4));
  ctx.lineTo(x1 - 10 * Math.cos(a + 0.4), y1 - 10 * Math.sin(a + 0.4));
  ctx.closePath();
  ctx.fill();
}

export function drawLabel(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string, size: number = 16): void {
  ctx.fillStyle = color;
  ctx.font = size + 'px "PingFang SC", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(text, x, y);
}

export const PaperKit: React.FC<WidgetProps> = () => null;
