export const STORY_COLORS = {
  bg: '#f5f8f0',
  field: '#eef3e9',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#d97706',
  purple: '#7c3aed',
  text: '#21324a',
  muted: '#68778f',
  border: '#d7deea',
  paper: '#ffffff',
};

export function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius = 10,
) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

export function clearStoryCanvas(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = STORY_COLORS.bg;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = 'rgba(184, 201, 167, 0.28)';
  ctx.fillRect(0, height - 34, width, 34);
  ctx.strokeStyle = STORY_COLORS.border;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, height - 34);
  ctx.lineTo(width, height - 34);
  ctx.stroke();
}

export function label(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color = STORY_COLORS.text,
  align: CanvasTextAlign = 'left',
  font = '12px "Segoe UI", sans-serif',
) {
  ctx.fillStyle = color;
  ctx.font = font;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
}

export function pill(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  width: number,
  active = false,
  color = STORY_COLORS.blue,
) {
  ctx.fillStyle = active ? color : STORY_COLORS.paper;
  ctx.strokeStyle = active ? color : STORY_COLORS.border;
  ctx.lineWidth = active ? 2 : 1;
  roundedRect(ctx, x, y, width, 28, 14);
  ctx.fill();
  ctx.stroke();
  label(ctx, text, x + width / 2, y + 14, active ? STORY_COLORS.paper : STORY_COLORS.muted, 'center', '600 11px "Segoe UI", sans-serif');
}

export function arrow(
  ctx: CanvasRenderingContext2D,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  color = STORY_COLORS.blue,
  width = 2,
) {
  const angle = Math.atan2(toY - fromY, toX - fromX);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(toX - 8 * Math.cos(angle - Math.PI / 6), toY - 8 * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(toX - 8 * Math.cos(angle + Math.PI / 6), toY - 8 * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
}

export function seal(ctx: CanvasRenderingContext2D, x: number, y: number, text = '✓') {
  ctx.fillStyle = STORY_COLORS.paper;
  ctx.strokeStyle = STORY_COLORS.green;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  label(ctx, text, x, y + 0.5, STORY_COLORS.green, 'center', '700 10px "Segoe UI", sans-serif');
}
