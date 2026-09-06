import { clamp } from '../lib/canvasKit';

export const C = {
  bg: '#f5f8f0',
  env: '#b8c9a7',
  depth: '#76906a',
  route: '#92400e',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#d97706',
  purple: '#7c3aed',
  sky: '#4f7fb5',
  text: '#21324a',
  muted: '#68778f',
  border: '#d7deea',
};

export function fillBg(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, w, h);
}

export function drawBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  color: string
) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y - h, w, h);
  ctx.fillStyle = C.text;
  ctx.font = '13px "Segoe UI", sans-serif';
  ctx.fillText(label, x, y + 16);
}

export function pct(v: number) {
  return clamp(v, 0, 100).toFixed(1) + '%';
}

/** Framework hides canvas until `.is-ready` (see components.css). Call after every draw. */
export function markCanvasReady(canvas: HTMLCanvasElement) {
  if (!canvas.classList.contains('is-ready')) {
    canvas.classList.add('is-ready');
  }
}
