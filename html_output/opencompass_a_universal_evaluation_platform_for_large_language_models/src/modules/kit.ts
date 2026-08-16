// Shared Canvas drawing kit for the OpenCompass "exam grading" theme.
// Reused by the Hero, all analogy cards, and life-metaphor body modules so the
// whole tutorial reads as one coherent scene. Semantic colors follow contract §5:
// red = failure/old, green = success/paper method, blue = guidance/current,
// orange = emphasis, purple = auxiliary.

export const C = {
  bg: '#fdf8ec', // warm exam-paper scene field
  light: '#b8c9a7',
  dark: '#76906a',
  support: '#92400e',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#d97706',
  purple: '#7c3aed',
  ink: '#21324a',
  muted: '#68778f',
  axis: '#d7deea',
};

const FONT = '"Segoe UI", "PingFang SC", Arial, sans-serif';

export function clear(ctx: CanvasRenderingContext2D, w: number, h: number, bg: string = C.bg): void {
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
}

export function rr(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

export function label(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size = 13,
  color = C.ink,
  align: CanvasTextAlign = 'left',
  weight = 400
): void {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
}

// A horizontal "score scale" / ruler: the recurring rubric motif.
export function ruler(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  ticks: number,
  color: string = C.blue,
  tickColor: string = C.ink
): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y);
  ctx.stroke();
  const step = w / ticks;
  ctx.strokeStyle = tickColor;
  ctx.lineWidth = 1.5;
  for (let i = 0; i <= ticks; i++) {
    const h = i % 5 === 0 ? 12 : 6;
    ctx.beginPath();
    ctx.moveTo(x + i * step, y - h);
    ctx.lineTo(x + i * step, y + h);
    ctx.stroke();
  }
}

// An answer sheet (exam paper) rectangle with a few text lines.
export function sheet(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string = '#fff',
  lines = 4
): void {
  ctx.fillStyle = color;
  rr(ctx, x, y, w, h, 4);
  ctx.fill();
  ctx.strokeStyle = C.axis;
  ctx.lineWidth = 1;
  rr(ctx, x, y, w, h, 4);
  ctx.stroke();
  ctx.strokeStyle = '#c9d4e4';
  const gap = (h - 16) / Math.max(1, lines - 1);
  for (let i = 0; i < lines; i++) {
    ctx.beginPath();
    ctx.moveTo(x + 8, y + 10 + i * gap);
    ctx.lineTo(x + w - 8, y + 10 + i * gap);
    ctx.stroke();
  }
}

// A red grading pen (the recurring protagonist object).
export function pen(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string = C.red,
  angle = 0
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = color;
  rr(ctx, -2, -14, 4, 20, 2);
  ctx.fill();
  ctx.fillStyle = '#e8c9a0';
  ctx.beginPath();
  ctx.moveTo(-2, -14);
  ctx.lineTo(0, -20);
  ctx.lineTo(2, -14);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}
