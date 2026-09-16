import React from 'react';
import { lerp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Shared calligraphy-practice drawing kit (owned by packet p0). Every widget
// imports its helpers from here so all ten chapters share one 书案 look.

export interface Pt {
  x: number;
  y: number;
}

export const PALETTE = {
  bg: '#f5f8f0', // 书案安静底色
  paper: '#fffdf6', // 宣纸纸面
  grid: '#d7deea', // 田字格 / 轴
  ink: '#21324a', // 主墨色
  muted: '#68778f', // 淡墨
  guide: '#92400e', // 字帖范迹 / 工具柄
  blue: '#27446e', // 指引 / 当前状态
  green: '#228d5c', // 成功 / 修正后
  red: '#c43f52', // 失败 / 盲写偏差
  orange: '#f07e47', // 用户强调
  purple: '#7c3aed', // 辅助概念
  envDark: '#76906a', // 墨渍 / 深环境
  envLight: '#b8c9a7', // 浅环境
} as const;

export const FONT = '"Segoe UI", "Microsoft YaHei", sans-serif';

/** Deterministic seeded RNG (mulberry32) so slider positions render stably. */
export function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 书案 background + 宣纸 sheet (+ optional 田字格). */
export function drawScene(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  opts?: { sheet?: boolean; grid?: boolean; margin?: number }
): void {
  const { sheet = true, grid = false, margin = 10 } = opts ?? {};
  ctx.fillStyle = PALETTE.bg;
  ctx.fillRect(0, 0, w, h);
  if (!sheet) return;
  const sw = w - margin * 2;
  const sh = h - margin * 2;
  ctx.fillStyle = PALETTE.paper;
  ctx.fillRect(margin, margin, sw, sh);
  ctx.strokeStyle = PALETTE.grid;
  ctx.lineWidth = 1;
  ctx.strokeRect(margin + 0.5, margin + 0.5, sw - 1, sh - 1);
  if (grid) {
    ctx.save();
    ctx.strokeStyle = PALETTE.grid;
    ctx.globalAlpha = 0.75;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(w / 2, margin);
    ctx.lineTo(w / 2, h - margin);
    ctx.moveTo(margin, h / 2);
    ctx.lineTo(w - margin, h / 2);
    ctx.stroke();
    ctx.restore();
  }
}

/** The protagonist: 毛笔. Tip touches (x, y); handle leans by `angle` rad. */
export function drawBrush(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle = 0.3,
  size = 30,
  tipColor: string = PALETTE.blue
): void {
  const dx = Math.sin(angle);
  const dy = -Math.cos(angle);
  ctx.save();
  ctx.lineCap = 'round';
  ctx.strokeStyle = tipColor;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + dx * 7, y + dy * 7);
  ctx.stroke();
  ctx.strokeStyle = PALETTE.guide;
  ctx.lineWidth = 4.5;
  ctx.beginPath();
  ctx.moveTo(x + dx * 7, y + dy * 7);
  ctx.lineTo(x + dx * size, y + dy * size);
  ctx.stroke();
  ctx.fillStyle = tipColor;
  ctx.beginPath();
  ctx.arc(x, y, 2.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Executed ink stroke (solid, round joins). */
export function drawInkPath(
  ctx: CanvasRenderingContext2D,
  pts: Pt[],
  opts?: { color?: string; width?: number; alpha?: number }
): void {
  if (pts.length < 2) return;
  const { color = PALETTE.blue, width = 4, alpha = 1 } = opts ?? {};
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.stroke();
  ctx.restore();
}

/** Imagined / preview stroke (dashed, 55% alpha). */
export function drawGhostPath(
  ctx: CanvasRenderingContext2D,
  pts: Pt[],
  opts?: { color?: string; width?: number; dash?: number[]; alpha?: number }
): void {
  if (pts.length < 2) return;
  const { color = PALETTE.blue, width = 2, dash = [6, 5], alpha = 0.55 } = opts ?? {};
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.setLineDash(dash);
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.stroke();
  ctx.restore();
}

/** 字帖范迹 (dashed #92400e, 60% alpha). */
export function drawGuide(ctx: CanvasRenderingContext2D, pts: Pt[]): void {
  if (pts.length < 2) return;
  ctx.save();
  ctx.globalAlpha = 0.6;
  ctx.strokeStyle = PALETTE.guide;
  ctx.lineWidth = 2;
  ctx.setLineDash([7, 6]);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.stroke();
  ctx.restore();
}

/** 目标笔位 (green ring) or 印章 (red seal square with 白文 mark). */
export function drawTarget(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  opts?: { r?: number; color?: string; seal?: boolean }
): void {
  const { r = 9, color = PALETTE.green, seal = false } = opts ?? {};
  ctx.save();
  if (seal) {
    ctx.fillStyle = PALETTE.red;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
    ctx.strokeStyle = PALETTE.paper;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(x - r * 0.45, y);
    ctx.lineTo(x + r * 0.45, y);
    ctx.moveTo(x, y - r * 0.45);
    ctx.lineTo(x, y + r * 0.45);
    ctx.stroke();
  } else {
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

/** 砚台 prop (dark ellipse + ink pool). */
export function drawInkStone(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  opts?: { w?: number; h?: number }
): void {
  const { w = 84, h = 30 } = opts ?? {};
  ctx.save();
  ctx.fillStyle = PALETTE.envDark;
  ctx.beginPath();
  ctx.ellipse(x, y, w / 2, h / 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2f3e2e';
  ctx.beginPath();
  ctx.ellipse(x + 4, y - 2, w / 2 - 14, h / 2 - 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Default faint example glyph (「永」骨架, relative 0–1 coords). */
export const DEFAULT_GLYPH: Pt[][] = [
  [
    { x: 0.5, y: 0.08 },
    { x: 0.44, y: 0.28 },
    { x: 0.32, y: 0.42 },
  ],
  [
    { x: 0.2, y: 0.32 },
    { x: 0.62, y: 0.32 },
  ],
  [
    { x: 0.5, y: 0.18 },
    { x: 0.5, y: 0.6 },
  ],
  [
    { x: 0.5, y: 0.34 },
    { x: 0.26, y: 0.5 },
    { x: 0.16, y: 0.68 },
  ],
  [
    { x: 0.5, y: 0.34 },
    { x: 0.74, y: 0.5 },
    { x: 0.84, y: 0.68 },
  ],
];

/** 字帖 prop: paper card + faint example glyph. */
export function drawCopybook(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  opts?: { glyph?: Pt[][]; color?: string }
): void {
  const { glyph = DEFAULT_GLYPH, color = PALETTE.guide } = opts ?? {};
  ctx.save();
  ctx.fillStyle = PALETTE.paper;
  ctx.strokeStyle = PALETTE.grid;
  ctx.lineWidth = 1;
  ctx.fillRect(x, y, w, h);
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  const pad = Math.min(w, h) * 0.14;
  ctx.globalAlpha = 0.5;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  for (const stroke of glyph) {
    if (!stroke.length) continue;
    ctx.beginPath();
    ctx.moveTo(x + pad + stroke[0].x * (w - pad * 2), y + pad + stroke[0].y * (h - pad * 2));
    for (let i = 1; i < stroke.length; i++) {
      ctx.lineTo(x + pad + stroke[i].x * (w - pad * 2), y + pad + stroke[i].y * (h - pad * 2));
    }
    ctx.stroke();
  }
  ctx.restore();
}

/** Muted 13px scene label. */
export function drawSceneLabel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
  opts?: { color?: string; size?: number; align?: CanvasTextAlign }
): void {
  const { color = PALETTE.muted, size = 13, align = 'left' } = opts ?? {};
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = `${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
  ctx.restore();
}

/** ≤3-entry horizontal legend at (x, y). */
export function drawLegend(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  items: { color: string; text: string }[],
  opts?: { size?: number }
): void {
  const { size = 12 } = opts ?? {};
  ctx.save();
  ctx.font = `${size}px ${FONT}`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  let cx = x;
  for (const it of items) {
    ctx.fillStyle = it.color;
    ctx.fillRect(cx, y - 4, 9, 8);
    cx += 13;
    ctx.fillStyle = PALETTE.muted;
    ctx.fillText(it.text, cx, y);
    cx += ctx.measureText(it.text).width + 14;
  }
  ctx.restore();
}

/** Sample a smooth stroke polyline through control points (quadratic segments). */
export function strokePath(start: Pt, ctrl: Pt[], end: Pt, n = 48): Pt[] {
  const pts: Pt[] = [];
  const quad = (p0: Pt, p1: Pt, p2: Pt, m: number) => {
    for (let i = 1; i <= m; i++) {
      const t = i / m;
      const u = 1 - t;
      pts.push({
        x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
        y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y,
      });
    }
  };
  if (ctrl.length === 0) {
    pts.unshift(start);
    for (let i = 1; i <= n; i++) {
      const t = i / n;
      pts.push({ x: lerp(start.x, end.x, t), y: lerp(start.y, end.y, t) });
    }
    return pts;
  }
  if (ctrl.length === 1) {
    pts.unshift(start);
    quad(start, ctrl[0], end, n);
    return pts;
  }
  const anchors: Pt[] = [start];
  for (let i = 0; i < ctrl.length - 1; i++) {
    anchors.push({
      x: (ctrl[i].x + ctrl[i + 1].x) / 2,
      y: (ctrl[i].y + ctrl[i + 1].y) / 2,
    });
  }
  const segs: [Pt, Pt, Pt][] = [];
  for (let i = 0; i < ctrl.length; i++) {
    const a = anchors[i];
    const c = ctrl[i];
    const b = i === ctrl.length - 1 ? end : anchors[i + 1];
    segs.push([a, c, b]);
  }
  const per = Math.max(4, Math.round(n / segs.length));
  pts.unshift(start);
  for (const [a, c, b] of segs) quad(a, c, b, per);
  return pts;
}

// Registry placeholder — never referenced by chapter data.
export const ThemeKit: React.FC<WidgetProps> = () => null;
