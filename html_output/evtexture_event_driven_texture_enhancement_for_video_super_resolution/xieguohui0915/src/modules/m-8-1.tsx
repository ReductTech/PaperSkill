// §8.1 EvTexture++ 插件框架（按论文 Fig.7 的版式重画）
//
// 版式（从左到右，与 Fig.7 一致）：
//   LR 帧 → VSR 主干 → 三路输出（传播前特征 {f^bp} / 传播后特征 {f^ap} / 光流 {O^r}）
//   → EvTexture++（纹理分支 ITE ＋ 运动分支 MEMC/warp）→ 融合 → 上采样 → HR 帧
// 事件从左上角进入 EvTexture++，同时喂给纹理分支与运动分支；纹理分支有一条从
// 「传播前特征」来的上下文线，运动分支复用主干算好的光流（不重算）。
//
// 冻结的方块画六角雪花 + 蓝描边，可训练的方块画火焰 + 绿描边；chip 切换两种训练模式。
// 读数（迭代数 / 卡数天数）来自论文 Sec. IV-B，反馈文案照本节规范逐字给出。

import React, { useEffect, useRef, useState } from 'react';
import {
  setupCanvas,
  observeCanvas,
  clamp,
  lerp,
  lerpColor,
  easeInOutQuad,
} from '../lib/canvasKit';
import { clearScene, drawLegend, drawSceneLabel, PAPER } from './halftoneKit';
import { drawFabricPatch } from './fabricKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H_WIDE = 480;
const H_NARROW = 680;
const NARROW_W = 720;
const TRANSITION_MS = 420;
const FONT = '"Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';

type Mode = 'plugin' | 'standalone';

interface Pt {
  x: number;
  y: number;
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Layout {
  plate: Rect;
  events: Rect[];
  evtCap: Pt;
  rail: Pt[];
  lr: Rect[];
  lrCap: Pt;
  backbone: Rect;
  bbMark: Pt;
  outBp: Rect;
  outAp: Rect;
  outFlow: Rect;
  flowMark: Pt;
  evt: Rect;
  evtTitle: Pt;
  evtMark: Pt;
  tex: Rect;
  texTitle: Pt;
  texThumbs: Rect[];
  ite: Rect;
  ctxBox: Rect;
  mot: Rect;
  motTitle: Pt;
  memc: Rect;
  warp: Rect;
  plus: Pt;
  plusR: number;
  conv: Rect;
  fusion: Rect;
  upsample: Rect;
  upMark: Pt;
  hr: Rect[];
  hrCap: Pt;
  legend: Pt;
  railToMotion: Pt[];
  routeBp: Pt[];
  routeAp: Pt[];
  routeFlow: Pt[];
  texToFusion: Pt[];
  motToFusion: Pt[];
  fusionOut: Pt[];
  fuseToUp: Pt[];
  lblCtx: Pt;
  lblFlow: Pt;
}

// ---------------------------------------------------------------- 版式

const L_WIDE: Layout = {
  plate: { x: 8, y: 8, w: 1064, h: 464 },
  events: [
    { x: 30, y: 16, w: 30, h: 38 },
    { x: 66, y: 16, w: 30, h: 38 },
    { x: 102, y: 16, w: 30, h: 38 },
  ],
  evtCap: { x: 144, y: 54 },
  rail: [
    { x: 132, y: 30 },
    { x: 576, y: 30 },
    { x: 576, y: 134 },
  ],
  lr: [
    { x: 24, y: 140, w: 80, h: 52 },
    { x: 24, y: 212, w: 80, h: 52 },
    { x: 24, y: 284, w: 80, h: 52 },
  ],
  lrCap: { x: 24, y: 362 },
  backbone: { x: 118, y: 118, w: 52, h: 240 },
  bbMark: { x: 167, y: 115 },
  outBp: { x: 186, y: 102, w: 182, h: 74 },
  outAp: { x: 186, y: 201, w: 182, h: 74 },
  outFlow: { x: 186, y: 300, w: 182, h: 74 },
  flowMark: { x: 365, y: 297 },
  evt: { x: 384, y: 88, w: 436, h: 304 },
  evtTitle: { x: 810, y: 112 },
  evtMark: { x: 817, y: 82 },
  tex: { x: 444, y: 116, w: 204, h: 136 },
  texTitle: { x: 452, y: 134 },
  texThumbs: [
    { x: 460, y: 140, w: 52, h: 28 },
    { x: 520, y: 140, w: 52, h: 28 },
    { x: 580, y: 140, w: 52, h: 28 },
  ],
  ite: { x: 456, y: 180, w: 180, h: 28 },
  ctxBox: { x: 456, y: 220, w: 180, h: 26 },
  mot: { x: 444, y: 266, w: 204, h: 118 },
  motTitle: { x: 452, y: 284 },
  memc: { x: 460, y: 292, w: 108, h: 28 },
  warp: { x: 460, y: 334, w: 108, h: 42 },
  plus: { x: 588, y: 310 },
  plusR: 10,
  conv: { x: 608, y: 296, w: 32, h: 28 },
  fusion: { x: 664, y: 176, w: 84, h: 110 },
  upsample: { x: 834, y: 140, w: 50, h: 200 },
  upMark: { x: 881, y: 137 },
  hr: [
    { x: 900, y: 120, w: 120, h: 66 },
    { x: 900, y: 208, w: 120, h: 66 },
    { x: 900, y: 296, w: 120, h: 66 },
  ],
  hrCap: { x: 900, y: 392 },
  legend: { x: 858, y: 32 },
  railToMotion: [
    { x: 470, y: 254 },
    { x: 470, y: 288 },
  ],
  routeBp: [
    { x: 368, y: 139 },
    { x: 430, y: 139 },
    { x: 430, y: 239 },
    { x: 456, y: 239 },
  ],
  routeAp: [
    { x: 368, y: 238 },
    { x: 414, y: 238 },
    { x: 414, y: 344 },
    { x: 460, y: 344 },
  ],
  routeFlow: [
    { x: 368, y: 337 },
    { x: 396, y: 337 },
    { x: 396, y: 364 },
    { x: 460, y: 364 },
  ],
  texToFusion: [
    { x: 636, y: 194 },
    { x: 664, y: 194 },
  ],
  motToFusion: [
    { x: 640, y: 310 },
    { x: 656, y: 310 },
    { x: 656, y: 262 },
    { x: 664, y: 262 },
  ],
  fusionOut: [
    { x: 748, y: 231 },
    { x: 834, y: 231 },
  ],
  fuseToUp: [],
  lblCtx: { x: 390, y: 132 },
  lblFlow: { x: 386, y: 382 },
};

const L_NARROW: Layout = {
  plate: { x: 8, y: 8, w: 1064, h: 664 },
  events: [
    { x: 28, y: 16, w: 40, h: 44 },
    { x: 74, y: 16, w: 40, h: 44 },
    { x: 120, y: 16, w: 40, h: 44 },
  ],
  evtCap: { x: 172, y: 54 },
  rail: [
    { x: 160, y: 30 },
    { x: 700, y: 30 },
    { x: 700, y: 126 },
  ],
  lr: [
    { x: 28, y: 130, w: 160, h: 62 },
    { x: 28, y: 214, w: 160, h: 62 },
    { x: 28, y: 298, w: 160, h: 62 },
  ],
  lrCap: { x: 28, y: 390 },
  backbone: { x: 210, y: 110, w: 70, h: 270 },
  bbMark: { x: 277, y: 107 },
  outBp: { x: 300, y: 110, w: 240, h: 86 },
  outAp: { x: 300, y: 206, w: 240, h: 86 },
  outFlow: { x: 300, y: 302, w: 240, h: 86 },
  flowMark: { x: 537, y: 306 },
  evt: { x: 570, y: 88, w: 480, h: 286 },
  evtTitle: { x: 1038, y: 112 },
  evtMark: { x: 1047, y: 80 },
  tex: { x: 620, y: 108, w: 270, h: 142 },
  texTitle: { x: 628, y: 126 },
  texThumbs: [
    { x: 640, y: 132, w: 52, h: 26 },
    { x: 700, y: 132, w: 52, h: 26 },
    { x: 760, y: 132, w: 52, h: 26 },
  ],
  ite: { x: 636, y: 168, w: 224, h: 28 },
  ctxBox: { x: 636, y: 210, w: 224, h: 26 },
  mot: { x: 620, y: 262, w: 270, h: 112 },
  motTitle: { x: 628, y: 280 },
  memc: { x: 640, y: 290, w: 120, h: 28 },
  warp: { x: 640, y: 328, w: 120, h: 42 },
  plus: { x: 790, y: 320 },
  plusR: 11,
  conv: { x: 812, y: 306, w: 40, h: 28 },
  fusion: { x: 920, y: 170, w: 84, h: 110 },
  upsample: { x: 940, y: 460, w: 70, h: 210 },
  upMark: { x: 1007, y: 457 },
  hr: [
    { x: 300, y: 434, w: 320, h: 68 },
    { x: 300, y: 516, w: 320, h: 68 },
    { x: 300, y: 598, w: 320, h: 68 },
  ],
  hrCap: { x: 300, y: 424 },
  legend: { x: 790, y: 44 },
  railToMotion: [
    { x: 700, y: 252 },
    { x: 700, y: 286 },
  ],
  routeBp: [
    { x: 540, y: 153 },
    { x: 612, y: 153 },
    { x: 612, y: 228 },
    { x: 636, y: 228 },
  ],
  routeAp: [
    { x: 540, y: 249 },
    { x: 590, y: 249 },
    { x: 590, y: 336 },
    { x: 640, y: 336 },
  ],
  routeFlow: [
    { x: 540, y: 345 },
    { x: 576, y: 345 },
    { x: 576, y: 352 },
    { x: 640, y: 352 },
  ],
  texToFusion: [
    { x: 860, y: 182 },
    { x: 920, y: 182 },
  ],
  motToFusion: [
    { x: 852, y: 320 },
    { x: 910, y: 320 },
    { x: 910, y: 240 },
    { x: 920, y: 240 },
  ],
  fusionOut: [],
  fuseToUp: [
    { x: 962, y: 280 },
    { x: 962, y: 458 },
  ],
  lblCtx: { x: 572, y: 142 },
  lblFlow: { x: 578, y: 390 },
};

function layoutFor(narrow: boolean): Layout {
  return narrow ? L_NARROW : L_WIDE;
}

// ---------------------------------------------------------------- 状态

interface SceneState {
  mode: Mode;
  from: number;
  to: number;
  start: number;
}

const MODES: { id: Mode; label: string }[] = [
  { id: 'plugin', label: '插件模式' },
  { id: 'standalone', label: '独立模式' },
];

// 迭代数与训练耗时均取自论文 Sec. IV-B（4 张 RTX 3090）。
const READOUT: Record<Mode, string[]> = {
  plugin: ['迭代 20 万', '4 张 3090 约 6 天'],
  standalone: ['迭代 30 万', '4 张 3090 约 4 天'],
};

const FEEDBACK: Record<Mode, { text: string; cls: string }> = {
  plugin: {
    cls: 'good',
    text: '主干冻住不动，只训插件和上采样器。主干每次吐出三样东西：传播前的特征、传播后的特征、以及它自己算好的双向光流——插件直接拿来用，不重算。所以换任何现成模型都能挂上去。',
  },
  standalone: {
    cls: 'info',
    text: '没有现成主干可借，整条链路都要从零训：主干、插件、上采样器一起更新。迭代数更多，也稍快一点——因为它不需要另训一个主干。',
  },
};

// ---------------------------------------------------------------- 通用绘制

function roundRectPath(ctx: CanvasRenderingContext2D, r: Rect, radius: number): void {
  const rad = Math.max(0, Math.min(radius, r.w / 2, r.h / 2));
  ctx.beginPath();
  ctx.moveTo(r.x + rad, r.y);
  ctx.lineTo(r.x + r.w - rad, r.y);
  ctx.quadraticCurveTo(r.x + r.w, r.y, r.x + r.w, r.y + rad);
  ctx.lineTo(r.x + r.w, r.y + r.h - rad);
  ctx.quadraticCurveTo(r.x + r.w, r.y + r.h, r.x + r.w - rad, r.y + r.h);
  ctx.lineTo(r.x + rad, r.y + r.h);
  ctx.quadraticCurveTo(r.x, r.y + r.h, r.x, r.y + r.h - rad);
  ctx.lineTo(r.x, r.y + rad);
  ctx.quadraticCurveTo(r.x, r.y, r.x + rad, r.y);
  ctx.closePath();
}

function boxText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size: number,
  color: string,
  align: CanvasTextAlign = 'center'
): void {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = `${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(text, x, y);
  ctx.restore();
}

interface BoxStyle {
  fill?: string;
  stroke: string;
  dashed?: boolean;
  lw?: number;
  radius?: number;
}

function drawBox(ctx: CanvasRenderingContext2D, r: Rect, st: BoxStyle): void {
  ctx.save();
  ctx.fillStyle = st.fill ?? PAPER.print;
  roundRectPath(ctx, r, st.radius ?? 6);
  ctx.fill();
  ctx.strokeStyle = st.stroke;
  ctx.lineWidth = st.lw ?? 1.5;
  if (st.dashed) ctx.setLineDash([6, 4]);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

function arrowHead(ctx: CanvasRenderingContext2D, x: number, y: number, ang: number, size: number): void {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(
    x - Math.cos(ang) * size + Math.cos(ang + Math.PI / 2) * size * 0.5,
    y - Math.sin(ang) * size + Math.sin(ang + Math.PI / 2) * size * 0.5
  );
  ctx.lineTo(
    x - Math.cos(ang) * size + Math.cos(ang - Math.PI / 2) * size * 0.5,
    y - Math.sin(ang) * size + Math.sin(ang - Math.PI / 2) * size * 0.5
  );
  ctx.closePath();
  ctx.fill();
}

function drawRoute(
  ctx: CanvasRenderingContext2D,
  pts: Pt[],
  color: string,
  dashed: boolean,
  lw = 1.4
): void {
  if (pts.length < 2) return;
  const last = pts[pts.length - 1];
  const prev = pts[pts.length - 2];
  const dx = last.x - prev.x;
  const dy = last.y - prev.y;
  const len = Math.hypot(dx, dy);
  if (len < 0.5) return;
  const ang = Math.atan2(dy, dx);
  const head = Math.min(9, len * 0.7);

  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lw;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  if (dashed) ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length - 1; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.lineTo(last.x - Math.cos(ang) * head, last.y - Math.sin(ang) * head);
  ctx.stroke();
  ctx.setLineDash([]);
  arrowHead(ctx, last.x, last.y, ang, head);
  ctx.restore();
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  lw = 1.4
): void {
  drawRoute(ctx, [{ x: x1, y: y1 }, { x: x2, y: y2 }], color, false, lw);
}

// ---------------------------------------------------------------- 帧缩略图（缓存）

const THUMB_CELL: Record<string, number> = { lr: 7, hr: 3, evt: 5 };
const thumbCache = new Map<string, HTMLCanvasElement>();

/** 一帧画面：天空 / 岸树 / 水面 + 人物剪影，按格子大小量化 —— 格子越大越像低分辨率。 */
function paintFrame(
  g: CanvasRenderingContext2D,
  w: number,
  h: number,
  cell: number,
  kind: string
): void {
  const cols = Math.max(1, Math.round(w / cell));
  const rows = Math.max(1, Math.round(h / cell));
  const cw = w / cols;
  const ch = h / rows;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const u = (c + 0.5) / cols;
      const v = (r + 0.5) / rows;
      let col: string;
      if (kind === 'evt') {
        // 事件帧：极性图，亮 = 变亮，暗 = 变暗
        const s = (c * 73 + r * 149 + c * r * 7) % 11;
        col = s < 3 ? PAPER.evOn : s < 5 ? '#f3c9d0' : s > 8 ? PAPER.evOff : '#e8e3f2';
      } else {
        col = '#cfe0ea';
        if (v > 0.44) col = '#8fb3a8';
        if (v > 0.64) col = '#5f7f96';
        if (u < 0.32 && v > 0.30 && v < 0.62) col = '#7d9c86';
        if (u > 0.34 && u < 0.56 && v > 0.14 && v < 0.94) col = '#2b3a4a';
      }
      g.fillStyle = col;
      g.fillRect(c * cw, r * ch, cw + 0.5, ch + 0.5);
    }
  }
}

function thumbCanvas(w: number, h: number, kind: string): HTMLCanvasElement {
  const cell = THUMB_CELL[kind] ?? 5;
  const key = `${Math.round(w)}|${Math.round(h)}|${cell}|${kind}`;
  const hit = thumbCache.get(key);
  if (hit) return hit;
  const c = document.createElement('canvas');
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  c.width = Math.max(1, Math.round(w * dpr));
  c.height = Math.max(1, Math.round(h * dpr));
  const g = c.getContext('2d');
  if (g) {
    g.scale(dpr, dpr);
    paintFrame(g, w, h, cell, kind);
  }
  thumbCache.set(key, c);
  return c;
}

function drawThumb(ctx: CanvasRenderingContext2D, r: Rect, kind: string): void {
  ctx.save();
  ctx.fillStyle = 'rgba(33,50,74,0.10)';
  ctx.fillRect(r.x + 2.5, r.y + 2.5, r.w, r.h);
  ctx.drawImage(thumbCanvas(r.w, r.h, kind), r.x, r.y, r.w, r.h);
  ctx.strokeStyle = PAPER.printEdge;
  ctx.lineWidth = 1;
  ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
  ctx.restore();
}

// ---------------------------------------------------------------- 特征图 / 光流

/** 特征图：平行四边形，里面是真实的布纹（乘上色调），代表密密的特征通道。 */
function drawFeatureMap(
  ctx: CanvasRenderingContext2D,
  r: Rect,
  tint: string,
  ox: number
): void {
  const sk = Math.min(r.w * 0.28, r.h * 0.45);
  const path = (): void => {
    ctx.beginPath();
    ctx.moveTo(r.x + sk, r.y);
    ctx.lineTo(r.x + r.w, r.y);
    ctx.lineTo(r.x + r.w - sk, r.y + r.h);
    ctx.lineTo(r.x, r.y + r.h);
    ctx.closePath();
  };

  ctx.save();
  path();
  ctx.clip();
  ctx.fillStyle = PAPER.print;
  ctx.fillRect(r.x, r.y, r.w, r.h);
  drawFabricPatch(ctx, r.x, r.y, r.w, r.h, ox, 0);
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = tint;
  ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.restore();

  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  path();
  ctx.strokeStyle = 'rgba(33,50,74,0.55)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}

/** 光流：小块里画红 / 蓝两色的运动条纹。 */
function drawFlowPatch(ctx: CanvasRenderingContext2D, r: Rect, seed: number): void {
  const bands = 5;
  ctx.save();
  ctx.fillStyle = PAPER.print;
  ctx.fillRect(r.x, r.y, r.w, r.h);
  for (let i = 0; i < bands; i++) {
    const all = (seed + i * 3) % 2 === 0;
    ctx.fillStyle = all ? PAPER.evOn : PAPER.evOff;
    ctx.globalAlpha = 0.34 + 0.12 * ((i + seed) % 3);
    const bh = (r.h - 8) / bands;
    ctx.fillRect(r.x + 4 + ((i * 5 + seed * 3) % 6), r.y + 4 + i * bh, r.w - 8 - ((i * 5) % 5), bh * 0.62);
  }
  ctx.globalAlpha = 1;
  ctx.strokeStyle = 'rgba(33,50,74,0.45)';
  ctx.lineWidth = 1;
  ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
  ctx.restore();
}

/** 三路输出方块：虚线框 + 三张特征图（或两块光流）+ 名称。 */
function drawOutputBox(
  ctx: CanvasRenderingContext2D,
  r: Rect,
  kind: 'bp' | 'ap' | 'flow',
  edge: string
): void {
  drawBox(ctx, r, { stroke: edge, dashed: true, lw: 1.6 });
  const top = r.y + r.h * 0.13;
  const ch = r.h * 0.42;
  if (kind === 'flow') {
    const pw = r.w * 0.28;
    const gap = r.w * 0.08;
    const total = pw * 2 + gap;
    const x0 = r.x + (r.w - total) / 2;
    drawFlowPatch(ctx, { x: x0, y: top, w: pw, h: ch }, 0);
    drawFlowPatch(ctx, { x: x0 + pw + gap, y: top, w: pw, h: ch }, 1);
  } else {
    const pw = r.w * 0.245;
    const gap = r.w * 0.075;
    const total = pw * 3 + gap * 2;
    const x0 = r.x + (r.w - total) / 2;
    const tint = kind === 'bp' ? '#f0dc9c' : '#d9c8f2';
    for (let i = 0; i < 3; i++) {
      drawFeatureMap(ctx, { x: x0 + i * (pw + gap), y: top, w: pw, h: ch }, tint, i * 61);
    }
  }
  const name = kind === 'bp' ? '传播前特征' : kind === 'ap' ? '传播后特征' : '光流';
  boxText(
    ctx,
    name,
    r.x + r.w / 2,
    r.y + r.h - r.h * 0.15,
    clamp(r.h * 0.2, 11, 16),
    PAPER.ink
  );
}

// ---------------------------------------------------------------- 冻结 / 可训练标记

/** 六角雪花：六段短线 + 每段两笔小分叉。 */
function drawSnowflake(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rad: number,
  alpha: number,
  color: string
): void {
  if (alpha <= 0.02 || rad <= 0.5) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.6;
  ctx.lineCap = 'round';
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i;
    const dx = Math.cos(a);
    const dy = Math.sin(a);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + dx * rad, y + dy * rad);
    ctx.stroke();
    const bx = x + dx * rad * 0.62;
    const by = y + dy * rad * 0.62;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx + Math.cos(a + 0.75) * rad * 0.34, by + Math.sin(a + 0.75) * rad * 0.34);
    ctx.moveTo(bx, by);
    ctx.lineTo(bx + Math.cos(a - 0.75) * rad * 0.34, by + Math.sin(a - 0.75) * rad * 0.34);
    ctx.stroke();
  }
  ctx.restore();
}

/** 火焰：外弧一圈 + 内弧一簇，两段弧线。 */
function drawFlame(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rad: number,
  alpha: number,
  color: string
): void {
  if (alpha <= 0.02 || rad <= 0.5) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-rad * 0.72, rad * 0.92);
  ctx.quadraticCurveTo(-rad * 1.1, -rad * 0.4, 0, -rad * 1.18);
  ctx.quadraticCurveTo(rad * 1.1, -rad * 0.4, rad * 0.72, rad * 0.92);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-rad * 0.3, rad * 0.92);
  ctx.quadraticCurveTo(-rad * 0.5, rad * 0.02, 0, -rad * 0.46);
  ctx.quadraticCurveTo(rad * 0.5, rad * 0.02, rad * 0.3, rad * 0.92);
  ctx.stroke();
  ctx.restore();
}

/** trainT = 1 画火焰（可训练），trainT = 0 画雪花（冻结），中间是切换动画。 */
function drawMarker(ctx: CanvasRenderingContext2D, p: Pt, trainT: number): void {
  const t = clamp(trainT, 0, 1);
  drawSnowflake(ctx, p.x, p.y, 11.5 * (1 - 0.3 * t), 1 - t, PAPER.blue);
  drawFlame(ctx, p.x, p.y, 11.5 * (0.7 + 0.3 * t), t, PAPER.green);
}

// ---------------------------------------------------------------- 主绘制

function render(
  ctx: CanvasRenderingContext2D,
  H: number,
  narrow: boolean,
  s: SceneState,
  now: number
): void {
  const L = layoutFor(narrow);
  const t = clamp((now - s.start) / TRANSITION_MS, 0, 1);
  const mix = lerp(s.from, s.to, easeInOutQuad(t));

  // 主干与光流：插件模式下冻结（蓝 / 雪花），独立模式下一并解冻（绿 / 火焰）
  const bbCol = lerpColor(PAPER.blue, PAPER.green, mix);
  const flowCol = lerpColor(PAPER.blue, PAPER.green, mix);
  const bbTrain = mix;
  const flowTrain = mix;

  clearScene(ctx, W, H);

  // ---- 图版 ----
  ctx.save();
  ctx.fillStyle = 'rgba(33,50,74,0.10)';
  roundRectPath(ctx, { x: L.plate.x + 3, y: L.plate.y + 3, w: L.plate.w, h: L.plate.h }, 12);
  ctx.fill();
  ctx.fillStyle = PAPER.print;
  roundRectPath(ctx, L.plate, 12);
  ctx.fill();
  ctx.strokeStyle = PAPER.printEdge;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();

  // ---- 事件（左上角，紫色）+ 主线 ----
  for (const e of L.events) drawThumb(ctx, e, 'evt');
  boxText(ctx, '事件', L.evtCap.x, L.evtCap.y, 14, PAPER.purple);
  drawRoute(ctx, L.rail, PAPER.purple, true, 1.6);

  // ---- LR 帧 → VSR 主干 ----
  for (const f of L.lr) drawThumb(ctx, f, 'lr');
  // 「LR 帧」「HR 帧」「事件」是图内题注（和论文原图里的 L.R Frames / HR Frames / Events 一样），
  // 与被命名的图形同属图表内容；画布上的短标签只留给「上下文」「复用光流」两处。
  boxText(ctx, 'LR 帧', L.lrCap.x, L.lrCap.y, 14, PAPER.ink, 'left');
  for (const f of L.lr) {
    drawArrow(ctx, f.x + f.w, f.y + f.h / 2, L.backbone.x, f.y + f.h / 2, PAPER.muted, 1.2);
  }

  drawBox(ctx, L.backbone, { stroke: bbCol, lw: 2, radius: 10, fill: 'rgba(39,68,110,0.05)' });
  ctx.save();
  ctx.translate(L.backbone.x + L.backbone.w / 2, L.backbone.y + L.backbone.h / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = PAPER.ink;
  ctx.font = `16px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('VSR 主干', 0, 0);
  ctx.restore();
  drawMarker(ctx, L.bbMark, bbTrain);

  // ---- 三路输出 ----
  drawArrow(ctx, L.backbone.x + L.backbone.w, L.outBp.y + L.outBp.h / 2, L.outBp.x, L.outBp.y + L.outBp.h / 2, PAPER.muted, 1.2);
  drawArrow(ctx, L.backbone.x + L.backbone.w, L.outAp.y + L.outAp.h / 2, L.outAp.x, L.outAp.y + L.outAp.h / 2, PAPER.muted, 1.2);
  drawArrow(ctx, L.backbone.x + L.backbone.w, L.outFlow.y + L.outFlow.h / 2, L.outFlow.x, L.outFlow.y + L.outFlow.h / 2, PAPER.muted, 1.2);

  drawOutputBox(ctx, L.outBp, 'bp', PAPER.orange);
  drawOutputBox(ctx, L.outAp, 'ap', PAPER.purple);
  drawOutputBox(ctx, L.outFlow, 'flow', flowCol);
  drawMarker(ctx, L.flowMark, flowTrain);

  // ---- 三条输入线：上下文 / 传播后特征 / 光流 ----
  drawRoute(ctx, L.routeBp, PAPER.muted, true);
  drawRoute(ctx, L.routeAp, PAPER.muted, true);
  drawRoute(ctx, L.routeFlow, PAPER.muted, true);

  // ---- EvTexture++ 大框（可训练：绿色虚线）----
  drawBox(ctx, L.evt, { stroke: PAPER.green, dashed: true, lw: 1.8, radius: 10, fill: 'rgba(34,141,92,0.045)' });
  boxText(ctx, 'EvTexture++', L.evtTitle.x, L.evtTitle.y, 17, PAPER.green, 'right');
  drawMarker(ctx, L.evtMark, 1);

  // 事件：喂给纹理分支（主线末端），再分一路给运动分支
  drawRoute(ctx, L.railToMotion, PAPER.purple, true, 1.6);

  // ---- 纹理分支（ITERATIVE TEXTURE ENHANCEMENT）----
  drawBox(ctx, L.tex, { stroke: PAPER.red, dashed: true, lw: 1.4, radius: 8, fill: 'rgba(196,63,82,0.045)' });
  boxText(ctx, '纹理分支', L.texTitle.x, L.texTitle.y, 13, PAPER.red, 'left');
  for (const th of L.texThumbs) drawThumb(ctx, th, 'evt');
  for (const th of L.texThumbs) {
    drawArrow(ctx, th.x + th.w / 2, th.y + th.h + 2, th.x + th.w / 2, L.ite.y - 2, PAPER.red, 1.2);
  }
  drawBox(ctx, L.ite, { stroke: PAPER.red, lw: 1.4, radius: 4, fill: PAPER.print });
  boxText(ctx, '迭代纹理增强', L.ite.x + L.ite.w / 2, L.ite.y + L.ite.h * 0.68, clamp(L.ite.h * 0.52, 11, 14), PAPER.ink);
  for (const th of L.texThumbs) {
    drawArrow(ctx, th.x + th.w / 2, L.ctxBox.y - 2, th.x + th.w / 2, L.ite.y + L.ite.h + 2, PAPER.red, 1.2);
  }
  drawBox(ctx, L.ctxBox, { stroke: PAPER.red, lw: 1.4, radius: 4, fill: PAPER.print });
  boxText(ctx, '上下文特征', L.ctxBox.x + L.ctxBox.w / 2, L.ctxBox.y + L.ctxBox.h * 0.7, clamp(L.ctxBox.h * 0.52, 11, 14), PAPER.ink);

  // ---- 运动分支（MEMC + 特征 warp）----
  drawBox(ctx, L.mot, { stroke: PAPER.purple, dashed: true, lw: 1.4, radius: 8, fill: 'rgba(124,58,237,0.05)' });
  boxText(ctx, '运动分支', L.motTitle.x, L.motTitle.y, 13, PAPER.purple, 'left');
  drawBox(ctx, L.memc, { stroke: PAPER.purple, lw: 1.4, radius: 4, fill: PAPER.print });
  boxText(ctx, '事件 MEMC', L.memc.x + L.memc.w / 2, L.memc.y + L.memc.h * 0.68, clamp(L.memc.h * 0.5, 11, 14), PAPER.ink);
  drawBox(ctx, L.warp, { stroke: PAPER.purple, lw: 1.4, radius: 4, fill: PAPER.print });
  boxText(ctx, '特征 warp', L.warp.x + L.warp.w / 2, L.warp.y + L.warp.h / 2 + 4, clamp(L.warp.h * 0.36, 11, 14), PAPER.ink);

  const p = L.plus;
  ctx.save();
  ctx.fillStyle = PAPER.print;
  ctx.strokeStyle = PAPER.ink;
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.arc(p.x, p.y, L.plusR, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = PAPER.ink;
  ctx.font = `13px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('C', p.x, p.y + 1);
  ctx.restore();

  drawArrow(ctx, L.memc.x + L.memc.w, L.memc.y + L.memc.h * 0.5, p.x - L.plusR - 1, p.y - L.plusR * 0.45, PAPER.ink, 1.2);
  drawArrow(ctx, L.warp.x + L.warp.w, L.warp.y + L.warp.h * 0.55, p.x - L.plusR * 0.5, p.y + L.plusR + 1, PAPER.ink, 1.2);

  drawBox(ctx, L.conv, { stroke: PAPER.ink, lw: 1.3, radius: 4, fill: PAPER.print });
  boxText(ctx, '1×1', L.conv.x + L.conv.w / 2, L.conv.y + L.conv.h * 0.68, clamp(L.conv.h * 0.5, 11, 13), PAPER.ink);
  drawArrow(ctx, p.x + L.plusR + 1, p.y, L.conv.x - 1, p.y, PAPER.ink, 1.2);

  // ---- 融合 → 上采样 ----
  drawRoute(ctx, L.texToFusion, PAPER.red, false);
  drawRoute(ctx, L.motToFusion, PAPER.ink, false);
  drawBox(ctx, L.fusion, { stroke: PAPER.ink, lw: 1.6, radius: 6, fill: PAPER.print });
  boxText(ctx, '融合', L.fusion.x + L.fusion.w / 2, L.fusion.y + L.fusion.h / 2 + 6, 15, PAPER.ink);
  drawRoute(ctx, L.fusionOut, PAPER.ink, false);

  drawBox(ctx, L.upsample, { stroke: PAPER.green, lw: 2, radius: 10, fill: 'rgba(34,141,92,0.05)' });
  ctx.save();
  ctx.translate(L.upsample.x + L.upsample.w / 2, L.upsample.y + L.upsample.h / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = PAPER.ink;
  ctx.font = `16px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('上采样', 0, 0);
  ctx.restore();
  drawMarker(ctx, L.upMark, 1);

  // ---- HR 帧 ----
  for (const f of L.hr) {
    drawArrow(
      ctx,
      narrow ? L.upsample.x : L.upsample.x + L.upsample.w,
      f.y + f.h / 2,
      narrow ? f.x + f.w : f.x,
      f.y + f.h / 2,
      PAPER.muted,
      1.2
    );
  }
  for (const f of L.hr) drawThumb(ctx, f, 'hr');
  boxText(ctx, 'HR 帧', L.hrCap.x, L.hrCap.y, 14, PAPER.ink, 'left');

  // ---- 图例（两项：可训练 / 冻结）----
  drawLegend(ctx, L.legend.x, L.legend.y, [
    { color: PAPER.green, label: '可训练' },
    { color: PAPER.blue, label: '冻结' },
  ]);

  // ---- 两处短标签：上下文 / 复用光流 ----
  drawSceneLabel(ctx, L.lblCtx.x, L.lblCtx.y, '上下文', PAPER.muted);
  drawSceneLabel(ctx, L.lblFlow.x, L.lblFlow.y, '复用光流', PAPER.muted);

  // 窄屏把链路拆成上下两条带，融合与上采样之间用这一条竖线接上
  drawRoute(ctx, L.fuseToUp, PAPER.ink, false);
}

// ---------------------------------------------------------------- 组件

export const M8_1: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<SceneState>({
    mode: 'plugin',
    from: 0,
    to: 0,
    start: 0,
  });

  const [mode, setMode] = useState<Mode>('plugin');
  const [feedback, setFeedback] = useState<{ text: string; cls: string }>(FEEDBACK.plugin);

  const pick = (next: Mode): void => {
    if (next === stateRef.current.mode) return;
    const s = stateRef.current;
    const now = performance.now();
    const t = clamp((now - s.start) / TRANSITION_MS, 0, 1);
    s.from = lerp(s.from, s.to, easeInOutQuad(t));
    s.to = next === 'standalone' ? 1 : 0;
    s.start = now;
    s.mode = next;
    setMode(next);
    setFeedback(FEEDBACK[next]);
  };

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

    const frame = (now: number): void => {
      if (!running) return;
      const shownW = canvas.getBoundingClientRect().width;
      const narrow = shownW > 0 && shownW < NARROW_W;
      const wantH = narrow ? H_NARROW : H_WIDE;
      if (wantH !== H) {
        H = wantH;
        try {
          ctx = setupCanvas(canvas, W, H);
        } catch {
          running = false;
          return;
        }
      }
      render(ctx, H, narrow, stateRef.current, now);
      if (!ready) {
        ready = true;
        canvas.classList.add('is-ready');
      }
      raf = requestAnimationFrame(frame);
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

    const disconnect = observeCanvas(canvas, start, stop);
    start();
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const readout = READOUT[mode];

  return (
    <>
      <canvas ref={canvasRef} aria-label="EvTexture++ 插件框架与两种训练模式" />
      <div className="chip-row">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            className={`chip${mode === m.id ? ' selected' : ''}`}
            onClick={() => pick(m.id)}
          >
            {m.label}
          </button>
        ))}
      </div>
      <div className="ctrl" style={{ justifyContent: 'center', margin: '10px 0 0' }}>
        <span className="val">{readout[0]}</span>
      </div>
      <div className="ctrl" style={{ justifyContent: 'center', margin: '2px 0 4px' }}>
        <span className="val">{readout[1]}</span>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </>
  );
};

export default M8_1;
