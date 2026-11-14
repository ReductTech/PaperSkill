import React from 'react';

// Shared studio drawing kit (老照相馆). Imported by every paper-specific widget as
// './studio-kit'. Scene neutrals are studio-specific; semantic colors follow the
// tutorial-wide contract (red failure / green success / blue guidance / orange
// emphasis / purple auxiliary / brown physical support).

export const SC = {
  bg: '#f5f3ec',
  ground: '#e3ddcf',
  shade: '#b8b2a0',
  line: '#d7deea',
  ink: '#21324a',
  muted: '#68778f',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#f07e47',
  purple: '#7c3aed',
  handle: '#92400e',
  paper: '#fffdf7',
};

export type Ctx = CanvasRenderingContext2D;

function hex2rgb(h: string): [number, number, number] {
  return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
}

/** Blend two hex colors, t in [0,1]. */
export function mix(c1: string, c2: string, t: number): string {
  const a = hex2rgb(c1);
  const b = hex2rgb(c2);
  const c = a.map((v, i) => Math.round(v + (b[i] - v) * Math.max(0, Math.min(1, t))));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

export function roundRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

/** Quiet warm wall + counter line. */
export function clearStudio(ctx: Ctx, w: number, h: number, yFrac = 0.82) {
  ctx.fillStyle = SC.bg;
  ctx.fillRect(0, 0, w, h);
  const y = Math.round(h * yFrac);
  ctx.fillStyle = SC.ground;
  ctx.fillRect(0, y, w, h - y);
  ctx.fillStyle = SC.shade;
  ctx.fillRect(0, y, w, 2);
}

/** One preset dial: brown ring, face, pointer at `angle` (radians, 0 = +x). */
export function dial(ctx: Ctx, cx: number, cy: number, r: number, angle: number, glow?: string) {
  if (glow) {
    ctx.beginPath();
    ctx.arc(cx, cy, r + 5, 0, Math.PI * 2);
    ctx.strokeStyle = glow;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = SC.paper;
  ctx.fill();
  ctx.strokeStyle = SC.handle;
  ctx.lineWidth = 3;
  ctx.stroke();
  // ticks
  ctx.strokeStyle = SC.shade;
  ctx.lineWidth = 1;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * (r - 6), cy + Math.sin(a) * (r - 6));
    ctx.lineTo(cx + Math.cos(a) * (r - 2), cy + Math.sin(a) * (r - 2));
    ctx.stroke();
  }
  // pointer
  ctx.strokeStyle = SC.ink;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(angle) * (r - 8), cy + Math.sin(angle) * (r - 8));
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, 3, 0, Math.PI * 2);
  ctx.fillStyle = SC.ink;
  ctx.fill();
}

/** A preset board / panel with screws. */
export function board(ctx: Ctx, x: number, y: number, w: number, h: number, title?: string) {
  roundRect(ctx, x, y, w, h, 8);
  ctx.fillStyle = SC.paper;
  ctx.fill();
  ctx.strokeStyle = SC.shade;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = SC.shade;
  for (const [sx, sy] of [[x + 7, y + 7], [x + w - 7, y + 7], [x + 7, y + h - 7], [x + w - 7, y + h - 7]]) {
    ctx.beginPath();
    ctx.arc(sx, sy, 2, 0, Math.PI * 2);
    ctx.fill();
  }
  if (title) label(ctx, title, x + w / 2, y + 14, SC.muted, 11, 'center');
}

/** A photo print: white border + tinted image block. shift 0..1 degrades toward shiftTarget. */
export function print(ctx: Ctx, x: number, y: number, w: number, h: number, base: string, shift = 0, shiftTarget = SC.red, skew = 0) {
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  if (skew) ctx.rotate(skew);
  ctx.translate(-w / 2, -h / 2);
  ctx.fillStyle = SC.paper;
  roundRect(ctx, 0, 0, w, h, 4);
  ctx.fill();
  ctx.strokeStyle = SC.line;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = shift > 0 ? mix(base, shiftTarget, shift) : base;
  ctx.fillRect(w * 0.08, h * 0.08, w * 0.84, h * 0.7);
  // simple subject mark
  ctx.fillStyle = shift > 0.5 ? SC.paper : 'rgba(255,255,255,0.55)';
  ctx.beginPath();
  ctx.arc(w * 0.5, h * 0.36, h * 0.16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(w * 0.34, h * 0.52, w * 0.32, h * 0.16);
  ctx.restore();
}

/** Print hung on the wall (nail + slight tilt). */
export function wallPrint(ctx: Ctx, x: number, y: number, w: number, h: number, shift = 0, base = SC.green) {
  ctx.fillStyle = SC.shade;
  ctx.fillRect(x + w / 2 - 1.5, y - 6, 3, 6);
  print(ctx, x, y, w, h, base, shift, SC.red, -0.02);
}

/** Order slip (text token). */
export function slip(ctx: Ctx, x: number, y: number, w: number, h: number, color = SC.blue) {
  roundRect(ctx, x, y, w, h, 3);
  ctx.fillStyle = SC.paper;
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.strokeStyle = mix(color, SC.paper, 0.55);
  ctx.lineWidth = 1.5;
  for (let i = 1; i <= 3; i++) {
    const ly = y + (h * i) / 4;
    ctx.beginPath();
    ctx.moveTo(x + 5, ly);
    ctx.lineTo(x + w - 5, ly);
    ctx.stroke();
  }
}

/** Film chip (image token). */
export function filmChip(ctx: Ctx, x: number, y: number, s: number, color = SC.green) {
  roundRect(ctx, x, y, s, s, 3);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = SC.ink;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = SC.paper;
  ctx.beginPath();
  ctx.arc(x + s / 2, y + s * 0.38, s * 0.18, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(x + s * 0.28, y + s * 0.62, s * 0.44, s * 0.22);
}

/** Factory reference album; openFrac opens the cover. */
export function album(ctx: Ctx, x: number, y: number, w: number, h: number, openFrac = 0.5) {
  ctx.fillStyle = SC.handle;
  roundRect(ctx, x, y, w, h, 4);
  ctx.fill();
  ctx.save();
  ctx.translate(x, y);
  ctx.transform(1, 0, (1 - openFrac) * 0.12, 1, 0, 0);
  ctx.fillStyle = mix(SC.handle, SC.paper, 0.35);
  roundRect(ctx, 0, 0, w * 0.5, h, 4);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = SC.paper;
  ctx.fillRect(x + w * 0.5, y + 3, w * 0.44, h - 6);
  ctx.fillStyle = SC.green;
  ctx.fillRect(x + w * 0.56, y + h * 0.2, w * 0.3, h * 0.35);
}

/** Indicator lamp. */
export function lamp(ctx: Ctx, cx: number, cy: number, r: number, on: boolean, color = SC.green) {
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = on ? color : SC.ground;
  ctx.fill();
  ctx.strokeStyle = on ? color : SC.shade;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  if (on) {
    ctx.beginPath();
    ctx.arc(cx, cy, r + 4, 0, Math.PI * 2);
    ctx.strokeStyle = mix(color, SC.bg, 0.6);
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

/** Review stamp with a check mark. */
export function stampMark(ctx: Ctx, cx: number, cy: number, r: number, color: string) {
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.45, cy + r * 0.05);
  ctx.lineTo(cx - r * 0.1, cy + r * 0.4);
  ctx.lineTo(cx + r * 0.5, cy - r * 0.35);
  ctx.stroke();
}

/** Stylized hand/pointer (palm + index finger) pointing along `angle`. */
export function hand(ctx: Ctx, x: number, y: number, angle: number, len: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  // index finger
  roundRect(ctx, 0, -4, len, 8, 4);
  ctx.fillStyle = '#e8c9a0';
  ctx.fill();
  ctx.strokeStyle = SC.shade;
  ctx.lineWidth = 1;
  ctx.stroke();
  // palm
  ctx.beginPath();
  ctx.arc(0, 0, 11, 0, Math.PI * 2);
  ctx.fillStyle = '#e8c9a0';
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

/** Straight arrow. */
export function arrowLine(ctx: Ctx, x1: number, y1: number, x2: number, y2: number, color: string, width = 2) {
  const a = Math.atan2(y2 - y1, x2 - x1);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - Math.cos(a - 0.4) * 9, y2 - Math.sin(a - 0.4) * 9);
  ctx.lineTo(x2 - Math.cos(a + 0.4) * 9, y2 - Math.sin(a + 0.4) * 9);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

export function label(ctx: Ctx, text: string, x: number, y: number, color = SC.ink, size = 13, align: CanvasTextAlign = 'left') {
  ctx.fillStyle = color;
  ctx.font = `${size}px "Segoe UI", sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(text, x, y);
  ctx.textAlign = 'left';
}

/** Legend rows: entries of [colorKey, text]; max 3 entries. */
export function legend(ctx: Ctx, entries: Array<[string, string]>, x: number, y: number) {
  entries.forEach(([c, t], i) => {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(x + 5, y + i * 16 - 4, 4, 0, Math.PI * 2);
    ctx.fill();
    label(ctx, t, x + 14, y + i * 16, SC.muted, 11);
  });
}

/** Horizontal bar with track; frac 0..1 of wMax. */
export function barH(ctx: Ctx, x: number, y: number, wMax: number, frac: number, h: number, color: string) {
  ctx.fillStyle = SC.ground;
  roundRect(ctx, x, y, wMax, h, 3);
  ctx.fill();
  const w = Math.max(0, Math.min(1, frac)) * wMax;
  if (w > 0) {
    ctx.fillStyle = color;
    roundRect(ctx, x, y, w, h, 3);
    ctx.fill();
  }
}

/** 冻结 lock tag on the frozen backbone. */
export function lockTag(ctx: Ctx, x: number, y: number) {
  roundRect(ctx, x, y, 46, 20, 4);
  ctx.fillStyle = SC.shade;
  ctx.fill();
  ctx.fillStyle = SC.paper;
  ctx.fillRect(x + 5, y + 6, 8, 8);
  ctx.strokeStyle = SC.paper;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(x + 9, y + 5.5, 3.2, Math.PI, 0);
  ctx.stroke();
  label(ctx, '冻结', x + 16, y + 14, SC.paper, 11);
}

/** Map pointer event to intrinsic canvas coordinates. */
export function toLocal(canvas: HTMLCanvasElement, clientX: number, clientY: number): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((clientX - rect.left) / rect.width) * (canvas.width / (window.devicePixelRatio || 1)),
    y: ((clientY - rect.top) / rect.height) * (canvas.height / (window.devicePixelRatio || 1)),
  };
}

/** Registered placeholder component so the kit file can live in the widget registry. */
export function StudioKitMarker() {
  return null;
}
export default StudioKitMarker;
