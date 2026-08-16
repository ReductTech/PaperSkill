// Shared knitting drawing kit for this tutorial. Every paper-specific widget imports
// from here so all chapters share one visual vocabulary. Not a registered widget.

import { useEffect, useRef, useState } from 'react';

export const PAL = {
  scene: '#f5f8f0',
  envLight: '#b8c9a7',
  envDark: '#76906a',
  support: '#92400e',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#d97706',
  purple: '#7c3aed',
  ink: '#21324a',
  muted: '#68778f',
  axis: '#d7deea',
  paper: '#ffffff',
} as const;

export const LABEL_FONT = '600 13px "Segoe UI", sans-serif';
export const LEGEND_FONT = '12px "Segoe UI", sans-serif';

/**
 * Quiet scene field for LIFE-metaphor scenes, plus the work-surface line the
 * scarf rests on. The line is deliberately faint and sits low, so it reads as
 * a table edge rather than a chart axis.
 *
 * Technical panels (mask grids, distributions, trajectories, role diagrams)
 * must use `clearPanel` instead — a work surface there is meaningless and only
 * collides with the content.
 */
export function clearScene(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = PAL.scene;
  ctx.fillRect(0, 0, w, h);
  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.strokeStyle = PAL.envLight;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, Math.round(h * 0.88) + 0.5);
  ctx.lineTo(w, Math.round(h * 0.88) + 0.5);
  ctx.stroke();
  ctx.restore();
}

/** Quiet field with NO work-surface line: for technical/diagram panels. */
export function clearPanel(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = PAL.scene;
  ctx.fillRect(0, 0, w, h);
}

/** Basket rim arc plus N desaturated coiled rows tucked behind it. */
export function drawBasket(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  coiledRows: number
): void {
  for (let i = 0; i < coiledRows; i++) {
    const r = 7 + i * 3.1;
    ctx.strokeStyle = PAL.envLight;
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = Math.max(0.2, 0.75 - i * 0.06);
    ctx.beginPath();
    ctx.arc(x, y + 4, r, Math.PI * 1.05, Math.PI * 1.95);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.strokeStyle = PAL.support;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, 15, Math.PI * 0.98, Math.PI * 2.02);
  ctx.stroke();
}

/** One yarn ball with three winding arcs and a gentle 3.2 s bob. */
export function drawYarnBall(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  time: number
): void {
  const bob = Math.sin((time / 3200) * Math.PI * 2) * 1.8;
  const cy = y + bob;
  ctx.fillStyle = PAL.envLight;
  ctx.strokeStyle = PAL.envDark;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(x, cy, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x - 3, cy, 7, -0.6, 1.4);
  ctx.moveTo(x + 5, cy - 6);
  ctx.arc(x + 2, cy, 6.5, -1.1, 0.9);
  ctx.stroke();
}

/**
 * Two tapered knitting needles crossing at the seat, with a metal point, a highlight
 * along the upper edge, and `loops` live loops seated across the shaft.
 * `tiltRad` rotates both needles, so it visibly changes the direction the next row grows.
 */
export function drawNeedles(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  tiltRad: number,
  color: string,
  loops = 0
): void {
  const LEN = 32;
  for (const s of [-1, 1]) {
    const a = tiltRad + (s < 0 ? -0.34 : 0.34);
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    const bx = x - ca * 6;
    const by = y - sa * 6;
    // shaft: full width up to the taper start
    const tx = x + ca * (LEN - 7);
    const ty = y + sa * (LEN - 7);
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.lineCap = 'butt';
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(tx, ty);
    ctx.stroke();
    // tapered tip narrowing to a point
    const px = x + ca * LEN;
    const py = y + sa * LEN;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.lineTo(px, py);
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(px, py, 1.1, 0, Math.PI * 2);
    ctx.fill();
    // highlight along the upper edge of the shaft
    const nx = -sa;
    const ny = ca;
    ctx.strokeStyle = 'rgba(255,255,255,0.65)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(bx + nx * 0.9, by + ny * 0.9);
    ctx.lineTo(tx + nx * 0.9, ty + ny * 0.9);
    ctx.stroke();
  }
  // live loops seated across the shaft of the upper needle
  if (loops > 0) {
    const a = tiltRad + 0.34;
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    for (let i = 0; i < loops; i++) {
      const d = 8 + i * 6;
      const lx = x + ca * d;
      const ly = y + sa * d;
      ctx.save();
      ctx.translate(lx, ly);
      ctx.rotate(a);
      ctx.beginPath();
      ctx.ellipse(0, 0, 2.6, 4.6, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }
  ctx.lineCap = 'butt';
}

/**
 * Horizontal scarf strip advancing left to right. `widthFn(i)` returns row i's
 * half-width, so drift is expressed as geometry rather than colour alone.
 * Returns the x coordinate of the strip's right end.
 */
export function drawScarf(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  rows: number,
  widthFn: (i: number) => number,
  color: string,
  rowStep = 11
): number {
  if (rows <= 0) return x0;
  const top: Array<[number, number]> = [];
  const bot: Array<[number, number]> = [];
  for (let i = 0; i < rows; i++) {
    const x = x0 + i * rowStep;
    const hw = widthFn(i);
    top.push([x, y0 - hw]);
    bot.push([x, y0 + hw]);
  }

  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.4;
  ctx.lineWidth = 1.5;
  for (let i = 0; i < rows; i++) {
    ctx.beginPath();
    ctx.moveTo(top[i][0], top[i][1] + 2);
    ctx.lineTo(bot[i][0], bot[i][1] - 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(top[0][0], top[0][1]);
  for (const [x, y] of top) ctx.lineTo(x, y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(bot[0][0], bot[0][1]);
  for (const [x, y] of bot) ctx.lineTo(x, y);
  ctx.stroke();

  return x0 + (rows - 1) * rowStep;
}

/** Small white pattern card carrying one texture glyph. */
export function drawPatternCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  glyph: string,
  active: boolean
): void {
  ctx.fillStyle = PAL.paper;
  ctx.strokeStyle = active ? PAL.blue : PAL.axis;
  ctx.lineWidth = active ? 2 : 1;
  ctx.beginPath();
  ctx.rect(x, y, 56, 44);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = active ? PAL.blue : PAL.muted;
  ctx.font = LABEL_FONT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(glyph, x + 28, y + 23);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

/** Dashed tolerance band the scarf edge should stay inside. */
export function drawTargetWidthGuide(
  ctx: CanvasRenderingContext2D,
  x0: number,
  x1: number,
  y: number,
  halfW: number
): void {
  ctx.save();
  ctx.strokeStyle = PAL.envDark;
  ctx.globalAlpha = 0.55;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 4]);
  for (const yy of [y - halfW, y + halfW]) {
    ctx.beginPath();
    ctx.moveTo(x0, yy);
    ctx.lineTo(x1, yy);
    ctx.stroke();
  }
  ctx.restore();
}

/** At most two of these per canvas. */
export function drawSceneLabel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string
): void {
  ctx.fillStyle = PAL.ink;
  ctx.font = LABEL_FONT;
  ctx.fillText(text, x, y);
}

/** One compact legend: swatch plus label. */
export function drawLegend(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  entries: Array<{ color: string; label: string }>
): void {
  ctx.font = LEGEND_FONT;
  let cx = x;
  for (const e of entries) {
    ctx.fillStyle = e.color;
    ctx.fillRect(cx, y - 7, 9, 9);
    ctx.fillStyle = PAL.muted;
    ctx.fillText(e.label, cx + 13, y + 1);
    cx += 13 + ctx.measureText(e.label).width + 14;
  }
}

/** White technical inset with a small title. Body text should start at y+34 or lower. */
export function drawInset(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  title: string
): void {
  ctx.fillStyle = PAL.paper;
  ctx.strokeStyle = PAL.axis;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = PAL.muted;
  ctx.font = LEGEND_FONT;
  ctx.fillText(title, x + 8, y + 15);
}

export interface MaskGridOpts {
  rowLabels?: string[];
  colLabels?: string[];
  highlightRow?: number;
  blockOutline?: { r0: number; r1: number; c0: number; c1: number; color: string } | null;
  cellW?: number;
}

/**
 * Attention-mask grid: white cells with axis borders, filled by `fillFn(i, j)`.
 * `blockOutline` strokes a rectangle to mark an appended block (e.g. MoBA's
 * bottom-right bidirectional block).
 */
export function drawMaskGrid(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  cell: number,
  rows: number,
  cols: number,
  fillFn: (i: number, j: number) => string | null,
  opts: MaskGridOpts = {}
): void {
  const cw = opts.cellW ?? cell;
  if (opts.highlightRow !== undefined && opts.highlightRow >= 0) {
    ctx.fillStyle = 'rgba(217,119,6,0.16)';
    ctx.fillRect(x - 4, y + opts.highlightRow * cell - 1, cols * cw + 8, cell + 2);
    ctx.fillStyle = PAL.orange;
    ctx.fillRect(x - 8, y + opts.highlightRow * cell + 2, 3, cell - 4);
  }
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const cx = x + j * cw;
      const cy = y + i * cell;
      ctx.fillStyle = PAL.paper;
      ctx.strokeStyle = PAL.axis;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.rect(cx, cy, cw - 1, cell - 1);
      ctx.fill();
      ctx.stroke();
      const f = fillFn(i, j);
      if (f) {
        ctx.fillStyle = f;
        ctx.globalAlpha = 0.72;
        ctx.fillRect(cx + 1, cy + 1, cw - 3, cell - 3);
        ctx.globalAlpha = 1;
      }
    }
  }
  const b = opts.blockOutline;
  if (b) {
    ctx.strokeStyle = b.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.rect(x + b.c0 * cw, y + b.r0 * cell, (b.c1 - b.c0 + 1) * cw - 1, (b.r1 - b.r0 + 1) * cell - 1);
    ctx.stroke();
  }
}

/** Wrap text to `maxW`, one character at a time (works for CJK). */
export function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxW: number,
  lh: number
): number {
  let line = '';
  let yy = y;
  for (const ch of text) {
    const test = line + ch;
    if (ctx.measureText(test).width > maxW && line !== '') {
      ctx.fillText(line, x, yy);
      line = ch;
      yy += lh;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, yy);
  return yy + lh;
}

/**
 * Hover-scrub for the automatic analogy cards.
 *
 * Every analogy loops on its own clock. Attaching this lets the learner take
 * that clock over: moving the pointer across the card scrubs the loop
 * position, so a motion that normally flashes past can be inspected frame by
 * frame. Leaving the card hands the clock back and the loop resumes from where
 * it was, so nothing jumps.
 *
 * Returns a `phase(time)` function: call it instead of `(time % LOOP) / LOOP`.
 * `detach()` removes the listeners.
 */
export function attachScrub(
  canvas: HTMLCanvasElement,
  loopMs: number
): { phase: (time: number) => number; detach: () => void } {
  let scrub: number | null = null;

  const onMove = (e: MouseEvent) => {
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0) return;
    const p = (e.clientX - rect.left) / rect.width;
    scrub = Math.max(0, Math.min(1, p));
  };
  const onLeave = () => {
    scrub = null;
  };

  canvas.addEventListener('mousemove', onMove);
  canvas.addEventListener('mouseleave', onLeave);
  canvas.style.cursor = 'ew-resize';

  return {
    phase: (time: number) => (scrub !== null ? scrub : (time % loopMs) / loopMs),
    detach: () => {
      canvas.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('mouseleave', onLeave);
    },
  };
}

/**
 * Crisp full-width canvas setup.
 *
 * `setupCanvas` (framework) sizes the backing store to `w * dpr` and pins the
 * CSS width to `w` px. Stretching that canvas wider with CSS upscales the
 * bitmap, which is what made in-canvas text look soft. This helper instead
 * measures the width the canvas will actually occupy, allocates the backing
 * store at that size times the device pixel ratio, and pre-scales the context
 * so all existing drawing code keeps working in the original `w x h`
 * coordinate space — same layout, native resolution, sharp text.
 *
 * Returns the context plus a `detach()` that stops the resize listener.
 */
export function setupCrispCanvas(
  canvas: HTMLCanvasElement,
  w: number,
  h: number
): { ctx: CanvasRenderingContext2D; detach: () => void } {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D context unavailable');

  const apply = () => {
    const dpr = window.devicePixelRatio || 1;
    // The canvas fills its container; fall back to the intrinsic width before layout.
    const box = canvas.parentElement?.clientWidth ?? 0;
    const cssW = box > 40 ? box : w;
    const scale = cssW / w;
    const bw = Math.round(w * scale * dpr);
    const bh = Math.round(h * scale * dpr);
    if (canvas.width !== bw || canvas.height !== bh) {
      canvas.width = bw;
      canvas.height = bh;
    }
    canvas.style.width = '100%';
    canvas.style.height = 'auto';
    // Map the w x h drawing space onto the full backing store.
    ctx.setTransform(scale * dpr, 0, 0, scale * dpr, 0, 0);
  };

  apply();

  let ro: ResizeObserver | null = null;
  if (typeof ResizeObserver !== 'undefined' && canvas.parentElement) {
    ro = new ResizeObserver(() => apply());
    ro.observe(canvas.parentElement);
  }
  const onWinResize = () => apply();
  window.addEventListener('resize', onWinResize);

  return {
    ctx,
    detach: () => {
      if (ro) ro.disconnect();
      window.removeEventListener('resize', onWinResize);
    },
  };
}

/**
 * Shared "自动演示" driver for interactive modules.
 *
 * Every module here already exposes one `apply(value)` (or `select(index)`)
 * entry point that writes the learner's choice into `stateRef` and updates the
 * feedback line. Autoplay reuses exactly that entry point on a timer, so the
 * demo can never drift out of sync with manual control — it IS manual control,
 * driven by a clock.
 *
 * The demo is a teaching aid, not a replacement: any manual interaction calls
 * `stop()`, so touching a slider or chip hands control straight back.
 *
 * `steps` are visited in order and the run stops on the last one (`loop: false`,
 * the default) or wraps around forever (`loop: true`). `intervalMs` is how long
 * each step is held.
 */
export interface AutoplayOpts<T> {
  steps: T[];
  intervalMs: number;
  loop?: boolean;
}

export interface AutoplayDriver {
  start: () => void;
  stop: () => void;
  isRunning: () => boolean;
}

/**
 * Timer core, framework-free so it can be driven from a React ref.
 * `onStep` receives each value in turn; `onEnd` fires when a non-looping run
 * finishes so the caller can flip its button state back.
 */
export function createAutoplay<T>(
  opts: AutoplayOpts<T>,
  onStep: (value: T, index: number) => void,
  onEnd: () => void
): AutoplayDriver {
  let timer: ReturnType<typeof setInterval> | null = null;
  let i = 0;

  const stop = () => {
    if (timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  };

  const start = () => {
    stop();
    if (opts.steps.length === 0) return;
    i = 0;
    onStep(opts.steps[0], 0);
    timer = setInterval(() => {
      i += 1;
      if (i >= opts.steps.length) {
        if (opts.loop) {
          i = 0;
        } else {
          stop();
          onEnd();
          return;
        }
      }
      onStep(opts.steps[i], i);
    }, opts.intervalMs);
  };

  return { start, stop, isRunning: () => timer !== null };
}

/** Evenly spaced numeric steps, inclusive of both ends — for slider demos. */
export function rampSteps(from: number, to: number, count: number): number[] {
  if (count < 2) return [to];
  const out: number[] = [];
  for (let k = 0; k < count; k += 1) out.push(from + ((to - from) * k) / (count - 1));
  return out;
}

/**
 * React binding for `createAutoplay`.
 *
 * Usage in a module:
 *   const demo = useAutoplay({ steps: [...], intervalMs: 700 }, apply);
 *   ...
 *   <button className={demo.btnClass} onClick={demo.toggle}>{demo.label}</button>
 *
 * and call `demo.stop()` at the top of every manual handler so touching a
 * control hands control back to the learner immediately.
 *
 * `onStep` is read through a ref, so it always sees the latest closure without
 * restarting the timer.
 */
export function useAutoplay<T>(
  opts: AutoplayOpts<T>,
  onStep: (value: T, index: number) => void
): {
  playing: boolean;
  label: string;
  btnClass: string;
  toggle: () => void;
  stop: () => void;
} {
  const [playing, setPlaying] = useState(false);
  const stepRef = useRef(onStep);
  stepRef.current = onStep;
  const driverRef = useRef<AutoplayDriver | null>(null);

  if (!driverRef.current) {
    driverRef.current = createAutoplay(
      opts,
      (v, i) => stepRef.current(v, i),
      () => setPlaying(false)
    );
  }

  // Stop the timer if the module scrolls out of the tree.
  useEffect(() => () => driverRef.current?.stop(), []);

  const stop = () => {
    driverRef.current?.stop();
    setPlaying(false);
  };

  return {
    playing,
    label: playing ? '暂停演示' : '自动演示',
    btnClass: playing ? 'tiny' : 'tiny ghost',
    stop,
    toggle: () => {
      if (driverRef.current?.isRunning()) stop();
      else {
        driverRef.current?.start();
        setPlaying(true);
      }
    },
  };
}
