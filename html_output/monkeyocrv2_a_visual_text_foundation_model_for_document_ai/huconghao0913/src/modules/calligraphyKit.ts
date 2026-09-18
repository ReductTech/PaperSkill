// Shared calligraphy-theme Canvas drawing kit for MonkeyOCRv2 tutorial.
// All widgets reuse these helpers to keep visual consistency.
import { clamp } from '../lib/canvasKit';

export const COLORS = {
  bg: '#f9f9f7',
  paper: '#faf6ec',
  grid: '#e8dcc8',
  ink: '#2d2d2a',
  inkLight: '#6b7280',
  brush: '#92400e',
  blue: '#4a5568',
  green: '#5a8a6e',
  red: '#b85c5c',
  orange: '#c26a4e',
  purple: '#7c6a9e',
  border: '#e5e7eb',
};

export function clearScene(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, w, h);
}

// Rice paper with 米字格 guide
export function drawPaper(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.fillStyle = COLORS.paper;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = COLORS.grid;
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, w, h);
  // 米字格 diagonal guides
  ctx.beginPath();
  ctx.moveTo(x, y); ctx.lineTo(x + w, y + h);
  ctx.moveTo(x + w, y); ctx.lineTo(x, y + h);
  ctx.moveTo(x + w / 2, y); ctx.lineTo(x + w / 2, y + h);
  ctx.moveTo(x, y + h / 2); ctx.lineTo(x + w, y + h / 2);
  ctx.stroke();
}

// Brush with ink drop at position
export function drawBrush(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, size: number = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  // handle
  ctx.fillStyle = COLORS.brush;
  ctx.fillRect(-2 * size, -18 * size, 4 * size, 22 * size);
  // ferrule
  ctx.fillStyle = '#888';
  ctx.fillRect(-3 * size, 4 * size, 6 * size, 4 * size);
  // bristles
  ctx.fillStyle = COLORS.ink;
  ctx.beginPath();
  ctx.moveTo(-3 * size, 8 * size);
  ctx.quadraticCurveTo(0, 20 * size, 3 * size, 8 * size);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// Ink stroke (a smooth thick line)
export function drawInkStroke(ctx: CanvasRenderingContext2D, pts: { x: number; y: number }[], width: number, color: string = COLORS.ink, alpha: number = 1) {
  if (pts.length < 2) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1];
    const cur = pts[i];
    const mx = (prev.x + cur.x) / 2;
    const my = (prev.y + cur.y) / 2;
    ctx.quadraticCurveTo(prev.x, prev.y, mx, my);
  }
  ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
  ctx.stroke();
  ctx.restore();
}

// Template character outline (faint guide)
export function drawTemplateChar(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.save();
  ctx.strokeStyle = COLORS.grid;
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 4]);
  // A simple "永" character-like stroke guide
  const cx = x + size / 2;
  const cy = y + size / 2;
  // top dot
  ctx.beginPath();
  ctx.arc(cx, cy - size * 0.3, size * 0.06, 0, Math.PI * 2);
  ctx.stroke();
  // horizontal
  ctx.beginPath();
  ctx.moveTo(cx - size * 0.3, cy - size * 0.1);
  ctx.lineTo(cx + size * 0.3, cy - size * 0.1);
  ctx.stroke();
  // vertical hook
  ctx.beginPath();
  ctx.moveTo(cx, cy - size * 0.1);
  ctx.lineTo(cx, cy + size * 0.3);
  ctx.stroke();
  // left-falling
  ctx.beginPath();
  ctx.moveTo(cx, cy + size * 0.05);
  ctx.lineTo(cx - size * 0.25, cy + size * 0.3);
  ctx.stroke();
  // right-falling
  ctx.beginPath();
  ctx.moveTo(cx, cy + size * 0.05);
  ctx.lineTo(cx + size * 0.25, cy + size * 0.3);
  ctx.stroke();
  ctx.restore();
}

export function drawLegend(ctx: CanvasRenderingContext2D, x: number, y: number, items: { color: string; label: string }[]) {
  ctx.save();
  ctx.font = '13px "Segoe UI", sans-serif';
  items.forEach((it, i) => {
    const ly = y + i * 18;
    ctx.fillStyle = it.color;
    ctx.fillRect(x, ly - 10, 12, 12);
    ctx.fillStyle = COLORS.inkLight;
    ctx.fillText(it.label, x + 18, ly);
  });
  ctx.restore();
}

export function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string = COLORS.ink) {
  ctx.save();
  ctx.font = 'bold 14px "Segoe UI", sans-serif';
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  ctx.restore();
}

// Simple bar chart
export function drawBar(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, value: number, max: number, color: string) {
  const bh = clamp(value / max, 0, 1) * h;
  ctx.fillStyle = color;
  ctx.fillRect(x, y + h - bh, w, bh);
  ctx.strokeStyle = COLORS.border;
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, w, h);
}

/**
 * Draw text on canvas with `_subscript` rendered as actual subscripts.
 * Example: "L_pretrain = L_text + 1.0 × L_rec"
 * Uses serif font by default for formula-like text.
 */
export function drawSubText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  baseSize = 16,
  color = COLORS.ink,
  fontFamily = 'serif'
) {
  ctx.save();
  ctx.fillStyle = color;
  let cx = x;
  const parts = text.split(/(_[a-zA-Z]+)/g);
  parts.forEach((part) => {
    if (part.startsWith('_')) {
      const sub = part.slice(1);
      ctx.font = `${Math.floor(baseSize * 0.62)}px ${fontFamily}`;
      ctx.fillText(sub, cx, y + baseSize * 0.32);
      cx += ctx.measureText(sub).width;
    } else {
      ctx.font = `${baseSize}px ${fontFamily}`;
      ctx.fillText(part, cx, y);
      cx += ctx.measureText(part).width;
    }
  });
  ctx.restore();
}
