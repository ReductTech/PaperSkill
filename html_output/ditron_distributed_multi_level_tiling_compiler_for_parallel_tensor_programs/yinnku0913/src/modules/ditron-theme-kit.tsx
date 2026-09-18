import React from 'react';
import type { WidgetProps } from './registry';

// ============================================================================
// DITRON shared Canvas drawing kit ("铺地砖" theme).
// Every paper-specific widget imports its scene helpers from this file so the
// whole tutorial keeps one visual world: one quiet floor, one recurring hand
// with a trowel, one straightedge, one mortar bucket, one tile-state palette.
// Line weights: 2px structure, 3px active, 1px grid. No gradients on Canvas.
// ============================================================================

export const KIT = {
  // contract.md §5 semantic roles (stable in every chapter)
  quiet: '#f5f8f0',
  lightEnv: '#b8c9a7',
  darkEnv: '#76906a',
  support: '#92400e',
  guidance: '#27446e',
  success: '#228d5c',
  failure: '#c43f52',
  emphasis: '#f07e47',
  auxiliary: '#7c3aed',
  text: '#21324a',
  muted: '#68778f',
  border: '#d7deea',
  // paper-specific scene neutrals (mirrors src/styles/paper.css :root overrides)
  tileFace: '#e8e2d4',
  tileEdge: '#c9bfa8',
  mortar: '#b8c9a7',
} as const;

export type TileState = 'idle' | 'local' | 'remote' | 'current' | 'done' | 'blocked';

const STATE_FILL: Record<TileState, string> = {
  idle: KIT.tileFace,
  local: KIT.guidance,
  remote: KIT.auxiliary,
  current: KIT.emphasis,
  done: KIT.success,
  blocked: KIT.failure,
};

export function tileFill(state: TileState): string {
  return STATE_FILL[state];
}

/**
 * Loop clock for the automatic animations.
 * `seconds` MUST be seconds (pass `elapsedMs / 1000`), never milliseconds:
 * mixing the two makes the phase jump to a near-random value every frame and
 * the scene strobes. Returns the normalised phase plus a soft envelope that
 * fades a repeating scene in at the start of its cycle and out at the end, so
 * the loop never snaps back to its first frame.
 */
export function cyclePhase(seconds: number, period: number): { t: number; env: number } {
  const raw = seconds % period;
  const t = (raw < 0 ? raw + period : raw) / period;
  const fade = 0.09;
  const e = Math.max(0, Math.min(1, Math.min(t, 1 - t) / fade));
  return { t, env: e * e * (3 - 2 * e) };
}

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.lineTo(x + w - rad, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rad);
  ctx.lineTo(x + w, y + h - rad);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
  ctx.lineTo(x + rad, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rad);
  ctx.lineTo(x, y + rad);
  ctx.quadraticCurveTo(x, y, x + rad, y);
  ctx.closePath();
}

/** Quiet floor field + ground band. Always the first call in a render. */
export function dTileGround(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = KIT.quiet;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = KIT.lightEnv;
  ctx.fillRect(0, h - 26, w, 26);
  ctx.strokeStyle = KIT.darkEnv;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, h - 26);
  ctx.lineTo(w, h - 26);
  ctx.stroke();
}

/** One tile. `t` (seconds) only drives the pulse of the `current` state. */
export function dTile(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  cell: number,
  state: TileState,
  t = 0
): void {
  rr(ctx, x, y, cell, cell, 4);
  ctx.fillStyle = tileFill(state);
  const base = ctx.globalAlpha;
  ctx.globalAlpha = base * (state === 'idle' ? 0.55 : 1);
  ctx.fill();
  ctx.globalAlpha = base;
  ctx.strokeStyle = state === 'idle' ? KIT.border : KIT.text;
  ctx.lineWidth = state === 'current' ? 2.5 : 1.5;
  ctx.stroke();
  if (state === 'current') {
    ctx.globalAlpha = base * (0.35 + 0.25 * Math.sin(t * 4));
    rr(ctx, x - 3, y - 3, cell + 6, cell + 6, 6);
    ctx.strokeStyle = KIT.emphasis;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.globalAlpha = base;
  }
  if (state === 'blocked') {
    ctx.save();
    ctx.strokeStyle = KIT.quiet;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + cell * 0.25, y + cell * 0.75);
    ctx.lineTo(x + cell * 0.75, y + cell * 0.25);
    ctx.stroke();
    ctx.restore();
  }
}

export interface GridOpts {
  gap?: number;
  stateAt?: (col: number, row: number) => TileState;
  frame?: boolean;
}

/** Tile grid. Coordinates are the top-left corner of the grid. */
export function dGrid(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  cols: number,
  rows: number,
  cell: number,
  opts: GridOpts = {},
  t = 0
): void {
  const gap = opts.gap ?? 2;
  if (opts.frame !== false) {
    ctx.strokeStyle = KIT.border;
    ctx.lineWidth = 1;
    ctx.strokeRect(x - 6, y - 6, cols * (cell + gap) + 10, rows * (cell + gap) + 10);
  }
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const state: TileState = opts.stateAt ? opts.stateAt(c, r) : 'idle';
      dTile(ctx, x + c * (cell + gap), y + r * (cell + gap), cell, state, t);
    }
  }
}

/** Recurring protagonist: a hand holding a trowel. `t` (seconds) adds a gentle bob. */
export function dHand(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  t: number,
  color: string = KIT.text
): void {
  const bob = Math.sin(t * 2.2) * 2;
  ctx.save();
  ctx.translate(x, y + bob);
  // forearm + hand
  ctx.fillStyle = KIT.support;
  rr(ctx, -34, -6, 30, 12, 5);
  ctx.fill();
  ctx.fillStyle = color;
  rr(ctx, -8, -8, 16, 16, 5);
  ctx.fill();
  // trowel handle + blade
  ctx.strokeStyle = KIT.support;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(6, 0);
  ctx.lineTo(20, 6);
  ctx.stroke();
  ctx.fillStyle = KIT.border;
  ctx.beginPath();
  ctx.moveTo(20, 0);
  ctx.lineTo(40, 8);
  ctx.lineTo(20, 16);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = KIT.muted;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}

/** Straightedge / datum line — the alignment motif. */
export function dRule(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string = KIT.support
): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  const len = Math.hypot(x2 - x1, y2 - y1) || 1;
  const nx = (-(y2 - y1) / len) * 7;
  const ny = ((x2 - x1) / len) * 7;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x1 - nx, y1 - ny);
  ctx.lineTo(x1 + nx, y1 + ny);
  ctx.moveTo(x2 - nx, y2 - ny);
  ctx.lineTo(x2 + nx, y2 + ny);
  ctx.stroke();
}

/** Mortar bucket prop. */
export function dBucket(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.fillStyle = KIT.darkEnv;
  ctx.beginPath();
  ctx.moveTo(x - 14, y - 18);
  ctx.lineTo(x + 14, y - 18);
  ctx.lineTo(x + 10, y);
  ctx.lineTo(x - 10, y);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = KIT.mortar;
  ctx.fillRect(x - 12, y - 16, 24, 5);
  ctx.strokeStyle = KIT.support;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y - 18, 14, Math.PI, 0);
  ctx.stroke();
}

/** rank × time lane frame for the overlap views. Returns the lane height. */
export function dTimeline(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  rows: number
): number {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = KIT.border;
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, w, h);
  const laneH = h / rows;
  ctx.strokeStyle = KIT.border;
  for (let i = 1; i < rows; i += 1) {
    ctx.beginPath();
    ctx.moveTo(x, y + i * laneH);
    ctx.lineTo(x + w, y + i * laneH);
    ctx.stroke();
  }
  return laneH;
}

/** Trade-off / speedup bar with a light track. */
export function dBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  frac: number,
  color: string
): void {
  const f = Math.max(0, Math.min(1, frac));
  ctx.fillStyle = '#ffffff';
  rr(ctx, x, y, w, h, 4);
  ctx.fill();
  ctx.strokeStyle = KIT.border;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = color;
  rr(ctx, x + 1, y + 1, Math.max(2, (w - 2) * f), h - 2, 3);
  ctx.fill();
}

/** Shared label style. Keep text to <= 8 characters. */
export function dLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color: string = KIT.text,
  align: CanvasTextAlign = 'left'
): void {
  ctx.fillStyle = color;
  ctx.font = '600 16px "Segoe UI", "Microsoft YaHei", sans-serif';
  ctx.textAlign = align;
  ctx.fillText(text, x, y);
  ctx.textAlign = 'left';
}

/** Compact legend, at most three entries. */
export function dLegend(
  ctx: CanvasRenderingContext2D,
  items: { color: string; text: string }[],
  x: number,
  y: number
): void {
  let cx = x;
  ctx.font = '500 13px "Segoe UI", "Microsoft YaHei", sans-serif';
  items.slice(0, 3).forEach((item) => {
    ctx.fillStyle = item.color;
    ctx.fillRect(cx, y - 9, 10, 10);
    ctx.fillStyle = KIT.muted;
    ctx.fillText(item.text, cx + 14, y);
    cx += 14 + ctx.measureText(item.text).width + 16;
  });
}

// The kit is never referenced from tutorial.ts; this trivial component exists so
// the packet assembler can register the file like any other widget.
export const DitronThemeKit: React.FC<WidgetProps> = () => (
  <div className="module-desc">绘制工具包（不单独展示）。</div>
);

export default DitronThemeKit;
