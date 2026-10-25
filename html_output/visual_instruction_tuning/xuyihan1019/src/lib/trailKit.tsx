// Paper-specific Canvas drawing kit for the LLaVA tutorial.
// One shared visual world: a sighted guide walking with a companion who cannot see.
// Written once by the coordinator; every packet widget imports from here and must not
// restate the palette, line weights, or label fonts.
//
// Semantic colors (paper-skill contract §5): red = failure / old method,
// blue = guidance / current state, green = success / paper method,
// orange = user-controlled emphasis, purple = auxiliary mechanism.

import { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp } from './canvasKit';

export const COLORS = {
  bg: '#f7f4ec',
  trail: '#d9c9a8',
  trailDark: '#a58a5c',
  foliage: '#b8c9a7',
  bench: '#92400e',
  route: '#27446e',
  good: '#228d5c',
  bad: '#c43f52',
  aux: '#7c3aed',
  fader: '#f07e47',
  ink: '#21324a',
  muted: '#68778f',
  axis: '#d7deea',
} as const;

const FONT = '"Segoe UI", "PingFang SC", "Hiragino Sans GB", sans-serif';

/** Quiet field, trail band, foliage edge, optional short corner label (<=8 chars). */
export function clearScene(ctx: CanvasRenderingContext2D, w: number, h: number, label?: string): void {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, w, h);
  // foliage strip behind the trail
  ctx.fillStyle = COLORS.foliage;
  ctx.fillRect(0, h * 0.50, w, h * 0.16);
  // trail band
  ctx.fillStyle = COLORS.trail;
  ctx.fillRect(0, h * 0.66, w, h * 0.30);
  ctx.strokeStyle = COLORS.trailDark;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, h * 0.66);
  ctx.lineTo(w, h * 0.66);
  ctx.stroke();
  ctx.fillStyle = COLORS.trailDark;
  ctx.fillRect(0, h - 4, w, 4);
  if (label) drawLabel(ctx, label, 12, 18, { color: COLORS.muted, size: 13 });
}

/** A standing guide. `eye` draws the "can see" mark; `talking` opens a speech bubble. */
export function drawGuide(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  opts: { talking?: boolean; eye?: boolean; accent?: string; label?: string; scale?: number } = {}
): void {
  const accent = opts.accent ?? COLORS.route;
  const s = opts.scale ?? 1;
  ctx.save();
  ctx.translate(x, y);
  // body
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-7 * s, 22 * s);
  ctx.lineTo(7 * s, 22 * s);
  ctx.closePath();
  ctx.fillStyle = accent;
  ctx.fill();
  // head
  ctx.beginPath();
  ctx.arc(0, -6 * s, 7 * s, 0, Math.PI * 2);
  ctx.fillStyle = accent;
  ctx.fill();
  // pointing arm
  ctx.beginPath();
  ctx.moveTo(4 * s, 6 * s);
  ctx.lineTo(20 * s, 2 * s);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.stroke();
  if (opts.eye) {
    // small eye mark = the seeing side
    ctx.beginPath();
    ctx.ellipse(0, -6 * s, 6 * s, 3.5 * s, 0, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.bg;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, -6 * s, 2 * s, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.ink;
    ctx.fill();
  }
  ctx.restore();
  if (opts.talking) drawSpeech(ctx, x + 14 * s, y - 26 * s, 92, '', { lines: 1 });
  if (opts.label) drawLabel(ctx, opts.label, x, y + 40 * s, { color: COLORS.muted, size: 13, align: 'center' });
}

/** The companion: cane and closed eyes. `blocked` turns the figure red at a bush. */
export function drawWalker(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  opts: { blocked?: boolean; walking?: boolean; label?: string; scale?: number } = {}
): void {
  const color = opts.blocked ? COLORS.bad : COLORS.ink;
  const k = opts.scale ?? 1;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(k, k);
  // body
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-7, 22);
  ctx.lineTo(7, 22);
  ctx.closePath();
  ctx.fillStyle = COLORS.muted;
  ctx.fill();
  // head with closed eyes
  ctx.beginPath();
  ctx.arc(0, -6, 7, 0, Math.PI * 2);
  ctx.fillStyle = COLORS.muted;
  ctx.fill();
  ctx.strokeStyle = COLORS.ink;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-4, -7);
  ctx.lineTo(-1.5, -7);
  ctx.moveTo(1.5, -7);
  ctx.lineTo(4, -7);
  ctx.stroke();
  // cane
  const swing = opts.walking ? 4 : 0;
  ctx.beginPath();
  ctx.moveTo(6, 10);
  ctx.lineTo(16 + swing, 34);
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.restore();
  if (opts.blocked) {
    // stray bush mark
    ctx.beginPath();
    ctx.arc(x + 22 * k, y + 30 * k, 9 * k, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(196,63,82,0.30)';
    ctx.fill();
    ctx.strokeStyle = COLORS.bad;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  if (opts.label) drawLabel(ctx, opts.label, x, y + 52 * k, { color: COLORS.muted, size: 13, align: 'center' });
}

/** One landmark on the trail: tree | bench | fountain | sign. */
export function drawLandmark(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  kind: 'tree' | 'bench' | 'fountain' | 'sign',
  opts: { highlight?: boolean } = {}
): void {
  const hl = opts.highlight === true;
  const stroke = hl ? COLORS.fader : COLORS.bench;
  ctx.save();
  ctx.translate(x, y);
  ctx.lineWidth = hl ? 3 : 2;
  ctx.strokeStyle = stroke;
  if (kind === 'tree') {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -14);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, -24, 12, 0, Math.PI * 2);
    ctx.fillStyle = hl ? 'rgba(240,126,71,0.25)' : 'rgba(184,201,167,0.85)';
    ctx.fill();
    ctx.stroke();
  } else if (kind === 'bench') {
    ctx.beginPath();
    ctx.moveTo(-13, -6);
    ctx.lineTo(13, -6);
    ctx.moveTo(-13, 0);
    ctx.lineTo(13, 0);
    ctx.moveTo(-10, 0);
    ctx.lineTo(-10, 8);
    ctx.moveTo(10, 0);
    ctx.lineTo(10, 8);
    ctx.stroke();
  } else if (kind === 'fountain') {
    ctx.beginPath();
    ctx.ellipse(0, 0, 16, 5, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -18);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, -20, 3, 0, Math.PI * 2);
    ctx.fillStyle = hl ? COLORS.fader : COLORS.route;
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -20);
    ctx.stroke();
    ctx.beginPath();
    ctx.rect(-2, -20, 22, 12);
    ctx.fillStyle = hl ? 'rgba(240,126,71,0.25)' : 'rgba(215,222,234,0.65)';
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

/** Polyline trail. Active segments use route blue at weight 3. */
export function drawTrail(
  ctx: CanvasRenderingContext2D,
  pts: Array<[number, number]>,
  opts: { active?: boolean; dashed?: boolean } = {}
): void {
  if (pts.length < 2) return;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i += 1) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.lineWidth = opts.active ? 3 : 2;
  ctx.strokeStyle = opts.active ? COLORS.route : COLORS.axis;
  if (opts.dashed) ctx.setLineDash([6, 5]);
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.restore();
}

/** Speech bubble with an optional <=8-char line. */
export function drawSpeech(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  text: string,
  opts: { active?: boolean; lines?: number } = {}
): void {
  const lines = opts.lines ?? 1;
  const h = 12 + lines * 12;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.fillStyle = opts.active ? 'rgba(34,141,92,0.18)' : 'rgba(255,255,255,0.85)';
  ctx.fill();
  ctx.strokeStyle = opts.active ? COLORS.good : COLORS.axis;
  ctx.lineWidth = opts.active ? 2 : 1.5;
  ctx.stroke();
  // tail
  ctx.beginPath();
  ctx.moveTo(x + 10, y + h);
  ctx.lineTo(x + 4, y + h + 7);
  ctx.lineTo(x + 18, y + h);
  ctx.closePath();
  ctx.fillStyle = opts.active ? 'rgba(34,141,92,0.18)' : 'rgba(255,255,255,0.85)';
  ctx.fill();
  ctx.strokeStyle = opts.active ? COLORS.good : COLORS.axis;
  ctx.stroke();
  // text lines
  for (let i = 0; i < lines; i += 1) {
    ctx.beginPath();
    ctx.moveTo(x + 8, y + 16 + i * 12);
    ctx.lineTo(x + w - 8 - (i === lines - 1 ? 22 : 0), y + 16 + i * 12);
    ctx.strokeStyle = COLORS.axis;
    ctx.lineWidth = 3;
    ctx.stroke();
  }
  if (text) drawLabel(ctx, text, x + 8, y + 14, { color: COLORS.ink, size: 13 });
  ctx.restore();
}

/** A dialogue record page with N lines; one line may be highlighted. */
export function drawPage(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  opts: { lines: number; highlight?: number; rows?: number }
): void {
  const rows = opts.rows ?? opts.lines;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.fill();
  ctx.strokeStyle = COLORS.axis;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  const rowH = (h - 14) / Math.max(1, rows);
  for (let i = 0; i < opts.lines; i += 1) {
    const ry = y + 8 + i * rowH;
    if (opts.highlight === i) {
      ctx.fillStyle = 'rgba(34,141,92,0.18)';
      ctx.fillRect(x + 4, ry - 2, w - 8, rowH - 2);
      ctx.strokeStyle = COLORS.good;
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 4, ry - 2, w - 8, rowH - 2);
    }
    ctx.beginPath();
    ctx.moveTo(x + 10, ry + rowH * 0.45);
    ctx.lineTo(x + w - 12, ry + rowH * 0.45);
    ctx.strokeStyle = opts.highlight === i ? COLORS.good : COLORS.axis;
    ctx.lineWidth = 3;
    ctx.stroke();
  }
  ctx.restore();
}

/** Horizontal meter with semantic coloring. 'down' = lower is better. */
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
  ctx.fillStyle = 'rgba(215,222,234,0.35)';
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = COLORS.axis;
  ctx.stroke();
  const good = direction === 'up' ? v : 1 - v;
  const color = opts.muted ? COLORS.muted : good > 0.66 ? COLORS.good : good < 0.33 ? COLORS.bad : COLORS.route;
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
