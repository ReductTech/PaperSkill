// 水彩调色绘制工具包 —— 全教程共用的 Canvas 绘图基元。
// 语义色与 contract 保持一致：蓝=引导/当前状态，绿=成功/本文方法，
// 红=失败/旧方法，橙=用户可控的强调，紫=辅助机制。
// 本文件只在 src/modules/* 内使用，供类比动画与交互模块共用。

export const C = {
  bg: '#f5f8f0',
  light: '#b8c9a7',
  dark: '#76906a',
  route: '#92400e',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#f07e47',
  purple: '#7c3aed',
  ink: '#21324a',
  muted: '#68778f',
  border: '#d7deea',
  paper: '#ffffff',
  paperEdge: '#e3e9dc',
};

export type Ctx = CanvasRenderingContext2D;

export function rr(ctx: Ctx, x: number, y: number, w: number, h: number, r: number): void {
  const k = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + k, y);
  ctx.lineTo(x + w - k, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + k);
  ctx.lineTo(x + w, y + h - k);
  ctx.quadraticCurveTo(x + w, y + h, x + w - k, y + h);
  ctx.lineTo(x + k, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - k);
  ctx.lineTo(x, y + k);
  ctx.quadraticCurveTo(x, y, x + k, y);
  ctx.closePath();
}

export function fillRR(ctx: Ctx, x: number, y: number, w: number, h: number, r: number, fill: string): void {
  rr(ctx, x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
}

export function strokeRR(
  ctx: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  stroke: string,
  lw = 1.5
): void {
  rr(ctx, x, y, w, h, r);
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lw;
  ctx.stroke();
}

/** 清空并铺一层安静的画布底色。 */
export function clear(ctx: Ctx, W: number, H: number): void {
  ctx.clearRect(0, 0, W, H);
  fillRR(ctx, 0, 0, W, H, 0, C.bg);
}

/** Canvas 内的短标签（最多 2 个、每个不超过 8 个汉字）。 */
export function label(
  ctx: Ctx,
  text: string,
  x: number,
  y: number,
  color = C.ink,
  size = 13,
  align: CanvasTextAlign = 'left'
): void {
  ctx.fillStyle = color;
  ctx.font = `${size}px "Segoe UI", "PingFang SC", sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
}

/** 画纸底板。 */
export function paper(ctx: Ctx, x: number, y: number, w: number, h: number): void {
  fillRR(ctx, x, y, w, h, 6, C.paper);
  strokeRR(ctx, x, y, w, h, 6, C.paperEdge, 1.5);
}

/** 一格色块。 */
export function swatch(
  ctx: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  alpha = 1
): void {
  ctx.globalAlpha = alpha;
  fillRR(ctx, x, y, w, h, 5, color);
  ctx.globalAlpha = 1;
}

/** 调色盘的一格圆形颜料井。 */
export function well(ctx: Ctx, cx: number, cy: number, r: number, color: string, alpha = 1): void {
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = C.border;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

/** 一支水彩笔（全教程唯一的移动主角）。angle 为弧度，0 表示笔尖朝下。 */
export function brush(ctx: Ctx, x: number, y: number, s: number, angle: number, ink = C.route): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(s, s);
  // 笔杆
  fillRR(ctx, -5, -74, 10, 52, 5, ink);
  // 金属箍
  fillRR(ctx, -6, -24, 12, 12, 3, C.muted);
  // 笔头
  ctx.beginPath();
  ctx.moveTo(-6, -12);
  ctx.lineTo(6, -12);
  ctx.lineTo(2, 6);
  ctx.lineTo(-2, 6);
  ctx.closePath();
  ctx.fillStyle = C.dark;
  ctx.fill();
  ctx.restore();
}

/** 一管颜料。 */
export function tube(ctx: Ctx, x: number, y: number, w: number, h: number, color: string, cap = true): void {
  fillRR(ctx, x, y, w, h, 4, color);
  strokeRR(ctx, x, y, w, h, 4, 'rgba(0,0,0,0.12)', 1);
  if (cap) fillRR(ctx, x + w / 2 - 4, y - 5, 8, 6, 2, C.muted);
}

/** 一张配方卡 / 色卡。 */
export function card(ctx: Ctx, x: number, y: number, w: number, h: number, accent: string, lines = 2): void {
  fillRR(ctx, x, y, w, h, 4, C.paper);
  strokeRR(ctx, x, y, w, h, 4, accent, 2);
  for (let i = 0; i < lines; i += 1) {
    ctx.fillStyle = i === 0 ? accent : C.border;
    ctx.fillRect(x + 7, y + 9 + i * 9, w - 14, 3);
  }
}

/** 一条平滑曲线连接两个点（用于图文对接、色带等）。 */
export function arcLink(
  ctx: Ctx,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  lw = 2.5,
  dash: number[] = []
): void {
  const mx = (x1 + x2) / 2;
  const my = Math.min(y1, y2) - Math.abs(x2 - x1) * 0.28 - 12;
  ctx.save();
  ctx.setLineDash(dash);
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.quadraticCurveTo(mx, my, x2, y2);
  ctx.stroke();
  ctx.restore();
}

/** 一条水平进度轨道 + 已完成部分。 */
export function track(ctx: Ctx, x: number, y: number, w: number, h: number, p: number, color: string): void {
  fillRR(ctx, x, y, w, h, h / 2, C.border);
  const pw = Math.max(2, w * Math.max(0, Math.min(1, p)));
  fillRR(ctx, x, y, pw, h, h / 2, color);
}

/** 竖直柱状图：values 已归一化到 0..1。 */
export function bars(
  ctx: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  values: number[],
  colorAt: (i: number, v: number) => string,
  gap = 10
): void {
  const n = values.length;
  if (n === 0) return;
  const bw = (w - gap * (n - 1)) / n;
  for (let i = 0; i < n; i += 1) {
    const v = Math.max(0, Math.min(1, values[i]));
    const bh = Math.max(3, v * h);
    fillRR(ctx, x + i * (bw + gap), y + h - bh, bw, bh, 3, colorAt(i, v));
  }
}

/** 折线。pts 为 [x,y] 数组。 */
export function polyline(ctx: Ctx, pts: number[][], color: string, lw = 2.5, dash: number[] = []): void {
  if (pts.length === 0) return;
  ctx.save();
  ctx.setLineDash(dash);
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i += 1) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.stroke();
  ctx.restore();
}

/** 实心圆点。 */
export function dot(ctx: Ctx, x: number, y: number, r: number, color: string): void {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

/** 冻结标记（雪花线段）。 */
export function frozenMark(ctx: Ctx, x: number, y: number, r: number, color = '#5b84c4'): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.6;
  for (let i = 0; i < 3; i += 1) {
    const a = (Math.PI / 3) * i;
    ctx.beginPath();
    ctx.moveTo(x - Math.cos(a) * r, y - Math.sin(a) * r);
    ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    ctx.stroke();
  }
}

/** 底部小图例（最多 3 项）。 */
export function legend(ctx: Ctx, items: Array<{ color: string; text: string }>, x: number, y: number): void {
  let cx = x;
  ctx.font = '12px "Segoe UI", "PingFang SC", sans-serif';
  ctx.textBaseline = 'middle';
  for (const it of items.slice(0, 3)) {
    dot(ctx, cx + 4, y, 4, it.color);
    ctx.fillStyle = C.muted;
    ctx.textAlign = 'left';
    ctx.fillText(it.text, cx + 12, y);
    cx += 16 + ctx.measureText(it.text).width + 16;
  }
}

/** 带箭头的直线段。 */
export function arrow(ctx: Ctx, x1: number, y1: number, x2: number, y2: number, color: string, lw = 2): void {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lw;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  const a = Math.atan2(y2 - y1, x2 - x1);
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - Math.cos(a - 0.4) * 9, y2 - Math.sin(a - 0.4) * 9);
  ctx.lineTo(x2 - Math.cos(a + 0.4) * 9, y2 - Math.sin(a + 0.4) * 9);
  ctx.closePath();
  ctx.fill();
}

/** 简易坐标轴（技术内嵌用）。 */
export function axis(ctx: Ctx, x: number, y: number, w: number, h: number, color = C.border): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y - h);
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y);
  ctx.stroke();
}