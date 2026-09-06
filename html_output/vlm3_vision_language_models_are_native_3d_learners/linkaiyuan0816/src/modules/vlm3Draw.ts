import { clamp } from '../lib/canvasKit';

export const C = {
  quiet: '#f5f8f0',
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
  border: '#d7deea',
};

export function drawSceneBg(ctx: CanvasRenderingContext2D, W: number, H: number) {
  ctx.fillStyle = C.quiet;
  ctx.fillRect(0, 0, W, H);
}

/** 底部说明：浅色通栏 + 居中文字（替代旧深绿色条带上的错位 label） */
export function drawCaption(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  text: string,
  color: string = C.text,
  size = 13,
) {
  const barH = 34;
  const y = H - barH - 6;
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = C.border;
  ctx.lineWidth = 1.5;
  ctx.fillRect(12, y, W - 24, barH);
  ctx.strokeRect(12, y, W - 24, barH);
  ctx.fillStyle = color;
  ctx.font = size + 'px "Segoe UI", "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, W / 2, y + barH / 2);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

/** 双列说明（左右各一句，仍居中于各自半区） */
export function drawCaptionPair(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  left: string,
  right: string,
  leftColor: string = C.text,
  rightColor: string = C.text,
  size = 12,
) {
  const barH = 34;
  const y = H - barH - 6;
  const gap = 8;
  const half = (W - 24 - gap) / 2;
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = C.border;
  ctx.lineWidth = 1.5;
  ctx.fillRect(12, y, half, barH);
  ctx.strokeRect(12, y, half, barH);
  ctx.fillRect(12 + half + gap, y, half, barH);
  ctx.strokeRect(12 + half + gap, y, half, barH);
  ctx.font = size + 'px "Segoe UI", "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = leftColor;
  ctx.fillText(left, 12 + half / 2, y + barH / 2);
  ctx.fillStyle = rightColor;
  ctx.fillText(right, 12 + half + gap + half / 2, y + barH / 2);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

export function drawWindow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  stroke = C.route
) {
  ctx.fillStyle = '#e8eef5';
  ctx.fillRect(x, y, w, h);
  // soft street
  ctx.fillStyle = C.light;
  ctx.fillRect(x + 8, y + h * 0.55, w - 16, h * 0.35);
  ctx.fillStyle = C.dark;
  ctx.fillRect(x + w * 0.2, y + h * 0.35, w * 0.18, h * 0.35);
  ctx.fillRect(x + w * 0.55, y + h * 0.28, w * 0.22, h * 0.42);
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 3;
  ctx.strokeRect(x, y, w, h);
  ctx.beginPath();
  ctx.moveTo(x + w / 2, y);
  ctx.lineTo(x + w / 2, y + h);
  ctx.moveTo(x, y + h / 2);
  ctx.lineTo(x + w, y + h / 2);
  ctx.stroke();
}

export function drawGridCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color = C.blue
) {
  ctx.fillStyle = '#fffef8';
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.fillRect(x, y, w, h);
  ctx.strokeRect(x, y, w, h);
  ctx.strokeStyle = C.border;
  ctx.lineWidth = 1;
  for (let i = 1; i < 4; i++) {
    const gx = x + (w * i) / 4;
    const gy = y + (h * i) / 4;
    ctx.beginPath();
    ctx.moveTo(gx, y);
    ctx.lineTo(gx, y + h);
    ctx.moveTo(x, gy);
    ctx.lineTo(x + w, gy);
    ctx.stroke();
  }
}

export function drawDot(ctx: CanvasRenderingContext2D, x: number, y: number, r = 5, color = C.orange) {
  ctx.beginPath();
  ctx.fillStyle = color;
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

export function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color = C.text, size = 13) {
  ctx.fillStyle = color;
  ctx.font = size + 'px "Segoe UI", "Microsoft YaHei", sans-serif';
  ctx.fillText(text, x, y);
}

export function drawBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  t: number,
  color: string
) {
  ctx.fillStyle = C.border;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w * clamp(t, 0, 1), h);
}
