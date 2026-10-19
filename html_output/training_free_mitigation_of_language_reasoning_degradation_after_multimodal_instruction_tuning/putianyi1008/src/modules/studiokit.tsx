// Shared home-studio drawing kit for the tft-merge tutorial.
// One quiet scene, one console deck, one recurring guitar, meters, faders and knobs.
// Colors are the tutorial-wide semantic palette (red = failure/degradation,
// green = success/recovered, blue = guidance/current, orange = emphasis, purple = auxiliary).

import React from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';

export const C = {
  bg: '#f5f8f0',
  light: '#b8c9a7',
  dark: '#76906a',
  warm: '#92400e',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#f07e47',
  purple: '#7c3aed',
  text: '#21324a',
  muted: '#68778f',
  axis: '#d7deea',
  white: '#ffffff',
};

export const FONT = '"Segoe UI", system-ui, sans-serif';

export function rr(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  const k = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + k, y);
  ctx.lineTo(x + w - k, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + k);
  ctx.lineTo(x + w, y + h - k);
  ctx.quadraticCurveTo(x + w, y + h, x + w - k, y + h);
  ctx.lineTo(x + k, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - k);
  ctx.lineTo(x, y + k);
  ctx.quadraticCurveTo(x, y, x + k, y);
  ctx.closePath();
}

/** Quiet field + console deck line. Always the first draw call. */
export function stage(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, w, h);
  const dy = Math.round(h * 0.78);
  ctx.fillStyle = C.light;
  ctx.fillRect(0, dy, w, h - dy);
  ctx.strokeStyle = C.dark;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(0, dy + 0.5);
  ctx.lineTo(w, dy + 0.5);
  ctx.stroke();
}

/** Recurring protagonist: a guitar body with `strings` strings. */
export function guitar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  body: string,
  neck: string,
  slack = 0
): void {
  ctx.lineCap = 'round';
  ctx.fillStyle = body;
  ctx.strokeStyle = neck;
  ctx.lineWidth = 2.2;
  // body: two overlapping circles
  ctx.beginPath();
  ctx.arc(x, y, 20 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x, y - 22 * s, 15 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // neck
  ctx.beginPath();
  ctx.moveTo(x, y - 36 * s);
  ctx.lineTo(x, y - 74 * s);
  ctx.stroke();
  // strings
  ctx.lineWidth = 1.1;
  ctx.strokeStyle = slack > 0.5 ? C.red : C.blue;
  for (let i = 0; i < 3; i++) {
    const ox = (i - 1) * 5 * s;
    ctx.beginPath();
    ctx.moveTo(x + ox, y - 70 * s);
    ctx.quadraticCurveTo(x + ox + 3 * s, y - 40 * s + slack * 16 * s, x + ox, y - 6 * s);
    ctx.stroke();
  }
}

/** Console channel strip / rack panel. */
export function rack(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  fill = false
): void {
  rr(ctx, x, y, w, h, 8);
  if (fill) {
    ctx.fillStyle = color;
    ctx.fill();
  } else {
    ctx.fillStyle = C.white;
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
    return;
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();
}

/** Vertical fader with a slot and ticks; v in 0..1 (0 = bottom). */
export function fader(
  ctx: CanvasRenderingContext2D,
  x: number,
  yTop: number,
  h: number,
  v: number,
  color: string
): void {
  rr(ctx, x - 4, yTop, 8, h, 4);
  ctx.fillStyle = C.axis;
  ctx.fill();
  ctx.strokeStyle = C.muted;
  ctx.lineWidth = 1.2;
  for (let i = 0; i <= 4; i++) {
    const ty = yTop + (h * i) / 4;
    ctx.beginPath();
    ctx.moveTo(x - 13, ty);
    ctx.lineTo(x - 7, ty);
    ctx.stroke();
  }
  const hy = yTop + h * (1 - Math.max(0, Math.min(1, v)));
  rr(ctx, x - 15, hy - 7, 30, 14, 4);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = C.text;
  ctx.lineWidth = 1.2;
  ctx.stroke();
}

/** Knob with a pointer; ang in radians (0 = up). */
export function knob(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  ang: number,
  color: string
): void {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = C.white;
  ctx.fill();
  ctx.strokeStyle = C.axis;
  ctx.lineWidth = 1.4;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y, r - 3, -2.3, -0.84);
  ctx.strokeStyle = C.axis;
  ctx.lineWidth = 1.4;
  ctx.stroke();
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.beginPath();
  ctx.moveTo(0, -r + 3);
  ctx.lineTo(0, -r * 0.32);
  ctx.strokeStyle = color;
  ctx.lineWidth = 3.2;
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.restore();
  ctx.beginPath();
  ctx.arc(x, y, r * 0.24, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

/** Horizontal meter bar; v in 0..1. Draws the value as a bare number at the right. */
export function meter(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  v: number,
  color: string,
  showNumber = true
): void {
  rr(ctx, x, y, w, h, h / 2);
  ctx.fillStyle = C.axis;
  ctx.fill();
  const wv = Math.max(2, w * Math.max(0, Math.min(1, v)));
  rr(ctx, x, y, wv, h, h / 2);
  ctx.fillStyle = color;
  ctx.fill();
  if (showNumber) {
    ctx.fillStyle = C.text;
    ctx.font = '700 17px ' + FONT;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(v.toFixed(2), x + w + 10, y + h / 2);
  }
}

/** Circular level dial with one needle; ang in radians (0 = up). */
export function dial(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  ang: number,
  color: string,
  ticks = 5
): void {
  ctx.beginPath();
  ctx.arc(x, y, r, Math.PI * 0.78, Math.PI * 2.22);
  ctx.strokeStyle = C.axis;
  ctx.lineWidth = 2;
  ctx.stroke();
  for (let i = 0; i <= ticks; i++) {
    const a = Math.PI * 0.78 + (Math.PI * 1.44 * i) / ticks;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(a) * (r - 9), y + Math.sin(a) * (r - 9));
    ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    ctx.strokeStyle = C.muted;
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.beginPath();
  ctx.moveTo(0, 4);
  ctx.lineTo(0, -r + 12);
  ctx.strokeStyle = color;
  ctx.lineWidth = 3.2;
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.restore();
  ctx.beginPath();
  ctx.arc(x, y, 5, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

/** Visible goal marker: a small green flag notch on a console edge. */
export function target(ctx: CanvasRenderingContext2D, x: number, y: number, color: string): void {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + 11, y + 6);
  ctx.lineTo(x, y + 12);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = C.text;
  ctx.lineWidth = 1;
  ctx.stroke();
}

/** Thin double-headed arrow (degradation gap / offset). */
export function arrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string
): void {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  const a = Math.atan2(y2 - y1, x2 - x1);
  const s = 6;
  for (const [px, py, dir] of [
    [x1, y1, a],
    [x2, y2, a + Math.PI],
  ]) {
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px + Math.cos(dir + 0.4) * s, py + Math.sin(dir + 0.4) * s);
    ctx.lineTo(px + Math.cos(dir - 0.4) * s, py + Math.sin(dir - 0.4) * s);
    ctx.closePath();
    ctx.fill();
  }
}

/** Bare number, no prefix. */
export function num(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  v: number,
  color = C.text,
  size = 18,
  align: CanvasTextAlign = 'left'
): void {
  ctx.fillStyle = color;
  ctx.font = '700 ' + size + 'px ' + FONT;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(v.toFixed(2), x, y);
}

/** At most two short labels per canvas. */
export function label(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
  color = C.text,
  align: CanvasTextAlign = 'left'
): void {
  ctx.fillStyle = color;
  ctx.font = '600 15px ' + FONT;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
}

/** At most one legend per canvas, at most three entries. */
export function legend(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  entries: Array<[string, string]>
): void {
  const items = entries.slice(0, 3);
  let cx = x;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = '600 14px ' + FONT;
  for (const [text, color] of items) {
    ctx.beginPath();
    ctx.arc(cx + 6, y, 6, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.fillStyle = C.muted;
    ctx.fillText(text, cx + 17, y);
    cx += 17 + ctx.measureText(text).width + 18;
  }
}

/** Iteration driver: runs until `done` returns true or maxMs elapses. */
export function loop(
  step: (t: number) => boolean,
  maxMs = 2600
): (now: number) => boolean {
  const t0 = performance.now();
  return (now: number) => {
    const t = now - t0;
    if (t > maxMs) return true;
    return step(t);
  };
}

export function hexA(hex: string, a: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

export function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

/** Wrap an animation loop with setupCanvas + is-ready + IntersectionObserver pausing. */
export function useStudioCanvas(
  W: number,
  H: number,
  draw: (ctx: CanvasRenderingContext2D, t: number) => void
): React.RefObject<HTMLCanvasElement> {
  const ref = React.useRef<HTMLCanvasElement>(null);
  const drawRef = React.useRef(draw);
  drawRef.current = draw;
  React.useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let raf: number | null = null;
    const tick = (now: number) => {
      drawRef.current(ctx, now);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const start = () => {
      if (raf === null) raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf !== null) cancelAnimationFrame(raf);
      raf = null;
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, [W, H]);
  return ref;
}

