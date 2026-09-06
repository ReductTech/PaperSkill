import React, { useEffect } from 'react';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

export const C = {
  field: '#f5f8f0',
  desk: '#b8c9a7',
  contour: '#76906a',
  camera: '#92400e',
  current: '#27446e',
  success: '#228d5c',
  failure: '#c43f52',
  control: '#d97706',
  aux: '#7c3aed',
  text: '#21324a',
  muted: '#68778f',
  border: '#d7deea',
  white: '#ffffff',
} as const;

export type LegendItem = { label: string; color: string; dashed?: boolean };

export function clearStudio(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = C.field;
  ctx.fillRect(0, 0, width, height);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
}

export function drawDesk(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  y = Math.round(height * 0.74)
) {
  ctx.fillStyle = C.desk;
  ctx.fillRect(0, y, width, height - y);
  ctx.strokeStyle = C.contour;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, y);
  ctx.lineTo(width, y);
  ctx.stroke();
}

export function drawCamera(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale = 1
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = C.camera;
  ctx.strokeStyle = C.text;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(-42, -25, 84, 50, 10);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = C.field;
  ctx.beginPath();
  ctx.arc(8, 0, 17, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = C.current;
  ctx.beginPath();
  ctx.arc(8, 0, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = C.camera;
  ctx.fillRect(-26, -35, 30, 12);
  ctx.restore();
}

export function drawPhoto(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width = 120,
  height = 82,
  accent: string = C.current
) {
  ctx.save();
  ctx.fillStyle = C.white;
  ctx.strokeStyle = C.contour;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, 6);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#e8eee3';
  ctx.fillRect(x + 8, y + 8, width - 16, height - 24);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(x + width * 0.5, y + height * 0.38, Math.min(width, height) * 0.12, 0, Math.PI * 2);
  ctx.moveTo(x + width * 0.28, y + height * 0.68);
  ctx.quadraticCurveTo(x + width * 0.5, y + height * 0.47, x + width * 0.72, y + height * 0.68);
  ctx.stroke();
  ctx.restore();
}

export function drawFocusTarget(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width = 64,
  height = 64,
  color: string = C.current
) {
  const d = Math.min(width, height) * 0.26;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, y + d); ctx.lineTo(x, y); ctx.lineTo(x + d, y);
  ctx.moveTo(x + width - d, y); ctx.lineTo(x + width, y); ctx.lineTo(x + width, y + d);
  ctx.moveTo(x + width, y + height - d); ctx.lineTo(x + width, y + height); ctx.lineTo(x + width - d, y + height);
  ctx.moveTo(x + d, y + height); ctx.lineTo(x, y + height); ctx.lineTo(x, y + height - d);
  ctx.stroke();
  ctx.restore();
}

export function drawMeter(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius = 28,
  value = 0.5,
  color: string = C.current
) {
  const v = Math.max(0, Math.min(1, value));
  ctx.save();
  ctx.fillStyle = C.white;
  ctx.strokeStyle = C.contour;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y, radius, Math.PI, Math.PI * 2);
  ctx.lineTo(x - radius, y);
  ctx.fill();
  ctx.stroke();
  const angle = Math.PI + v * Math.PI;
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.cos(angle) * radius * 0.78, y + Math.sin(angle) * radius * 0.78);
  ctx.stroke();
  ctx.restore();
}

export function drawGuide(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string = C.current,
  dashed = false
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.setLineDash(dashed ? [7, 6] : []);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

export function drawLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color: string = C.text,
  fontSize = 13,
  align: CanvasTextAlign = 'left'
) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = `600 ${fontSize}px system-ui, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
  ctx.restore();
}

export function drawLegend(
  ctx: CanvasRenderingContext2D,
  items: LegendItem[],
  x: number,
  y: number,
  gap = 130
) {
  items.forEach((item, index) => {
    const left = x + index * gap;
    ctx.save();
    ctx.strokeStyle = item.color;
    ctx.lineWidth = 3;
    ctx.setLineDash(item.dashed ? [7, 5] : []);
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(left + 24, y);
    ctx.stroke();
    ctx.restore();
    drawLabel(ctx, item.label, left + 31, y, C.muted, 12);
  });
}

export function useObservedCanvas(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  width: number,
  height: number,
  draw: (ctx: CanvasRenderingContext2D) => void
) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, width, height);
    } catch {
      return;
    }
    canvas.style.width = '100%';
    canvas.style.height = 'auto';
    canvas.style.aspectRatio = `${width} / ${height}`;
    const render = () => {
      draw(ctx);
      canvas.classList.add('is-ready');
    };
    const disconnect = observeCanvas(canvas, render, () => {});
    return disconnect;
  }, [canvasRef, draw, height, width]);
}

export const StudioKitPlaceholder: React.FC<WidgetProps> = () => null;

export default StudioKitPlaceholder;
