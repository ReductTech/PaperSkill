import React from 'react';

// chartkit.tsx — 测绘员野外作业隐喻的共享绘图工具包。
// 由 packet p1-ch12 拥有；装配时复制到 src/modules/chartkit.tsx，所有组件从 './chartkit' 导入。
// 纯 Canvas 路径 + 一个永不渲染的空组件。绝不在包外重新定义这些 helper。

export const FIELD = '#f5f8f0'; // 安静场地底色
export const SHEET = '#f1efe2'; // 图纸纸面
export const GROUND = '#b8c9a7'; // 地面色带 / 中性支撑
export const CONTOUR = '#76906a'; // 等高线 / 地形轮廓
export const ROUTE = '#27446e'; // 当前状态 / 正在画的线（引导）
export const OK = '#228d5c'; // 成功 / 本文方法（能带路的地图）
export const BAD = '#c43f52'; // 失败 / 旧方法（画得像但不能用）
export const EMPH = '#f07e47'; // 用户控制 / 强调
export const AUX = '#7c3aed'; // 辅助机制
export const INK = '#21324a';
export const MUTED = '#68778f';
export const LINE = '#d7deea';

const FONT = '"Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';

export type SurveyorPose = 'sight' | 'draw' | 'walk' | 'plant' | 'check';

export interface SheetOpts {
  color?: string;
  border?: string;
  /** true (默认) 画四角刻度；false 不画；数字表示刻度长度。 */
  ticks?: boolean | number;
}

export interface LegendItem {
  color: string;
  text: string;
}

/** 账本一行：字符串（单列）或 [标签, 取值] 数组。 */
export type LedgerRow = string | string[];

function roundRectPath(
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

/** 共享后层：安静场地 + 地面色带 + 2px 等高线。 */
export function clearField(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = FIELD;
  ctx.fillRect(0, 0, w, h);
  const y = Math.round(h * 0.85);
  ctx.fillStyle = GROUND;
  ctx.fillRect(0, y, w, h - y);
  ctx.fillStyle = CONTOUR;
  ctx.fillRect(0, y, w, 2);
}

/** 图纸面板：纸色圆角面板 + 边框 + 四角刻度。 */
export function drawSheet(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  opts?: SheetOpts
): void {
  const o = opts || {};
  const border = o.border || LINE;
  ctx.save();
  ctx.fillStyle = o.color || SHEET;
  roundRectPath(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.strokeStyle = border;
  ctx.lineWidth = 2;
  ctx.stroke();

  const ticks = o.ticks === undefined ? true : o.ticks;
  if (ticks) {
    const len = typeof ticks === 'number' ? ticks : 12;
    const pad = 5;
    ctx.strokeStyle = o.border || CONTOUR;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    const corners: number[][] = [
      [x, y, 1, 1],
      [x + w, y, -1, 1],
      [x, y + h, 1, -1],
      [x + w, y + h, -1, -1],
    ];
    for (const c of corners) {
      ctx.beginPath();
      ctx.moveTo(c[0] + c[2] * pad, c[1] + c[3] * (pad + len));
      ctx.lineTo(c[0] + c[2] * pad, c[1] + c[3] * pad);
      ctx.lineTo(c[0] + c[2] * (pad + len), c[1] + c[3] * pad);
      ctx.stroke();
    }
  }
  ctx.restore();
}

/** 确定性脊线 / 等高线，画在矩形内部。 */
export function drawContours(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  seed: number,
  color?: string,
  levels?: number
): void {
  const c = color || CONTOUR;
  const lv = levels && levels > 0 ? levels : 3;
  const rnd = seeded(seed);
  ctx.save();
  ctx.strokeStyle = c;
  ctx.lineWidth = 1.2;
  ctx.globalAlpha = 0.6;
  ctx.lineJoin = 'round';
  for (let i = 0; i < lv; i++) {
    const baseY = y + h * ((i + 1) / (lv + 1));
    const amp = h * 0.07 * (0.6 + rnd() * 0.8);
    const phase = rnd() * Math.PI * 2;
    const freq = 1.4 + rnd() * 1.4;
    ctx.beginPath();
    const steps = 26;
    for (let s = 0; s <= steps; s++) {
      const u = s / steps;
      const px = x + 8 + u * (w - 16);
      const py = baseY + Math.sin(u * Math.PI * freq + phase) * amp;
      if (s === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }
  ctx.restore();
}

/** 反复出现的主体：简洁测绘员人形，scale=1 时约 30px 高。(x,y) 为脚下基准点。 */
export function drawSurveyor(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  color: string,
  pose: SurveyorPose
): void {
  const s = scale || 1;
  const c = color || INK;

  // 姿势决定肩 / 头的高度与四肢端点
  let shY = y - 22 * s;
  let headY = y - 28 * s;
  let headR = 3.6 * s;
  let lx = x - 5 * s;
  let ly = y;
  let rx = x + 5 * s;
  let ry = y;
  let lhx = x - 6 * s;
  let lhy = shY + 3 * s;
  let rhx = x + 6 * s;
  let rhy = shY + 3 * s;

  if (pose === 'sight') {
    // 一手扶到眼平（读数），另一手支撑
    rhx = x + 10 * s;
    rhy = headY + 1 * s;
    lhx = x - 8 * s;
    lhy = shY + 2 * s;
    lx = x - 6 * s;
    rx = x + 6 * s;
  } else if (pose === 'draw') {
    // 俯身落笔：上半身压低
    shY = y - 17 * s;
    headY = y - 22 * s;
    headR = 3.4 * s;
    rhx = x + 9 * s;
    rhy = y - 5 * s;
    lhx = x - 8 * s;
    lhy = y - 6 * s;
  } else if (pose === 'walk') {
    // 迈步：一腿前、一腿后
    lx = x - 7 * s;
    ly = y - 1 * s;
    rx = x + 6 * s;
    ry = y;
    lhx = x - 7 * s;
    lhy = shY + 4 * s;
    rhx = x + 7 * s;
    rhy = shY + 3 * s;
  } else if (pose === 'plant') {
    // 双手向下扶桩
    rhx = x + 8 * s;
    rhy = y - 9 * s;
    lhx = x - 8 * s;
    lhy = y - 8 * s;
    lx = x - 5 * s;
    rx = x + 5 * s;
  } else if (pose === 'check') {
    // 举臂核对
    rhx = x + 9 * s;
    rhy = headY - 2 * s;
    lhx = x - 6 * s;
    lhy = y - 11 * s;
  }

  ctx.save();
  ctx.strokeStyle = c;
  ctx.fillStyle = c;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // 躯干
  ctx.lineWidth = 4 * s;
  ctx.beginPath();
  ctx.moveTo(x, y - 13 * s);
  ctx.lineTo(x, shY);
  ctx.stroke();

  // 手臂
  ctx.lineWidth = 2.6 * s;
  ctx.beginPath();
  ctx.moveTo(x, shY);
  ctx.lineTo(lhx, lhy);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, shY);
  ctx.lineTo(rhx, rhy);
  ctx.stroke();

  // 腿
  ctx.beginPath();
  ctx.moveTo(x, y - 13 * s);
  ctx.lineTo(lx, ly);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y - 13 * s);
  ctx.lineTo(rx, ry);
  ctx.stroke();

  // 手 / 脚端点
  const ends: number[][] = [
    [lhx, lhy],
    [rhx, rhy],
    [lx, ly],
    [rx, ry],
  ];
  for (const e of ends) {
    ctx.beginPath();
    ctx.arc(e[0], e[1], 2 * s, 0, Math.PI * 2);
    ctx.fill();
  }

  // 头
  ctx.beginPath();
  ctx.arc(x, headY, headR, 0, Math.PI * 2);
  ctx.fill();

  // 帽檐（测绘员特征）
  ctx.lineWidth = 1.8 * s;
  ctx.beginPath();
  ctx.moveTo(x - headR - 2 * s, headY - headR * 0.55);
  ctx.lineTo(x + headR + 2 * s, headY - headR * 0.55);
  ctx.stroke();

  ctx.restore();
}

/** 三脚测量仪器：三条腿 + 云台。 */
export function drawTripod(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  color: string
): void {
  const s = scale || 1;
  const c = color || INK;
  const apexY = y - 30 * s;
  ctx.save();
  ctx.strokeStyle = c;
  ctx.fillStyle = c;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // 三条腿
  ctx.lineWidth = 2.4 * s;
  ctx.beginPath();
  ctx.moveTo(x, apexY);
  ctx.lineTo(x - 12 * s, y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, apexY);
  ctx.lineTo(x + 12 * s, y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, apexY);
  ctx.lineTo(x, y + 1 * s);
  ctx.stroke();

  // 横向加固条
  ctx.lineWidth = 1.6 * s;
  ctx.beginPath();
  ctx.moveTo(x - 6 * s, y - 12 * s);
  ctx.lineTo(x + 6 * s, y - 12 * s);
  ctx.stroke();

  // 仪器云台
  ctx.beginPath();
  ctx.arc(x, apexY - 3 * s, 4.5 * s, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/** 折线路线。pts 为 [x,y] 数组。 */
export function drawRoute(
  ctx: CanvasRenderingContext2D,
  pts: number[][],
  color: string,
  width?: number
): void {
  if (!pts || pts.length < 2) return;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width || 2.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.stroke();
  ctx.restore();
}

/** 路线桩 / 标记。active 时加光晕与描边。 */
export function drawPin(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  active?: boolean
): void {
  const c = color || ROUTE;
  const r = 6;
  ctx.save();
  if (active) {
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(x, y - r, r * 2.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  // 泪滴形
  ctx.fillStyle = c;
  ctx.beginPath();
  ctx.arc(x, y - r, r, Math.PI, 0);
  ctx.lineTo(x + r * 0.55, y - r * 0.55);
  ctx.lineTo(x, y);
  ctx.lineTo(x - r * 0.55, y - r * 0.55);
  ctx.closePath();
  ctx.fill();
  // 内点
  ctx.fillStyle = SHEET;
  ctx.beginPath();
  ctx.arc(x, y - r, r * 0.4, 0, Math.PI * 2);
  ctx.fill();
  if (active) {
    ctx.strokeStyle = c;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y - r, r + 2.5, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

/** 罗盘玫瑰。 */
export function drawCompass(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color: string
): void {
  const c = color || CONTOUR;
  const R = r || 18;
  ctx.save();
  ctx.strokeStyle = c;
  ctx.fillStyle = c;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(x, y, R, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y, R * 0.62, 0, Math.PI * 2);
  ctx.stroke();
  // 四向刻线
  ctx.beginPath();
  ctx.moveTo(x - R, y);
  ctx.lineTo(x + R, y);
  ctx.moveTo(x, y - R);
  ctx.lineTo(x, y + R);
  ctx.stroke();
  // 北向指针
  ctx.beginPath();
  ctx.moveTo(x, y - R * 0.92);
  ctx.lineTo(x - R * 0.22, y + R * 0.18);
  ctx.lineTo(x + R * 0.22, y + R * 0.18);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = c;
  ctx.font = '600 11px ' + FONT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('N', x, y - R - 4);
  ctx.restore();
}

/** 地图比例尺：交替填充的分段长条 + 刻度。 */
export function drawScaleBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  color: string,
  ticks?: number
): void {
  const c = color || INK;
  const n = ticks && ticks > 0 ? ticks : 4;
  const seg = w / n;
  ctx.save();
  ctx.lineWidth = 1.5;
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = i % 2 === 0 ? c : SHEET;
    ctx.fillRect(x + i * seg, y, seg, 8);
    ctx.strokeStyle = c;
    ctx.strokeRect(x + i * seg, y, seg, 8);
  }
  // 两端与中段刻度线
  ctx.strokeStyle = c;
  ctx.beginPath();
  for (let i = 0; i <= n; i++) {
    const tx = x + i * seg;
    ctx.moveTo(tx, y - 4);
    ctx.lineTo(tx, y + 12);
  }
  ctx.stroke();
  ctx.restore();
}

/** 紧凑账本 / 图例条：左侧色条 + 逐行 [标签, 取值]。 */
export function drawLedger(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  rows: LedgerRow[],
  color: string
): void {
  const c = color || ROUTE;
  const list = rows || [];
  ctx.save();
  ctx.fillStyle = '#ffffff';
  roundRectPath(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // 左侧色条
  ctx.fillStyle = c;
  ctx.fillRect(x, y + 6, 4, Math.max(0, h - 12));

  const top = y + 16;
  const rowH = Math.max(20, (h - 24) / Math.max(1, list.length));
  for (let i = 0; i < list.length; i++) {
    const r = list[i];
    const ry = top + i * rowH;
    if (Array.isArray(r)) {
      ctx.textAlign = 'left';
      ctx.fillStyle = MUTED;
      ctx.font = '13px ' + FONT;
      ctx.fillText(String(r[0] === undefined ? '' : r[0]), x + 14, ry);
      ctx.fillStyle = INK;
      ctx.font = '600 13px ' + FONT;
      ctx.fillText(String(r[1] === undefined ? '' : r[1]), x + 14 + w * 0.42, ry);
    } else {
      ctx.textAlign = 'left';
      ctx.fillStyle = INK;
      ctx.font = '13px ' + FONT;
      ctx.fillText(String(r), x + 14, ry);
    }
  }
  ctx.restore();
}

/** 场景标签：≤8 字。 */
export function drawSheetLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color?: string
): void {
  ctx.save();
  ctx.fillStyle = color || INK;
  ctx.font = '18px ' + FONT;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(text, x, y);
  ctx.restore();
}

/** 图例：最多 3 项。 */
export function drawLegend(
  ctx: CanvasRenderingContext2D,
  items: LegendItem[],
  x: number,
  y: number
): void {
  ctx.save();
  ctx.font = '15px ' + FONT;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  let cx = x;
  for (const it of (items || []).slice(0, 3)) {
    ctx.fillStyle = it.color;
    ctx.fillRect(cx, y - 9, 10, 10);
    ctx.fillStyle = MUTED;
    ctx.fillText(it.text, cx + 14, y);
    cx += 14 + ctx.measureText(it.text).width + 18;
  }
  ctx.restore();
}

/** 确定性伪随机，保证等高线 / 纹理稳定。 */
export function seeded(seed: number): () => number {
  let s = seed >>> 0;
  return function (): number {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// 装配器要求模块文件导出一个组件；该组件永不渲染。
export const Chartkit: React.FC<{ chapterId: string; moduleId: string }> = () => null;
