import { setupCanvas, observeCanvas, clamp, lerp, easeOutCubic, easeInOutQuad } from '../lib/canvasKit';

export const COLORS = {
  bg: '#f5f8f0',
  lightEnv: '#b8c9a7',
  darkEnv: '#76906a',
  route: '#92400e',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#f07e47',
  purple: '#7c3aed',
  textMain: '#21324a',
  textMuted: '#68778f',
  border: '#d7deea',
} as const;

export { setupCanvas, observeCanvas, clamp, lerp, easeOutCubic, easeInOutQuad };

export function drawDrop(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

export function drawPipe(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, w: number = 8) {
  ctx.strokeStyle = COLORS.lightEnv;
  ctx.lineWidth = w;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.strokeStyle = COLORS.darkEnv;
  ctx.lineWidth = w - 4;
  ctx.stroke();
}

export function drawValve(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, open: boolean) {
  ctx.fillStyle = open ? COLORS.green : COLORS.red;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = COLORS.darkEnv;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = COLORS.textMain;
  ctx.font = '10px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(open ? '开' : '关', x, y + 3);
}

export function drawPlant(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, watered: number) {
  const potH = h * 0.35;
  ctx.fillStyle = '#a0522d';
  ctx.fillRect(x, y + h - potH, w, potH);
  ctx.fillStyle = COLORS.darkEnv;
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + h - potH, w / 2, w / 4, 0, 0, Math.PI * 2);
  ctx.fill();
  const stemH = (h - potH) * clamp(watered, 0, 1);
  ctx.strokeStyle = watered > 0.3 ? COLORS.green : COLORS.red;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x + w / 2, y + h - potH);
  ctx.lineTo(x + w / 2, y + h - potH - stemH);
  ctx.stroke();
  if (stemH > 10) {
    ctx.fillStyle = watered > 0.3 ? COLORS.green : '#5a8a4a';
    ctx.beginPath();
    ctx.ellipse(x + w / 2 - 8, y + h - potH - stemH + 5, 8, 5, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + w / 2 + 8, y + h - potH - stemH + 5, 8, 5, 0.3, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawLabel(ctx: CanvasRenderingContext2D, x: number, y: number, text: string, color: string = COLORS.textMain) {
  ctx.fillStyle = color;
  ctx.font = '11px "Segoe UI", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(text, x, y);
}

export function drawFeedbackBox(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, text: string, color: string) {
  ctx.fillStyle = color + '22';
  ctx.fillRect(x, y, w, 24);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, w, 24);
  ctx.fillStyle = color;
  ctx.font = '11px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(text, x + w / 2, y + 15);
}
