// Shared drawing kit for the iCaRL tutorial.
// One garden metaphor: pots, soil, vines, leaves, trellis bars and seed labels.
// Semantic colours follow contract.md §5 (red=failure, green=paper method,
// blue=guidance/current state, orange=user emphasis, purple=auxiliary).
import type { WidgetProps } from './registry';

export const C = {
  bg: '#f5f8f0',
  light: '#b8c9a7',
  dark: '#76906a',
  wood: '#92400e',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#f07e47',
  purple: '#7c3aed',
  text: '#21324a',
  muted: '#68778f',
  border: '#d7deea',
  white: '#ffffff',
};

export const W = 1080;
export const H = 280;

export function scene(ctx: CanvasRenderingContext2D): void {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(184,201,167,0.38)';
  ctx.fillRect(0, H - 30, W, 30);
}

export function txt(
  ctx: CanvasRenderingContext2D,
  s: string,
  x: number,
  y: number,
  color: string = C.text,
  size = 20,
  align: CanvasTextAlign = 'left',
  weight = '600'
): void {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(s, x, y);
  ctx.textAlign = 'left';
}

export function rr(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fill?: string,
  stroke?: string,
  lineWidth = 2
): void {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
}

export function line(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  width = 2,
  dash: number[] = []
): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.setLineDash(dash);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

export function arrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  width = 2
): void {
  line(ctx, x1, y1, x2, y2, color, width);
  const a = Math.atan2(y2 - y1, x2 - x1);
  const len = 9;
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - len * Math.cos(a - 0.4), y2 - len * Math.sin(a - 0.4));
  ctx.lineTo(x2 - len * Math.cos(a + 0.4), y2 - len * Math.sin(a + 0.4));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function dot(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  fill: string,
  stroke?: string,
  width = 2
): void {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = width;
    ctx.stroke();
  }
}

export function leaf(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
  angle = 0
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(size * 0.55, -size * 0.55, size, 0);
  ctx.quadraticCurveTo(size * 0.55, size * 0.55, 0, 0);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

export function plant(
  ctx: CanvasRenderingContext2D,
  x: number,
  baseY: number,
  height: number,
  color: string
): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x, baseY);
  ctx.quadraticCurveTo(x - 8, baseY - height * 0.55, x + 4, baseY - height);
  ctx.stroke();
  leaf(ctx, x + 2, baseY - height * 0.5, 22, color, -0.5);
  leaf(ctx, x - 2, baseY - height * 0.72, 20, color, -2.6);
  leaf(ctx, x + 2, baseY - height * 0.9, 16, color, -0.9);
  ctx.restore();
}

export function pot(ctx: CanvasRenderingContext2D, x: number, baseY: number, w = 66, h = 34): void {
  ctx.save();
  ctx.fillStyle = C.wood;
  ctx.globalAlpha = 0.9;
  ctx.beginPath();
  ctx.moveTo(x - w / 2, baseY - h);
  ctx.lineTo(x + w / 2, baseY - h);
  ctx.lineTo(x + w / 2 - 10, baseY);
  ctx.lineTo(x - w / 2 + 10, baseY);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = C.dark;
  ctx.fillRect(x - w / 2, baseY - h - 6, w, 7);
  ctx.restore();
}

/** Legend with at most three entries (contract.md §3). */
export function legend(
  ctx: CanvasRenderingContext2D,
  items: { label: string; color: string }[],
  x: number,
  y: number
): void {
  let cx = x;
  for (const it of items.slice(0, 3)) {
    dot(ctx, cx + 6, y, 6, it.color);
    txt(ctx, it.label, cx + 18, y, C.muted, 15, 'left', '500');
    cx += 22 + it.label.length * 15;
  }
}

/** Convert a pointer event to intrinsic canvas coordinates. */
export function canvasPoint(
  e: { clientX: number; clientY: number },
  canvas: HTMLCanvasElement
): { x: number; y: number } {
  const r = canvas.getBoundingClientRect();
  return {
    x: ((e.clientX - r.left) / r.width) * W,
    y: ((e.clientY - r.top) / r.height) * H,
  };
}

export type { WidgetProps };
