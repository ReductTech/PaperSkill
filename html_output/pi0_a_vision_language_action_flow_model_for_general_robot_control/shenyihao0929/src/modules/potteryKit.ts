// Shared drawing kit for the π0 tutorial — pottery studio theme.
// Semantic colors fixed per contract: green = π0 / success; red = old
// discretized method / failure; blue = current state / VLM backbone; orange =
// user emphasis / flow time τ; purple = action expert / action tokens.

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
 * The recurring protagonist: a potter. (x, y) = ground point.
 * mode: 'eye' holds a magnifier (VLM), 'shape' both hands on clay (expert),
 * 'idle' stands relaxed.
 */
export function drawPotter(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  opts?: { mode?: 'eye' | 'shape' | 'idle'; t?: number; color?: string }
) {
  const t = opts?.t ?? 0;
  const mode = opts?.mode ?? 'idle';
  const cloth = opts?.color ?? C.green;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  // apron body
  ctx.fillStyle = cloth;
  ctx.strokeStyle = C.deep;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-11, -26, 22, 26, 6);
  ctx.fill();
  ctx.stroke();
  // head + headband
  ctx.fillStyle = '#f2e3cf';
  ctx.strokeStyle = C.deep;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, -33, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = C.support;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(0, -35, 7.5, Math.PI * 1.05, Math.PI * 1.95);
  ctx.stroke();
  ctx.fillStyle = C.text;
  ctx.beginPath();
  ctx.arc(-3, -32, 1.1, 0, Math.PI * 2);
  ctx.arc(3, -32, 1.1, 0, Math.PI * 2);
  ctx.fill();
  if (mode === 'eye') {
    // magnifier in right hand
    ctx.strokeStyle = C.support;
    ctx.lineWidth = 2.25;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(10, -18);
    ctx.lineTo(20, -24);
    ctx.stroke();
    ctx.strokeStyle = C.deep;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(24, -28, 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = C.blue;
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    ctx.moveTo(21, -30);
    ctx.lineTo(26, -26);
    ctx.stroke();
  } else if (mode === 'shape') {
    // both hands forward on the clay, slight oscillation
    const dy = Math.sin(t * 2 * Math.PI) * 1.5;
    ctx.strokeStyle = '#f2e3cf';
    ctx.fillStyle = '#f2e3cf';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-10, -16);
    ctx.lineTo(-18, -10 + dy);
    ctx.moveTo(10, -16);
    ctx.lineTo(18, -10 - dy);
    ctx.stroke();
  }
  ctx.restore();
}

/** A spinning potter's wheel with a dashed rim and rotating spokes. */
export function drawWheel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  opts?: { spin?: number }
) {
  const spin = opts?.spin ?? 0;
  ctx.save();
  ctx.translate(x, y);
  // pedestal
  ctx.fillStyle = C.ground;
  ctx.strokeStyle = C.deep;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-r * 0.45, r * 0.16);
  ctx.lineTo(-r * 0.3, r * 0.95);
  ctx.lineTo(r * 0.3, r * 0.95);
  ctx.lineTo(r * 0.45, r * 0.16);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // disc
  ctx.fillStyle = '#e9e2d3';
  ctx.strokeStyle = C.deep;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, 0, r, r * 0.32, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // rotating spokes
  ctx.rotate(spin);
  ctx.strokeStyle = C.muted;
  ctx.lineWidth = 1.25;
  for (let k = 0; k < 3; k++) {
    const a = (k * Math.PI) / 3;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * r * 0.8, Math.sin(a) * r * 0.26);
    ctx.lineTo(-Math.cos(a) * r * 0.8, -Math.sin(a) * r * 0.26);
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Clay that morphs from a noise blob (shape01=0) to a slender vase
 * (shape01=1). The outline is interpolated; noise wiggles fade as it forms.
 */
export function drawClay(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  shape01: number,
  opts?: { size?: number; color?: string; t?: number }
) {
  const s = opts?.size ?? 1;
  const t = opts?.t ?? 0;
  const col = opts?.color ?? C.green;
  const b = Math.max(0, Math.min(1, shape01));
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  // base blob (noise form): wavy circle
  const N = 14;
  ctx.beginPath();
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * Math.PI * 2;
    const wig = 1 + (1 - b) * 0.35 * Math.sin(a * 3 + t * 2 * Math.PI);
    const rx = 16 * wig;
    const ry = 11 * wig;
    const px = Math.cos(a) * rx;
    const py = -Math.sin(a) * ry - 6;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  // vase target: slender neck silhouette
  const vase: Pt[] = [
    { x: -7, y: 6 }, { x: -7, y: -4 }, { x: -3, y: -12 }, { x: -3, y: -20 },
    { x: -5, y: -24 }, { x: 5, y: -24 }, { x: 3, y: -20 }, { x: 3, y: -12 },
    { x: 7, y: -4 }, { x: 7, y: 6 },
  ];
  const blobPts: Pt[] = [];
  for (let i = 0; i < vase.length; i++) {
    const a = (i / vase.length) * Math.PI * 2 - Math.PI / 2;
    const wig = 1 + (1 - b) * 0.35 * Math.sin(a * 3 + t * 2 * Math.PI);
    blobPts.push({ x: Math.cos(a) * 16 * wig, y: Math.sin(a) * 11 * wig - 9 });
  }
  // interpolate blob -> vase
  const pts: Pt[] = vase.map((v, i) => ({
    x: blobPts[i].x + (v.x - blobPts[i].x) * b,
    y: blobPts[i].y + (v.y - blobPts[i].y) * b,
  }));
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1];
    const cur = pts[i];
    ctx.quadraticCurveTo(prev.x, prev.y, (prev.x + cur.x) / 2, (prev.y + cur.y) / 2);
  }
  ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
  ctx.closePath();
  ctx.fillStyle = col;
  ctx.globalAlpha = 0.85;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = C.deep;
  ctx.lineWidth = 1.75;
  ctx.stroke();
  // noise speckles fading with formation
  ctx.fillStyle = C.muted;
  ctx.globalAlpha = (1 - b) * 0.7;
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2 + t;
    ctx.beginPath();
    ctx.arc(Math.cos(a) * (10 + b * 2), -9 + Math.sin(a) * 7, 1.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

/** A red dashed mold grid (the old discretized approach). */
export function drawMoldGrid(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  cols = 8,
  rows = 4
) {
  ctx.save();
  ctx.strokeStyle = C.red;
  ctx.lineWidth = 1.25;
  ctx.setLineDash([4, 3]);
  ctx.strokeRect(x, y, w, h);
  for (let c = 1; c < cols; c++) {
    ctx.beginPath();
    ctx.moveTo(x + (w * c) / cols, y);
    ctx.lineTo(x + (w * c) / cols, y + h);
    ctx.stroke();
  }
  for (let r = 1; r < rows; r++) {
    ctx.beginPath();
    ctx.moveTo(x, y + (h * r) / rows);
    ctx.lineTo(x + w, y + (h * r) / rows);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  ctx.restore();
}

/** A compressed strip of n chunk steps (action chunk H=50). */
export function drawChunkStrip(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  n: number,
  opts?: { highlightTo?: number; color?: string }
) {
  const color = opts?.color ?? C.purple;
  const hi = opts?.highlightTo ?? n;
  ctx.save();
  for (let i = 0; i < n; i++) {
    const cx = x + (w * i) / n;
    const cw = w / n - 1.5;
    ctx.fillStyle = i < hi ? color : '#e3e9f2';
    ctx.beginPath();
    ctx.roundRect(cx, y - 8, cw, 16, 2);
    ctx.fill();
  }
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
  ctx.roundRect(x - 22, y - 11, 44, 22, 5);
  ctx.fill();
  ctx.fillStyle = C.white;
  ctx.font = '12px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(value, x, y + 1);
  ctx.restore();
}
