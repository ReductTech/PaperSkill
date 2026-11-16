// Paper-specific Canvas drawing kit for the YOLO-World tutorial.
// One shared visual world: a classroom on a chalkboard-green field. A teacher copies the class
// roster into the attendance book ONCE, then a single glance is enough to call every name.
// Written once by the coordinator; every packet widget imports from here.
//
// Semantic colors: red = failure / old method, blue = guidance / current,
// green = success / paper method, orange = emphasis, purple = auxiliary.

import { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp } from './canvasKit';

export const COLORS = {
  board: '#22352f',
  board2: '#2b4239',
  chalk: '#f2f5f0',
  chalkDim: '#9fb3a8',
  desk: '#33483d',
  roster: '#fdfaf0',
  ink: '#1d2b25',
  muted: '#8c9a8f',
  name: '#4f8cc9',
  book: '#e0a52a',
  fast: '#2f7d4f',
  back: '#6d5bd0',
  bad: '#c0392b',
  axis: '#3d5347',
} as const;

const FONT = '"Segoe UI", "PingFang SC", "Hiragino Sans GB", sans-serif';

/** Board field + faint chalk rules + optional <=8-char corner label. */
export function clearScene(ctx: CanvasRenderingContext2D, w: number, h: number, label?: string): void {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = COLORS.board;
  ctx.fillRect(0, 0, w, h);
  // faint chalkboard smudges
  ctx.strokeStyle = 'rgba(159,179,168,0.10)';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 5; i += 1) {
    const y = (h / 5) * i + 10;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y + 4);
    ctx.stroke();
  }
  if (label) drawLabel(ctx, label, 12, 20, { color: COLORS.chalkDim, size: 13 });
}

/** The classroom desk grid. `highlight` marks columns or individual desks. */
export function drawDesks(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  opts: { rows?: number; cols?: number; highlightCol?: number; highlight?: Array<{ r: number; c: number }> } = {}
): void {
  const rows = Math.max(1, opts.rows ?? 3);
  const cols = Math.max(1, opts.cols ?? 4);
  const cw = w / cols;
  const ch = h / rows;
  ctx.save();
  if (opts.highlightCol !== undefined) {
    ctx.fillStyle = 'rgba(224,165,42,0.16)';
    ctx.fillRect(x + opts.highlightCol * cw, y, cw, h);
  }
  (opts.highlight ?? []).forEach(({ r, c }) => {
    ctx.fillStyle = 'rgba(224,165,42,0.22)';
    ctx.fillRect(x + c * cw, y + r * ch, cw, ch);
  });
  // desks
  ctx.strokeStyle = COLORS.axis;
  ctx.lineWidth = 2;
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const dx = x + c * cw + cw * 0.14;
      const dy = y + r * ch + ch * 0.62;
      const dw = cw * 0.72;
      const dh = ch * 0.26;
      ctx.beginPath();
      ctx.rect(dx, dy, dw, dh);
      ctx.fillStyle = COLORS.desk;
      ctx.fill();
      ctx.stroke();
    }
  }
  ctx.restore();
}

/** One seated child. kind = sit | hand | look */
export function drawKid(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  opts: { kind?: 'sit' | 'hand' | 'look'; dim?: boolean; highlight?: boolean } = {}
): void {
  const kind = opts.kind ?? 'sit';
  const color = opts.dim ? COLORS.chalkDim : COLORS.chalk;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.globalAlpha = opts.dim ? 0.42 : 1;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  // head
  ctx.beginPath();
  ctx.arc(0, -13, 4, 0, Math.PI * 2);
  ctx.fill();
  // shoulders / torso
  ctx.beginPath();
  ctx.moveTo(-5.5, -6);
  ctx.quadraticCurveTo(0, -9, 5.5, -6);
  ctx.lineTo(5.5, 4);
  ctx.lineTo(-5.5, 4);
  ctx.closePath();
  ctx.stroke();
  // arms
  ctx.beginPath();
  if (kind === 'hand') {
    ctx.moveTo(5, -3);
    ctx.lineTo(9, -16);
  } else if (kind === 'look') {
    ctx.moveTo(-5, -2);
    ctx.lineTo(-9, 3);
  } else {
    ctx.moveTo(-5, -2);
    ctx.lineTo(5, -2);
  }
  ctx.stroke();
  ctx.restore();
  if (opts.highlight) drawRing(ctx, x, y - 6, 16 * s, { color: COLORS.book, weight: 3 });
}

/** A ring marker (used for highlighted seats). */
export function drawRing(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  opts: { color?: string; weight?: number; dashed?: boolean } = {}
): void {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = opts.color ?? COLORS.book;
  ctx.lineWidth = opts.weight ?? 3;
  if (opts.dashed) ctx.setLineDash([6, 5]);
  ctx.stroke();
  ctx.restore();
}

/** The roster sheet / attendance book. */
export function drawRoster(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  opts: { lines?: number; active?: number; struck?: number; labels?: string[]; compact?: boolean; locked?: boolean } = {}
): void {
  const lines = Math.max(1, opts.lines ?? 6);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.fillStyle = COLORS.roster;
  ctx.fill();
  ctx.strokeStyle = COLORS.axis;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // binding strip
  ctx.fillStyle = 'rgba(224,165,42,0.5)';
  ctx.fillRect(x, y, 5, h);
  const rowH = (h - 10) / (opts.compact ? 1 : Math.max(1, Math.min(lines, 8)));
  const shown = opts.compact ? 1 : Math.min(lines, 8);
  for (let i = 0; i < shown; i += 1) {
    const ry = y + 6 + i * rowH;
    if (opts.active === i) {
      ctx.fillStyle = 'rgba(79,140,201,0.18)';
      ctx.fillRect(x + 6, ry - 1, w - 10, rowH - 2);
    }
    ctx.beginPath();
    ctx.moveTo(x + 12, ry + rowH * 0.58);
    ctx.lineTo(x + w - 10, ry + rowH * 0.58);
    ctx.strokeStyle = opts.struck === i ? COLORS.bad : COLORS.axis;
    ctx.lineWidth = opts.struck === i ? 2 : 2.5;
    ctx.stroke();
    if (opts.labels && opts.labels[i]) {
      drawLabel(ctx, opts.labels[i], x + 14, ry + rowH * 0.46, {
        color: opts.struck === i ? COLORS.bad : COLORS.ink,
        size: 13,
      });
    }
  }
  if (opts.locked) {
    ctx.strokeStyle = COLORS.book;
    ctx.lineWidth = 3;
    ctx.strokeRect(x - 3, y - 3, w + 6, h + 6);
  }
  ctx.restore();
}

/** One handwritten name chip. */
export function drawName(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  opts: { text?: string; active?: boolean; width?: number } = {}
): void {
  const w = opts.width ?? 64;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, 22);
  ctx.fillStyle = opts.active ? 'rgba(224,165,42,0.30)' : 'rgba(253,250,240,0.92)';
  ctx.fill();
  ctx.strokeStyle = opts.active ? COLORS.book : COLORS.axis;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
  if (opts.text) drawLabel(ctx, opts.text, x + 6, y + 16, { color: COLORS.ink, size: 13 });
}

/** Name -> desk attention beam (text-to-image). */
export function drawBeam(
  ctx: CanvasRenderingContext2D,
  from: [number, number],
  to: [number, number],
  opts: { active?: boolean; label?: string; width?: number } = {}
): void {
  const active = opts.active !== false;
  ctx.save();
  const grad = ctx.createLinearGradient(from[0], from[1], to[0], to[1]);
  grad.addColorStop(0, active ? 'rgba(224,165,42,0.85)' : 'rgba(140,154,143,0.5)');
  grad.addColorStop(1, active ? 'rgba(224,165,42,0.12)' : 'rgba(140,154,143,0.08)');
  ctx.beginPath();
  ctx.moveTo(from[0], from[1]);
  ctx.lineTo(to[0], to[1]);
  ctx.strokeStyle = active ? COLORS.book : COLORS.muted;
  ctx.lineWidth = opts.width ?? (active ? 3 : 2);
  if (!active) ctx.setLineDash([6, 5]);
  ctx.stroke();
  // cone hint
  ctx.beginPath();
  ctx.moveTo(from[0], from[1]);
  ctx.lineTo(to[0] - 10, to[1] - 12);
  ctx.moveTo(from[0], from[1]);
  ctx.lineTo(to[0] - 10, to[1] + 12);
  ctx.strokeStyle = grad;
  ctx.lineWidth = 1.5;
  ctx.globalAlpha = 0.6;
  ctx.stroke();
  ctx.restore();
  if (opts.label) drawLabel(ctx, opts.label, (from[0] + to[0]) / 2 - 16, (from[1] + to[1]) / 2 - 8, { color: COLORS.chalkDim, size: 13 });
}

/** Desk -> roster return arrow (image-to-text). */
export function drawGlance(
  ctx: CanvasRenderingContext2D,
  from: [number, number],
  to: [number, number],
  opts: { active?: boolean } = {}
): void {
  const active = opts.active !== false;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(from[0], from[1]);
  ctx.quadraticCurveTo((from[0] + to[0]) / 2, (from[1] + to[1]) / 2 - 26, to[0], to[1]);
  ctx.strokeStyle = active ? COLORS.back : COLORS.muted;
  ctx.lineWidth = active ? 2.5 : 2;
  if (!active) ctx.setLineDash([6, 5]);
  ctx.stroke();
  // arrow head
  const ang = Math.atan2(to[1] - ((from[1] + to[1]) / 2 - 26), to[0] - ((from[0] + to[0]) / 2));
  ctx.beginPath();
  ctx.moveTo(to[0], to[1]);
  ctx.lineTo(to[0] - 8 * Math.cos(ang - 0.4), to[1] - 8 * Math.sin(ang - 0.4));
  ctx.moveTo(to[0], to[1]);
  ctx.lineTo(to[0] - 8 * Math.cos(ang + 0.4), to[1] - 8 * Math.sin(ang + 0.4));
  ctx.stroke();
  ctx.restore();
}

/** Tick / cross for a name match. */
export function drawTick(ctx: CanvasRenderingContext2D, x: number, y: number, opts: { ok?: boolean } = {}): void {
  const ok = opts.ok !== false;
  ctx.save();
  ctx.strokeStyle = ok ? COLORS.fast : COLORS.bad;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  if (ok) {
    ctx.moveTo(x - 7, y);
    ctx.lineTo(x - 1, y + 7);
    ctx.lineTo(x + 9, y - 8);
  } else {
    ctx.moveTo(x - 6, y - 6);
    ctx.lineTo(x + 6, y + 6);
    ctx.moveTo(x + 6, y - 6);
    ctx.lineTo(x - 6, y + 6);
  }
  ctx.stroke();
  ctx.restore();
}

/** The stopwatch. progress in [0,1] sweeps the hand. */
export function drawClock(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, opts: { progress?: number } = {}): void {
  const p = clamp(opts.progress ?? 0, 0, 1);
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.strokeStyle = COLORS.chalk;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  // crown
  ctx.beginPath();
  ctx.moveTo(x - 4, y - r - 4);
  ctx.lineTo(x + 4, y - r - 4);
  ctx.lineWidth = 3;
  ctx.stroke();
  // hand
  const a = -Math.PI / 2 + p * Math.PI * 2;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.cos(a) * r * 0.7, y + Math.sin(a) * r * 0.7);
  ctx.strokeStyle = COLORS.book;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y, 2.5, 0, Math.PI * 2);
  ctx.fillStyle = COLORS.chalk;
  ctx.fill();
  ctx.restore();
}

/** Horizontal meter, semantic coloring. 'down' = lower is better. */
export function drawMeter(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  value: number,
  opts: { direction?: 'up' | 'down'; label?: string; axisMax?: number; muted?: boolean; color?: string } = {}
): void {
  const direction = opts.direction ?? 'up';
  const v = clamp(value, 0, 1);
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.fillStyle = 'rgba(61,83,71,0.85)';
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = COLORS.axis;
  ctx.stroke();
  const good = direction === 'up' ? v : 1 - v;
  const color = opts.color ?? (opts.muted ? COLORS.muted : good > 0.66 ? COLORS.fast : good < 0.33 ? COLORS.bad : COLORS.name);
  ctx.fillStyle = color;
  ctx.fillRect(x + 1.5, y + 1.5, Math.max(0, (w - 3) * v), h - 3);
  if (opts.axisMax !== undefined) {
    ctx.font = `13px ${FONT}`;
    ctx.fillStyle = COLORS.chalkDim;
    ctx.textAlign = 'right';
    ctx.fillText(String(opts.axisMax), x + w, y - 6);
  }
  if (opts.label) drawLabel(ctx, opts.label, x, y + h + 18, { color: COLORS.chalkDim, size: 13 });
}

/** In-Canvas label, capped at 8 characters by convention. */
export function drawLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  opts: { color?: string; size?: number; align?: CanvasTextAlign; bold?: boolean } = {}
): void {
  ctx.save();
  ctx.font = `${opts.bold ? '600 ' : ''}${opts.size ?? 15}px ${FONT}`;
  ctx.fillStyle = opts.color ?? COLORS.chalk;
  ctx.textAlign = opts.align ?? 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(text.slice(0, 8), x, y);
  ctx.restore();
}

/** One compact legend of at most 3 entries. */
export function drawLegend(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  items: Array<{ color: string; text: string }>
): void {
  const shown = items.slice(0, 3);
  ctx.save();
  ctx.font = `13px ${FONT}`;
  ctx.textBaseline = 'middle';
  let cx = x;
  shown.forEach((item) => {
    ctx.beginPath();
    ctx.arc(cx + 5, y, 5, 0, Math.PI * 2);
    ctx.fillStyle = item.color;
    ctx.fill();
    ctx.fillStyle = COLORS.chalkDim;
    ctx.textAlign = 'left';
    ctx.fillText(item.text, cx + 15, y);
    cx += 15 + ctx.measureText(item.text).width + 26;
  });
  ctx.restore();
}

export { clamp, lerp };

/** Shared canvas hook: HiDPI, off-screen pausing, rAF loop, `is-ready`. */
export function useCanvas<T>(
  draw: (ctx: CanvasRenderingContext2D, time: number, state: T) => void,
  w: number,
  h: number,
  stateRef: React.MutableRefObject<T>
): { ref: React.RefObject<HTMLCanvasElement>; ready: boolean } {
  const ref = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const drawRef = useRef(draw);
  drawRef.current = draw;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, w, h);
    } catch {
      return;
    }
    canvas.style.width = '100%';
    canvas.style.height = 'auto';
    let raf: number | null = null;
    const tick = (time: number) => {
      drawRef.current(ctx, time, stateRef.current);
      if (!canvas.classList.contains('is-ready')) {
        canvas.classList.add('is-ready');
        setReady(true);
      }
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf !== null) cancelAnimationFrame(raf);
      raf = null;
    };
    const start = () => {
      if (raf === null) raf = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, [w, h, stateRef]);

  return { ref, ready };
}
