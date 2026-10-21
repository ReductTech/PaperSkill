// Paper-specific Canvas drawing kit for the Flamingo tutorial.
// One shared visual world: a two-deck DJ mixing console.
// Written once by the coordinator; every packet widget imports from here and must not
// restate the palette, line weights, or label fonts.
//
// Semantic colors follow the paper-skill contract §5:
//   red = failure / old method, blue = guidance / current state, green = success / paper method,
//   orange = user-controlled emphasis, purple = auxiliary mechanism.
// Red never means success and green never means failure.

import { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp } from './canvasKit';

export const COLORS = {
  bg: '#f5f8f0',
  deck: '#b8c9a7',
  deckB: '#cfdcbf',
  platter: '#76906a',
  rail: '#92400e',
  fader: '#f07e47',
  route: '#27446e',
  good: '#228d5c',
  bad: '#c43f52',
  aux: '#7c3aed',
  ink: '#21324a',
  muted: '#68778f',
  axis: '#d7deea',
} as const;

const FONT = '"Segoe UI", "PingFang SC", "Hiragino Sans GB", sans-serif';

/** Quiet field + desk band + front edge. Optional short corner label (<=8 chars). */
export function clearScene(ctx: CanvasRenderingContext2D, w: number, h: number, label?: string): void {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, w, h);
  // desk surface
  ctx.fillStyle = COLORS.deck;
  ctx.fillRect(0, h * 0.62, w, h * 0.38);
  ctx.strokeStyle = COLORS.platter;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, h * 0.62);
  ctx.lineTo(w, h * 0.62);
  ctx.stroke();
  // front edge
  ctx.fillStyle = COLORS.platter;
  ctx.fillRect(0, h - 6, w, 6);
  if (label) drawLabel(ctx, label, 12, 18, { color: COLORS.muted, size: 13, align: 'left' });
}

/** One platter: groove ring, record, center label, sealed dot when frozen. */
export function drawDeck(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  opts: { spin?: number; frozen?: boolean; accent?: string; label?: string } = {}
): void {
  const { spin = 0, frozen = false, accent = COLORS.platter, label } = opts;
  ctx.save();
  ctx.translate(x, y);
  // platter body
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = frozen ? COLORS.deck : COLORS.deckB;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = accent;
  ctx.stroke();
  // record with groove ring
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.86, 0, Math.PI * 2);
  ctx.fillStyle = '#3d4a3a';
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = 'rgba(245,248,240,0.45)';
  for (let i = 1; i <= 3; i += 1) {
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.86 * (0.25 + i * 0.2), 0, Math.PI * 2);
    ctx.stroke();
  }
  // spinning marker shows rotation without moving the platter
  const angle = spin * Math.PI * 2;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(Math.cos(angle) * r * 0.6, Math.sin(angle) * r * 0.6);
  ctx.strokeStyle = 'rgba(245,248,240,0.7)';
  ctx.lineWidth = 2;
  ctx.stroke();
  // center label
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.2, 0, Math.PI * 2);
  ctx.fillStyle = frozen ? COLORS.route : COLORS.fader;
  ctx.fill();
  if (frozen) {
    // "sealed" motif: a small dot inside a ring
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.1, 0, Math.PI * 2);
    ctx.strokeStyle = COLORS.bg;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.03, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.bg;
    ctx.fill();
  }
  ctx.restore();
  if (label) drawLabel(ctx, label, x, y + r + 18, { color: COLORS.muted, size: 13, align: 'center' });
}

/** A run of vertical trainable strips. Active strips use weight 3 + purple fill. */
export function drawChannelStrip(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  opts: { count: number; active?: number; color?: string }
): void {
  const count = Math.max(1, Math.floor(opts.count));
  const active = clamp(opts.active ?? count, 0, count);
  const color = opts.color ?? COLORS.aux;
  const gap = Math.min(4, w / (count * 4));
  const bw = Math.max(2, (w - gap * (count - 1)) / count);
  for (let i = 0; i < count; i += 1) {
    const bx = x + i * (bw + gap);
    const on = i < active;
    ctx.beginPath();
    ctx.rect(bx, y, bw, h);
    ctx.fillStyle = on ? 'rgba(124,58,237,0.22)' : 'rgba(215,222,234,0.55)';
    ctx.fill();
    ctx.lineWidth = on ? 3 : 1.5;
    ctx.strokeStyle = on ? color : COLORS.axis;
    ctx.stroke();
  }
}

/** Brown rail plus an orange knob at t in [0,1]. */
export function drawFader(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  len: number,
  t: number,
  opts: { vertical?: boolean; label?: string; disabled?: boolean } = {}
): void {
  const vertical = opts.vertical ?? false;
  const tt = clamp(t, 0, 1);
  ctx.save();
  ctx.lineCap = 'round';
  ctx.strokeStyle = COLORS.rail;
  ctx.lineWidth = 6;
  ctx.beginPath();
  if (vertical) {
    ctx.moveTo(x, y);
    ctx.lineTo(x, y + len);
  } else {
    ctx.moveTo(x, y);
    ctx.lineTo(x + len, y);
  }
  ctx.stroke();
  const kx = vertical ? x : x + len * tt;
  const ky = vertical ? y + len * (1 - tt) : y;
  ctx.beginPath();
  ctx.arc(kx, ky, 9, 0, Math.PI * 2);
  ctx.fillStyle = opts.disabled ? COLORS.muted : COLORS.fader;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = COLORS.ink;
  ctx.stroke();
  ctx.restore();
  if (opts.label) {
    drawLabel(ctx, opts.label, vertical ? x : x + len / 2, vertical ? y + len + 18 : y + 24, {
      color: COLORS.muted,
      size: 13,
      align: vertical ? 'center' : 'center',
    });
  }
}

/**
 * Horizontal meter. direction 'down' = lower is better (loss); 'up' = higher is better (score).
 * Colors: value in the bad third -> red, middle -> blue, good third -> green.
 */
export function drawLevelMeter(
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
  // axis
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
  if (opts.label) drawLabel(ctx, opts.label, x, y + h + 18, { color: COLORS.muted, size: 13, align: 'left' });
}

/** Grid of cue pads. Lit pads orange, the query pad blue. */
export function drawCuePads(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  cols: number,
  rows: number,
  activeCount: number,
  opts: { total?: number; selected?: number[]; queryIndex?: number; gap?: number } = {}
): void {
  const total = Math.max(1, opts.total ?? cols * rows);
  const gap = opts.gap ?? 6;
  const cw = 26;
  const ch = 20;
  for (let i = 0; i < total; i += 1) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const px = x + col * (cw + gap);
    const py = y + row * (ch + gap);
    const lit = i < activeCount;
    const isQuery = opts.queryIndex !== undefined && i === opts.queryIndex;
    const isSel = opts.selected !== undefined && opts.selected.includes(i);
    ctx.beginPath();
    ctx.rect(px, py, cw, ch);
    ctx.fillStyle = isQuery ? 'rgba(39,68,110,0.35)' : lit ? 'rgba(240,126,71,0.35)' : 'rgba(215,222,234,0.5)';
    ctx.fill();
    ctx.lineWidth = isSel ? 3 : lit || isQuery ? 2 : 1.5;
    ctx.strokeStyle = isQuery ? COLORS.route : lit ? COLORS.fader : isSel ? COLORS.aux : COLORS.axis;
    ctx.stroke();
  }
}

/** Polyline route. Active segments use route blue at weight 3. */
export function drawSignalPath(
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
  ctx.stroke();
  ctx.restore();
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

/**
 * Shared canvas hook: HiDPI setup, off-screen pausing, rAF loop, and `is-ready`.
 * The draw callback reads live state from `stateRef` so ambient motion never resets
 * learner-controlled state.
 */
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
    // Draw in intrinsic coordinates but let CSS scale the element down on narrow
    // layouts (components.css sets `canvas { max-width: 100% }`).
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
