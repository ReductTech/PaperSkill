import React from 'react';
import type { WidgetProps } from './registry';

export type Point = { x: number; y: number };

export const PALETTE = {
  bg: '#f5f8f0',
  light: '#b8c9a7',
  dark: '#76906a',
  route: '#92400e',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#d97706',
  purple: '#7c3aed',
  text: '#21324a',
  muted: '#68778f',
  line: '#d7deea',
} as const;

export function clearSea(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = PALETTE.bg;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(118,144,106,.24)';
  ctx.lineWidth = 1;
  for (let y = 22; y < h; y += 28) {
    ctx.beginPath();
    for (let x = 0; x <= w; x += 16) {
      const yy = y + Math.sin((x + y) * 0.045) * 2;
      if (x === 0) ctx.moveTo(x, yy);
      else ctx.lineTo(x, yy);
    }
    ctx.stroke();
  }
}

export function drawCoast(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = PALETTE.light;
  ctx.beginPath();
  ctx.moveTo(w * 0.72, 0);
  ctx.quadraticCurveTo(w * 0.64, h * 0.34, w * 0.76, h * 0.56);
  ctx.quadraticCurveTo(w * 0.86, h * 0.76, w * 0.72, h);
  ctx.lineTo(w, h);
  ctx.lineTo(w, 0);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = PALETTE.dark;
  ctx.lineWidth = 2;
  ctx.stroke();
}

export function drawRoute(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  color: string = PALETTE.blue,
  width = 2,
  dashed = false,
) {
  if (points.length < 2) return;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.setLineDash(dashed ? [7, 6] : []);
  ctx.beginPath();
  points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  ctx.stroke();
  ctx.restore();
}

export function drawBoat(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string = PALETTE.blue,
  scale = 1,
  heading = 0,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(heading);
  ctx.scale(scale, scale);
  ctx.fillStyle = PALETTE.route;
  ctx.strokeStyle = PALETTE.text;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-13, 5);
  ctx.lineTo(13, 5);
  ctx.lineTo(8, 11);
  ctx.lineTo(-9, 11);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = PALETTE.route;
  ctx.beginPath();
  ctx.moveTo(0, 5);
  ctx.lineTo(0, -17);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(1, -16);
  ctx.lineTo(1, 2);
  ctx.lineTo(12, 2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function drawHarbor(ctx: CanvasRenderingContext2D, x: number, y: number, color: string = PALETTE.green) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y, 4, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

export function drawBuoy(ctx: CanvasRenderingContext2D, x: number, y: number, color: string = PALETTE.orange) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = PALETTE.text;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(x, y, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y - 7);
  ctx.lineTo(x, y - 17);
  ctx.stroke();
  ctx.restore();
}

export function drawCompass(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  angle: number,
  color: string = PALETTE.blue,
) {
  ctx.save();
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = PALETTE.line;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(r - 5, 0);
  ctx.lineTo(-5, -4);
  ctx.lineTo(-5, 4);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function drawChart(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,.78)';
  ctx.strokeStyle = PALETTE.line;
  ctx.lineWidth = 1;
  ctx.fillRect(x, y, w, h);
  ctx.strokeRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(118,144,106,.28)';
  for (let gx = x + 16; gx < x + w; gx += 20) {
    ctx.beginPath(); ctx.moveTo(gx, y); ctx.lineTo(gx, y + h); ctx.stroke();
  }
  for (let gy = y + 16; gy < y + h; gy += 20) {
    ctx.beginPath(); ctx.moveTo(x, gy); ctx.lineTo(x + w, gy); ctx.stroke();
  }
  ctx.restore();
}

export function drawSceneLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color: string = PALETTE.text,
  align: CanvasTextAlign = 'left',
) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = '600 13px "Segoe UI", sans-serif';
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
  ctx.restore();
}

export function drawLegend(
  ctx: CanvasRenderingContext2D,
  items: Array<{ label: string; color: string }>,
  x: number,
  y: number,
) {
  ctx.save();
  ctx.font = '12px "Segoe UI", sans-serif';
  ctx.textBaseline = 'middle';
  let dx = x;
  items.forEach((item) => {
    ctx.fillStyle = item.color;
    ctx.fillRect(dx, y - 4, 9, 9);
    ctx.fillStyle = PALETTE.muted;
    ctx.fillText(item.label, dx + 13, y);
    dx += 21 + ctx.measureText(item.label).width;
  });
  ctx.restore();
}

export const SailingKitWidget: React.FC<WidgetProps> = () => null;

export default SailingKitWidget;
