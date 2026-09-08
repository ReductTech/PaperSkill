import React from 'react';

export const STUDIO = {
  bg: '#f5f8f0',
  wall: '#b8c9a7',
  console: '#76906a',
  cable: '#92400e',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#d97706',
  purple: '#7c3aed',
  text: '#21324a',
  muted: '#68778f',
  line: '#d7deea',
  paper: '#fffdf8',
} as const;

export type Point = { x: number; y: number };

export function clearStudio(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.clearRect(0, 0, w, h);
  const wash = ctx.createLinearGradient(0, 0, 0, h);
  wash.addColorStop(0, STUDIO.bg);
  wash.addColorStop(1, '#edf3e8');
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(118,144,106,.16)';
  ctx.lineWidth = 1;
  for (let x = 12; x < w; x += 28) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
}

export function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r = 10) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

export function drawConsole(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  roundedRect(ctx, x, y, w, h, 12);
  ctx.fillStyle = 'rgba(255,253,248,.9)';
  ctx.fill();
  ctx.strokeStyle = STUDIO.console;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = 'rgba(118,144,106,.12)';
  roundedRect(ctx, x + 7, y + 7, w - 14, Math.min(18, h - 14), 6);
  ctx.fill();
}

export function drawScoreTrack(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, activeIndex = 0, stateColor: string = STUDIO.blue) {
  const gap = 5;
  const n = 4;
  const sw = (w - gap * (n - 1)) / n;
  for (let i = 0; i < n; i += 1) {
    roundedRect(ctx, x + i * (sw + gap), y, sw, 17, 4);
    ctx.fillStyle = i === activeIndex ? stateColor : '#e7ecf2';
    ctx.fill();
    ctx.strokeStyle = i === activeIndex ? stateColor : STUDIO.line;
    ctx.lineWidth = i === activeIndex ? 2.5 : 1;
    ctx.stroke();
    ctx.fillStyle = i === activeIndex ? '#fff' : STUDIO.muted;
    for (let j = 0; j < 3; j += 1) ctx.fillRect(x + i * (sw + gap) + 6 + j * 7, y + 6 + (j % 2) * 3, 4, 2);
  }
}

export function drawMic(ctx: CanvasRenderingContext2D, x: number, y: number, stateColor: string = STUDIO.blue) {
  ctx.save();
  ctx.strokeStyle = stateColor;
  ctx.fillStyle = '#fff';
  ctx.lineWidth = 2.5;
  roundedRect(ctx, x - 8, y - 18, 16, 27, 8);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y + 9);
  ctx.lineTo(x, y + 23);
  ctx.moveTo(x - 10, y + 23);
  ctx.lineTo(x + 10, y + 23);
  ctx.stroke();
  ctx.restore();
}

export function drawFader(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  value: number,
  stateColor: string = STUDIO.orange,
  width = 120,
) {
  const v = Math.max(0, Math.min(1, value));
  ctx.strokeStyle = STUDIO.line;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + width, y);
  ctx.stroke();
  const px = x + width * v;
  roundedRect(ctx, px - 9, y - 13, 18, 26, 5);
  ctx.fillStyle = stateColor;
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.stroke();
}

export function drawMeter(ctx: CanvasRenderingContext2D, x: number, y: number, value: number, stateColor: string = STUDIO.green, h = 68) {
  const v = Math.max(0, Math.min(1, value));
  roundedRect(ctx, x, y, 24, h, 5);
  ctx.fillStyle = '#edf1f5';
  ctx.fill();
  ctx.strokeStyle = STUDIO.line;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  const fillH = Math.max(3, (h - 8) * v);
  roundedRect(ctx, x + 4, y + h - 4 - fillH, 16, fillH, 3);
  ctx.fillStyle = stateColor;
  ctx.fill();
}

export function drawPatchCable(ctx: CanvasRenderingContext2D, from: Point, to: Point, stateColor: string = STUDIO.blue) {
  const bend = Math.max(18, Math.abs(to.x - from.x) * 0.34);
  ctx.strokeStyle = stateColor;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.bezierCurveTo(from.x + bend, from.y, to.x - bend, to.y, to.x, to.y);
  ctx.stroke();
  ctx.fillStyle = '#fff';
  for (const p of [from, to]) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
}

export function drawTargetBand(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h = 26) {
  roundedRect(ctx, x, y, w, h, 6);
  ctx.fillStyle = 'rgba(34,141,92,.14)';
  ctx.fill();
  ctx.strokeStyle = STUDIO.green;
  ctx.lineWidth = 2;
  ctx.stroke();
}

export function drawEngineerHand(ctx: CanvasRenderingContext2D, x: number, y: number, gesture = 'point', stateColor: string = STUDIO.orange) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#f4c7a1';
  ctx.strokeStyle = stateColor;
  ctx.lineWidth = 2;
  roundedRect(ctx, -10, -6, 22, 16, 7);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(9, gesture === 'patch' ? 0 : -2);
  ctx.lineTo(22, gesture === 'patch' ? -8 : -2);
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.restore();
}

export function drawStudioLabel(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, align: CanvasTextAlign = 'left') {
  ctx.save();
  ctx.fillStyle = STUDIO.text;
  ctx.font = '600 13px "Segoe UI", sans-serif';
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
  ctx.restore();
}

export function drawLegend(ctx: CanvasRenderingContext2D, items: Array<{ label: string; color: string }>, x: number, y: number) {
  ctx.save();
  ctx.font = '12px "Segoe UI", sans-serif';
  ctx.textBaseline = 'middle';
  let dx = x;
  for (const item of items) {
    ctx.fillStyle = item.color;
    ctx.beginPath();
    ctx.arc(dx + 4, y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = STUDIO.muted;
    ctx.fillText(item.label, dx + 12, y);
    dx += 20 + ctx.measureText(item.label).width;
  }
  ctx.restore();
}

export const StudioKitCarrier: React.FC = () => null;

export default StudioKitCarrier;
