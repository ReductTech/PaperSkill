// 论文专属共享绘图工具：全教程统一的「一叶扁舟顺流而下」场景。
// 只提供纯绘制函数，不包含 React 状态。所有 Canvas 组件复用同一套颜色与形状。

export const COLORS = {
  sky: '#f5f8f0',
  river: '#b8c9a7',
  bank: '#76906a',
  route: '#92400e',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#d97706',
  purple: '#7c3aed',
  ink: '#21324a',
  muted: '#68778f',
  axis: '#d7deea',
};

/** 绘制安静的河流背景（天空 + 河道 + 两岸）。phase 用于轻微波浪动画。 */
export function drawRiver(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  phase = 0
): void {
  ctx.fillStyle = COLORS.sky;
  ctx.fillRect(0, 0, w, h);
  const riverTop = h * 0.36;
  const riverBot = h * 0.84;
  ctx.fillStyle = COLORS.river;
  ctx.fillRect(0, riverTop, w, riverBot - riverTop);
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 3; i += 1) {
    const y = riverTop + 12 + i * 15 + phase;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(w * 0.28, y - 7, w * 0.58, y + 7, w, y);
    ctx.stroke();
  }
  ctx.fillStyle = COLORS.bank;
  ctx.fillRect(0, h * 0.28, w, riverTop - h * 0.28);
  ctx.fillRect(0, riverBot, w, h - riverBot);
}

/** 画一条小船。cx/cy 为船身中心（以像素为单位），scale 相对大小。 */
export function drawBoat(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  scale: number,
  hull = COLORS.blue,
  sail = COLORS.green
): void {
  ctx.fillStyle = hull;
  ctx.beginPath();
  ctx.moveTo(cx - 30 * scale, cy);
  ctx.lineTo(cx + 30 * scale, cy);
  ctx.lineTo(cx + 18 * scale, cy + 13 * scale);
  ctx.lineTo(cx - 18 * scale, cy + 13 * scale);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = COLORS.route;
  ctx.lineWidth = 3 * scale;
  ctx.beginPath();
  ctx.moveTo(cx, cy - 42 * scale);
  ctx.lineTo(cx, cy);
  ctx.stroke();
  ctx.fillStyle = sail;
  ctx.beginPath();
  ctx.moveTo(cx, cy - 42 * scale);
  ctx.lineTo(cx + 21 * scale, cy - 1);
  ctx.lineTo(cx, cy - 1);
  ctx.closePath();
  ctx.fill();
}

/** 画一个码头（目标点）。 */
export function drawDock(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  color = COLORS.green
): void {
  ctx.fillStyle = COLORS.route;
  ctx.fillRect(cx - 7, cy - 30, 14, 32);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy - 34, 5, 0, Math.PI * 2);
  ctx.fill();
}

/** 画一条带箭头的线段，用于漂移场向量。 */
export function arrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  width = 3
): void {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  const hx = 8;
  const hy = 5;
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - ux * hx - uy * hy, y2 - uy * hx + ux * hy);
  ctx.lineTo(x2 - ux * hx + uy * hy, y2 - uy * hx - ux * hy);
  ctx.closePath();
  ctx.fill();
}

/** 统一的 Canvas 文字绘制。 */
export function text(
  ctx: CanvasRenderingContext2D,
  s: string,
  x: number,
  y: number,
  color = COLORS.ink,
  size = 22,
  align: CanvasTextAlign = 'left'
): void {
  ctx.fillStyle = color;
  ctx.font = `${size}px "Segoe UI", "PingFang SC", Arial, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(s, x, y);
}

/** 手写圆角矩形路径（不依赖浏览器 roundRect 支持）。 */
export function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.arcTo(x + w, y, x + w, y + rr, rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.arcTo(x + w, y + h, x + w - rr, y + h, rr);
  ctx.lineTo(x + rr, y + h);
  ctx.arcTo(x, y + h, x, y + h - rr, rr);
  ctx.lineTo(x, y + rr);
  ctx.arcTo(x, y, x + rr, y, rr);
  ctx.closePath();
}
