import React from 'react';

// climbKit.tsx — 攀岩读线隐喻的共享绘图工具包。纯 Canvas + 一个永不渲染的空组件。
// 由 packet p1-ch12 拥有，装配时复制到 src/modules/climbkit.tsx；所有组件从 './climbkit' 导入。

export const FIELD = '#f5f8f0'; // 安静场地底色
export const WALL = '#b8c9a7'; // 岩壁
export const WALL_DEEP = '#76906a'; // 岩壁轮廓 / 深度
export const HOLD = '#92400e'; // 岩点（中性支撑）
export const GUIDE = '#27446e'; // 当前状态 / 引导
export const OK = '#228d5c'; // 成功 / 本文方法
export const BAD = '#c43f52'; // 失败 / 旧方法
export const EMPH = '#f07e47'; // 用户控制 / 强调
export const AUX = '#7c3aed'; // 辅助机制
export const INK = '#21324a';
export const MUTED = '#68778f';
export const LINE = '#d7deea';

const FONT = '"Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';

export type ClimberPose = 'reach' | 'hang' | 'rest' | 'flag' | 'topout';
export interface WallOpts {
  color?: string;
  veins?: number;
}
export interface LegendItem {
  color: string;
  text: string;
}

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

/** 共享后层：安静场地 + 地面色带 + 2px 轮廓线。 */
export function clearCrag(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = FIELD;
  ctx.fillRect(0, 0, w, h);
  const y = Math.round(h * 0.84);
  ctx.fillStyle = WALL;
  ctx.fillRect(0, y, w, h - y);
  ctx.fillStyle = WALL_DEEP;
  ctx.fillRect(0, y, w, 2);
}

/** 矩形岩壁面板：2–3 道浅色等高线，可选色调。 */
export function drawWall(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  opts?: WallOpts
): void {
  const o = opts || {};
  const veins = o.veins === undefined ? 3 : o.veins;
  ctx.save();
  ctx.fillStyle = o.color || WALL;
  roundRectPath(ctx, x, y, w, h, 10);
  ctx.fill();
  ctx.strokeStyle = WALL_DEEP;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.globalAlpha = 0.3;
  ctx.lineWidth = 1.5;
  for (let i = 0; i < veins; i++) {
    const yy = y + h * ((i + 1) / (veins + 1));
    ctx.beginPath();
    ctx.moveTo(x + 12, yy);
    ctx.quadraticCurveTo(
      x + w * 0.5,
      yy + (i % 2 === 0 ? -1 : 1) * h * 0.06,
      x + w - 12,
      yy + h * 0.02
    );
    ctx.stroke();
  }
  ctx.restore();
}

/** 反复出现的主体：简洁几何人形；pose 决定手臂/腿的姿态。约 24–30px 高（scale=1）。 */
export function drawClimber(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  color: string,
  pose: ClimberPose
): void {
  const s = scale || 1;
  const c = color || INK;
  const hipY = y - 12 * s;
  const shY = y - 21 * s;
  const headY = y - 26 * s;
  const headR = 3.6 * s;

  let lx = x - 5 * s;
  let ly = y;
  let rx = x + 5 * s;
  let ry = y;
  let lhx = x - 7 * s;
  let lhy = hipY + 2 * s;
  let rhx = x + 7 * s;
  let rhy = hipY + 2 * s;

  if (pose === 'reach') {
    rhx = x + 6 * s;
    rhy = shY - 10 * s;
    lhx = x - 8 * s;
    lhy = shY - 1 * s;
  } else if (pose === 'hang') {
    rhx = x + 6 * s;
    rhy = shY - 11 * s;
    lhx = x - 6 * s;
    lhy = shY - 11 * s;
  } else if (pose === 'flag') {
    rhx = x + 6 * s;
    rhy = shY - 10 * s;
    lhx = x - 9 * s;
    lhy = shY + 3 * s;
    rx = x + 12 * s;
    ry = y - 5 * s;
    lx = x - 4 * s;
    ly = y;
  } else if (pose === 'topout') {
    rhx = x + 7 * s;
    rhy = shY - 12 * s;
    lhx = x - 7 * s;
    lhy = shY - 12 * s;
    lx = x - 6 * s;
    ly = y - 1 * s;
    rx = x + 6 * s;
    ry = y - 1 * s;
  }

  ctx.save();
  ctx.strokeStyle = c;
  ctx.fillStyle = c;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // 躯干
  ctx.lineWidth = 4 * s;
  ctx.beginPath();
  ctx.moveTo(x, hipY);
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
  ctx.moveTo(x, hipY);
  ctx.lineTo(lx, ly);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, hipY);
  ctx.lineTo(rx, ry);
  ctx.stroke();

  // 手 / 脚端点
  ctx.beginPath();
  ctx.arc(lhx, lhy, 2 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(rhx, rhy, 2 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(lx, ly, 2 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(rx, ry, 2 * s, 0, Math.PI * 2);
  ctx.fill();

  // 头
  ctx.beginPath();
  ctx.arc(x, headY, headR, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/** 圆润岩点；active 时加粗描边 + 光晕。 */
export function drawHold(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color: string,
  active?: boolean
): void {
  const radius = r || 6;
  const c = color || HOLD;
  ctx.save();
  if (active) {
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(x, y, radius * 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  ctx.fillStyle = c;
  ctx.beginPath();
  ctx.ellipse(x, y, radius, radius * 0.82, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x - radius * 0.35, y - radius * 0.22, radius * 0.42, radius * 0.34, 0, 0, Math.PI * 2);
  ctx.fill();
  if (active) {
    ctx.strokeStyle = c;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(x, y, radius + 3, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

/** 折线绳索。pts 为 [x,y] 数组。 */
export function drawRope(
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

/** 小团镁粉痕（用户强调线索）。alpha 0..1。 */
export function drawChalkPuff(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  alpha: number
): void {
  const a = Math.max(0, Math.min(1, alpha));
  if (a <= 0) return;
  const blobs: number[][] = [
    [0, 0, 7],
    [-8, 3, 5],
    [8, 2, 5],
    [-3, -6, 4],
    [5, -5, 4.5],
  ];
  ctx.save();
  ctx.globalAlpha = a;
  ctx.fillStyle = '#ffffff';
  for (const b of blobs) {
    ctx.beginPath();
    ctx.arc(x + b[0], y + b[1], b[2], 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** 小路线卡：白底 + 归一化点序列 + 连线。pts 为 [0..1,0..1]。 */
export function drawTopoCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  pts: number[][],
  color: string
): void {
  ctx.save();
  ctx.fillStyle = '#ffffff';
  roundRectPath(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  const pad = 10;
  const px = (u: number): number => x + pad + u * (w - 2 * pad);
  const py = (v: number): number => y + pad + v * (h - 2 * pad);
  if (pts && pts.length > 0) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    if (pts.length > 1) {
      ctx.beginPath();
      ctx.moveTo(px(pts[0][0]), py(pts[0][1]));
      for (let i = 1; i < pts.length; i++) ctx.lineTo(px(pts[i][0]), py(pts[i][1]));
      ctx.stroke();
    }
    ctx.fillStyle = color;
    for (const p of pts) {
      ctx.beginPath();
      ctx.arc(px(p[0]), py(p[1]), 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

/** 水平数值刻度尺：values 为刻度值，markerIndex 为当前标记刻度。 */
export function drawScale(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  values: number[],
  markerIndex: number,
  color: string
): void {
  ctx.save();
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y);
  ctx.stroke();
  const n = values.length;
  const denom = Math.max(1, n - 1);
  ctx.font = '13px ' + FONT;
  ctx.textAlign = 'center';
  for (let i = 0; i < n; i++) {
    const tx = x + (i / denom) * w;
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(tx, y - 5);
    ctx.lineTo(tx, y + 5);
    ctx.stroke();
    ctx.fillStyle = MUTED;
    ctx.fillText(String(values[i]), tx, y + 20);
  }
  if (markerIndex >= 0 && markerIndex < n) {
    const mx = x + (markerIndex / denom) * w;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(mx, y, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  ctx.restore();
}

/** 顶端锚点 / 完攀小旗。 */
export function drawFlag(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string
): void {
  ctx.save();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y - 22);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - 22);
  ctx.lineTo(x + 15, y - 16);
  ctx.lineTo(x, y - 10);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** 场景标签：≤8 字。 */
export function drawSceneLabel(
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
  let cx = x;
  for (const it of items.slice(0, 3)) {
    ctx.fillStyle = it.color;
    ctx.fillRect(cx, y - 9, 10, 10);
    ctx.fillStyle = MUTED;
    ctx.fillText(it.text, cx + 14, y);
    cx += 14 + ctx.measureText(it.text).width + 18;
  }
  ctx.restore();
}

/** 确定性伪随机，保证噪点稳定。 */
export function seeded(seed: number): () => number {
  let s = seed >>> 0;
  return function (): number {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// 装配器要求模块文件导出一个组件；该组件永不渲染。
export const Climbkit: React.FC<{ chapterId: string; moduleId: string }> = () => null;
