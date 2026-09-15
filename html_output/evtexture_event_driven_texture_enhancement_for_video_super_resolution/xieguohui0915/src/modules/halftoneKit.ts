// 制版台绘景工具（本教程唯一的共享绘图套件）
//
// 主题：制版台上的网点（halftone screening at the light table）。
// 本文件由协调者一次性编写，所有 widget 通过
//   import { clearScene, drawPrint, ... } from './halftoneKit';
// 复用同一套图形词汇，保证全站 26 块画布是同一个世界。
//
// 注意：本文件不是 widget，不注册进 registry.tsx。
// 事件极性配色（--ev-on 红 / --ev-off 蓝）是事件视觉领域的显示惯例，
// 与页面状态语义（失败红 / 成功绿 / 引导蓝）相互独立；凡绘制事件点，
// 必须使用 PAPER.evOn / PAPER.evOff，并画出「变亮 / 变暗」两项图例。

import { lerpColor } from '../lib/canvasKit';

export const PAPER = {
  bg: '#f5f8f0',
  table: '#b8c9a7',
  tableShadow: '#76906a',
  print: '#fffdf6',
  printEdge: '#d7deea',
  screenLine: '#68778f',
  ink: '#21324a',
  muted: '#68778f',
  axis: '#d7deea',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#f07e47',
  purple: '#7c3aed',
  evOn: '#c43f52',
  evOff: '#27446e',
} as const;

const FONT = '"Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';

// ---------------------------------------------------------------- 场景底

/** 安静底色 + 制版台台面。所有画布的第一层。 */
export function clearScene(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = PAPER.bg;
  ctx.fillRect(0, 0, w, h);

  // 制版台：下三分之一的一条暖绿台面 + 轮廓线
  const top = Math.round(h * 0.66);
  ctx.fillStyle = PAPER.table;
  ctx.fillRect(0, top, w, h - top);
  ctx.strokeStyle = PAPER.tableShadow;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, top + 0.5);
  ctx.lineTo(w, top + 0.5);
  ctx.stroke();
}

// ---------------------------------------------------------------- 主角与道具

/** 印样：全站复用的主角，浅色矩形 + 细边 + 柔和投影。 */
export function drawPrint(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  opts: { highlight?: string; alpha?: number } = {}
): void {
  const a = opts.alpha ?? 1;
  ctx.save();
  ctx.globalAlpha = a;
  ctx.fillStyle = 'rgba(33,50,74,0.10)';
  ctx.fillRect(x + 3, y + 3, w, h);
  ctx.fillStyle = PAPER.print;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = opts.highlight ?? PAPER.printEdge;
  ctx.lineWidth = opts.highlight ? 2 : 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.restore();
}

/** 网点网屏：半透明片 + 规则网格细线。cellPx 是格距，可传 angle / phase。 */
export function drawScreen(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  cellPx: number,
  opts: { angle?: number; phase?: number; alpha?: number } = {}
): void {
  const cell = Math.max(2, cellPx);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();

  ctx.globalAlpha = opts.alpha ?? 0.55;
  ctx.fillStyle = PAPER.print;
  ctx.fillRect(x, y, w, h);

  ctx.globalAlpha = 1;
  ctx.strokeStyle = PAPER.screenLine;
  ctx.lineWidth = 1;

  const cx = x + w / 2;
  const cy = y + h / 2;
  const reach = Math.ceil((Math.abs(w) + Math.abs(h)) / 2);
  const phase = opts.phase ?? 0;

  ctx.translate(cx, cy);
  if (opts.angle) ctx.rotate(opts.angle);
  ctx.beginPath();
  for (let d = -reach; d <= reach; d += cell) {
    const o = d + (phase % cell);
    ctx.moveTo(o, -reach);
    ctx.lineTo(o, reach);
    ctx.moveTo(-reach, o);
    ctx.lineTo(reach, o);
  }
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = PAPER.printEdge;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.restore();
}

/** 放大镜：圆框 + 手柄。 */
export function drawLoupe(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  ctx.save();
  ctx.strokeStyle = PAPER.tableShadow;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + r * 0.7, y + r * 0.7);
  ctx.lineTo(x + r * 1.35, y + r * 1.35);
  ctx.stroke();
  ctx.restore();
}

/** 套准旋钮：圆盘 + 细指针。angle 用弧度。 */
export function drawRegisterKnob(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  angle: number,
  color: string
): void {
  ctx.save();
  ctx.fillStyle = PAPER.print;
  ctx.strokeStyle = PAPER.tableShadow;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.sin(angle) * r * 0.86, y - Math.cos(angle) * r * 0.86);
  ctx.stroke();
  ctx.restore();
}

/**
 * 密度计表盘：指针永远吸附在刻度上（离散跳变），不做连续插值——
 * 这正是"阈值触发"的图形表达。
 */
export function drawDial(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  marks: number,
  needleIndex: number,
  color: string
): void {
  const start = Math.PI * 0.75;
  const sweep = Math.PI * 1.5;
  ctx.save();

  ctx.fillStyle = PAPER.print;
  ctx.strokeStyle = PAPER.tableShadow;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = PAPER.axis;
  ctx.lineWidth = 2;
  for (let i = 0; i < marks; i++) {
    const a = start + (sweep * i) / (marks - 1);
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(a) * r * 0.7, y + Math.sin(a) * r * 0.7);
    ctx.lineTo(x + Math.cos(a) * r * 0.88, y + Math.sin(a) * r * 0.88);
    ctx.stroke();
  }

  const idx = Math.max(0, Math.min(marks - 1, Math.round(needleIndex)));
  const na = start + (sweep * idx) / (marks - 1);
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.cos(na) * r * 0.72, y + Math.sin(na) * r * 0.72);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// ---------------------------------------------------------------- 图案

/** 一维正弦条纹光栅，periodPx 是条纹周期，contrast 缩放振幅。 */
export function drawStripes(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  periodPx: number,
  opts: { contrast?: number; angle?: number } = {}
): void {
  const period = Math.max(1.5, periodPx);
  const contrast = opts.contrast ?? 1;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.translate(x + w / 2, y + h / 2);
  if (opts.angle) ctx.rotate(opts.angle);

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-w, -h, w * 2, h * 2);

  const reach = Math.ceil((w + h) / 2);
  for (let px = -reach; px <= reach; px++) {
    const v = Math.sin((px / period) * Math.PI * 2);
    const grey = Math.round(255 - ((v + 1) / 2) * 255 * contrast);
    ctx.fillStyle = `rgb(${grey},${grey},${grey})`;
    ctx.fillRect(px, -reach, 1.2, reach * 2);
  }
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = PAPER.printEdge;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.restore();
}

/** 西门子星图：中心频率无限高的经典图案。 */
export function drawSiemensStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  spokes: number
): void {
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#111111';
  for (let i = 0; i < spokes; i++) {
    const a0 = (Math.PI * 2 * i) / spokes;
    const a1 = a0 + Math.PI / spokes;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, a0, a1);
    ctx.closePath();
    ctx.fill();
  }

  ctx.strokeStyle = PAPER.printEdge;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

// ---------------------------------------------------------------- 事件

export interface EventPoint {
  x: number;
  y: number;
  p: number; // +1 变亮 (ON)，-1 变暗 (OFF)
}

/** 事件点。mode = 'polarity' 时按极性上色（变亮红 / 变暗蓝），'single' 时用紫色。 */
export function drawEventDots(
  ctx: CanvasRenderingContext2D,
  points: EventPoint[],
  mode: 'polarity' | 'single' = 'polarity'
): void {
  ctx.save();
  for (const pt of points) {
    ctx.fillStyle =
      mode === 'single' ? PAPER.purple : pt.p >= 0 ? PAPER.evOn : PAPER.evOff;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** 描点笔留下的轨迹：折线 + 每个点一个小圆。 */
export function drawTrace(
  ctx: CanvasRenderingContext2D,
  pts: { x: number; y: number }[],
  color: string
): void {
  if (pts.length === 0) return;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.stroke();
  ctx.fillStyle = color;
  for (const pt of pts) {
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 2.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// ---------------------------------------------------------------- 技术插图

/** 紧凑的技术插图边框；只有边框与极少的刻度，不承载说明文字。 */
export function drawAxes(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
): void {
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = PAPER.axis;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.restore();
}

/** 共享基线的水平条形组。values 与 colors 等长。 */
export function drawBars(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  values: number[],
  colors: string[],
  opts: { max?: number; gap?: number } = {}
): void {
  const n = values.length;
  if (n === 0) return;
  const gap = opts.gap ?? 12;
  const barH = Math.max(6, (h - gap * (n - 1)) / n);
  const max = opts.max ?? Math.max(1e-6, ...values);

  ctx.save();
  for (let i = 0; i < n; i++) {
    const by = y + i * (barH + gap);
    ctx.fillStyle = PAPER.axis;
    ctx.fillRect(x, by, w, barH);
    const bw = Math.max(0, Math.min(1, values[i] / max)) * w;
    ctx.fillStyle = colors[i] ?? PAPER.blue;
    ctx.fillRect(x, by, bw, barH);
  }
  ctx.restore();
}

// ---------------------------------------------------------------- 文字

/** 画布内短标签，最多 8 个字。全站标签样式统一走这里。 */
export function drawSceneLabel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
  color: string = PAPER.ink
): void {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = `14px ${FONT}`;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(text, x, y);
  ctx.restore();
}

/** 画布内图例，最多 3 项，每项一个色块 + ≤6 字标签。 */
export function drawLegend(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  items: { color: string; label: string }[]
): void {
  ctx.save();
  ctx.font = `13px ${FONT}`;
  ctx.textBaseline = 'middle';
  let cx = x;
  for (const item of items.slice(0, 3)) {
    ctx.fillStyle = item.color;
    ctx.beginPath();
    ctx.arc(cx + 5, y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PAPER.muted;
    ctx.fillText(item.label, cx + 14, y + 1);
    cx += 14 + ctx.measureText(item.label).width + 18;
  }
  ctx.restore();
}

/** 两色插值，供状态渐变使用。 */
export function lerpPrint(a: string, b: string, t: number): string {
  return lerpColor(a, b, Math.max(0, Math.min(1, t)));
}
