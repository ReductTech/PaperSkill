// woodKit.ts — shared drawing kit for the "hand-planing a board" metaphor.
// Pure Canvas helpers only; no React, no component export.
// Every paper-specific widget imports from this file so the board, bench,
// plane, straightedge and shavings are drawn identically across the tutorial.

export const FIELD = '#f5f8f0';
export const WOOD = '#b8c9a7';
export const WOOD_DARK = '#76906a';
export const BENCH = '#92400e';
export const GUIDE = '#27446e';
export const OK = '#228d5c';
export const BAD = '#c43f52';
export const EMPH = '#f07e47';
export const AUX = '#7c3aed';
export const INK = '#21324a';
export const MUTED = '#68778f';
export const LINE = '#d7deea';

const FONT = '"Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';

export function clearScene(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = FIELD;
  ctx.fillRect(0, 0, w, h);
  const benchY = Math.round(h * 0.84);
  ctx.fillStyle = BENCH;
  ctx.fillRect(0, benchY, w, h - benchY);
  ctx.fillStyle = WOOD_DARK;
  ctx.fillRect(0, benchY, w, 2);
}

export interface BoardOpts {
  color?: string;
  profileColor?: string;
}

export function drawBoard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  profile?: number[] | null,
  opts?: BoardOpts
): void {
  const o = opts || {};
  ctx.fillStyle = o.color || WOOD;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = WOOD_DARK;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x + 0.75, y + 0.75, w - 1.5, h - 1.5);
  if (profile && profile.length > 1) {
    ctx.strokeStyle = o.profileColor || INK;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < profile.length; i++) {
      const px = x + (w * i) / (profile.length - 1);
      const py = y - Math.max(0, profile[i]);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }
}

export interface PlaneOpts {
  length?: number;
  flip?: boolean;
  ghost?: boolean;
}

export function drawPlane(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  opts?: PlaneOpts
): void {
  const o = opts || {};
  const len = o.length || 54;
  ctx.save();
  ctx.globalAlpha = o.ghost ? 0.35 : 1;
  ctx.fillStyle = BENCH;
  ctx.fillRect(x - len / 2, y - 12, len, 12);
  ctx.fillStyle = WOOD_DARK;
  ctx.fillRect(x - len / 2, y - 12, len, 3);
  ctx.fillStyle = INK;
  ctx.fillRect(o.flip ? x - len / 2 : x + len / 2 - 2, y - 4, 2, 4);
  ctx.restore();
}

export function drawShavings(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  t: number,
  amount: number
): void {
  const n = Math.max(0, Math.min(3, Math.round(amount)));
  ctx.strokeStyle = BENCH;
  ctx.lineWidth = 1.5;
  for (let i = 0; i < n; i++) {
    const a = t * Math.PI * 2 + i * 1.7;
    ctx.beginPath();
    ctx.arc(x + i * 9 - 9, y + Math.sin(a) * 3, 4 + (i % 2), 0.6, 4.2);
    ctx.stroke();
  }
}

export function drawGapWedge(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  gap: number
): void {
  if (gap <= 0) return;
  ctx.fillStyle = BAD;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w / 2, y + gap);
  ctx.closePath();
  ctx.fill();
}

export function drawStraightedge(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  gap: number
): void {
  if (gap > 0) {
    drawGapWedge(ctx, x, y, w, gap);
  } else {
    ctx.strokeStyle = OK;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w, y);
    ctx.stroke();
  }
  ctx.fillStyle = GUIDE;
  ctx.fillRect(x, y - 7, w, 7);
  ctx.fillStyle = EMPH;
  ctx.fillRect(x + w - 4, y - 7, 4, 7);
}

export function drawTarget(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  state: 'reached' | 'pending'
): void {
  ctx.fillStyle = state === 'reached' ? OK : GUIDE;
  ctx.beginPath();
  ctx.arc(x, y, 4, 0, Math.PI * 2);
  ctx.fill();
}

export function drawModeMark(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  kind: 'left' | 'right'
): void {
  ctx.strokeStyle = GUIDE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  if (kind === 'left') {
    ctx.moveTo(x + 10, y);
    ctx.lineTo(x - 10, y);
    ctx.lineTo(x - 5, y - 5);
  } else {
    ctx.moveTo(x - 10, y);
    ctx.lineTo(x + 10, y);
    ctx.lineTo(x + 5, y - 5);
  }
  ctx.stroke();
}

export function drawSceneLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color?: string
): void {
  ctx.fillStyle = color || INK;
  ctx.font = '18px ' + FONT;
  ctx.textAlign = 'left';
  ctx.fillText(text, x, y);
}

export interface LegendItem {
  color: string;
  text: string;
}

export function drawLegend(
  ctx: CanvasRenderingContext2D,
  items: LegendItem[],
  x: number,
  y: number
): void {
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
}

/** Deterministic pseudo-random in [0,1) so noise profiles are reproducible across renders. */
export function seeded(seed: number): () => number {
  let s = seed >>> 0;
  return function () {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** Build a reproducible surface profile whose amplitude is scaled by `amp`. */
export function makeProfile(n: number, amp: number, seed: number): number[] {
  const rnd = seeded(seed);
  const raw: number[] = [];
  for (let i = 0; i < n; i++) raw.push(rnd() * 2 - 1);
  // Smooth once so the profile reads as a board surface rather than white noise.
  const smoothed = raw.map((_, i) => {
    const a = raw[Math.max(0, i - 1)];
    const b = raw[i];
    const c = raw[Math.min(raw.length - 1, i + 1)];
    return (a + 2 * b + c) / 4;
  });
  return smoothed.map((v) => v * amp);
}
