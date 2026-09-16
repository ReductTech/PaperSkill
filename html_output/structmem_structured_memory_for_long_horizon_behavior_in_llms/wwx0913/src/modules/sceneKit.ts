// sceneKit.ts — 家庭影像手账主题的统一 Canvas 绘制工具包。
// 由协调者编写并在所有 packet 控件中复用；packet worker 只读、不修改。
// 语义色板与 contract 保持一致：red=失败 / green=成功 / blue=引导与当前状态 /
// orange=学习者控制的高亮 / purple=辅助机制。Canvas 内最多画 2 个 ≤8 字的短标签
// 和 1 个 ≤3 项的图例；其余说明文字全部放在 DOM 中。

export const COL = {
  bg: '#f5f8f0',
  light: '#b8c9a7',
  dark: '#76906a',
  route: '#92400e',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#d97706',
  purple: '#7c3aed',
  ink: '#21324a',
  muted: '#68778f',
  axis: '#d7deea',
  white: '#ffffff',
};

export const FONT = '"Segoe UI", "PingFang SC", "Hiragino Sans GB", sans-serif';

/** 静场背景 + 可选桌面台面。 */
export function clearScene(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  ground = true
): void {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = COL.bg;
  ctx.fillRect(0, 0, w, h);
  if (ground) {
    ctx.fillStyle = COL.light;
    ctx.fillRect(0, h - 26, w, 26);
    ctx.strokeStyle = COL.dark;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, h - 26);
    ctx.lineTo(w, h - 26);
    ctx.stroke();
  }
}

/** 只建立圆角矩形路径（不填充、不描边）。 */
export function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  const rr = Math.max(0, Math.min(r, Math.min(w, h) / 2));
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

export function fillRound(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  color: string
): void {
  roundRect(ctx, x, y, w, h, r);
  ctx.fillStyle = color;
  ctx.fill();
}

/** 旋转的照片卡：这是全教程反复出现的“事件单位”。 */
export function drawPhoto(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  tilt: number,
  edge: string,
  fill: string = COL.white
): void {
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.rotate(tilt);
  ctx.fillStyle = 'rgba(33, 50, 74, 0.10)';
  ctx.fillRect(-w / 2 + 3, -h / 2 + 4, w, h);
  ctx.fillStyle = fill;
  ctx.fillRect(-w / 2, -h / 2, w, h);
  ctx.strokeStyle = edge;
  ctx.lineWidth = 2;
  ctx.strokeRect(-w / 2, -h / 2, w, h);
  // 照片内部的“影像”示意：一块浅色区域
  ctx.fillStyle = 'rgba(184, 201, 167, 0.55)';
  ctx.fillRect(-w / 2 + 8, -h / 2 + 8, w - 16, h - 34);
  ctx.strokeStyle = COL.dark;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-w / 2 + 8, h / 2 - 26);
  ctx.lineTo(w / 2 - 8, h / 2 - 26);
  ctx.stroke();
  ctx.restore();
}

/** 简笔手：全教程唯一的运动主体。 */
export function drawHand(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  angle: number,
  color: string = '#e8c9a8'
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(s, s);
  ctx.fillStyle = color;
  fillRound(ctx, -14, -9, 30, 18, 8, color);
  fillRound(ctx, -2, -32, 12, 26, 6, color);
  fillRound(ctx, -15, -28, 10, 22, 5, color);
  ctx.strokeStyle = 'rgba(33, 50, 74, 0.35)';
  ctx.lineWidth = 1;
  roundRect(ctx, -14, -9, 30, 18, 8);
  ctx.stroke();
  ctx.restore();
}

/** 日期章：时间锚定的视觉标记。 */
export function drawStamp(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color: string,
  filled = false
): void {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  if (filled) {
    ctx.fillStyle = color;
    ctx.fill();
  } else {
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(x, y, Math.max(2, r - 6), 0, Math.PI * 2);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}

/** 相册页 / 注记页：页边用 #92400e，横线表示已写下的条目。 */
export function drawPage(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  edge: string,
  lines: number
): void {
  ctx.save();
  ctx.fillStyle = 'rgba(33, 50, 74, 0.08)';
  ctx.fillRect(x + 3, y + 4, w, h);
  ctx.fillStyle = COL.white;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = edge;
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);
  ctx.strokeStyle = COL.axis;
  ctx.lineWidth = 1;
  const n = Math.max(0, Math.min(lines, Math.floor((h - 18) / 14)));
  for (let i = 0; i < n; i += 1) {
    const ly = y + 18 + i * 14;
    ctx.beginPath();
    ctx.moveTo(x + 10, ly);
    ctx.lineTo(x + w - 10, ly);
    ctx.stroke();
  }
  ctx.restore();
}

/** 小标签 / 贴纸。 */
export function drawTag(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  filled = false
): void {
  roundRect(ctx, x, y, w, h, 6);
  if (filled) {
    ctx.fillStyle = color;
    ctx.fill();
  } else {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

/** 技术视图中的内嵌白框（#d7deea 边框）。 */
export function drawAxisBox(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
): void {
  ctx.save();
  ctx.fillStyle = COL.white;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = COL.axis;
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, w, h);
  ctx.restore();
}

export function drawArrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  head = 8
): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  const a = Math.atan2(y2 - y1, x2 - x1);
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - head * Math.cos(a - Math.PI / 7), y2 - head * Math.sin(a - Math.PI / 7));
  ctx.lineTo(x2 - head * Math.cos(a + Math.PI / 7), y2 - head * Math.sin(a + Math.PI / 7));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** 折线：points 为 Canvas 绝对坐标。 */
export function drawCurve(
  ctx: CanvasRenderingContext2D,
  pts: { x: number; y: number }[],
  color: string,
  width = 3
): void {
  if (pts.length === 0) return;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i += 1) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.stroke();
  ctx.restore();
}

/** 柱状图：values 归一化到 [0, max]，基线在 y + h。 */
export function drawBars(
  ctx: CanvasRenderingContext2D,
  items: { v: number; c: string }[],
  x: number,
  y: number,
  w: number,
  h: number,
  max: number
): void {
  if (items.length === 0) return;
  const gap = 18;
  const bw = (w - gap * (items.length - 1)) / items.length;
  items.forEach((it, i) => {
    const ratio = Math.max(0, Math.min(1, it.v / max));
    const bh = Math.max(2, ratio * h);
    const bx = x + i * (bw + gap);
    ctx.fillStyle = it.c;
    ctx.fillRect(bx, y + h - bh, bw, bh);
  });
}

/** 短标签（调用方负责 ≤8 个字符）。 */
export function label(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color: string = COL.ink,
  align: CanvasTextAlign = 'left',
  size = 20
): void {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = `${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(text, x, y);
  ctx.restore();
}

/** 图例（调用方负责 ≤3 项）。 */
export function legend(
  ctx: CanvasRenderingContext2D,
  items: { c: string; t: string }[],
  x: number,
  y: number
): void {
  ctx.save();
  ctx.font = `16px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  items.forEach((it, i) => {
    const iy = y + i * 22;
    ctx.fillStyle = it.c;
    ctx.fillRect(x, iy - 6, 16, 12);
    ctx.fillStyle = COL.muted;
    ctx.fillText(it.t, x + 24, iy);
  });
  ctx.restore();
}
