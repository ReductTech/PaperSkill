// Paper-specific Canvas drawing kit for the GLIP tutorial.
// One shared visual world: a cluttered room and a written list. Someone reads the list
// and marks each matching thing — some lines have nothing to match.
// Written once by the coordinator; every packet widget imports from here.
//
// Semantic colors: red = failure / old method, blue = guidance / current,
// green = success / paper method, orange = user emphasis, purple = auxiliary.

import { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp } from './canvasKit';

export const COLORS = {
  room: '#fffdf7',
  paper: '#fff8e7',
  rule: '#e3d7bd',
  ink: '#25324a',
  muted: '#7b8794',
  item: '#f2e4c9',
  box: '#3b6ea5',
  thread: '#2f7d4f',
  warn: '#c0453f',
  aux: '#6d5bd0',
  accent: '#e8722e',
  tag: '#d98b1f',
  axis: '#d7deea',
} as const;

const FONT = '"Segoe UI", "PingFang SC", "Hiragino Sans GB", sans-serif';

/** Room field + table band + optional <=8-char corner label. */
export function clearScene(ctx: CanvasRenderingContext2D, w: number, h: number, label?: string): void {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = COLORS.room;
  ctx.fillRect(0, 0, w, h);
  // table band
  ctx.fillStyle = COLORS.item;
  ctx.fillRect(0, h * 0.62, w, h * 0.38);
  ctx.strokeStyle = COLORS.rule;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, h * 0.62);
  ctx.lineTo(w, h * 0.62);
  ctx.stroke();
  if (label) drawLabel(ctx, label, 12, 20, { color: COLORS.muted, size: 13 });
}

/** One object in the clutter. kind = bottle | box | cup | plant | frame */
export function drawItem(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  opts: { kind?: 'bottle' | 'box' | 'cup' | 'plant' | 'frame'; highlight?: boolean; label?: string } = {}
): void {
  const kind = opts.kind ?? 'box';
  const hl = opts.highlight === true;
  ctx.save();
  ctx.lineWidth = hl ? 3 : 2;
  ctx.strokeStyle = hl ? COLORS.accent : COLORS.muted;
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.beginPath();
  if (kind === 'bottle') {
    ctx.moveTo(x + w * 0.35, y);
    ctx.lineTo(x + w * 0.65, y);
    ctx.lineTo(x + w * 0.65, y + h * 0.22);
    ctx.lineTo(x + w * 0.85, y + h * 0.45);
    ctx.lineTo(x + w * 0.85, y + h);
    ctx.lineTo(x + w * 0.15, y + h);
    ctx.lineTo(x + w * 0.15, y + h * 0.45);
    ctx.lineTo(x + w * 0.35, y + h * 0.22);
    ctx.closePath();
  } else if (kind === 'cup') {
    ctx.moveTo(x + w * 0.15, y + h * 0.2);
    ctx.lineTo(x + w * 0.85, y + h * 0.2);
    ctx.lineTo(x + w * 0.72, y + h);
    ctx.lineTo(x + w * 0.28, y + h);
    ctx.closePath();
  } else if (kind === 'plant') {
    ctx.moveTo(x + w * 0.5, y + h);
    ctx.lineTo(x + w * 0.5, y + h * 0.35);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x + w * 0.5, y + h * 0.25, w * 0.42, 0, Math.PI * 2);
  } else if (kind === 'frame') {
    ctx.rect(x, y, w, h);
  } else {
    ctx.rect(x, y, w, h);
  }
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  if (opts.label) drawLabel(ctx, opts.label, x, y + h + 16, { color: COLORS.muted, size: 13, align: 'center' });
}

/** A marker frame around one object. */
export function drawBox(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  w: number,
  h: number,
  opts: { color?: string; weight?: number; dashed?: boolean; label?: string } = {}
): void {
  ctx.save();
  ctx.strokeStyle = opts.color ?? COLORS.box;
  ctx.lineWidth = opts.weight ?? 2;
  if (opts.dashed) ctx.setLineDash([6, 5]);
  ctx.strokeRect(cx - w / 2, cy - h / 2, w, h);
  ctx.restore();
  if (opts.label) drawLabel(ctx, opts.label, cx - w / 2, cy - h / 2 - 6, { color: COLORS.muted, size: 13 });
}

/** The list panel. `active` highlights one line; `split` splits that line into chips;
 *  `struck` strikes a line that has no match. */
export function drawList(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  opts: { lines: number; active?: number; split?: number; struck?: number; labels?: string[] }
): void {
  const lines = Math.max(1, opts.lines);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.fillStyle = COLORS.paper;
  ctx.fill();
  ctx.strokeStyle = COLORS.rule;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  const rowH = (h - 14) / lines;
  for (let i = 0; i < lines; i += 1) {
    const ry = y + 8 + i * rowH;
    const isActive = opts.active === i;
    const isStruck = opts.struck === i;
    if (isActive) {
      ctx.fillStyle = 'rgba(232,114,46,0.14)';
      ctx.fillRect(x + 4, ry - 1, w - 8, rowH - 3);
    }
    // rule line
    ctx.beginPath();
    ctx.moveTo(x + 12, ry + rowH * 0.55);
    ctx.lineTo(x + w - 14, ry + rowH * 0.55);
    ctx.strokeStyle = isStruck ? COLORS.warn : isActive ? COLORS.accent : COLORS.rule;
    ctx.lineWidth = isStruck ? 2 : 3;
    ctx.stroke();
    // split chips on the requested line
    if (opts.split === i) {
      const chips = 3;
      const cw = (w - 40) / chips;
      for (let c = 0; c < chips; c += 1) {
        ctx.beginPath();
        ctx.rect(x + 16 + c * cw, ry + rowH * 0.15, cw - 10, rowH * 0.5);
        ctx.fillStyle = 'rgba(217,139,31,0.28)';
        ctx.fill();
        ctx.strokeStyle = COLORS.tag;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }
    if (opts.labels && opts.labels[i]) {
      drawLabel(ctx, opts.labels[i], x + 14, ry + rowH * 0.42, { color: isStruck ? COLORS.warn : COLORS.ink, size: 13 });
    }
  }
  ctx.restore();
}

/** Thread between a box and a list line, optional score label. */
export function drawThread(
  ctx: CanvasRenderingContext2D,
  from: [number, number],
  to: [number, number],
  opts: { active?: boolean; score?: number; muted?: boolean } = {}
): void {
  const active = opts.active !== false;
  const color = opts.muted ? COLORS.axis : active ? COLORS.thread : COLORS.axis;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(from[0], from[1]);
  ctx.bezierCurveTo((from[0] + to[0]) / 2, from[1], (from[0] + to[0]) / 2, to[1], to[0], to[1]);
  ctx.lineWidth = active ? 3 : 2;
  ctx.strokeStyle = color;
  ctx.setLineDash(active ? [] : [6, 5]);
  ctx.stroke();
  ctx.restore();
  if (opts.score !== undefined) {
    drawLabel(ctx, opts.score.toFixed(2), (from[0] + to[0]) / 2 - 14, (from[1] + to[1]) / 2 - 6, {
      color: active ? COLORS.thread : COLORS.muted,
      size: 14,
      bold: true,
    });
  }
}

/** The old closed classification handbook. */
export function drawHandbook(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, opts: { closed?: boolean } = {}): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.beginPath();
  ctx.rect(-26, -34, 52, 68);
  ctx.fillStyle = '#e8dfcc';
  ctx.fill();
  ctx.strokeStyle = COLORS.muted;
  ctx.lineWidth = 2;
  ctx.stroke();
  // spine
  ctx.beginPath();
  ctx.moveTo(-26, -34);
  ctx.lineTo(-26, 34);
  ctx.strokeStyle = COLORS.accent;
  ctx.lineWidth = 4;
  ctx.stroke();
  // page lines
  ctx.strokeStyle = COLORS.rule;
  ctx.lineWidth = 2;
  for (let i = 0; i < 5; i += 1) {
    ctx.beginPath();
    ctx.moveTo(-14, -20 + i * 12);
    ctx.lineTo(18, -20 + i * 12);
    ctx.stroke();
  }
  ctx.restore();
}

/** A figure. role = searcher | teacher | student */
export function drawPerson(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  opts: { role?: 'searcher' | 'teacher' | 'student'; accent?: string } = {}
): void {
  const accent = opts.accent ?? COLORS.ink;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  // body
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-9, 28);
  ctx.lineTo(9, 28);
  ctx.closePath();
  ctx.fillStyle = opts.role === 'teacher' ? COLORS.aux : accent;
  ctx.globalAlpha = 0.85;
  ctx.fill();
  ctx.globalAlpha = 1;
  // head
  ctx.beginPath();
  ctx.arc(0, -8, 8, 0, Math.PI * 2);
  ctx.fillStyle = accent;
  ctx.fill();
  // arm (holding the list / marking)
  ctx.beginPath();
  ctx.moveTo(5, 6);
  ctx.lineTo(20, 0);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.restore();
}

/** A sticky note (pseudo label). */
export function drawNote(ctx: CanvasRenderingContext2D, x: number, y: number, opts: { text?: string } = {}): void {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x - 14, y - 11, 28, 22);
  ctx.fillStyle = 'rgba(217,139,31,0.30)';
  ctx.fill();
  ctx.strokeStyle = COLORS.tag;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
  if (opts.text) drawLabel(ctx, opts.text, x - 12, y + 4, { color: COLORS.ink, size: 12 });
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
  ctx.fillStyle = 'rgba(215,222,234,0.5)';
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = COLORS.axis;
  ctx.stroke();
  const good = direction === 'up' ? v : 1 - v;
  const color = opts.muted ? COLORS.muted : good > 0.66 ? COLORS.thread : good < 0.33 ? COLORS.warn : COLORS.box;
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
