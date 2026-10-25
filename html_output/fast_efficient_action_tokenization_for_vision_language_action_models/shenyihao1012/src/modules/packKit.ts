// Shared drawing kit for the FAST tutorial — travel packing theme.
// Semantic colors fixed per contract: green = FAST / success; red = naive
// stuffing / failure; blue = current state / model; orange = user emphasis
// (rate, γ); purple = tokens / packed rolls.

export interface Pt {
  x: number;
  y: number;
}

export const C = {
  bg: '#f5f8f0',
  ground: '#b8c9a7',
  deep: '#76906a',
  support: '#92400e',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#f07e07',
  purple: '#7c3aed',
  text: '#21324a',
  muted: '#68778f',
  border: '#d7deea',
  white: '#ffffff',
};

/** Quiet field + counter line; optional light grid. */
export function drawSceneBg(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  opts?: { grid?: boolean; ground?: boolean }
) {
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, w, h);
  if (opts?.grid) {
    ctx.strokeStyle = C.border;
    ctx.lineWidth = 1;
    for (let x = 0; x <= w; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y <= h; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  } else if (opts?.ground !== false) {
    const gy = h - 34;
    ctx.strokeStyle = C.ground;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, gy);
    ctx.lineTo(w, gy);
    ctx.stroke();
    ctx.strokeStyle = C.deep;
    ctx.lineWidth = 1.25;
    ctx.globalAlpha = 0.35;
    ctx.beginPath();
    ctx.moveTo(w * 0.06, gy);
    ctx.lineTo(w * 0.06, h * 0.22);
    ctx.lineTo(w * 0.94, h * 0.22);
    ctx.lineTo(w * 0.94, gy);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

/**
 * The recurring protagonist: a packer. (x, y) = ground point.
 * mode: 'stuff' arms pushing into a case, 'roll' rolling a garment,
 * 'shake' shrug (case won't close).
 */
export function drawPacker(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  opts?: { mode?: 'stuff' | 'roll' | 'shake'; t?: number; color?: string }
) {
  const t = opts?.t ?? 0;
  const mode = opts?.mode ?? 'roll';
  const cloth = opts?.color ?? C.green;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  // body
  ctx.fillStyle = cloth;
  ctx.strokeStyle = C.deep;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-11, -26, 22, 26, 6);
  ctx.fill();
  ctx.stroke();
  // head + cap (visor)
  ctx.fillStyle = '#f2e3cf';
  ctx.strokeStyle = C.deep;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, -33, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = C.orange;
  ctx.beginPath();
  ctx.roundRect(-9, -41, 18, 5, 2);
  ctx.fill();
  ctx.strokeStyle = C.deep;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = C.text;
  ctx.beginPath();
  ctx.arc(-3, -32, 1.1, 0, Math.PI * 2);
  ctx.arc(3, -32, 1.1, 0, Math.PI * 2);
  ctx.fill();
  if (mode === 'stuff') {
    const dy = Math.abs(Math.sin(t * 2 * Math.PI)) * 2.5;
    ctx.strokeStyle = '#f2e3cf';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-10, -16);
    ctx.lineTo(-17, -10 - dy);
    ctx.moveTo(10, -16);
    ctx.lineTo(17, -10 - dy);
    ctx.stroke();
  } else if (mode === 'roll') {
    // hands rolling a garment between them
    ctx.strokeStyle = '#f2e3cf';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    const off = Math.sin(t * 2 * Math.PI) * 2;
    ctx.beginPath();
    ctx.moveTo(-10, -16);
    ctx.lineTo(-16, -12 + off);
    ctx.moveTo(10, -16);
    ctx.lineTo(16, -12 - off);
    ctx.stroke();
    ctx.fillStyle = C.ground;
    ctx.strokeStyle = C.deep;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(0, -13 + off * 0.5, 9, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else {
    ctx.strokeStyle = cloth;
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-11, -20);
    ctx.lineTo(-19, -14);
    ctx.moveTo(11, -20);
    ctx.lineTo(19, -14);
    ctx.stroke();
  }
  ctx.restore();
}

/** A suitcase: open lid + fill level (fill01: 0 empty .. 1 overflowing). */
export function drawSuitcase(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  opts?: { fill01?: number; open?: boolean; color?: string }
) {
  const fill = Math.max(0, Math.min(1.15, opts?.fill01 ?? 0));
  const open = opts?.open ?? true;
  const color = opts?.color ?? C.support;
  ctx.save();
  // base case
  ctx.fillStyle = '#e9e2d3';
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 6);
  ctx.fill();
  ctx.stroke();
  // handle
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x + w / 2 - 12, y);
  ctx.quadraticCurveTo(x + w / 2, y - 12, x + w / 2 + 12, y);
  ctx.stroke();
  // contents (stack of garments up to fill)
  const rows = Math.round(fill * (h / 9));
  for (let r = 0; r < rows; r++) {
    const gy = y + h - 6 - r * 9;
    const wob = Math.sin(r * 2.7) * 4;
    ctx.fillStyle = r % 2 === 0 ? C.ground : '#d9c7a7';
    ctx.strokeStyle = C.deep;
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    ctx.roundRect(x + 6 + wob * 0.4, gy - 7, w - 12 - wob * 0.8, 8, 3);
    ctx.fill();
    ctx.stroke();
  }
  // overflow items poking out when overstuffed
  if (fill > 0.95) {
    for (let k = 0; k < 3; k++) {
      const gx = x + 14 + k * (w / 3.2);
      ctx.fillStyle = C.red;
      ctx.strokeStyle = C.red;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(gx, y - 14 - k * 3, 16, 10, 3);
      ctx.fill();
      ctx.stroke();
    }
  }
  // lid (open, tilted behind)
  if (open) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-0.5);
    ctx.fillStyle = '#f2ecdf';
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-4, -h * 0.62, w, h * 0.6, 6);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

/** A vacuum-compression bag: puffy → flat as squish01 goes 0 → 1. */
export function drawVacBag(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  squish01: number,
  opts?: { color?: string }
) {
  const s = Math.max(0, Math.min(1, squish01));
  const color = opts?.color ?? C.green;
  const bh = h * (1 - 0.65 * s);
  const bw = w * (1 + 0.08 * s);
  ctx.save();
  // puffy silhouette with bumps when not compressed
  ctx.fillStyle = 'rgba(178,201,167,0.35)';
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  const N = 16;
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    const px = x + u * bw;
    const bump = Math.sin(u * Math.PI * 3 + 1) * (1 - s) * 6;
    const py = y + bh * 0.5 - bh * 0.5 * Math.sin(u * Math.PI) - bump * (u > 0.08 && u < 0.92 ? 1 : 0);
    if (i === 0) ctx.moveTo(px, y + bh);
    if (u > 0.05 && u < 0.95) ctx.lineTo(px, py);
    if (i === N) ctx.lineTo(x + bw, y + bh);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // valve
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x + bw - 12, y + bh - 8, 4, 0, Math.PI * 2);
  ctx.fill();
  // sealed seam line
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ctx.moveTo(x + 4, y + 5);
  ctx.lineTo(x + bw - 4, y + 5);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

/** A pile of loose garments (naive): n simple tee shapes. */
export function drawClothes(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  n: number,
  opts?: { color?: string; seed?: number }
) {
  const color = opts?.color ?? C.red;
  const seed = opts?.seed ?? 1;
  ctx.save();
  for (let i = 0; i < n; i++) {
    const gx = x + ((i * 37 + seed * 13) % 90) - 45 + (i % 3) * 34;
    const gy = y - (i / 3) * 12;
    ctx.fillStyle = i % 2 === 0 ? '#f6e3e6' : '#efd6da';
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(gx - 14, gy - 8, 28, 14, 4);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

/** Tightly rolled garments (compressed): n neat rolls in a row. */
export function drawRolled(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  n: number,
  opts?: { color?: string; size?: number }
) {
  const color = opts?.color ?? C.purple;
  const s = opts?.size ?? 1;
  ctx.save();
  for (let i = 0; i < n; i++) {
    const rx = x + i * 24 * s;
    ctx.fillStyle = 'rgba(124,58,237,0.18)';
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.75;
    ctx.beginPath();
    ctx.roundRect(rx, y - 8 * s, 18 * s, 16 * s, 8 * s);
    ctx.fill();
    ctx.stroke();
    // spiral hint
    ctx.beginPath();
    ctx.arc(rx + 9 * s, y, 4.5 * s, 0.4, Math.PI * 1.6);
    ctx.stroke();
  }
  ctx.restore();
}

/** A packing cube / pouch with multiple small items merged inside. */
export function drawPouch(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  items: number,
  opts?: { color?: string }
) {
  const color = opts?.color ?? C.purple;
  ctx.save();
  ctx.fillStyle = 'rgba(124,58,237,0.12)';
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x, y - 14, w, 28, 6);
  ctx.fill();
  ctx.stroke();
  // zipper
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.25;
  ctx.setLineDash([3, 2]);
  ctx.beginPath();
  ctx.moveTo(x + 4, y - 14);
  ctx.lineTo(x + w - 4, y - 14);
  ctx.stroke();
  ctx.setLineDash([]);
  // items inside as dots
  for (let i = 0; i < items; i++) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x + 8 + i * ((w - 16) / Math.max(1, items - 1)), y, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** A time-domain waveform polyline. */
export function drawWaveform(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  pts: number[],
  color: string,
  opts?: { dashed?: boolean }
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.25;
  if (opts?.dashed) ctx.setLineDash([7, 5]);
  ctx.beginPath();
  pts.forEach((v, i) => {
    const px = x + (i / (pts.length - 1)) * w;
    const py = y + h / 2 - v * (h / 2);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

/** DCT frequency bars: low frequencies on the LEFT. */
export function drawFreqBars(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  coefs: number[],
  color: string,
  opts?: { keep?: number }
) {
  const keep = opts?.keep ?? coefs.length;
  const bw = w / coefs.length;
  ctx.save();
  coefs.forEach((v, i) => {
    const bh = Math.min(h, Math.abs(v) * h);
    ctx.fillStyle = i < keep ? color : '#e3e9f2';
    ctx.fillRect(x + i * bw + 1, y + h - bh, bw - 2, bh);
  });
  ctx.strokeStyle = C.border;
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, w, h);
  ctx.restore();
}

/** Large pulsing verdict badge (check/cross disc + halo). */
export function drawVerdict(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  ok: boolean,
  opts?: { r?: number; pulse?: number }
) {
  const r = opts?.r ?? 17;
  const pulse = opts?.pulse ?? 0;
  ctx.save();
  const color = ok ? C.green : C.red;
  ctx.globalAlpha = 0.3 + 0.16 * Math.sin(pulse * Math.PI * 2);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r * (1.5 + 0.16 * Math.sin(pulse * Math.PI * 2)), 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = C.white;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  if (ok) {
    ctx.beginPath();
    ctx.moveTo(x - r * 0.45, y + r * 0.05);
    ctx.lineTo(x - r * 0.1, y + r * 0.42);
    ctx.lineTo(x + r * 0.5, y - r * 0.38);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(x - r * 0.42, y - r * 0.42);
    ctx.lineTo(x + r * 0.42, y + r * 0.42);
    ctx.moveTo(x + r * 0.42, y - r * 0.42);
    ctx.lineTo(x - r * 0.42, y + r * 0.42);
    ctx.stroke();
  }
  ctx.restore();
}

/** Simple 2-segment robot arm with gripper. */
export function drawArm(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  opts?: { scale?: number; angle?: number; grip?: number; color?: string }
) {
  const s = opts?.scale ?? 1;
  const a = opts?.angle ?? 0.25;
  const g = opts?.grip ?? 1;
  const color = opts?.color ?? C.blue;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-9, -6, 18, 8, 2);
  ctx.fill();
  const x1 = -14 * Math.sin(a);
  const y1 = -14 * Math.cos(a);
  const x2 = x1 - 16 * Math.sin(a * 0.4);
  const y2 = y1 - 16 * Math.cos(a * 0.4);
  ctx.lineCap = 'round';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(0, -6);
  ctx.lineTo(x1, y1);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.lineWidth = 3;
  const ga = 0.5 * g;
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - 7 * Math.cos(ga), y2 - 7 * Math.sin(ga));
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - 7 * Math.cos(-ga), y2 - 7 * Math.sin(-ga));
  ctx.stroke();
  ctx.restore();
}

export function drawCheckMark(ctx: CanvasRenderingContext2D, x: number, y: number, r = 9) {
  ctx.save();
  ctx.strokeStyle = C.green;
  ctx.lineWidth = 3.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - r * 0.6, y + r * 0.1);
  ctx.lineTo(x - r * 0.1, y + r * 0.55);
  ctx.lineTo(x + r * 0.7, y - r * 0.5);
  ctx.stroke();
  ctx.restore();
}

export function drawCrossMark(ctx: CanvasRenderingContext2D, x: number, y: number, r = 9) {
  ctx.save();
  ctx.strokeStyle = C.red;
  ctx.lineWidth = 3.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - r * 0.6, y - r * 0.6);
  ctx.lineTo(x + r * 0.6, y + r * 0.6);
  ctx.moveTo(x + r * 0.6, y - r * 0.6);
  ctx.lineTo(x - r * 0.6, y + r * 0.6);
  ctx.stroke();
  ctx.restore();
}

/** In-canvas label (≤ 8 chars). */
export function drawSceneLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  opts?: { color?: string; align?: CanvasTextAlign }
) {
  ctx.save();
  ctx.fillStyle = opts?.color ?? C.text;
  ctx.font = '13px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.textAlign = opts?.align ?? 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
  ctx.restore();
}

/** Compact legend, ≤ 3 entries. */
export function drawLegend(
  ctx: CanvasRenderingContext2D,
  entries: [string, string][],
  x: number,
  y: number
) {
  ctx.save();
  ctx.font = '11px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.textBaseline = 'middle';
  let cx = x;
  entries.forEach(([text, color]) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(cx + 5, y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = C.muted;
    ctx.textAlign = 'left';
    ctx.fillText(text, cx + 14, y + 1);
    cx += 14 + ctx.measureText(text).width + 18;
  });
  ctx.restore();
}

/** Bare-number value chip. */
export function drawValueChip(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  value: string,
  color: string
) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x - 26, y - 11, 52, 22, 5);
  ctx.fill();
  ctx.fillStyle = C.white;
  ctx.font = '12px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(value, x, y + 1);
  ctx.restore();
}

/** n compact packed-roll glyphs in a row (legacy shorthand alias). */
export function drawShorthand(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  n: number,
  opts?: { color?: string; size?: number }
) {
  drawRolled(ctx, x, y, n, opts);
}
