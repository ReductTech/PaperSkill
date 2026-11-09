// Paper-specific Canvas drawing kit for the Grounding DINO tutorial.
// One shared visual world: a training pitch and a written requirements card. A scout reads the
// card, circles a few candidates, then walks up and confirms each one — still holding the card.
// Written once by the coordinator; every packet widget imports from here.
//
// Semantic colors: red = failure / old method, blue = guidance / current,
// green = success / paper method, orange = user emphasis, purple = auxiliary.

import { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp } from './canvasKit';

export const COLORS = {
  pitch: '#eef7ee',
  pitch2: '#dcecdc',
  line: '#b9d4b9',
  ink: '#1f3a2b',
  muted: '#8c9a8f',
  card: '#ffffff',
  ring: '#d99a17',
  fuse: '#5b46c9',
  confirm: '#1d7f7a',
  box: '#2f6bb0',
  good: '#2f7d4f',
  bad: '#c0392b',
  axis: '#cfdcd0',
} as const;

const FONT = '"Segoe UI", "PingFang SC", "Hiragino Sans GB", sans-serif';

/** Pitch field + touch-lines + optional <=8-char corner label. */
export function clearScene(ctx: CanvasRenderingContext2D, w: number, h: number, label?: string): void {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = COLORS.pitch;
  ctx.fillRect(0, 0, w, h);
  // mown stripes
  ctx.fillStyle = 'rgba(185,212,185,0.22)';
  const band = w / 10;
  for (let i = 0; i < 10; i += 2) ctx.fillRect(i * band, 0, band, h);
  if (label) drawLabel(ctx, label, 12, 20, { color: COLORS.muted, size: 13 });
}

/** The field divided into a token grid, with optional player spots. */
export function drawPitch(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  opts: { rows?: number; cols?: number; spots?: Array<{ r: number; c: number }>; highlight?: Array<{ r: number; c: number }> } = {}
): void {
  const rows = Math.max(1, opts.rows ?? 4);
  const cols = Math.max(1, opts.cols ?? 6);
  const cw = w / cols;
  const ch = h / rows;
  ctx.save();
  // outer touch-line
  ctx.strokeStyle = COLORS.line;
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);
  // token grid
  ctx.strokeStyle = 'rgba(185,212,185,0.85)';
  ctx.lineWidth = 1.5;
  for (let c = 1; c < cols; c += 1) {
    ctx.beginPath();
    ctx.moveTo(x + c * cw, y);
    ctx.lineTo(x + c * cw, y + h);
    ctx.stroke();
  }
  for (let r = 1; r < rows; r += 1) {
    ctx.beginPath();
    ctx.moveTo(x, y + r * ch);
    ctx.lineTo(x + w, y + r * ch);
    ctx.stroke();
  }
  // highlighted cells
  (opts.highlight ?? []).forEach(({ r, c }) => {
    ctx.fillStyle = 'rgba(217,154,23,0.22)';
    ctx.fillRect(x + c * cw, y + r * ch, cw, ch);
  });
  // players
  (opts.spots ?? []).forEach(({ r, c }) => {
    drawPlayer(ctx, x + (c + 0.5) * cw, y + (r + 0.5) * ch, 0.85, {});
  });
  ctx.restore();
}

/** One player figure. kind = stand | run | jump */
export function drawPlayer(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  opts: { kind?: 'stand' | 'run' | 'jump'; highlight?: boolean; dim?: boolean } = {}
): void {
  const kind = opts.kind ?? 'stand';
  const color = opts.dim ? COLORS.muted : opts.highlight ? COLORS.ink : COLORS.ink;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.globalAlpha = opts.dim ? 0.45 : 1;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  // head
  ctx.beginPath();
  ctx.arc(0, -11, 3.4, 0, Math.PI * 2);
  ctx.fill();
  // torso
  ctx.beginPath();
  ctx.moveTo(0, -7.5);
  ctx.lineTo(0, 2);
  ctx.stroke();
  // arms
  ctx.beginPath();
  if (kind === 'jump') {
    ctx.moveTo(-5, -8);
    ctx.lineTo(0, -5);
    ctx.lineTo(5, -8);
  } else if (kind === 'run') {
    ctx.moveTo(-5, -3);
    ctx.lineTo(0, -5);
    ctx.lineTo(5, -1);
  } else {
    ctx.moveTo(-4.5, -1);
    ctx.lineTo(0, -5);
    ctx.lineTo(4.5, -1);
  }
  ctx.stroke();
  // legs
  ctx.beginPath();
  if (kind === 'run') {
    ctx.moveTo(0, 2);
    ctx.lineTo(-4, 9);
    ctx.moveTo(0, 2);
    ctx.lineTo(4, 7);
  } else {
    ctx.moveTo(0, 2);
    ctx.lineTo(-3.2, 9);
    ctx.moveTo(0, 2);
    ctx.lineTo(3.2, 9);
  }
  ctx.stroke();
  ctx.restore();
}

/** The requirements card. `split` breaks that line into clauses; `struck` strikes a line. */
export function drawCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  opts: { lines: number; active?: number; split?: number; struck?: number; labels?: string[]; oneLine?: boolean }
): void {
  const lines = Math.max(1, opts.lines);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.fillStyle = COLORS.card;
  ctx.fill();
  ctx.strokeStyle = COLORS.line;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  if (opts.oneLine) {
    // a single long sentence, wrapped as one visual block
    ctx.fillStyle = 'rgba(47,107,176,0.16)';
    ctx.fillRect(x + 10, y + h * 0.3, w - 20, h * 0.4);
    if (opts.labels && opts.labels[0]) {
      drawLabel(ctx, opts.labels[0], x + 14, y + h * 0.55, { color: COLORS.ink, size: 13 });
    }
    ctx.restore();
    return;
  }
  const rowH = (h - 14) / lines;
  for (let i = 0; i < lines; i += 1) {
    const ry = y + 8 + i * rowH;
    const isActive = opts.active === i;
    const isStruck = opts.struck === i;
    if (isActive) {
      ctx.fillStyle = 'rgba(91,70,201,0.12)';
      ctx.fillRect(x + 4, ry - 1, w - 8, rowH - 3);
    }
    ctx.beginPath();
    ctx.moveTo(x + 12, ry + rowH * 0.55);
    ctx.lineTo(x + w - 14, ry + rowH * 0.55);
    ctx.strokeStyle = isStruck ? COLORS.bad : isActive ? COLORS.fuse : COLORS.line;
    ctx.lineWidth = isStruck ? 2 : 3;
    ctx.stroke();
    if (opts.split === i) {
      const chips = 3;
      const cw = (w - 40) / chips;
      for (let c = 0; c < chips; c += 1) {
        ctx.beginPath();
        ctx.rect(x + 16 + c * cw, ry + rowH * 0.16, cw - 10, rowH * 0.5);
        ctx.fillStyle = 'rgba(217,154,23,0.28)';
        ctx.fill();
        ctx.strokeStyle = COLORS.ring;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }
    if (opts.labels && opts.labels[i]) {
      drawLabel(ctx, opts.labels[i], x + 14, ry + rowH * 0.44, { color: isStruck ? COLORS.bad : COLORS.ink, size: 13 });
    }
  }
  ctx.restore();
}

/** The amber candidate ring. */
export function drawRing(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  opts: { color?: string; weight?: number; dashed?: boolean; label?: string } = {}
): void {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = opts.color ?? COLORS.ring;
  ctx.lineWidth = opts.weight ?? 3;
  if (opts.dashed) ctx.setLineDash([6, 5]);
  ctx.stroke();
  ctx.restore();
  if (opts.label) drawLabel(ctx, opts.label, cx - r, cy - r - 6, { color: COLORS.muted, size: 13 });
}

/** The confirmation box (localization). */
export function drawFrame(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  w: number,
  h: number,
  opts: { color?: string; weight?: number; dashed?: boolean; label?: string } = {}
): void {
  ctx.save();
  ctx.strokeStyle = opts.color ?? COLORS.confirm;
  ctx.lineWidth = opts.weight ?? 3;
  if (opts.dashed) ctx.setLineDash([6, 5]);
  ctx.strokeRect(cx - w / 2, cy - h / 2, w, h);
  ctx.restore();
  if (opts.label) drawLabel(ctx, opts.label, cx - w / 2, cy - h / 2 - 6, { color: COLORS.muted, size: 13 });
}

/** Card <-> pitch link; `twoWay` draws the pulsing fusion arrow. */
export function drawLink(
  ctx: CanvasRenderingContext2D,
  from: [number, number],
  to: [number, number],
  opts: { active?: boolean; twoWay?: boolean; label?: string; muted?: boolean } = {}
): void {
  const active = opts.active !== false;
  const color = opts.muted ? COLORS.axis : active ? COLORS.fuse : COLORS.axis;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(from[0], from[1]);
  ctx.lineTo(to[0], to[1]);
  ctx.lineWidth = active ? 3 : 2;
  ctx.strokeStyle = color;
  if (!active) ctx.setLineDash([6, 5]);
  ctx.stroke();
  ctx.restore();
  if (opts.twoWay) {
    // second, offset arrow travelling back
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(to[0], to[1] + 12);
    ctx.lineTo(from[0], from[1] + 12);
    ctx.lineWidth = 3;
    ctx.strokeStyle = active ? COLORS.fuse : COLORS.axis;
    ctx.setLineDash(active ? [] : [6, 5]);
    ctx.stroke();
    ctx.restore();
  }
  if (opts.label) drawLabel(ctx, opts.label, (from[0] + to[0]) / 2 - 16, (from[1] + to[1]) / 2 - 8, { color: COLORS.muted, size: 13 });
}

/** The fixed closed-set roster card. */
export function drawRoster(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  opts: { entries?: number } = {}
): void {
  const entries = Math.max(1, opts.entries ?? 6);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.fillStyle = '#f3f3ee';
  ctx.fill();
  ctx.strokeStyle = COLORS.muted;
  ctx.lineWidth = 2;
  ctx.stroke();
  // spine
  ctx.beginPath();
  ctx.moveTo(x + 6, y);
  ctx.lineTo(x + 6, y + h);
  ctx.strokeStyle = COLORS.bad;
  ctx.lineWidth = 3;
  ctx.stroke();
  const rowH = (h - 12) / entries;
  ctx.strokeStyle = 'rgba(140,154,143,0.55)';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < entries; i += 1) {
    ctx.beginPath();
    ctx.moveTo(x + 14, y + 8 + i * rowH + rowH * 0.5);
    ctx.lineTo(x + w - 12, y + 8 + i * rowH + rowH * 0.5);
    ctx.stroke();
  }
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
  opts: { direction?: 'up' | 'down'; label?: string; axisMax?: number; muted?: boolean } = {}
): void {
  const direction = opts.direction ?? 'up';
  const v = clamp(value, 0, 1);
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.fillStyle = 'rgba(207,220,208,0.6)';
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = COLORS.axis;
  ctx.stroke();
  const good = direction === 'up' ? v : 1 - v;
  const color = opts.muted ? COLORS.muted : good > 0.66 ? COLORS.good : good < 0.33 ? COLORS.bad : COLORS.box;
  ctx.fillStyle = color;
  ctx.fillRect(x + 1.5, y + 1.5, Math.max(0, (w - 3) * v), h - 3);
  if (opts.axisMax !== undefined) {
    ctx.font = `13px ${FONT}`;
    ctx.fillStyle = COLORS.muted;
    ctx.textAlign = 'right';
    ctx.fillText(String(opts.axisMax), x + w, y - 6);
  }
  if (opts.label) drawLabel(ctx, opts.label, x, y + h + 18, { color: COLORS.muted, size: 13 });
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
  ctx.fillStyle = opts.color ?? COLORS.ink;
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
    ctx.fillStyle = COLORS.muted;
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
