import React, { useEffect, useRef, useState } from 'react';
import { clamp, observeCanvas, setupCanvas } from '../lib/canvasKit';
import { clearScene, drawLegend, drawPrint, drawSceneLabel, PAPER } from './halftoneKit';
import { cellMeans, drawFabricPatch, fabricCanvas } from './fabricKit';
import type { WidgetProps } from './registry';

// §7.1「两条流谁搬得准」—— EvTexture++ 的双流对齐（TTA）
//
// 三行并列，自上而下，每行结构相同：输入小图 → 模块方框 → 对齐结果 → 读数。
//   行 1  RGB 流：输入是「帧 t−1」，SpyNet 估计光流把它搬到「帧 t」的位置。
//   行 2  事件流：输入是体素网格，U-Net 估计光流把同一帧搬过去。
//   行 3  融合：输入是上面两路的结果，按权重决定听谁的，叠加应当是严丝合缝的。
//
// 画布上的双影是**真算出来的**：把布纹窗口按该流的估计位移做 1:1 的空间平移
// （drawFabricPatch 的 ox 是源窗口左上角，ox 变小，同样的织纹就在画面里向右跑），
// 再与没有平移的那一帧各取 0.5 叠起来 —— 偏差多少个像素，重影就错开多少个像素。
// 两层分别染成蓝（帧 t−1，被搬动的那一层）与橙（帧 t，参照），于是「哪一影是谁」一眼可辨。
// 布纹是周期花纹，单看"一块布"很难看出错开，所以在两层里各画一遍同一组参照记号（套准记号）：
// 两层记号之间的距离 = 该行的偏差，错位多少肉眼直接可读。记号是纯注释性的，不参与任何计算。
//
// 诚实边界（必须说清楚，改动时不要删）：
//   ・两条流的**偏差百分比是输入，不是算出来的**。方向依据论文 Sec. V-B1 与 Fig.6
//     （事件流在大运动下明显更稳），但论文没有给出具体百分比。本模块取
//     大运动 RGB 20% / 事件 4%，常规运动 RGB 5% / 事件 4%。
//   ・偏差一旦给定，下面的对齐结果就完全是按这个偏差真算出来的 —— 重影是它算出来的
//     后果，不是画上去的假象。
//   ・偏差方向按「RGB 偏大（过冲）、事件偏小（欠冲）」建模，一正一负，这是为了让加权
//     融合能体现「两路误差互相抵消」的直觉；论文没有给方向。真实 EvTexture++ 的融合
//     发生在特征空间，这里用位移加权作为可解释的简化，只用来演示「权重决定听谁的」。
//   ・体素网格的极性是真算的：取 帧 t−1 与 帧 t 在同一格里真实亮度的平均差，
//     变亮 = evOn（红）、变暗 = evOff（蓝）。真实事件相机给的是更高分辨率、更长时间窗的体素网格。
//
// 性能：每帧只做 drawImage 位图搬运。染色布纹、体素网格、三张叠加图都只做一次并缓存；
// 叠加图只在 motion 变化（偏差是输入）时重建。rAF 里没有 getImageData / cellMeans。

const W = 1080;
const H_WIDE = 460;
const H_NARROW = 720;

const IN_W = 120;                 // 输入小图宽
const IN_H = 100;                 // 输入小图高
const BOX_W = 104;                // 模块方框
const BOX_H = 46;
const RES_W = 360;                // 对齐结果窗口（规范：x 300–660，360×100）
const RES_H = 100;
const RES_X = 300;

const LABEL_DY = 14;              // 行标签基线相对行的偏移
const PATCH_DY = 20;              // 输入小图顶相对行的偏移

// 两帧之间真实存在的位移（显示像素）。这个数不是论文数字，只用来把"偏差"摆到肉眼可辨的量级：
// 取 25 时，大运动下 RGB 偏 20% → 错开 5px（参照记号直接裂成两个），事件流偏 4% → 只错开 1px。
const TRUE_D = 25;
const DEV_MAX = 0.20;             // 偏差条的满量程 = 大运动下 RGB 的偏差

// 参照记号（套准记号）：同一个布纹位置在两层里各画一次，落在叠加图上就成 x = 基准 + 该层位移。
// 两层记号之间的距离 = |估计位移 − 真实位移|，正是这一行的偏差 —— 布纹本身是周期花纹，
// 错开一点还是"一块布"，记号才是让错位肉眼可辨的东西（上一版就是靠这个十字读位的）。
const REF_X = [60, 130, 200, 270, 330];
const REF_Y = [30, 70];
const REF_ARM = 5;
const REF_LW = 2;

// 布纹取窗口。FAB_OX − estD 是「帧 t−1 的窗口」：ox 变小 → 内容向右跑，正是「搬过去」。
const FAB_OX = 320;
const FAB_OY = 140;

// 染色布纹只需覆盖所有用到的窗口：x ∈ [FAB_OX − 48, FAB_OX + 360]，y ∈ [FAB_OY, FAB_OY + 100]。
// 左边留 48 的余量 > 最大估计位移（1.20 × 25 = 30）。
const TINT_X0 = FAB_OX - 48;
const TINT_Y0 = FAB_OY - 8;
const TINT_W = 460;
const TINT_H = 116;
const TINT_ALPHA = 0.3;           // 染色强度：留 70% 的织纹明暗，再高会把重影冲淡

const FONT = '"Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';

export type Motion = 'normal' | 'large';

export interface DeviationSpec {
  rgb: number;      // RGB 流的偏差（**输入量**，依据 Sec. V-B1 / Fig.6 的方向，非论文数字）
  ev: number;       // 事件流的偏差（同上）
  wEv: number;      // 融合时事件流的权重
  wRgb: number;     // 融合时 RGB 流的权重
}

// 偏差表来自规范；权重随运动幅度变化 —— 大运动时事件流主导，常规运动时两路更均衡。
export const SPEC: Record<Motion, DeviationSpec> = {
  large: { rgb: 0.2, ev: 0.04, wEv: 0.85, wRgb: 0.15 },
  normal: { rgb: 0.05, ev: 0.04, wEv: 0.35, wRgb: 0.65 },
};

/** 估计位移 = 真实位移 × (1 ± 偏差)。RGB 取 +（偏大），事件取 −（偏小）。 */
export function scalesOf(spec: DeviationSpec): { rgb: number; ev: number; fuse: number } {
  const rgb = 1 + spec.rgb;
  const ev = 1 - spec.ev;
  const fuse = spec.wEv * ev + spec.wRgb * rgb;
  return { rgb, ev, fuse };
}

export type Band = 'good' | 'warn';

/** 反馈只有两档：大运动给 warn，常规运动给 good。 */
export function bandOf(motion: Motion): Band {
  return motion === 'large' ? 'warn' : 'good';
}

/** 反馈文案逐字照抄规范，不要改写。 */
export function feedbackFor(motion: Motion): { text: string; cls: Band } {
  if (motion === 'large') {
    return {
      cls: 'warn',
      text:
        '大运动下，RGB 光流偏了 20%：上一帧没搬到该去的地方，叠出来一片双影。事件流只偏 4%，叠得严丝合缝。两条流偏差的量级依据论文 Sec. V-B1 与 Fig.6；下面的对齐结果是按这个偏差真实算出来的。',
    };
  }
  return {
    cls: 'good',
    text:
      '运动不大时，RGB 光流只偏 5%，够用；事件流依旧偏 4%。两条流都能对齐——所以论文不赌哪一条更好，而是让融合去决定听谁的。',
  };
}

// ---------------------------------------------------------------- 布局

export interface Layout {
  rows: number[];                 // 每行内容区顶部（标签基线 = rows[i] + 14，输入小图 = rows[i] + 20）
  inX: number;
  inW: number;
  inH: number;
  boxX: number;
  boxW: number;
  boxH: number;
  resX: number;
  resW: number;
  resH: number;
  readX: number;
  barX: number;
  barW: number;
  legend: { x: number; y: number };
  evLegend: { x: number; y: number };
}

export function layoutFor(narrow: boolean): Layout {
  return {
    rows: narrow ? [76, 300, 524] : [56, 186, 316],
    inX: 24,
    inW: IN_W,
    inH: IN_H,
    boxX: 168,
    boxW: BOX_W,
    boxH: BOX_H,
    resX: RES_X,
    resW: RES_W,
    resH: RES_H,
    readX: 684,
    barX: 800,
    barW: 240,
    legend: narrow ? { x: 872, y: 40 } : { x: 872, y: 30 },
    // 事件极性图例分区单放：贴在行 2 体素网格的右下角（x 150 起，避开 24–144 的网格与 294 起的结果面板）
    evLegend: { x: 150, y: narrow ? 430 : 292 },
  };
}

// ---------------------------------------------------------------- 染色布纹

function hexToRgba(hex: string, a: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

const tintCache = new Map<string, HTMLCanvasElement>();

/** 布纹的染色版本：懒做一次，之后一直是位图搬运。 */
function tintedFabric(color: string): HTMLCanvasElement {
  const hit = tintCache.get(color);
  if (hit) return hit;
  const c = document.createElement('canvas');
  c.width = TINT_W;
  c.height = TINT_H;
  const g = c.getContext('2d');
  if (g) {
    g.drawImage(fabricCanvas(), TINT_X0, TINT_Y0, TINT_W, TINT_H, 0, 0, TINT_W, TINT_H);
    // source-atop：只在不透明处上色，带 alpha 的色 → TINT_ALPHA 的色 + 余下的原织纹
    g.globalCompositeOperation = 'source-atop';
    g.fillStyle = hexToRgba(color, TINT_ALPHA);
    g.fillRect(0, 0, TINT_W, TINT_H);
    g.globalCompositeOperation = 'source-over';
  }
  tintCache.set(color, c);
  return c;
}

/** 把布纹的某一窗口（左上角 ox/oy，可为小数）染色后画到 dx/dy，尺寸 dw×dh。 */
function drawTintedPatch(
  ctx: CanvasRenderingContext2D,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
  ox: number,
  oy: number,
  color: string
): void {
  const src = tintedFabric(color);
  ctx.drawImage(src, ox - TINT_X0, oy - TINT_Y0, dw, dh, dx, dy, dw, dh);
}

// ---------------------------------------------------------------- 对齐结果（真平移 + 真叠加）

const overlayCache = new Map<string, HTMLCanvasElement>();

/**
 * 一行的对齐结果：把 帧 t−1 按**估计位移** estD 平移之后，与 帧 t（原样）各取一半叠起来。
 *
 *   底：帧 t−1，窗口取自 FAB_OX − estD（即被搬了 estD 个像素），染色蓝，alpha 1
 *   上：帧 t，窗口取自 FAB_OX − TRUE_D（真实位置），染色橙，alpha 0.5
 *   → 最终每个像素 = 0.5 × 帧 t−1(搬过) + 0.5 × 帧 t
 *
 * estD 与 TRUE_D 一致时两层逐像素重合，叠出来是一张清晰的织纹；差多少像素就错开多少，
 * 同一根线落在两个位置上，取平均后变成两条淡影 —— 双影。
 *
 * 只在 motion 变化时构建（偏差是输入量），结果按 estD 缓存。
 */
export function overlayFor(estD: number): HTMLCanvasElement {
  const key = estD.toFixed(3);
  const hit = overlayCache.get(key);
  if (hit) return hit;

  const c = document.createElement('canvas');
  c.width = RES_W;
  c.height = RES_H;
  const g = c.getContext('2d');
  if (g) {
    // 帧 t−1：搬了 estD 个像素
    g.globalAlpha = 1;
    drawTintedPatch(g, 0, 0, RES_W, RES_H, FAB_OX - estD, FAB_OY, PAPER.blue);
    drawRefMarks(g, estD, PAPER.blue);
    // 帧 t：待在真实位置上
    g.globalAlpha = 0.5;
    drawTintedPatch(g, 0, 0, RES_W, RES_H, FAB_OX - TRUE_D, FAB_OY, PAPER.orange);
    drawRefMarks(g, TRUE_D, PAPER.orange);
    g.globalAlpha = 1;
  }
  overlayCache.set(key, c);
  return c;
}

/**
 * 参照记号：布纹上一个固定位置，在"估计位移 = shift"的那一层里落在 x = 基准 + (shift − TRUE_D)。
 * 两层各画一次，记号之间的距离就等于这一行的偏差。当前 globalAlpha 决定它在叠加里占多少。
 */
function drawRefMarks(ctx: CanvasRenderingContext2D, shift: number, color: string): void {
  const dx = shift - TRUE_D;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = REF_LW;
  ctx.beginPath();
  for (const bx of REF_X) {
    for (const by of REF_Y) {
      const x = bx + dx;
      ctx.moveTo(x - REF_ARM, by);
      ctx.lineTo(x + REF_ARM, by);
      ctx.moveTo(x, by - REF_ARM);
      ctx.lineTo(x, by + REF_ARM);
    }
  }
  ctx.stroke();
  ctx.restore();
}

// ---------------------------------------------------------------- 体素网格（行 2 的输入）

let voxelBitmap: HTMLCanvasElement | null = null;

/**
 * 体素网格的输入小图。极性是真算的：同一格在 帧 t−1 与 帧 t 里的平均亮度之差，
 * 变亮 = evOn（红）、变暗 = evOff（蓝），点的浓淡 = 亮度差的大小。
 * 只在第一次用到时算一次（会读一次 getImageData），之后一直是位图搬运。
 */
export function voxelCanvas(): HTMLCanvasElement {
  if (voxelBitmap) return voxelBitmap;
  const c = document.createElement('canvas');
  c.width = IN_W;
  c.height = IN_H;
  const g = c.getContext('2d');
  if (g) {
    g.fillStyle = PAPER.print;
    g.fillRect(0, 0, IN_W, IN_H);

    const cell = 8;
    const a = cellMeans(FAB_OX, FAB_OY, IN_W, IN_H, cell, 0);
    const b = cellMeans(FAB_OX - TRUE_D, FAB_OY, IN_W, IN_H, cell, 0);

    // 格子线
    g.strokeStyle = PAPER.axis;
    g.lineWidth = 1;
    g.beginPath();
    for (let i = 1; i < a.cols; i++) {
      const x = Math.round(i * a.cw) + 0.5;
      g.moveTo(x, 0);
      g.lineTo(x, IN_H);
    }
    for (let j = 1; j < a.rows; j++) {
      const y = Math.round(j * a.ch) + 0.5;
      g.moveTo(0, y);
      g.lineTo(IN_W, y);
    }
    g.stroke();

    // 极性点
    const rows = Math.min(a.rows, b.rows);
    const cols = Math.min(a.cols, b.cols);
    for (let r = 0; r < rows; r++) {
      for (let col = 0; col < cols; col++) {
        const i = r * a.cols + col;
        const d = b.vals[i] - a.vals[i];
        const mag = Math.abs(d);
        if (mag < 2) continue;
        g.globalAlpha = clamp(mag / 26, 0.18, 0.95);
        g.fillStyle = d > 0 ? PAPER.evOn : PAPER.evOff;
        g.beginPath();
        g.arc((col + 0.5) * a.cw, (r + 0.5) * a.ch, 2.6, 0, Math.PI * 2);
        g.fill();
      }
    }
    g.globalAlpha = 1;
  }
  voxelBitmap = c;
  return c;
}

// ---------------------------------------------------------------- 场景状态

export interface Scene {
  motion: Motion;
  estD: [number, number, number];   // 三行的估计位移（显示像素）
  dev: [number, number, number];    // 三行的偏差：行 1/2 是**输入量**，行 3 由权重算得
  overlays: [HTMLCanvasElement, HTMLCanvasElement, HTMLCanvasElement];
}

/** 状态量 → 绘制量。只在 motion 变化时算一次。 */
export function sceneFor(motion: Motion): Scene {
  const spec = SPEC[motion];
  const s = scalesOf(spec);
  const rgbD = s.rgb * TRUE_D;
  const evD = s.ev * TRUE_D;
  const fuseD = s.fuse * TRUE_D;
  return {
    motion,
    estD: [rgbD, evD, fuseD],
    dev: [spec.rgb, spec.ev, Math.abs(s.fuse - 1)],
    overlays: [overlayFor(rgbD), overlayFor(evD), overlayFor(fuseD)],
  };
}

// ---------------------------------------------------------------- 绘制小件

function frameRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  lw: number
): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.strokeRect(x + lw / 2, y + lw / 2, w - lw, h - lw);
  ctx.restore();
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y: number,
  x1: number,
  color: string
): void {
  if (!(x1 > x0 + 8)) return;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x0, y);
  ctx.lineTo(x1 - 7, y);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.lineTo(x1 - 8, y - 5);
  ctx.lineTo(x1 - 8, y + 5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawModuleBox(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  name: string,
  color: string
): void {
  drawPrint(ctx, x, y, w, h, { highlight: color });
  ctx.save();
  ctx.fillStyle = PAPER.ink;
  ctx.font = `600 16px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(name, x + w / 2, y + h / 2 + 1);
  ctx.restore();
}

function drawReliability(
  ctx: CanvasRenderingContext2D,
  x: number,
  cy: number,
  barX: number,
  barW: number,
  text: string,
  dev: number,
  color: string
): void {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = `600 18px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, cy);

  // 偏差条：同一把尺子（0 → 20%），三行摆在一起就是「谁搬得准」的直观比较
  ctx.fillStyle = PAPER.axis;
  ctx.fillRect(barX, cy - 5, barW, 10);
  ctx.fillStyle = color;
  ctx.fillRect(barX, cy - 5, clamp(dev / DEV_MAX, 0, 1) * barW, 10);
  ctx.restore();
}

// ---------------------------------------------------------------- 主绘制

export function renderScene(
  ctx: CanvasRenderingContext2D,
  H: number,
  sc: Scene,
  vox: HTMLCanvasElement | null
): void {
  const L = layoutFor(H > H_WIDE);
  const spec = SPEC[sc.motion];
  clearScene(ctx, W, H);

  // 图例：叠加区里哪一影是谁
  drawLegend(ctx, L.legend.x, L.legend.y, [
    { color: PAPER.blue, label: '帧 t−1' },
    { color: PAPER.orange, label: '帧 t' },
  ]);

  // 行标识：RGB 流 / 事件流（两行各一个短标签）；融合行的身份由方框与读数承担
  const accents = [PAPER.ink, PAPER.purple, PAPER.green];
  const modules = ['SpyNet', 'U-Net', '融合'];
  const readouts = [
    `偏差 ${Math.round(spec.rgb * 100)}%`,
    `偏差 ${Math.round(spec.ev * 100)}%`,
    '融合',
  ];

  for (let i = 0; i < 3; i++) {
    const y0 = L.rows[i];
    const py = y0 + PATCH_DY;
    const cy = py + L.inH / 2;

    // 行首色规
    ctx.save();
    ctx.fillStyle = accents[i];
    ctx.fillRect(12, py, 4, L.inH);
    ctx.restore();

    if (i < 2) {
      drawSceneLabel(ctx, L.inX, y0 + LABEL_DY, i === 0 ? 'RGB 流' : '事件流', accents[i]);
    }

    // ---- 输入小图 ----
    if (i === 0) {
      // 上一帧，相机看到的样子
      drawFabricPatch(ctx, L.inX, py, L.inW, L.inH, FAB_OX, FAB_OY);
      frameRect(ctx, L.inX, py, L.inW, L.inH, PAPER.blue, 2);
    } else if (i === 1) {
      if (vox) ctx.drawImage(vox, L.inX, py);
      frameRect(ctx, L.inX, py, L.inW, L.inH, PAPER.purple, 2);
    } else {
      // 上面两行的结果，两小块
      const mw = 56;
      const mh = 46;
      const my = py + (L.inH - mh) / 2;
      ctx.drawImage(sc.overlays[0], 124, 4, 112, 92, L.inX, my, mw, mh);
      frameRect(ctx, L.inX, my, mw, mh, PAPER.printEdge, 1);
      ctx.drawImage(sc.overlays[1], 124, 4, 112, 92, L.inX + 64, my, mw, mh);
      frameRect(ctx, L.inX + 64, my, mw, mh, PAPER.printEdge, 1);
    }

    // ---- 输入 → 模块 → 对齐结果 ----
    drawArrow(ctx, L.inX + L.inW + 6, cy, L.boxX - 6, PAPER.muted);
    drawModuleBox(ctx, L.boxX, cy - L.boxH / 2, L.boxW, L.boxH, modules[i], accents[i]);
    drawArrow(ctx, L.boxX + L.boxW + 6, cy, L.resX - 8, PAPER.muted);

    drawPrint(ctx, L.resX - 6, py - 6, L.resW + 12, L.resH + 12, { highlight: accents[i] });
    ctx.drawImage(sc.overlays[i], L.resX, py);

    // ---- 读数 + 偏差条（读数在结果右侧，裸数字）----
    drawReliability(
      ctx,
      L.readX,
      cy,
      L.barX,
      L.barW,
      readouts[i],
      sc.dev[i],
      i === 2 ? PAPER.green : accents[i]
    );
  }

  // 事件极性图例：分区单放，紧贴行 2 的体素网格
  drawLegend(ctx, L.evLegend.x, L.evLegend.y, [
    { color: PAPER.evOn, label: '变亮' },
    { color: PAPER.evOff, label: '变暗' },
  ]);
}

// ---------------------------------------------------------------- 组件

export const M7_1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sceneRef = useRef<Scene | null>(null);

  const [motion, setMotion] = useState<Motion>('large');

  // 场景（三行叠加图）只在 motion 变化时重建一次；rAF 里只读结果
  useEffect(() => {
    sceneRef.current = sceneFor(motion);
  }, [motion]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let H = H_WIDE;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    if (!sceneRef.current) sceneRef.current = sceneFor('large');   // 默认状态：大运动

    let vox: HTMLCanvasElement | null = null;
    try {
      vox = voxelCanvas();
    } catch {
      vox = null;   // 画不出体素网格也不该挡住整块画布
    }

    let raf = 0;
    let running = false;
    let ready = false;

    const frame = (): void => {
      const shown = canvas.getBoundingClientRect().width;
      const wantH = shown > 0 && shown < 720 ? H_NARROW : H_WIDE;
      if (wantH !== H) {
        H = wantH;
        try {
          ctx = setupCanvas(canvas, W, H);
        } catch {
          /* 保持上一次尺寸继续画 */
        }
      }

      const sc = sceneRef.current;
      if (sc) renderScene(ctx, H, sc, vox);

      if (!ready) {
        ready = true;
        canvas.classList.add('is-ready');
      }
      if (running) raf = requestAnimationFrame(frame);
    };

    const start = (): void => {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(frame);
    };
    const stop = (): void => {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };

    start();
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
    // 只挂一次：motion 的变化通过 sceneRef 进来，不重启 rAF
  }, []);

  const pick = (next: Motion): void => {
    setMotion(next);
  };

  const feedback = feedbackFor(motion);

  return (
    <>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H_WIDE}
        aria-label="两条流谁搬得准"
      />
      <div className="chip-row">
        {(['normal', 'large'] as Motion[]).map((m) => (
          <button
            key={m}
            type="button"
            className={`chip${motion === m ? ' selected' : ''}`}
            onClick={() => pick(m)}
          >
            {m === 'normal' ? '常规运动' : '大运动'}
          </button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </>
  );
};

export default M7_1;
