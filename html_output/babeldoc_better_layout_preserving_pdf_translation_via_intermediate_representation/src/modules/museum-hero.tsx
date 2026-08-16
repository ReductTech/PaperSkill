import React, { useEffect, useRef } from 'react';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

export const MUSEUM_COLORS = {
  scene: '#f5f8f0',
  light: '#b8c9a7',
  dark: '#76906a',
  support: '#92400e',
  current: '#27446e',
  success: '#228d5c',
  failure: '#c43f52',
  emphasis: '#d97706',
  auxiliary: '#7c3aed',
  text: '#21324a',
  muted: '#68778f',
  border: '#d7deea',
} as const;

export interface MuseumWallOptions {
  pedestalY?: number;
  wallColor?: string;
  pedestalColor?: string;
}

export interface FrameOptions {
  stroke?: string;
  fill?: string;
  lineWidth?: number;
  radius?: number;
  dashed?: boolean;
}

export interface CaptionOptions {
  fill?: string;
  stroke?: string;
  textColor?: string;
  fontSize?: number;
  lineHeight?: number;
  align?: CanvasTextAlign;
  padding?: number;
  fontWeight?: number | string;
}

export interface LabelOptions {
  color?: string;
  fontSize?: number;
  align?: CanvasTextAlign;
  baseline?: CanvasTextBaseline;
  fontWeight?: number | string;
}

export interface LegendItem {
  label: string;
  color: string;
  dashed?: boolean;
}

export interface LegendOptions {
  fontSize?: number;
  gap?: number;
  columns?: number;
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  const r = Math.max(0, Math.min(radius, width / 2, height / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export function clearMuseumScene(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.save();
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = MUSEUM_COLORS.scene;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

export function drawMuseumWall(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  options: MuseumWallOptions = {}
): void {
  const pedestalY = options.pedestalY ?? h * 0.78;
  ctx.save();
  ctx.fillStyle = options.wallColor ?? MUSEUM_COLORS.scene;
  ctx.fillRect(0, 0, w, pedestalY);
  ctx.fillStyle = options.pedestalColor ?? MUSEUM_COLORS.light;
  ctx.globalAlpha = 0.42;
  ctx.fillRect(0, pedestalY, w, h - pedestalY);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = MUSEUM_COLORS.dark;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, pedestalY + 0.5);
  ctx.lineTo(w, pedestalY + 0.5);
  ctx.stroke();
  ctx.restore();
}

export function drawExhibitFrame(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  options: FrameOptions = {}
): void {
  ctx.save();
  roundedRect(ctx, x, y, width, height, options.radius ?? 12);
  if (options.fill) {
    ctx.fillStyle = options.fill;
    ctx.fill();
  }
  ctx.strokeStyle = options.stroke ?? MUSEUM_COLORS.dark;
  ctx.lineWidth = options.lineWidth ?? 2;
  ctx.setLineDash(options.dashed ? [7, 5] : []);
  ctx.stroke();
  ctx.restore();
}

function wrapLine(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const result: string[] = [];
  let line = '';
  for (const char of text) {
    const candidate = line + char;
    if (line && ctx.measureText(candidate).width > maxWidth) {
      result.push(line);
      line = char;
    } else {
      line = candidate;
    }
  }
  if (line) result.push(line);
  return result.length ? result : [''];
}

export function drawCaptionCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  text: string | string[],
  options: CaptionOptions = {}
): void {
  const padding = options.padding ?? 12;
  const fontSize = options.fontSize ?? 16;
  const lineHeight = options.lineHeight ?? Math.round(fontSize * 1.35);
  const align = options.align ?? 'left';
  const fontWeight = options.fontWeight ?? 600;
  ctx.save();
  roundedRect(ctx, x, y, width, height, 8);
  ctx.fillStyle = options.fill ?? '#ffffff';
  ctx.fill();
  ctx.strokeStyle = options.stroke ?? MUSEUM_COLORS.border;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = options.textColor ?? MUSEUM_COLORS.text;
  ctx.font = `${fontWeight} ${fontSize}px system-ui, "PingFang SC", sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  const sourceLines = Array.isArray(text) ? text : [text];
  const lines = sourceLines.flatMap((line) => wrapLine(ctx, line, width - padding * 2));
  const visibleLines = lines.slice(0, Math.max(1, Math.floor((height - padding * 2) / lineHeight)));
  const blockHeight = (visibleLines.length - 1) * lineHeight;
  const startY = y + height / 2 - blockHeight / 2;
  const textX = align === 'center' ? x + width / 2 : align === 'right' ? x + width - padding : x + padding;
  visibleLines.forEach((line, index) => ctx.fillText(line, textX, startY + index * lineHeight));
  ctx.restore();
}

export function drawTargetSeal(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  label = '通过',
  radius = 18
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.12);
  ctx.fillStyle = 'rgba(34,141,92,0.10)';
  ctx.strokeStyle = MUSEUM_COLORS.success;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = MUSEUM_COLORS.success;
  ctx.font = `700 ${Math.max(9, radius * 0.62)}px system-ui, "PingFang SC", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, 0, 0);
  ctx.restore();
}

export function drawMuseumLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  options: LabelOptions = {}
): void {
  ctx.save();
  ctx.fillStyle = options.color ?? MUSEUM_COLORS.text;
  ctx.font = `${options.fontWeight ?? 650} ${options.fontSize ?? 12}px system-ui, "PingFang SC", sans-serif`;
  ctx.textAlign = options.align ?? 'left';
  ctx.textBaseline = options.baseline ?? 'alphabetic';
  ctx.fillText(text, x, y);
  ctx.restore();
}

export function drawLegend(
  ctx: CanvasRenderingContext2D,
  items: LegendItem[],
  x: number,
  y: number,
  options: LegendOptions = {}
): void {
  const fontSize = options.fontSize ?? 12;
  const gap = options.gap ?? 18;
  const columns = Math.max(1, options.columns ?? items.length);
  ctx.save();
  ctx.font = `600 ${fontSize}px system-ui, "PingFang SC", sans-serif`;
  ctx.textBaseline = 'middle';
  items.forEach((item, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const itemX = x + column * 132;
    const itemY = y + row * gap;
    ctx.strokeStyle = item.color;
    ctx.lineWidth = 3;
    ctx.setLineDash(item.dashed ? [5, 4] : []);
    ctx.beginPath();
    ctx.moveTo(itemX, itemY);
    ctx.lineTo(itemX + 22, itemY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = MUSEUM_COLORS.muted;
    ctx.fillText(item.label, itemX + 29, itemY);
  });
  ctx.restore();
}

const HERO_W = 640;
const HERO_H = 360;
const HERO_CAPTION = '中间表示把文字内容和页面约束分开保存。';

function drawHero(ctx: CanvasRenderingContext2D, mode: 'old' | 'new') {
  clearMuseumScene(ctx, HERO_W, HERO_H);
  drawMuseumWall(ctx, HERO_W, HERO_H, { pedestalY: 296 });

  const frame = { x: 158, y: 100, width: 324, height: 162 };
  drawExhibitFrame(ctx, frame.x, frame.y, frame.width, frame.height, {
    stroke: MUSEUM_COLORS.dark,
    fill: 'rgba(255,255,255,0.32)',
    lineWidth: 3,
  });
  drawMuseumLabel(ctx, '译文相同', 42, 46, { color: MUSEUM_COLORS.emphasis, fontSize: 13 });
  drawMuseumLabel(ctx, '固定展框', frame.x + frame.width / 2, 83, {
    color: MUSEUM_COLORS.dark,
    fontSize: 13,
    align: 'center',
  });

  if (mode === 'old') {
    ctx.save();
    ctx.strokeStyle = MUSEUM_COLORS.failure;
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.moveTo(70, 170);
    ctx.lineTo(292, 170);
    ctx.stroke();
    ctx.restore();
    drawCaptionCard(ctx, 302, 142, 330, 92, HERO_CAPTION, {
      stroke: MUSEUM_COLORS.failure,
      textColor: MUSEUM_COLORS.text,
      fontSize: 17,
      lineHeight: 24,
    });
    ctx.save();
    ctx.fillStyle = 'rgba(196,63,82,0.13)';
    ctx.fillRect(frame.x + frame.width, 132, HERO_W - frame.x - frame.width, 112);
    ctx.restore();
    drawMuseumLabel(ctx, '约束已断', 70, 193, { color: MUSEUM_COLORS.failure, fontSize: 13 });
    drawLegend(ctx, [{ label: '丢失约束', color: MUSEUM_COLORS.failure, dashed: true }], 210, 326);
  } else {
    ctx.save();
    ctx.strokeStyle = MUSEUM_COLORS.success;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(70, 170);
    ctx.lineTo(194, 170);
    ctx.stroke();
    ctx.restore();
    drawCaptionCard(ctx, 194, 132, 252, 112, HERO_CAPTION, {
      stroke: MUSEUM_COLORS.success,
      textColor: MUSEUM_COLORS.text,
      fontSize: 15,
      lineHeight: 22,
    });
    drawMuseumLabel(ctx, '派生局部缩放', 320, 273, {
      color: MUSEUM_COLORS.current,
      fontSize: 12,
      align: 'center',
    });
    drawTargetSeal(ctx, 462, 236, '合框', 20);
    drawLegend(ctx, [{ label: '保留约束', color: MUSEUM_COLORS.success }], 210, 326);
  }
}

export const MuseumHero: React.FC<WidgetProps> = ({ moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mode: 'old' | 'new' = moduleId === 'new' ? 'new' : 'old';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, HERO_W, HERO_H);
    } catch {
      return;
    }
    canvas.style.width = '100%';
    canvas.style.height = 'auto';
    const render = () => {
      drawHero(ctx, mode);
      canvas.classList.add('is-ready');
    };
    const disconnect = observeCanvas(canvas, render, () => undefined);
    return disconnect;
  }, [mode]);

  const ariaLabel =
    mode === 'old'
      ? '正确译文失去页面约束后溢出固定展框'
      : 'IR 保留页面约束后，译文经局部排版落回固定展框';

  return <canvas ref={canvasRef} width={HERO_W} height={HERO_H} aria-label={ariaLabel} role="img" />;
};

export default MuseumHero;
