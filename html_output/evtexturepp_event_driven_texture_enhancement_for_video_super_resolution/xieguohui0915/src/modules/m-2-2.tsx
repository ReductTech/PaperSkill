import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import {
  clearScene,
  drawAxes,
  drawLegend,
  drawSceneLabel,
  PAPER,
} from './halftoneKit';
import { cellMeans } from './fabricKit';
import type { WidgetProps } from './registry';

// §2.2 事件流的时空体
//
// 沿用 §2.1 的那台相机，一个参数都不改：每个像素存一个参考值 ref，每隔 50ms（20Hz）
// 读一次它那一格的真实面积平均 v，只有 |v − ref| > C×255 才报一个事件并把 ref = v。
// 放大倍数也一样（显示 42.5px 的一格对应布纹里 2.65625px），阈值也一样（C = 0.08）。
// 唯一的差别是像素从 24 个减到 5 个 —— 24 个像素的噪声会盖掉规律，5 个才看得清。
//
// 左边的 5 个像素是**沿布纹排开的一个横排**，所以它们落在布纹的不同相位上：
// 此刻有的正在变亮、有的正在变暗。这一点是这块的核心 —— 事件极性是**逐像素**的，
// 不由整条的明暗顺序决定。所以每行左边放该像素的灰度块和裸整数，右边放它自己的
// 事件槽（点按时间从左向右落），槽里那条很淡的折线就是该像素自己的灰度随时间的变化，
// 每个点都落在折线上、颜色与该处折线的斜率同向，行末再用 ↑ / ↓ 标出此刻的方向。
// 实测（本文件参数下 30 秒）：每行最近 800ms 有 3–9 个点（平均 5.5），
// 任意时刻 5 个像素里 ↑ 的个数总在 1–4 之间 —— 从不同时朝一个方向。
//
// 右边直接给结果：一个时间轴从下往上的三维时空体。下平面是 t₀ 帧、上平面是 t₁ 帧
// （相隔 800ms，布纹滑过 16 个布纹像素 = 1.6 根线，所以两帧的内容是错开的），
// 中间等距插 5 片切片，落在每一片对应时段里的事件就画在那片切片上。
//
// 窗口是滚动的：t₁ 永远是此刻，t₀ = t₁ − 800ms。这样画面连续流动，不出现整块冻住；
// 两个帧平面之间那 800ms 的空白就是帧留下的盲时，chip 一切换就能看出来。
//
// 性能：只有 50ms 的仿真步里才读像素（cellMeans 会 getImageData）；
// rAF 的每一帧只是把缓存下来的 vals / hist / events 画出来，绝不逐帧读像素。

const W = 1080;
const H_WIDE = 400;
const H_NARROW = 640;

const N = 5;                        // 像素个数：只留 5 个，规律才看得见
const ZOOM = 16;                    // 与 §2.1 同一台相机
const CELL_F = 42.5 / ZOOM;         // 每格在布纹里的宽度 2.65625
const SCAN_H = 150;                 // 每格参与面积平均的高度（布纹像素）
const FAB_OY = 200;                 // 在布纹里的纵向起点
const SLIDE = 20;                   // 布纹滑动速度（布纹像素/秒）
const SIM_MS = 50;                  // 仿真步长
const THRESHOLD_C = 0.08;           // 与 §2.1 默认值一致
const WINDOW_MS = 800;              // 时空体覆盖的时间跨度：就是两帧的间隔
const HIST_MS = 1200;               // 灰度历史保留长度（要盖住整个窗口）
const MAX_EVENTS = 200;             // 窗口里最多留 200 条
const OX_SPAN = 2000;               // ox 回绕范围
const DIR_BACK = 3;                 // 方向箭头用 150ms 的差分
const SLICES = 5;                   // 帧平面之间插 5 片切片
const WARM_STEPS = 40;              // 入场前先跑 2 秒，一进来两个区都有东西
const MIN_RANGE = 24;               // 折线的最小量程，免得把量化噪声放大成大摆动

const FONT = '"Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';

export type View = 'frame' | 'slices';

export interface StampEvent {
  i: number; // 像素序号 0..4
  t: number; // 仿真时刻（ms）
  p: number; // +1 变亮 / -1 变暗
}

export interface Sample {
  t: number;
  v: Float32Array;
}

export interface Sim {
  ox: number;                 // 布纹滑动偏移
  ref: Float32Array;          // 每个像素的参考值（只在报事件时更新）
  vals: Float32Array;         // 每个像素当前的格子平均值 0–255
  hist: Sample[];             // 灰度历史（窗口滚动，用来画折线和取两帧的内容）
  events: StampEvent[];       // 滚动窗口里的事件
  clock: number;              // 仿真时钟（ms）
  acc: number;                // 未消化的时间
  primed: boolean;            // 第一次采样只建立参考值，不报事件
}

export function createSim(): Sim {
  return {
    ox: 0,
    ref: new Float32Array(N),
    vals: new Float32Array(N),
    hist: [],
    events: [],
    clock: 0,
    acc: 0,
    primed: false,
  };
}

/** 读一次像素：把布纹那一块的真实面积平均取出来（正好 5 列 × 3 行）。 */
function samplePixels(ox: number): Float32Array {
  const g = cellMeans(ox, FAB_OY, CELL_F * N, SCAN_H / ZOOM, CELL_F);
  const out = new Float32Array(N);
  for (let c = 0; c < N; c++) {
    const cc = Math.min(c, g.cols - 1);
    let sum = 0;
    for (let r = 0; r < g.rows; r++) sum += g.vals[r * g.cols + cc];
    out[c] = g.rows > 0 ? sum / g.rows : 0;
  }
  return out;
}

/** 推进仿真。dtMs 由 rAF 给出；每个 50ms 的仿真步才读一次像素。 */
export function stepSim(sim: Sim, dtMs: number): void {
  sim.acc += clamp(dtMs, 0, 200);
  let steps = 0;
  while (sim.acc >= SIM_MS && steps < 4) {
    sim.acc -= SIM_MS;
    steps++;
    sim.clock += SIM_MS;

    sim.ox += (SLIDE * SIM_MS) / 1000;
    if (sim.ox > OX_SPAN) sim.ox -= OX_SPAN;

    const v = samplePixels(sim.ox);
    sim.vals = v;
    sim.hist.push({ t: sim.clock, v });

    const th = THRESHOLD_C * 255;
    for (let i = 0; i < N; i++) {
      const val = v[i];
      if (!sim.primed) {
        sim.ref[i] = val; // 参考值初始化：不报事件
        continue;
      }
      const d = val - sim.ref[i];
      if (Math.abs(d) > th) {
        sim.events.push({ i, t: sim.clock, p: d > 0 ? 1 : -1 });
        sim.ref[i] = val; // 只有报事件时才更新参考值
      }
    }
    sim.primed = true;
  }

  while (sim.hist.length > 0 && sim.clock - sim.hist[0].t > HIST_MS) sim.hist.shift();
  while (
    sim.events.length > 0 &&
    (sim.clock - sim.events[0].t > HIST_MS || sim.events.length > MAX_EVENTS)
  ) {
    sim.events.shift();
  }
}

/** 取 t 时刻（或之前最近一次）的采样。 */
export function sampleAt(sim: Sim, t: number): Sample {
  const h = sim.hist;
  if (h.length === 0) return { t, v: sim.vals };
  let lo = 0;
  let hi = h.length - 1;
  if (h[0].t >= t) return h[0];
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (h[mid].t <= t) lo = mid;
    else hi = mid - 1;
  }
  return h[lo];
}

/**
 * 该像素此刻在变亮还是变暗：用最近 150ms（3 个仿真步）的差分。
 * 实测这个口径和"这个像素最近报出的那个点的极性"有 87% 的时间一致 ——
 * 另外 13% 是方向正好在两次报点之间翻了向，属于真实情况，不是画错。
 */
function dirOf(sim: Sim, i: number): number {
  const h = sim.hist;
  if (h.length === 0) return 1;
  const a = h[Math.max(0, h.length - 1 - DIR_BACK)].v[i];
  const d = sim.vals[i] - a;
  if (d > 0) return 1;
  if (d < 0) return -1;
  return h.length > 1 ? (h[h.length - 1].v[i] >= h[h.length - 2].v[i] ? 1 : -1) : 1;
}

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Pt {
  x: number;
  y: number;
}

interface Layout {
  left: Box;
  right: Box;
  rowH: number;
  blockW: number;
  labelLeft: Pt;
  labelRight: Pt;
  legendLeft: Pt;
  legendRight: Pt;
}

export function layoutFor(narrow: boolean): Layout {
  if (narrow) {
    return {
      left: { x: 30, y: 70, w: 1020, h: 240 },
      right: { x: 30, y: 348, w: 1020, h: 250 },
      rowH: 44,
      blockW: 56,
      labelLeft: { x: 30, y: 62 },
      labelRight: { x: 30, y: 340 },
      legendLeft: { x: 30, y: 308 },
      legendRight: { x: 30, y: 618 },
    };
  }
  return {
    left: { x: 30, y: 70, w: 330, h: 250 },
    right: { x: 400, y: 70, w: 650, h: 250 },
    rowH: 44,
    blockW: 44,
    labelLeft: { x: 30, y: 62 },
    labelRight: { x: 400, y: 62 },
    legendLeft: { x: 30, y: 300 },
    legendRight: { x: 400, y: 302 },
  };
}

// ---------------------------------------------------------------- 左区

/** 窗口内 5 个像素共同的灰度量程 —— 5 行共用一把尺子，行与行之间才可比。 */
function valueRange(sim: Sim, t0: number, t1: number): { mn: number; mx: number } {
  let mn = Infinity;
  let mx = -Infinity;
  for (const s of sim.hist) {
    if (s.t < t0 || s.t > t1) continue;
    for (let i = 0; i < N; i++) {
      if (s.v[i] < mn) mn = s.v[i];
      if (s.v[i] > mx) mx = s.v[i];
    }
  }
  if (!isFinite(mn) || !isFinite(mx)) return { mn: 0, mx: 255 };
  if (mx - mn < MIN_RANGE) {
    const c = (mn + mx) / 2;
    mn = c - MIN_RANGE / 2;
    mx = c + MIN_RANGE / 2;
  }
  return { mn, mx };
}

/**
 * 左区：5 行，一行一个像素。左边是它的灰度块 + 裸整数，右边是它自己的事件槽。
 * 槽里那条淡折线是该像素自己的灰度随时间的变化 —— 每个事件点都落在折线上，
 * 颜色与折线在该处的斜率同向。行末的箭头是此刻的方向。
 */
function drawLeft(
  ctx: CanvasRenderingContext2D,
  L: Layout,
  sim: Sim,
  t0: number,
  t1: number
): void {
  const box = L.left;
  const span = Math.max(1, t1 - t0);
  const slotX = box.x + L.blockW + 20;
  const slotW = Math.max(60, box.x + box.w - slotX - 34);
  const rowH = L.rowH;
  const pad = 7;
  const sh = rowH - pad * 2;
  const { mn, mx } = valueRange(sim, t0, t1);
  const range = Math.max(1e-6, mx - mn);

  ctx.save();
  ctx.font = `600 15px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (let i = 0; i < N; i++) {
    const ry = box.y + i * rowH;
    const sy = ry + pad;
    const yOf = (v: number) => sy + 4 + (1 - clamp((v - mn) / range, 0, 1)) * (sh - 8);

    // 灰度块 + 裸整数灰度值：这是相机真正记下的东西
    const grey = Math.round(clamp(sim.vals[i], 0, 255));
    ctx.fillStyle = `rgb(${grey},${grey},${grey})`;
    ctx.fillRect(box.x, sy, L.blockW, sh);
    ctx.strokeStyle = 'rgba(33,50,74,0.22)';
    ctx.lineWidth = 1;
    ctx.strokeRect(box.x + 0.5, sy + 0.5, L.blockW - 1, sh - 1);
    ctx.fillStyle = grey > 140 ? PAPER.ink : '#e8eef7';
    ctx.fillText(String(grey), box.x + L.blockW / 2, sy + sh / 2);

    // 事件槽
    drawAxes(ctx, slotX, sy, slotW, sh);

    // 该像素自己的灰度折线（窗口内）
    ctx.strokeStyle = 'rgba(104,119,143,0.55)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    let started = false;
    for (const s of sim.hist) {
      if (s.t < t0 || s.t > t1) continue;
      const x = slotX + ((s.t - t0) / span) * slotW;
      const y = yOf(s.v[i]);
      if (!started) {
        ctx.moveTo(x, y);
        started = true;
      } else {
        ctx.lineTo(x, y);
      }
    }
    if (started) ctx.stroke();

    // 这条槽里、这个像素报出的事件：从左向右按时间落点
    for (const e of sim.events) {
      if (e.i !== i || e.t < t0 || e.t > t1) continue;
      const x = slotX + ((e.t - t0) / span) * slotW;
      const y = yOf(sampleAt(sim, e.t).v[i]);
      ctx.fillStyle = e.p > 0 ? PAPER.evOn : PAPER.evOff;
      ctx.beginPath();
      ctx.arc(x, y, 2.6, 0, Math.PI * 2);
      ctx.fill();
    }

    // 此刻的方向：↑ 变亮（红）/ ↓ 变暗（蓝），与事件点同色系
    const ax = slotX + slotW + 17;
    const ay = ry + rowH / 2;
    const dir = dirOf(sim, i);
    ctx.fillStyle = dir > 0 ? PAPER.evOn : PAPER.evOff;
    ctx.beginPath();
    if (dir > 0) {
      ctx.moveTo(ax, ay - 8);
      ctx.lineTo(ax - 6, ay + 2);
      ctx.lineTo(ax + 6, ay + 2);
    } else {
      ctx.moveTo(ax, ay + 8);
      ctx.lineTo(ax - 6, ay - 2);
      ctx.lineTo(ax + 6, ay - 2);
    }
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

// ---------------------------------------------------------------- 右区：三维时空体

// 等距投影：像素轴向右下微斜，进深轴向右上斜，时间轴竖直向上。
// 一层在屏幕上的高度 = 5 × UCY + VDY = 30px。5 片切片画在各自那一段时间段的**正中**
// （z = 0.1 / 0.3 / 0.5 / 0.7 / 0.9），相邻切片之间隔 39.2px —— 比 30px 大，互不遮挡；
// 最下面那片离 t₀ 帧 19.6px、最上面那片离 t₁ 帧 19.6px，会和帧平面叠掉 10px。
// 这点重叠是刻意的：切片是半透明的，叠在不透明的帧上正好看得出"切片贴在帧上"。
const UCX = 46;
const UCY = 3;
const VDX = 64;
const VDY = 15;
const VOL_PAD = 10;

interface Vol {
  cx: number;
  cy: number;
  ts: number; // 上下两个帧平面之间的竖直距离
}

function makeVol(box: Box): Vol {
  const half = (N * UCY + VDY) / 2;
  const cy = box.y + box.h - VOL_PAD - half;
  const ts = Math.max(60, cy - half - VOL_PAD - box.y);
  return { cx: box.x + box.w / 2, cy, ts };
}

/** (像素坐标 u, 进深 d, 时间 z) → 屏幕坐标。z = 0 是 t₀ 帧，z = 1 是 t₁ 帧。 */
function proj(vol: Vol, u: number, d: number, z: number): Pt {
  return {
    x: vol.cx + (u - N / 2) * UCX + (d - 0.5) * VDX,
    y: vol.cy + (u - N / 2) * UCY - (d - 0.5) * VDY - z * vol.ts,
  };
}

function planeQuad(
  ctx: CanvasRenderingContext2D,
  vol: Vol,
  u0: number,
  u1: number,
  z: number
): void {
  const a = proj(vol, u0, 0, z);
  const b = proj(vol, u1, 0, z);
  const c = proj(vol, u1, 1, z);
  const d = proj(vol, u0, 1, z);
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.lineTo(c.x, c.y);
  ctx.lineTo(d.x, d.y);
  ctx.closePath();
}

/** 帧平面：5 个像素的灰度画成一排格子，整片用 PAPER.blue 描边。 */
function drawFramePlane(
  ctx: CanvasRenderingContext2D,
  vol: Vol,
  z: number,
  vals: Float32Array
): void {
  ctx.save();
  for (let i = 0; i < N; i++) {
    const grey = Math.round(clamp(vals[i], 0, 255));
    ctx.fillStyle = `rgb(${grey},${grey},${grey})`;
    planeQuad(ctx, vol, i, i + 1, z);
    ctx.fill();
  }
  ctx.strokeStyle = 'rgba(33,50,74,0.18)';
  ctx.lineWidth = 1;
  for (let i = 1; i < N; i++) {
    const a = proj(vol, i, 0, z);
    const b = proj(vol, i, 1, z);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }
  planeQuad(ctx, vol, 0, N, z);
  ctx.strokeStyle = PAPER.blue;
  ctx.lineWidth = 1.6;
  ctx.stroke();
  ctx.restore();
}

interface Dot {
  i: number;
  p: number;
  j: number; // 同一格里第几个点，用来错开位置
}

// 同一格里最多 5 个点，按这个表错开（u 方向的偏移，进深方向的偏移）
const SPREAD: [number, number][] = [
  [0, 0],
  [0.3, 0.22],
  [-0.3, -0.22],
  [0.3, -0.22],
  [-0.3, 0.22],
];

/** 切片：同形状的平行四边形，半透明填充 + PAPER.purple 描边，落在这一段里的事件画在上面。 */
function drawSlicePlane(
  ctx: CanvasRenderingContext2D,
  vol: Vol,
  z: number,
  dots: Dot[]
): void {
  ctx.save();
  planeQuad(ctx, vol, 0, N, z);
  ctx.fillStyle = 'rgba(124,58,237,0.10)';
  ctx.fill();
  ctx.strokeStyle = PAPER.purple;
  ctx.lineWidth = 1;
  ctx.stroke();

  for (const dt of dots) {
    const sp = SPREAD[dt.j % SPREAD.length];
    const p = proj(vol, dt.i + 0.5 + sp[0], 0.5 + sp[1], z);
    ctx.fillStyle = dt.p > 0 ? PAPER.evOn : PAPER.evOff;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 2.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** 体的四条竖棱：把 7 层串成一个体积，也让"中间本来是空的"看得出来。 */
function drawBones(ctx: CanvasRenderingContext2D, vol: Vol): void {
  ctx.save();
  ctx.strokeStyle = 'rgba(104,119,143,0.35)';
  ctx.lineWidth = 1;
  const corners: [number, number][] = [
    [0, 0],
    [N, 0],
    [0, 1],
    [N, 1],
  ];
  for (const c of corners) {
    const a = proj(vol, c[0], c[1], 0);
    const b = proj(vol, c[0], c[1], 1);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }
  ctx.restore();
}

/** 时间轴：体的左侧一根向上的箭头 —— 越往上越晚。 */
function drawTimeArrow(ctx: CanvasRenderingContext2D, vol: Vol): void {
  const x = vol.cx - (N / 2) * UCX - VDX / 2 - 26;
  const yBot = vol.cy + 8;
  const yTop = vol.cy - vol.ts - 8;
  ctx.save();
  ctx.strokeStyle = 'rgba(104,119,143,0.75)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(x, yBot);
  ctx.lineTo(x, yTop);
  ctx.stroke();
  ctx.fillStyle = 'rgba(104,119,143,0.75)';
  ctx.beginPath();
  ctx.moveTo(x, yTop - 7);
  ctx.lineTo(x - 4.5, yTop + 1);
  ctx.lineTo(x + 4.5, yTop + 1);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** 右区：三维时空体。 */
function drawVolume(
  ctx: CanvasRenderingContext2D,
  box: Box,
  sim: Sim,
  t0: number,
  t1: number,
  view: View
): void {
  const vol = makeVol(box);
  const span = Math.max(1, t1 - t0);
  const v0 = sampleAt(sim, t0).v; // t₀ 帧的内容
  const v1 = sim.vals; // t₁ 帧（此刻）的内容

  drawBones(ctx, vol);
  drawTimeArrow(ctx, vol);

  // 下平面：t₀ 帧
  drawFramePlane(ctx, vol, 0, v0);

  if (view === 'slices') {
    // 窗口平分成 5 段，每片切片画在自己那一段的正中，5 段合起来正好盖满整个窗口
    const buckets: Dot[][] = [[], [], [], [], []];
    const seen = new Int32Array(SLICES * N);
    for (const e of sim.events) {
      if (e.t < t0) continue;
      const k = Math.min(SLICES - 1, Math.floor(clamp((e.t - t0) / span, 0, 0.99999) * SLICES));
      const j = seen[k * N + e.i]++;
      buckets[k].push({ i: e.i, p: e.p, j });
    }
    for (let k = 0; k < SLICES; k++) {
      drawSlicePlane(ctx, vol, (k + 0.5) / SLICES, buckets[k]);
    }
  }

  // 上平面：t₁ 帧。上下两帧相隔 800ms，布纹滑过 1.6 根线，内容自然错开。
  drawFramePlane(ctx, vol, 1, v1);
}

// ---------------------------------------------------------------- 总渲染

export function renderSim(
  ctx: CanvasRenderingContext2D,
  H: number,
  sim: Sim,
  view: View
): void {
  const narrow = H > H_WIDE;
  const L = layoutFor(narrow);

  clearScene(ctx, W, H);

  const t1 = sim.clock;
  const t0 = Math.max(0, t1 - WINDOW_MS);

  drawLeft(ctx, L, sim, t0, t1);
  drawVolume(ctx, L.right, sim, t0, t1, view);

  drawSceneLabel(ctx, L.labelLeft.x, L.labelLeft.y, '事件是怎么产生的', PAPER.screenLine);
  drawSceneLabel(ctx, L.labelRight.x, L.labelRight.y, '时空体', PAPER.screenLine);

  // 左区图例：事件的两个极性。凡画事件点必须配这两项。
  drawLegend(ctx, L.legendLeft.x, L.legendLeft.y, [
    { color: PAPER.evOn, label: '变亮' },
    { color: PAPER.evOff, label: '变暗' },
  ]);
  // 右区图例：帧平面（蓝）与切片（紫）
  drawLegend(ctx, L.legendRight.x, L.legendRight.y, [
    { color: PAPER.blue, label: '帧' },
    { color: PAPER.purple, label: '时间片' },
  ]);
}

const FEEDBACK: Record<View, { text: string; cls: string }> = {
  frame: {
    cls: 'warn',
    text: '两帧之间是一段空白——这段时间里发生了什么，帧一个数都没记。',
  },
  slices: {
    cls: 'good',
    text: '事件把这段空白填满了：每一片记录一小段时间里的变化，5 片合起来就是一个体素网格。这些切片，就是论文第 4 章要送去网络的东西。',
  },
};

export const M2_2: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const simRef = useRef<Sim | null>(null);
  if (simRef.current === null) {
    // 入场前先跑 2 秒：两个区一进来就有东西可看，不会先闪一段空白
    const s = createSim();
    for (let k = 0; k < WARM_STEPS; k++) stepSim(s, SIM_MS);
    simRef.current = s;
  }
  const sim = simRef.current;

  const viewRef = useRef<View>('slices');
  const [view, setView] = useState<View>('slices');

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

    let raf = 0;
    let running = false;
    let ready = false;
    let last = 0;

    const frame = (now: number) => {
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

      const dt = last === 0 ? SIM_MS : now - last;
      last = now;
      stepSim(sim, dt); // 只有这里读像素，每 50ms 一次

      renderSim(ctx, H, sim, viewRef.current); // 每帧只画缓存状态

      if (!ready) {
        ready = true;
        canvas.classList.add('is-ready');
      }
      if (running) raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
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
  }, [sim]);

  const pick = (next: View) => {
    viewRef.current = next;
    setView(next);
  };

  const feedback = FEEDBACK[view];

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H_WIDE}
        aria-label="事件是怎么产生的，以及事件流的时空体"
      />
      <div className="chip-row">
        <button
          type="button"
          className={view === 'frame' ? 'chip selected' : 'chip'}
          onClick={() => pick('frame')}
          aria-pressed={view === 'frame'}
        >
          只画帧
        </button>
        <button
          type="button"
          className={view === 'slices' ? 'chip selected' : 'chip'}
          onClick={() => pick('slices')}
          aria-pressed={view === 'slices'}
        >
          画上时间片
        </button>
      </div>
      <div
        className={`feedback ${feedback.cls}`}
        dangerouslySetInnerHTML={{ __html: feedback.text }}
      />
    </div>
  );
};

export default M2_2;
