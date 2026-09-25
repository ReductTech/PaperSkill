import type * as React from 'react';

// ===========================================================================
// viz-kit — shared, concrete pathology / light-microscopy drawing kit.
//
// Everything here is drawn with plain Canvas 2D primitives (arc / ellipse /
// bezierCurveTo / quadraticCurveTo / lineTo / fill / stroke / gradients).
// No images, no web fonts, no CDN, no emoji. Coordinates are intrinsic canvas
// pixels; this module never touches `window` or `devicePixelRatio`.
//
// FROZEN API — every widget in this project draws through these symbols.
// Do not rename, re-order parameters, or change return types.
//
// ANCHOR CONVENTIONS (important for callers)
//   (x, y)  = TOP-LEFT of a w×h box:
//             clearScene, drawBench, drawSlide, drawTissueField,
//             drawRequestForm, drawReportSheet, drawEmbeddingCassette,
//             drawStainJar, drawLabel, drawLegend, drawMiniBars
//   (cx,cy) = CENTRE of the object:
//             drawGland, drawNucleus, drawKeratinPearl, drawObjectiveTurret,
//             drawSpecimen
//   drawMicroscope(ctx, x, y, scale, opts)
//           (x, y) = CENTRE of the machine; at scale ≈ 1 the whole
//           microscope occupies roughly 170×195 px around that centre.
//   drawVessel(ctx, x, y, len, angle, invaded)
//           (x, y) = START of the vessel centreline; the tube runs `len` px
//           along `angle` (radians, 0 = +x to the right).
//   drawTweezers(ctx, x, y, angle, open)
//           (x, y) = the hinge / pivot; the two arms extend ~52 px along
//           `angle` (angle 0 → straight down), opening apart as `open` → 1.
//
// Determinism: every scattered detail comes from an LCG seeded by the `seed`
// argument, so a widget can redraw every animation frame without flicker.
// ===========================================================================

export const SKIN = {
  bg: '#f5f8f0', // 静场底色（浅）
  bench: '#cbb79a', // 实验台木面
  benchDark: '#a8927a',
  glass: '#e9f2f8', // 玻片玻璃
  glassEdge: '#c3d4e0',
  frost: '#f7f3ea', // 玻片磨砂标签端
  eosin: '#e79ab0', // 伊红（胞质/组织）
  eosinDeep: '#d0708d',
  hema: '#7b6aa8', // 苏木素（核）
  hemaDeep: '#4d3f70',
  nucleolus: '#3b3055',
  stroma: '#f3d7e2',
  lumen: '#fdf6f8',
  vesselWall: '#d98ba0',
  rbc: '#c8526a',
  metal: '#93a0b2', // 显微镜金属
  metalDark: '#5d6878',
  paper: '#fbf7ef', // 申请单/报告单
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#f07e47',
  purple: '#7c3aed',
  text: '#21324a',
  muted: '#68778f',
  axis: '#d7deea',
} as const;

// ---------------------------------------------------------------------------
// Small typed helpers (local on purpose: the kit stays import-free)
// ---------------------------------------------------------------------------

const TAU = Math.PI * 2;
const FONT_STACK = '"Segoe UI", "Microsoft YaHei", sans-serif';

/** Finite-number guard: a stray NaN from a caller never reaches the canvas. */
function safe(v: number, fallback: number): number {
  return Number.isFinite(v) ? v : fallback;
}

function clampNum(v: number, lo: number, hi: number): number {
  if (!Number.isFinite(v)) return lo;
  return v < lo ? lo : v > hi ? hi : v;
}

/** Deterministic 0..1 pseudo-random sequence (LCG) seeded by `seed`. */
function lcg(seed: number): () => number {
  let s = (Math.floor(safe(seed, 1)) * 2654435761 + 1013904223) % 2147483648;
  if (s <= 0) s += 2147483647;
  return () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  const ww = Math.max(0, w);
  const hh = Math.max(0, h);
  const rr = Math.max(0, Math.min(r, ww / 2, hh / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + ww - rr, y);
  ctx.arcTo(x + ww, y, x + ww, y + rr, rr);
  ctx.lineTo(x + ww, y + hh - rr);
  ctx.arcTo(x + ww, y + hh, x + ww - rr, y + hh, rr);
  ctx.lineTo(x + rr, y + hh);
  ctx.arcTo(x, y + hh, x, y + hh - rr, rr);
  ctx.lineTo(x, y + rr);
  ctx.arcTo(x, y, x + rr, y, rr);
  ctx.closePath();
}

function strokeLine(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  width: number
): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(0.2, width);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

/** Safe ellipse sub-path (radii are always positive, so canvas never throws). */
function ellipsePath(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  rot: number
): void {
  ctx.beginPath();
  ctx.ellipse(cx, cy, Math.max(0.2, rx), Math.max(0.2, ry), rot, 0, TAU);
}

function dot(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  color: string
): void {
  ctx.beginPath();
  ctx.arc(cx, cy, Math.max(0.2, r), 0, TAU);
  ctx.fillStyle = color;
  ctx.fill();
}

/** Smooth closed organic blob (soft tissue, H&E section, specimen block). */
function blobPath(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  seed: number,
  wobble: number,
  steps: number
): void {
  const n = Math.max(10, Math.floor(safe(steps, 22)));
  const rnd = lcg(seed);
  const px: number[] = [];
  const py: number[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU;
    const k =
      1 +
      wobble * 0.5 * Math.sin(a * 3 + 0.7) +
      wobble * 0.3 * Math.sin(a * 5 + 2.1) +
      (rnd() - 0.5) * wobble;
    px.push(cx + Math.cos(a) * rx * k);
    py.push(cy + Math.sin(a) * ry * k);
  }
  ctx.beginPath();
  ctx.moveTo((px[n - 1] + px[0]) / 2, (py[n - 1] + py[0]) / 2);
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    ctx.quadraticCurveTo(px[i], py[i], (px[i] + px[j]) / 2, (py[i] + py[j]) / 2);
  }
  ctx.closePath();
}

/** Fine fibrous texture used inside the micrograph field. */
function drawFibers(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  rnd: () => number,
  count: number,
  color: string,
  alpha: number,
  width: number
): void {
  const n = Math.max(0, Math.floor(count));
  if (n === 0) return;
  ctx.save();
  ctx.globalAlpha = clampNum(alpha, 0, 1);
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(0.3, width);
  ctx.lineCap = 'round';
  const span = Math.min(w, h);
  for (let i = 0; i < n; i++) {
    const sx = x + rnd() * w;
    const sy = y + rnd() * h;
    const a = rnd() * TAU;
    const len = span * (0.07 + rnd() * 0.16);
    const ex = sx + Math.cos(a) * len;
    const ey = sy + Math.sin(a) * len;
    const mx = (sx + ex) / 2 - Math.sin(a) * len * (rnd() - 0.5) * 0.9;
    const my = (sy + ey) / 2 + Math.cos(a) * len * (rnd() - 0.5) * 0.9;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.quadraticCurveTo(mx, my, ex, ey);
    ctx.stroke();
  }
  ctx.restore();
}

/** Three significant digits, plain decimal (0.860 / 0.427 / 100). */
function sig3(v: number): string {
  if (!Number.isFinite(v)) return '—';
  if (v === 0) return '0.00';
  const mag = Math.abs(v);
  if (mag >= 100) return String(Math.round(v));
  return v.toFixed(mag >= 10 ? 1 : 2);
}

// ---------------------------------------------------------------------------
// Scene and glassware
// ---------------------------------------------------------------------------

/** Light field + a ~26px wooden bench strip along the bottom edge. */
export function clearScene(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const W = Math.max(0, safe(w, 1));
  const H = Math.max(0, safe(h, 1));
  ctx.fillStyle = SKIN.bg;
  ctx.fillRect(0, 0, W, H);

  const bandH = Math.min(26, H);
  const top = H - bandH;
  const g = ctx.createLinearGradient(0, top, 0, H);
  g.addColorStop(0, SKIN.bench);
  g.addColorStop(1, SKIN.benchDark);
  ctx.fillStyle = g;
  ctx.fillRect(0, top, W, bandH);
  strokeLine(ctx, 0, top, W, top, SKIN.benchDark, 2);
  ctx.save();
  ctx.globalAlpha = 0.35;
  for (let i = 1; i < 3; i++) {
    const gy = top + (bandH * i) / 3;
    strokeLine(ctx, 0, gy, W, gy, SKIN.benchDark, 0.6);
  }
  ctx.restore();
}

/** A bench slab (rounded wooden block + highlight) to carry instruments. */
export function drawBench(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
): void {
  const X = safe(x, 0);
  const Y = safe(y, 0);
  const W = Math.max(1, safe(w, 10));
  const H = Math.max(3, safe(h, 10));
  ctx.save();
  roundRectPath(ctx, X, Y, W, H, 7);
  ctx.fillStyle = SKIN.bench;
  ctx.fill();
  ctx.save();
  ctx.clip();
  // wood grain
  const rnd = lcg(Math.round(W) + Math.round(H) * 131);
  ctx.strokeStyle = SKIN.benchDark;
  ctx.globalAlpha = 0.35;
  ctx.lineWidth = 0.8;
  for (let i = 1; i < 5; i++) {
    const gy = Y + (H * i) / 5 + (rnd() - 0.5) * 2;
    ctx.beginPath();
    ctx.moveTo(X, gy);
    ctx.bezierCurveTo(
      X + W * 0.3,
      gy + (rnd() - 0.5) * 4,
      X + W * 0.7,
      gy + (rnd() - 0.5) * 4,
      X + W,
      gy
    );
    ctx.stroke();
  }
  // top highlight
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(X, Y + 1.5, W, Math.max(1.5, H * 0.22));
  ctx.restore();
  roundRectPath(ctx, X, Y, W, H, 7);
  ctx.strokeStyle = SKIN.benchDark;
  ctx.lineWidth = 1.4;
  ctx.stroke();
  ctx.restore();
}

/**
 * A recognisable glass microscope slide: clear glass rounded rect, frosted
 * writing end at the top-left, two pencil guide lines, a diagonal glass
 * highlight, and — with `tissue: 'section'` — an irregular H&E tissue section
 * (≈60% × 55% of the slide) with a 1px eosinDeep outline.
 */
export function drawSlide(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  opts?: { tissue?: 'none' | 'section'; label?: string }
): void {
  const X = safe(x, 0);
  const Y = safe(y, 0);
  const W = Math.max(8, safe(w, 160));
  const H = Math.max(8, safe(h, 42));
  const tissue = opts && opts.tissue === 'section' ? 'section' : 'none';
  const label = opts && typeof opts.label === 'string' ? opts.label : '';
  const rad = Math.min(H * 0.22, 9);
  const frostW = Math.max(16, W * 0.24);

  ctx.save();
  // glass body
  roundRectPath(ctx, X, Y, W, H, rad);
  ctx.fillStyle = SKIN.glass;
  ctx.fill();
  ctx.save();
  ctx.clip();

  // frosted label end
  ctx.fillStyle = SKIN.frost;
  ctx.fillRect(X, Y, frostW, H);
  ctx.strokeStyle = SKIN.glassEdge;
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(X + frostW, Y);
  ctx.lineTo(X + frostW, Y + H);
  ctx.stroke();
  ctx.strokeStyle = '#d6d1c4';
  ctx.lineWidth = 0.8;
  for (let i = 0; i < 2; i++) {
    const ly = Y + H * (0.36 + i * 0.28);
    ctx.beginPath();
    ctx.moveTo(X + 4, ly);
    ctx.lineTo(X + frostW - 4, ly);
    ctx.stroke();
  }

  // H&E tissue section
  if (tissue === 'section') {
    const cx = X + frostW + (W - frostW) * 0.5;
    const cy = Y + H * 0.5;
    const rx = W * 0.3;
    const ry = H * 0.275;
    const seed = Math.round(X * 3 + Y * 5 + W * 7 + H * 11);
    ctx.save();
    blobPath(ctx, cx, cy, rx, ry, seed, 0.17, 24);
    ctx.fillStyle = SKIN.eosin;
    ctx.fill();
    ctx.strokeStyle = SKIN.eosinDeep;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.clip();
    // darker eosin patches
    ctx.globalAlpha = 0.55;
    for (let i = 0; i < 4; i++) {
      blobPath(
        ctx,
        cx + (i - 1.5) * rx * 0.34,
        cy + Math.sin(i * 2.1) * ry * 0.4,
        rx * 0.3,
        ry * 0.32,
        seed + 17 * (i + 1),
        0.3,
        12
      );
      ctx.fillStyle = SKIN.eosinDeep;
      ctx.fill();
    }
    // gland rings + haematoxylin specks
    ctx.globalAlpha = 0.85;
    ctx.strokeStyle = SKIN.hema;
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      const a = i * 1.31;
      const gx = cx + Math.cos(a) * rx * 0.5;
      const gy = cy + Math.sin(a) * ry * 0.5;
      const gr = Math.min(rx, ry) * (0.16 + 0.05 * i);
      ctx.beginPath();
      ctx.arc(gx, gy, Math.max(0.8, gr), 0, TAU);
      ctx.stroke();
    }
    ctx.fillStyle = SKIN.hema;
    for (let i = 0; i < 14; i++) {
      const a = i * 2.399 + 0.4;
      const d = 0.15 + 0.7 * ((i % 5) / 4);
      dot(
        ctx,
        cx + Math.cos(a) * rx * d,
        cy + Math.sin(a) * ry * d,
        0.8 + (i % 3) * 0.35,
        SKIN.hema
      );
    }
    ctx.restore();
  }

  // diagonal glass highlights
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(X + W * 0.34, Y + H);
  ctx.lineTo(X + W * 0.5, Y);
  ctx.lineTo(X + W * 0.6, Y);
  ctx.lineTo(X + W * 0.44, Y + H);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 0.3;
  ctx.beginPath();
  ctx.moveTo(X + W * 0.66, Y + H);
  ctx.lineTo(X + W * 0.78, Y);
  ctx.lineTo(X + W * 0.82, Y);
  ctx.lineTo(X + W * 0.7, Y + H);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.restore();

  // rim
  roundRectPath(ctx, X, Y, W, H, rad);
  ctx.strokeStyle = SKIN.glassEdge;
  ctx.lineWidth = 1.2;
  ctx.stroke();

  if (label) {
    const size = clampNum(Math.min(H * 0.3, frostW / 7), 8, 12);
    const text = label.length > 8 ? label.slice(0, 8) : label;
    ctx.save();
    ctx.font = `${size}px ${FONT_STACK}`;
    ctx.fillStyle = SKIN.muted;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, X + 4, Y + H * 0.7);
    ctx.restore();
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------
// The micrograph field — the visual centrepiece of this tutorial
// ---------------------------------------------------------------------------

/**
 * A microscope field of view (rounded-rect field stop, 1px glassEdge rim) of
 * H&E tissue. `magnification` changes what the learner sees:
 *   1.25 → 8–12 tidy rings of glands, essentially no cellular detail
 *   5    → 4–6 larger glands plus a few individual cells between them
 *   20   → 20–30 individual cells (cytoplasm outline + nucleus + nucleolus)
 *          packed in stroma, i.e. real histology at high power
 * `lesion: 'vessel'` adds a blood vessel with tumour cells inside its lumen;
 * `lesion: 'pearl'` adds a keratin pearl in the centre of the field.
 */
export function drawTissueField(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  opts: { seed: number; magnification: 1.25 | 5 | 20; lesion?: 'none' | 'vessel' | 'pearl' }
): void {
  const X = safe(x, 0);
  const Y = safe(y, 0);
  const W = Math.max(8, safe(w, 140));
  const H = Math.max(8, safe(h, 140));
  const seed = safe(opts ? opts.seed : 1, 1);
  const mag = safe(opts ? opts.magnification : 1.25, 1.25);
  const lesion = opts && opts.lesion ? opts.lesion : 'none';
  const rnd = lcg(seed);
  const rad = Math.min(W, H) * 0.22;

  ctx.save();
  roundRectPath(ctx, X, Y, W, H, rad);
  ctx.fillStyle = SKIN.stroma;
  ctx.fill();
  ctx.save();
  ctx.clip();

  // pale rose tissue ground
  const g = ctx.createLinearGradient(X, Y, X, Y + H);
  g.addColorStop(0, SKIN.lumen);
  g.addColorStop(0.55, SKIN.stroma);
  g.addColorStop(1, SKIN.eosin);
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = g;
  ctx.fillRect(X, Y, W, H);
  ctx.globalAlpha = 1;

  // fine fibrous stroma texture
  drawFibers(ctx, X, Y, W, H, rnd, Math.round((W * H) / 1200), SKIN.eosinDeep, 0.18, 0.8);

  if (mag === 20) {
    // ---- high power: individual cells -----------------------------------
    const n = Math.round(clampNum((W * H) / 1700, 20, 30));
    const spacing = Math.sqrt((W * H) / n);
    const cols = Math.max(1, Math.round(W / Math.max(1, spacing)));
    const rows = Math.max(1, Math.ceil(n / cols));
    const cw = W / cols;
    const ch = H / rows;
    const cr = Math.min(spacing * 0.56, Math.min(W, H) * 0.17);
    let k = 0;
    for (let r = 0; r < rows && k < n; r++) {
      for (let c = 0; c < cols && k < n; c++) {
        const px = X + cw * (c + 0.5) + (rnd() - 0.5) * cw * 0.5;
        const py = Y + ch * (r + 0.5) + (rnd() - 0.5) * ch * 0.5;
        drawNucleus(ctx, px, py, cr * (0.82 + rnd() * 0.34), seed + k * 41 + 7);
        k++;
      }
    }
    // two tiny capillaries threaded through the stroma
    for (let i = 0; i < 2; i++) {
      const cyy = Y + H * (0.16 + 0.66 * (i === 0 ? 0 : 1));
      const rr = Math.max(1.1, Math.min(W, H) * 0.014);
      ctx.save();
      ctx.globalAlpha = 0.55;
      ctx.strokeStyle = SKIN.vesselWall;
      ctx.lineWidth = rr * 2.2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(X - 2, cyy);
      ctx.bezierCurveTo(X + W * 0.3, cyy - 6, X + W * 0.7, cyy + 6, X + W + 2, cyy - 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
      for (let j = 0; j < 4; j++) {
        dot(ctx, X + W * (0.16 + j * 0.24), cyy + Math.sin(j * 1.9 + i) * 3.4, rr * 0.8, SKIN.rbc);
      }
      ctx.restore();
    }
  } else if (mag === 5) {
    // ---- intermediate power: big glands + a few cells -------------------
    const n = 4 + Math.floor(rnd() * 3); // 4..6
    const cols = n <= 4 ? 2 : 3;
    const rows = Math.ceil(n / cols);
    const cw = W / cols;
    const ch = H / rows;
    const gr = Math.min(W, H) * 0.235;
    const centres: [number, number][] = [];
    for (let i = 0; i < n; i++) {
      const c = i % cols;
      const r = Math.floor(i / cols);
      const gx = X + cw * (c + 0.5) + (rnd() - 0.5) * cw * 0.16;
      const gy = Y + ch * (r + 0.5) + (rnd() - 0.5) * ch * 0.16;
      centres.push([gx, gy]);
      drawGland(ctx, gx, gy, Math.max(4, gr * (0.88 + rnd() * 0.24)), seed + i * 53 + 5);
    }
    // a few individual cells sitting in the stroma between the glands
    const nc = 8 + Math.floor(rnd() * 5); // 8..12
    const cr = Math.min(W, H) * 0.055;
    const rad2 = gr * 1.12;
    let placed = 0;
    let tries = 0;
    while (placed < nc && tries < nc * 40) {
      tries++;
      const px = X + W * (0.06 + rnd() * 0.88);
      const py = Y + H * (0.06 + rnd() * 0.88);
      let ok = true;
      for (let i = 0; i < centres.length; i++) {
        const dx = px - centres[i][0];
        const dy = py - centres[i][1];
        if (dx * dx + dy * dy < rad2 * rad2) {
          ok = false;
          break;
        }
      }
      if (!ok) continue;
      drawNucleus(ctx, px, py, cr * (0.85 + rnd() * 0.32), seed + 500 + placed * 29);
      placed++;
    }
  } else {
    // ---- low power: tidy gland rings, no cellular detail ----------------
    const n = 8 + Math.floor(rnd() * 5); // 8..12
    const cols = Math.max(1, Math.round(Math.sqrt((n * W) / H)));
    const rows = Math.max(1, Math.ceil(n / cols));
    const cw = W / cols;
    const ch = H / rows;
    const gr = Math.min(cw, ch) * 0.4;
    for (let i = 0; i < n; i++) {
      const c = i % cols;
      const r = Math.floor(i / cols);
      const gx = X + cw * (c + 0.5) + (rnd() - 0.5) * cw * 0.12;
      const gy = Y + ch * (r + 0.5) + (rnd() - 0.5) * ch * 0.12;
      drawGland(ctx, gx, gy, Math.max(3, gr * (0.86 + rnd() * 0.24)), seed + i * 37 + 11);
    }
  }

  // ---- lesion overlays ---------------------------------------------------
  if (lesion === 'vessel') {
    drawVessel(ctx, X + W * 0.05, Y + H * 0.7, W * 0.9, -0.05, true);
  } else if (lesion === 'pearl') {
    drawKeratinPearl(ctx, X + W * 0.5, Y + H * 0.5, Math.min(W, H) * 0.22);
  }
  ctx.restore();

  // field stop rim: this is what makes it read as "down the eyepiece"
  roundRectPath(ctx, X, Y, W, H, rad);
  ctx.strokeStyle = SKIN.glassEdge;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}

/**
 * A gland: a ring of 8–12 epithelial cells (eosin cytoplasm + haematoxylin
 * nuclei) around an empty lumen.
 */
export function drawGland(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  seed: number
): void {
  const CX = safe(cx, 0);
  const CY = safe(cy, 0);
  const R = Math.max(3, safe(r, 12));
  const rnd = lcg(seed);
  const n = 8 + Math.floor(rnd() * 5); // 8..12 epithelial cells
  const rot0 = rnd() * TAU;

  ctx.save();
  // epithelial sheet (eosin) + outline
  ellipsePath(ctx, CX, CY, R, R * (0.88 + rnd() * 0.08), 0);
  ctx.fillStyle = SKIN.eosin;
  ctx.fill();
  ctx.strokeStyle = SKIN.eosinDeep;
  ctx.lineWidth = Math.max(0.5, R * 0.045);
  ctx.stroke();

  // nuclei sitting on the epithelial ring
  const ringR = R * 0.79;
  const nr = Math.max(0.7, R * (0.15 + rnd() * 0.05));
  for (let i = 0; i < n; i++) {
    const a = rot0 + (i / n) * TAU + (rnd() - 0.5) * 0.12;
    const nx = CX + Math.cos(a) * ringR;
    const ny = CY + Math.sin(a) * ringR * 0.92;
    ellipsePath(ctx, nx, ny, nr, nr * 0.9, a);
    ctx.fillStyle = SKIN.hema;
    ctx.fill();
    ctx.strokeStyle = SKIN.hemaDeep;
    ctx.lineWidth = Math.max(0.3, nr * 0.18);
    ctx.stroke();
    if (nr > 2.2) {
      dot(ctx, nx + nr * 0.25, ny - nr * 0.15, nr * 0.3, SKIN.nucleolus);
    }
  }

  // lumen
  const lr = R * (0.48 + rnd() * 0.06);
  ellipsePath(ctx, CX, CY, lr, lr * 0.92, 0);
  ctx.fillStyle = SKIN.lumen;
  ctx.fill();
  ctx.strokeStyle = SKIN.eosinDeep;
  ctx.lineWidth = Math.max(0.4, R * 0.04);
  ctx.stroke();
  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.strokeStyle = SKIN.eosinDeep;
  ctx.lineWidth = Math.max(0.3, R * 0.035);
  for (let i = 0; i < 6; i++) {
    const a = rot0 + (i / 6) * TAU;
    ctx.beginPath();
    ctx.moveTo(CX + Math.cos(a) * lr, CY + Math.sin(a) * lr * 0.92);
    ctx.lineTo(CX + Math.cos(a) * R * 0.7, CY + Math.sin(a) * R * 0.7 * 0.92);
    ctx.stroke();
  }
  ctx.restore();
  ctx.restore();
}

/**
 * One cell, unmistakably: eosin cytoplasm ellipse with an eosinDeep outline,
 * a haematoxylin nucleus and a dark nucleolus.
 */
export function drawNucleus(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  seed: number
): void {
  const CX = safe(cx, 0);
  const CY = safe(cy, 0);
  const R = Math.max(2, safe(r, 9));
  const rnd = lcg(seed);
  const rot = (rnd() - 0.5) * 0.8;
  const rx = R * (0.96 + rnd() * 0.16);
  const ry = R * (0.76 + rnd() * 0.16);

  ctx.save();
  // cytoplasm
  ellipsePath(ctx, CX, CY, rx, ry, rot);
  ctx.fillStyle = SKIN.eosin;
  ctx.fill();
  ctx.strokeStyle = SKIN.eosinDeep;
  ctx.lineWidth = Math.max(0.4, R * 0.065);
  ctx.stroke();

  // nucleus (slightly off-centre, as in real sections)
  const na = rnd() * TAU;
  const nd = R * 0.16;
  const nx = CX + Math.cos(na) * nd;
  const ny = CY + Math.sin(na) * nd * 0.85;
  const nr = Math.max(1.2, R * (0.48 + rnd() * 0.12));
  const nrot = rot + (rnd() - 0.5) * 0.6;
  ellipsePath(ctx, nx, ny, nr, nr * (0.84 + rnd() * 0.1), nrot);
  ctx.fillStyle = SKIN.hema;
  ctx.fill();
  ctx.strokeStyle = SKIN.hemaDeep;
  ctx.lineWidth = Math.max(0.4, R * 0.05);
  ctx.stroke();

  // chromatin speckle
  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = SKIN.hemaDeep;
  for (let i = 0; i < 3; i++) {
    const a = rnd() * TAU;
    const d = rnd() * nr * 0.55;
    dot(ctx, nx + Math.cos(a) * d, ny + Math.sin(a) * d, Math.max(0.3, nr * 0.13), SKIN.hemaDeep);
  }
  ctx.restore();

  // nucleolus
  const qa = rnd() * TAU;
  const qd = nr * 0.32;
  dot(ctx, nx + Math.cos(qa) * qd, ny + Math.sin(qa) * qd, Math.max(0.5, nr * 0.32), SKIN.nucleolus);
  ctx.restore();
}

/**
 * A blood vessel: vesselWall tube with a pale lumen, 6–10 red cells inside,
 * and — when `invaded` — 3–5 tumour-cell clusters (haematoxylin nuclei) that
 * have broken into the lumen (the paper's vascular-invasion finding).
 */
export function drawVessel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  len: number,
  angle: number,
  invaded: boolean
): void {
  const X = safe(x, 0);
  const Y = safe(y, 0);
  const L = Math.max(10, safe(len, 90));
  const A = safe(angle, 0);
  const half = Math.max(5, L * 0.115);
  const wall = Math.max(1.6, half * 0.3);
  const innerHalf = Math.max(1.5, half - wall);
  const rnd = lcg(Math.round(X * 5 + Y * 11 + L * 7 + A * 100) + (invaded ? 17 : 3));

  ctx.save();
  ctx.translate(X, Y);
  ctx.rotate(A);

  // outer wall
  roundRectPath(ctx, 0, -half, L, half * 2, half);
  const wg = ctx.createLinearGradient(0, -half, 0, half);
  wg.addColorStop(0, SKIN.eosinDeep);
  wg.addColorStop(0.35, SKIN.vesselWall);
  wg.addColorStop(0.65, SKIN.vesselWall);
  wg.addColorStop(1, SKIN.eosinDeep);
  ctx.fillStyle = wg;
  ctx.fill();

  // smooth-muscle striations in the wall
  ctx.save();
  ctx.globalAlpha = 0.4;
  ctx.strokeStyle = SKIN.eosinDeep;
  ctx.lineWidth = 0.7;
  for (let t = 0.05; t < 0.96; t += 0.055) {
    const px = t * L;
    ctx.beginPath();
    ctx.moveTo(px, -half);
    ctx.lineTo(px + L * 0.015, -innerHalf);
    ctx.moveTo(px + L * 0.03, half);
    ctx.lineTo(px + L * 0.045, innerHalf);
    ctx.stroke();
  }
  ctx.restore();

  // lumen
  roundRectPath(ctx, wall, -innerHalf, L - wall * 2, innerHalf * 2, innerHalf);
  const lg = ctx.createLinearGradient(0, -innerHalf, 0, innerHalf);
  lg.addColorStop(0, SKIN.stroma);
  lg.addColorStop(0.5, SKIN.lumen);
  lg.addColorStop(1, SKIN.stroma);
  ctx.fillStyle = lg;
  ctx.fill();
  ctx.strokeStyle = SKIN.eosinDeep;
  ctx.lineWidth = 0.8;
  ctx.stroke();

  // red cells
  const rbcRx = Math.max(1.8, Math.min(innerHalf * 0.62, L * 0.04));
  const rbcRy = rbcRx * 0.7;
  const nRbc = Math.round(clampNum(L / 22, 6, 10));
  const travel = Math.max(1, L - wall * 2 - rbcRx * 2);
  for (let i = 0; i < nRbc; i++) {
    const t = (i + 0.3 + rnd() * 0.4) / nRbc;
    const px = wall + rbcRx + clampNum(t, 0, 1) * travel;
    const py = (rnd() * 2 - 1) * Math.max(0, innerHalf - rbcRy - 0.8);
    const rot = (rnd() - 0.5) * 1.2;
    ellipsePath(ctx, px, py, rbcRx, rbcRy, rot);
    ctx.fillStyle = SKIN.rbc;
    ctx.fill();
    // central pallor of a red cell
    ellipsePath(ctx, px, py, rbcRx * 0.42, rbcRy * 0.42, rot);
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fill();
  }

  // invaded: tumour cell nests inside the lumen
  if (invaded) {
    const nests = 3 + Math.floor(rnd() * 3); // 3..5
    const base = Math.max(2.4, Math.min(innerHalf * 0.62, L * 0.05));
    for (let i = 0; i < nests; i++) {
      const px = L * (0.12 + rnd() * 0.72);
      const py = (rnd() * 2 - 1) * Math.max(0, innerHalf - base - 0.6);
      const nrot = (rnd() - 0.5) * 0.9;
      // tumour cytoplasm
      ellipsePath(ctx, px, py, base * 1.25, base * 1.0, nrot);
      ctx.fillStyle = SKIN.eosin;
      ctx.fill();
      ctx.strokeStyle = SKIN.eosinDeep;
      ctx.lineWidth = 0.7;
      ctx.stroke();
      // its nuclei
      const k = 3 + Math.floor(rnd() * 3);
      for (let j = 0; j < k; j++) {
        const a = rnd() * TAU;
        const d = rnd() * base * 0.7;
        const nr = Math.max(0.8, base * (0.32 + rnd() * 0.18));
        const nx = px + Math.cos(a) * d;
        const ny = py + Math.sin(a) * d;
        ellipsePath(ctx, nx, ny, nr, nr * 0.88, a);
        ctx.fillStyle = SKIN.hema;
        ctx.fill();
        ctx.strokeStyle = SKIN.hemaDeep;
        ctx.lineWidth = 0.5;
        ctx.stroke();
        if (nr > 1.6) dot(ctx, nx + nr * 0.2, ny - nr * 0.2, nr * 0.3, SKIN.nucleolus);
      }
    }
  }

  // outer outline
  roundRectPath(ctx, 0, -half, L, half * 2, half);
  ctx.strokeStyle = SKIN.eosinDeep;
  ctx.lineWidth = 1.1;
  ctx.stroke();
  ctx.restore();
}

/**
 * Keratin pearl: 3–4 concentric eosin rings of squamous cells around a dense
 * haematoxylin core — the morphological hallmark of squamous carcinoma.
 */
export function drawKeratinPearl(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number
): void {
  const CX = safe(cx, 0);
  const CY = safe(cy, 0);
  const R = Math.max(6, safe(r, 22));
  const rings = 4;
  const rnd = lcg(Math.round(CX * 13 + CY * 7 + R * 3));

  ctx.save();
  // soft halo in the surrounding tissue
  ctx.globalAlpha = 0.5;
  ellipsePath(ctx, CX, CY, R * 1.14, R * 1.08, 0);
  ctx.fillStyle = SKIN.eosinDeep;
  ctx.fill();
  ctx.globalAlpha = 1;

  for (let i = rings - 1; i >= 0; i--) {
    const rr = R * (0.3 + (0.7 * (i + 1)) / rings);
    ellipsePath(ctx, CX, CY, rr, rr * 0.96, 0);
    ctx.fillStyle = i % 2 === 1 ? SKIN.eosin : SKIN.eosinDeep;
    ctx.fill();
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.strokeStyle = SKIN.hemaDeep;
    ctx.lineWidth = Math.max(0.5, R * 0.03);
    ctx.stroke();
    ctx.restore();

    // flattened squamous nuclei wrapped along this keratin layer
    const n = 7 + i * 2;
    const nr = Math.max(0.8, R * 0.07);
    const phase = rnd() * TAU;
    for (let j = 0; j < n; j++) {
      const a = phase + (j / n) * TAU + (rnd() - 0.5) * 0.2;
      const d = rr * 0.9;
      const nx = CX + Math.cos(a) * d;
      const ny = CY + Math.sin(a) * d * 0.96;
      ellipsePath(ctx, nx, ny, nr * 1.7, nr * 0.8, a + Math.PI / 2);
      ctx.fillStyle = SKIN.hema;
      ctx.fill();
      ctx.strokeStyle = SKIN.hemaDeep;
      ctx.lineWidth = 0.4;
      ctx.stroke();
      if (nr > 1.6) dot(ctx, nx, ny, nr * 0.3, SKIN.nucleolus);
    }
  }

  // dense keratinised core
  ellipsePath(ctx, CX, CY, R * 0.22, R * 0.21, 0);
  ctx.fillStyle = SKIN.hemaDeep;
  ctx.fill();
  for (let i = 0; i < 5; i++) {
    const a = rnd() * TAU;
    const d = rnd() * R * 0.16;
    dot(ctx, CX + Math.cos(a) * d, CY + Math.sin(a) * d, Math.max(0.4, R * 0.03), SKIN.nucleolus);
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Microscope
// ---------------------------------------------------------------------------

/** Objective nosepiece: metal disc + 3 barrels; the active one is longer and
 *  outlined in blue and always points straight down at the specimen. */
export function drawObjectiveTurret(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  index: number
): void {
  const CX = safe(cx, 0);
  const CY = safe(cy, 0);
  const R = Math.max(6, safe(r, 16));
  const idx = Math.round(clampNum(safe(index, 0), 0, 2));

  ctx.save();
  // disc
  const dg = ctx.createRadialGradient(CX - R * 0.35, CY - R * 0.4, R * 0.1, CX, CY, R * 1.05);
  dg.addColorStop(0, '#dfe6ee');
  dg.addColorStop(0.45, SKIN.metal);
  dg.addColorStop(1, SKIN.metalDark);
  ctx.beginPath();
  ctx.arc(CX, CY, R, 0, TAU);
  ctx.fillStyle = dg;
  ctx.fill();
  ctx.strokeStyle = SKIN.metalDark;
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // barrels
  for (let i = 0; i < 3; i++) {
    const a = Math.PI / 2 + (i - idx) * (TAU / 3);
    const on = i === idx;
    const bw = R * 0.42;
    const blen = R * (on ? 2.05 : 1.45);
    const nx = Math.cos(a);
    const ny = Math.sin(a);
    ctx.save();
    ctx.translate(CX + nx * R * 0.45, CY + ny * R * 0.45);
    ctx.rotate(a - Math.PI / 2);
    roundRectPath(ctx, -bw / 2, 0, bw, blen, bw * 0.4);
    const bg = ctx.createLinearGradient(-bw / 2, 0, bw / 2, 0);
    bg.addColorStop(0, SKIN.metalDark);
    bg.addColorStop(0.35, '#e2e8ef');
    bg.addColorStop(0.7, SKIN.metal);
    bg.addColorStop(1, SKIN.metalDark);
    ctx.fillStyle = bg;
    ctx.fill();
    // objective grip rings
    ctx.strokeStyle = SKIN.metalDark;
    ctx.lineWidth = 0.6;
    for (let s = 1; s <= 2; s++) {
      const gy = (blen * s) / 3;
      ctx.beginPath();
      ctx.moveTo(-bw / 2, gy);
      ctx.lineTo(bw / 2, gy);
      ctx.stroke();
    }
    // front lens
    ellipsePath(ctx, 0, blen, bw * 0.5, bw * 0.26, 0);
    ctx.fillStyle = SKIN.hemaDeep;
    ctx.fill();
    ctx.strokeStyle = SKIN.metalDark;
    ctx.lineWidth = 0.7;
    ctx.stroke();
    if (on) {
      roundRectPath(ctx, -bw / 2, 0, bw, blen, bw * 0.4);
      ctx.strokeStyle = SKIN.blue;
      ctx.lineWidth = 2;
      ctx.stroke();
      ellipsePath(ctx, 0, blen, bw * 0.5, bw * 0.26, 0);
      ctx.strokeStyle = SKIN.blue;
      ctx.lineWidth = 1.6;
      ctx.stroke();
    }
    ctx.restore();
  }

  // hub cap
  ctx.beginPath();
  ctx.arc(CX, CY, R * 0.34, 0, TAU);
  ctx.fillStyle = SKIN.metalDark;
  ctx.globalAlpha = 0.85;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = '#dfe6ee';
  ctx.lineWidth = 0.8;
  ctx.stroke();
  ctx.restore();
}

/**
 * A recognisable upright light microscope: trapezoid base, C-shaped arm,
 * stage with a slide, tube, angled eyepiece, objective nosepiece and a focus
 * knob. `opts.objective` (0 = 4×, 1 = 10×, 2 = 40×) selects the barrel that
 * faces the specimen — the selected one is longer and outlined in blue.
 * (x, y) is the CENTRE of the machine; at scale 1 it is about 170×195 px.
 */
export function drawMicroscope(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  opts: { objective: 0 | 1 | 2 }
): void {
  const X = safe(x, 0);
  const Y = safe(y, 0);
  const s = clampNum(safe(scale, 1), 0.05, 8);
  const objective = Math.round(clampNum(safe(opts ? opts.objective : 0, 0), 0, 2));

  ctx.save();
  ctx.translate(X, Y);
  ctx.scale(s, s);
  ctx.lineJoin = 'round';

  const cyl = (
    x0: number,
    y0: number,
    x1: number,
    y1: number
  ): CanvasGradient => {
    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, SKIN.metalDark);
    g.addColorStop(0.28, '#e4eaf1');
    g.addColorStop(0.6, SKIN.metal);
    g.addColorStop(1, SKIN.metalDark);
    return g;
  };

  // ---- base ---------------------------------------------------------------
  ctx.beginPath();
  ctx.moveTo(-80, 96);
  ctx.lineTo(80, 96);
  ctx.lineTo(58, 76);
  ctx.lineTo(-56, 76);
  ctx.closePath();
  const baseG = ctx.createLinearGradient(0, 76, 0, 96);
  baseG.addColorStop(0, SKIN.metal);
  baseG.addColorStop(1, SKIN.metalDark);
  ctx.fillStyle = baseG;
  ctx.fill();
  ctx.strokeStyle = SKIN.metalDark;
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // ---- arm ----------------------------------------------------------------
  ctx.beginPath();
  ctx.moveTo(-50, 80);
  ctx.lineTo(-58, 16);
  ctx.quadraticCurveTo(-64, -48, -6, -58);
  ctx.lineTo(16, -58);
  ctx.lineTo(16, -34);
  ctx.quadraticCurveTo(-40, -34, -30, 16);
  ctx.lineTo(-24, 80);
  ctx.closePath();
  const armG = ctx.createLinearGradient(-64, 0, -6, 0);
  armG.addColorStop(0, SKIN.metalDark);
  armG.addColorStop(0.45, SKIN.metal);
  armG.addColorStop(1, '#c3ccd8');
  ctx.fillStyle = armG;
  ctx.fill();
  ctx.strokeStyle = SKIN.metalDark;
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // ---- tube ---------------------------------------------------------------
  roundRectPath(ctx, 2, -60, 24, 68, 5);
  ctx.fillStyle = cyl(2, 0, 26, 0);
  ctx.fill();
  ctx.strokeStyle = SKIN.metalDark;
  ctx.lineWidth = 1.1;
  ctx.stroke();

  // ---- head housing -------------------------------------------------------
  roundRectPath(ctx, -8, -68, 42, 26, 6);
  ctx.fillStyle = cyl(-8, 0, 34, 0);
  ctx.fill();
  ctx.strokeStyle = SKIN.metalDark;
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // ---- eyepiece (slanted) -------------------------------------------------
  ctx.save();
  ctx.translate(16, -62);
  ctx.rotate(0.62);
  roundRectPath(ctx, -9, -40, 18, 44, 7);
  ctx.fillStyle = cyl(-9, 0, 9, 0);
  ctx.fill();
  ctx.strokeStyle = SKIN.metalDark;
  ctx.lineWidth = 1.1;
  ctx.stroke();
  ctx.save();
  ctx.globalAlpha = 0.65;
  ctx.strokeStyle = SKIN.metalDark;
  ctx.lineWidth = 0.8;
  for (let i = -3; i <= 3; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 2.2, -26);
    ctx.lineTo(i * 2.2, -20);
    ctx.stroke();
  }
  ctx.restore();
  // eyepiece lens
  ellipsePath(ctx, 0, -40, 8.6, 4.6, 0);
  ctx.fillStyle = SKIN.metalDark;
  ctx.fill();
  ellipsePath(ctx, 0, -40, 5.6, 2.8, 0);
  ctx.fillStyle = SKIN.glass;
  ctx.fill();
  ctx.strokeStyle = SKIN.metalDark;
  ctx.lineWidth = 0.8;
  ctx.stroke();
  ctx.restore();

  // ---- stage --------------------------------------------------------------
  roundRectPath(ctx, -34, 56, 17, 22, 3);
  ctx.fillStyle = SKIN.metal;
  ctx.fill();
  ctx.strokeStyle = SKIN.metalDark;
  ctx.lineWidth = 1;
  ctx.stroke();

  roundRectPath(ctx, -66, 44, 132, 11, 2.5);
  const stageG = ctx.createLinearGradient(0, 44, 0, 55);
  stageG.addColorStop(0, '#cdd6e0');
  stageG.addColorStop(0.5, SKIN.metal);
  stageG.addColorStop(1, SKIN.metalDark);
  ctx.fillStyle = stageG;
  ctx.fill();
  ctx.strokeStyle = SKIN.metalDark;
  ctx.lineWidth = 1;
  ctx.stroke();

  // condenser under the stage
  roundRectPath(ctx, 6, 57, 17, 13, 3);
  ctx.fillStyle = cyl(6, 0, 23, 0);
  ctx.fill();
  ctx.strokeStyle = SKIN.metalDark;
  ctx.lineWidth = 0.9;
  ctx.stroke();

  // ---- slide with its tissue section on the stage -------------------------
  roundRectPath(ctx, -18, 37, 68, 7, 1.5);
  ctx.fillStyle = SKIN.glass;
  ctx.fill();
  ctx.strokeStyle = SKIN.glassEdge;
  ctx.lineWidth = 0.8;
  ctx.stroke();
  ellipsePath(ctx, 14, 40.5, 11, 2.3, 0);
  ctx.fillStyle = SKIN.eosin;
  ctx.fill();
  ctx.strokeStyle = SKIN.eosinDeep;
  ctx.lineWidth = 0.6;
  ctx.stroke();
  dot(ctx, 10, 40.2, 0.9, SKIN.hema);
  dot(ctx, 17, 41, 0.9, SKIN.hema);
  // stage clips
  roundRectPath(ctx, -12, 33.5, 9, 4, 1);
  ctx.fillStyle = SKIN.metal;
  ctx.fill();
  ctx.strokeStyle = SKIN.metalDark;
  ctx.lineWidth = 0.7;
  ctx.stroke();
  roundRectPath(ctx, 38, 33.5, 9, 4, 1);
  ctx.fillStyle = SKIN.metal;
  ctx.fill();
  ctx.strokeStyle = SKIN.metalDark;
  ctx.lineWidth = 0.7;
  ctx.stroke();

  // ---- objective nosepiece (in front of the stage) ------------------------
  drawObjectiveTurret(ctx, 14, 6, 16, objective);

  // ---- focus knob ---------------------------------------------------------
  const kg = ctx.createRadialGradient(-62, 28, 2, -58, 34, 15);
  kg.addColorStop(0, '#dfe6ee');
  kg.addColorStop(0.6, SKIN.metal);
  kg.addColorStop(1, SKIN.metalDark);
  ctx.beginPath();
  ctx.arc(-58, 34, 14, 0, TAU);
  ctx.fillStyle = kg;
  ctx.fill();
  ctx.strokeStyle = SKIN.metalDark;
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.save();
  ctx.globalAlpha = 0.6;
  ctx.strokeStyle = SKIN.metalDark;
  ctx.lineWidth = 1;
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU;
    ctx.beginPath();
    ctx.moveTo(-58 + Math.cos(a) * 10, 34 + Math.sin(a) * 10);
    ctx.lineTo(-58 + Math.cos(a) * 13, 34 + Math.sin(a) * 13);
    ctx.stroke();
  }
  ctx.restore();
  ctx.beginPath();
  ctx.arc(-58, 34, 5.5, 0, TAU);
  ctx.fillStyle = SKIN.metalDark;
  ctx.globalAlpha = 0.8;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = '#dfe6ee';
  ctx.lineWidth = 0.7;
  ctx.stroke();

  ctx.restore();
}

// ---------------------------------------------------------------------------
// Paperwork
// ---------------------------------------------------------------------------

function drawSheet(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  lines: string[],
  header: string,
  rot: number,
  stamp: boolean
): void {
  const X = safe(x, 0);
  const Y = safe(y, 0);
  const W = Math.max(30, safe(w, 150));
  const H = Math.max(30, safe(h, 100));
  const rows = Array.isArray(lines) ? lines : [];
  const headerH = Math.max(10, Math.min(H * 0.2, 22));

  ctx.save();
  ctx.translate(X + W / 2, Y + H / 2);
  ctx.rotate(rot);

  const hw = W / 2;
  const hh = H / 2;

  // drop shadow
  ctx.globalAlpha = 0.13;
  ctx.fillStyle = '#3c3226';
  roundRectPath(ctx, -hw + 2.5, -hh + 3.5, W, H, 3);
  ctx.fill();
  ctx.globalAlpha = 1;

  // paper
  roundRectPath(ctx, -hw, -hh, W, H, 3);
  ctx.fillStyle = SKIN.paper;
  ctx.fill();
  ctx.strokeStyle = '#ddd3c2';
  ctx.lineWidth = 1;
  ctx.stroke();

  // header bar
  roundRectPath(ctx, -hw + 1, -hh + 1, W - 2, headerH, 2.5);
  ctx.fillStyle = header;
  ctx.fill();
  ctx.globalAlpha = 0.6;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-hw + 8, -hh + headerH * 0.34, Math.min(W * 0.42, 58), Math.max(2, headerH * 0.3));
  ctx.globalAlpha = 1;

  // 3–5 ruled rows with short real text
  const nRows = Math.round(clampNum(rows.length, 3, 5));
  const top = -hh + headerH + 8;
  const bottom = hh - (stamp ? 26 : 10);
  const gap = Math.max(8, (bottom - top) / nRows);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  for (let i = 0; i < nRows; i++) {
    const ry = top + gap * i;
    if (ry > hh - 4) break;
    ctx.strokeStyle = SKIN.axis;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(-hw + 8, ry);
    ctx.lineTo(hw - 8, ry);
    ctx.stroke();
    const raw = typeof rows[i] === 'string' ? rows[i] : '';
    const text = raw.length > 14 ? raw.slice(0, 14) : raw;
    if (text) {
      const size = clampNum(Math.min(gap * 0.62, W / 12), 8, 12);
      ctx.font = `${size}px ${FONT_STACK}`;
      ctx.fillStyle = SKIN.text;
      ctx.fillText(text, -hw + 10, ry - 3);
    }
  }

  if (stamp) {
    // red circular date stamp (outline only, no glyphs)
    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.strokeStyle = SKIN.red;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(hw - 20, hh - 18, 13, 0, TAU);
    ctx.stroke();
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.arc(hw - 20, hh - 18, 9.5, 0, TAU);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(hw - 29, hh - 18);
    ctx.lineTo(hw - 11, hh - 18);
    ctx.stroke();
    ctx.restore();
  } else {
    // signature rule
    ctx.strokeStyle = SKIN.green;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-hw + 10, hh - 12);
    ctx.lineTo(-hw + 10 + W * 0.4, hh - 12);
    ctx.stroke();
  }

  ctx.restore();
}

/** Request form: paper sheet tilted -1.5° with a blue title bar, ruled rows
 *  of ≤14 characters each and a red circular rubber stamp (no glyphs). */
export function drawRequestForm(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  lines: string[]
): void {
  drawSheet(ctx, x, y, w, h, lines, SKIN.blue, -0.026, true);
}

/** Report sheet: upright paper with a green title bar and ruled rows. */
export function drawReportSheet(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  lines: string[]
): void {
  drawSheet(ctx, x, y, w, h, lines, SKIN.green, 0, false);
}

/**
 * Embedding cassette: translucent plastic box with a perforated grid and a
 * lid that either sits on top or swings open on its left hinge.
 */
export function drawEmbeddingCassette(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  lidOpen: boolean
): void {
  const X = safe(x, 0);
  const Y = safe(y, 0);
  const W = Math.max(20, safe(w, 90));
  const H = Math.max(10, safe(h, 34));
  const lidH = Math.max(5, H * 0.34);

  ctx.save();

  // lid
  ctx.save();
  if (lidOpen) {
    ctx.translate(X, Y);
    ctx.rotate(-0.38);
    ctx.translate(-X, -Y);
  }
  roundRectPath(ctx, X, lidOpen ? Y - lidH - 4 : Y - lidH * 0.6, W, lidH, 3);
  const lg = ctx.createLinearGradient(0, Y - lidH, 0, Y);
  lg.addColorStop(0, '#f2f7fb');
  lg.addColorStop(1, SKIN.glass);
  ctx.fillStyle = lg;
  ctx.fill();
  ctx.strokeStyle = SKIN.glassEdge;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.save();
  ctx.globalAlpha = 0.55;
  ctx.strokeStyle = SKIN.glassEdge;
  ctx.lineWidth = 0.6;
  for (let gx = X + 5; gx < X + W - 3; gx += 5) {
    ctx.beginPath();
    ctx.moveTo(gx, Y - lidH);
    ctx.lineTo(gx, Y);
    ctx.stroke();
  }
  ctx.restore();
  ctx.restore();

  // body
  roundRectPath(ctx, X, Y, W, H, 3.5);
  const bg = ctx.createLinearGradient(X, Y, X + W, Y + H);
  bg.addColorStop(0, 'rgba(240,247,252,0.92)');
  bg.addColorStop(0.5, 'rgba(226,238,247,0.9)');
  bg.addColorStop(1, 'rgba(206,222,235,0.92)');
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.save();
  ctx.clip();
  // perforation grid
  ctx.strokeStyle = SKIN.glassEdge;
  ctx.lineWidth = 0.6;
  const step = Math.max(3, W / 22);
  for (let gx = X + step; gx < X + W; gx += step) {
    ctx.beginPath();
    ctx.moveTo(gx, Y);
    ctx.lineTo(gx, Y + H);
    ctx.stroke();
  }
  for (let gy = Y + step; gy < Y + H; gy += step) {
    ctx.beginPath();
    ctx.moveTo(X, gy);
    ctx.lineTo(X + W, gy);
    ctx.stroke();
  }
  // frosted writing strip on the right
  ctx.fillStyle = SKIN.frost;
  ctx.globalAlpha = 0.85;
  ctx.fillRect(X + W * 0.72, Y + 1.5, W * 0.26, H - 3);
  ctx.globalAlpha = 0.7;
  ctx.strokeStyle = '#d6d1c4';
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.moveTo(X + W * 0.75, Y + H * 0.45);
  ctx.lineTo(X + W * 0.95, Y + H * 0.45);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(X + W * 0.75, Y + H * 0.68);
  ctx.lineTo(X + W * 0.95, Y + H * 0.68);
  ctx.stroke();
  ctx.restore();
  roundRectPath(ctx, X, Y, W, H, 3.5);
  ctx.strokeStyle = SKIN.glassEdge;
  ctx.lineWidth = 1.1;
  ctx.stroke();

  ctx.restore();
}

/**
 * Tweezers: two slim metal arms meeting at the pivot (x, y) and running ~52px
 * along `angle`; `open` (0..1) spreads the tips apart.
 */
export function drawTweezers(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  open: number
): void {
  const X = safe(x, 0);
  const Y = safe(y, 0);
  const A = safe(angle, 0);
  const op = clampNum(safe(open, 0), 0, 1);
  const L = 52;
  const gap = 3.4 + op * 8;

  ctx.save();
  ctx.translate(X, Y);
  ctx.rotate(A);

  const metalG = ctx.createLinearGradient(-gap - 2, 0, gap + 2, 0);
  metalG.addColorStop(0, SKIN.metalDark);
  metalG.addColorStop(0.3, '#e4eaf1');
  metalG.addColorStop(0.6, SKIN.metal);
  metalG.addColorStop(1, SKIN.metalDark);

  for (let k = 0; k < 2; k++) {
    const s = k === 0 ? -1 : 1;
    ctx.beginPath();
    ctx.moveTo(s * 1.3, -16);
    ctx.quadraticCurveTo(s * (gap * 0.35 + 2.2), 10, s * gap, L);
    ctx.lineTo(s * (gap - 3.2), L + 0.8);
    ctx.quadraticCurveTo(s * (gap * 0.35 - 1.8), 10, -s * 0.8, -16);
    ctx.closePath();
    ctx.fillStyle = metalG;
    ctx.fill();
    ctx.strokeStyle = SKIN.metalDark;
    ctx.lineWidth = 1;
    ctx.stroke();
    // serrated grip near the tip
    ctx.save();
    ctx.globalAlpha = 0.7;
    ctx.strokeStyle = SKIN.metalDark;
    ctx.lineWidth = 0.5;
    for (let i = 0; i < 3; i++) {
      const ty = L - 4 - i * 3;
      const tx = s * (gap - (4 - i) * 0.45);
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(tx - s * 2.2, ty + 1.6);
      ctx.stroke();
    }
    ctx.restore();
  }

  // pivot
  ctx.beginPath();
  ctx.arc(0, -16, 3.3, 0, TAU);
  ctx.fillStyle = SKIN.metalDark;
  ctx.fill();
  ctx.strokeStyle = SKIN.metal;
  ctx.lineWidth = 0.8;
  ctx.stroke();
  ctx.restore();
}

/** Gross specimen: an irregular eosin soft-tissue block with haematoxylin
 *  specks and a wet highlight. */
export function drawSpecimen(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  seed: number
): void {
  const CX = safe(cx, 0);
  const CY = safe(cy, 0);
  const R = Math.max(4, safe(r, 22));
  const rnd = lcg(seed);

  ctx.save();
  // cast shadow on the bench
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = SKIN.benchDark;
  ellipsePath(ctx, CX + 2, CY + R * 0.5, R * 1.02, R * 0.34, 0);
  ctx.fill();
  ctx.globalAlpha = 1;

  blobPath(ctx, CX, CY, R, R * 0.84, seed, 0.2, 22);
  ctx.fillStyle = SKIN.eosin;
  ctx.fill();
  ctx.strokeStyle = SKIN.eosinDeep;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.save();
  ctx.clip();
  // deeper eosin patches
  for (let i = 0; i < 4; i++) {
    ctx.globalAlpha = 0.5;
    blobPath(
      ctx,
      CX + (rnd() - 0.5) * R * 0.9,
      CY + (rnd() - 0.5) * R * 0.7,
      R * (0.18 + rnd() * 0.2),
      R * (0.14 + rnd() * 0.16),
      seed + 31 * (i + 1),
      0.3,
      12
    );
    ctx.fillStyle = SKIN.eosinDeep;
    ctx.fill();
  }
  // haematoxylin specks (tumour nests in the gross specimen)
  ctx.globalAlpha = 0.9;
  for (let i = 0; i < 9; i++) {
    const a = rnd() * TAU;
    const d = rnd() * R * 0.72;
    dot(
      ctx,
      CX + Math.cos(a) * d,
      CY + Math.sin(a) * d * 0.84,
      Math.max(0.7, R * (0.05 + rnd() * 0.05)),
      SKIN.hema
    );
  }
  // wet highlight
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = '#ffffff';
  ellipsePath(ctx, CX - R * 0.28, CY - R * 0.34, R * 0.3, R * 0.16, -0.5);
  ctx.fill();
  ctx.restore();
  ctx.restore();
}

/** Staining jar: glass square jar, stain bath at `level` (0..1) and a metal
 *  rim; a slide parked in it stays visible through the glass. */
export function drawStainJar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  level: number
): void {
  const X = safe(x, 0);
  const Y = safe(y, 0);
  const W = Math.max(12, safe(w, 64));
  const H = Math.max(16, safe(h, 96));
  const lv = clampNum(safe(level, 0), 0, 1);
  const rim = Math.max(4, H * 0.075);
  const rad = Math.min(W * 0.12, 6);
  const bodyTop = Y + rim * 0.5;
  const bodyH = H - rim * 0.5;

  ctx.save();

  // glass body back
  roundRectPath(ctx, X, bodyTop, W, bodyH, rad);
  ctx.fillStyle = 'rgba(233,242,248,0.55)';
  ctx.fill();

  // stain bath
  ctx.save();
  roundRectPath(ctx, X, bodyTop, W, bodyH, rad);
  ctx.clip();
  const liqH = (H - rim) * lv;
  if (liqH > 0.6) {
    const ly = Y + H - liqH;
    const lg = ctx.createLinearGradient(0, ly, 0, Y + H);
    lg.addColorStop(0, 'rgba(123,106,168,0.62)');
    lg.addColorStop(1, 'rgba(77,63,112,0.9)');
    ctx.fillStyle = lg;
    ctx.fillRect(X, ly, W, liqH + rad + 2);
    // meniscus
    ctx.strokeStyle = 'rgba(77,63,112,0.9)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(X, ly);
    ctx.quadraticCurveTo(X + W / 2, ly + 2.4, X + W, ly);
    ctx.stroke();
    // sediment at the bottom
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = SKIN.hemaDeep;
    ctx.fillRect(X, Y + H - Math.min(6, liqH * 0.4), W, Math.min(6, liqH * 0.4));
    ctx.globalAlpha = 1;
    // the slide standing in the bath
    if (liqH > H * 0.2) {
      roundRectPath(ctx, X + W * 0.32, ly - H * 0.32, W * 0.36, H * 0.52, 2);
      ctx.fillStyle = 'rgba(233,242,248,0.45)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.75)';
      ctx.lineWidth = 0.9;
      ctx.stroke();
    }
  }
  ctx.restore();

  // vertical glass highlight
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = '#ffffff';
  roundRectPath(ctx, X + W * 0.1, bodyTop + 4, Math.max(2, W * 0.1), bodyH * 0.62, 3);
  ctx.fill();
  ctx.globalAlpha = 1;

  // metal rim at the mouth of the jar
  roundRectPath(ctx, X - 2, Y, W + 4, rim, rim * 0.45);
  const rg = ctx.createLinearGradient(X - 2, 0, X + W + 2, 0);
  rg.addColorStop(0, SKIN.metalDark);
  rg.addColorStop(0.3, '#e4eaf1');
  rg.addColorStop(0.6, SKIN.metal);
  rg.addColorStop(1, SKIN.metalDark);
  ctx.fillStyle = rg;
  ctx.fill();
  ctx.strokeStyle = SKIN.metalDark;
  ctx.lineWidth = 1;
  ctx.stroke();

  // glass outline
  roundRectPath(ctx, X, bodyTop, W, bodyH, rad);
  ctx.strokeStyle = SKIN.glassEdge;
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Labels, legend, technical inset
// ---------------------------------------------------------------------------

/** One short in-canvas label (silently truncated to 8 characters). */
export function drawLabel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
  color: string,
  size: number
): void {
  const X = safe(x, 0);
  const Y = safe(y, 0);
  const s = clampNum(safe(size, 13), 11, 20);
  const raw = typeof text === 'string' ? text : '';
  const shown = raw.length > 8 ? raw.slice(0, 8) : raw;
  if (!shown) return;
  ctx.save();
  ctx.font = `${s}px ${FONT_STACK}`;
  ctx.fillStyle = typeof color === 'string' && color ? color : SKIN.text;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(shown, X, Y);
  ctx.restore();
}

/** Legend of at most three entries; extra entries are silently dropped. */
export function drawLegend(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  items: { label: string; color: string }[]
): void {
  const X = safe(x, 0);
  const Y = safe(y, 0);
  const list = Array.isArray(items) ? items : [];
  const count = Math.min(list.length, 3);
  if (count === 0) return;
  ctx.save();
  ctx.font = `12px ${FONT_STACK}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  for (let i = 0; i < count; i++) {
    const it = list[i];
    const rowY = Y + i * 18;
    const color = typeof it.color === 'string' && it.color ? it.color : SKIN.muted;
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = color;
    roundRectPath(ctx, X - 1.5, rowY - 6.5, 13, 13, 3);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = color;
    roundRectPath(ctx, X, rowY - 5, 10, 10, 2.5);
    ctx.fill();
    ctx.strokeStyle = SKIN.axis;
    ctx.lineWidth = 0.8;
    roundRectPath(ctx, X, rowY - 5, 10, 10, 2.5);
    ctx.stroke();
    const raw = typeof it.label === 'string' ? it.label : '';
    const label = raw.length > 6 ? raw.slice(0, 6) : raw;
    ctx.fillStyle = SKIN.muted;
    ctx.fillText(label, X + 16, rowY);
  }
  ctx.restore();
}

/** Technical inset: horizontal bars plus their bare numbers. */
export function drawMiniBars(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  items: { value: number; color: string }[],
  max: number
): void {
  const X = safe(x, 0);
  const Y = safe(y, 0);
  const W = Math.max(20, safe(w, 160));
  const H = Math.max(12, safe(h, 80));
  const list = Array.isArray(items) ? items : [];
  const n = list.length;
  if (n === 0) return;
  const denom = safe(max, 1) > 0 ? safe(max, 1) : 1;
  const slot = H / n;
  const barH = Math.max(3, Math.min(16, slot * 0.5));
  const trackX = X + 4;
  const trackW = Math.max(10, W - 74);

  ctx.save();
  ctx.font = `12px ${FONT_STACK}`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  for (let i = 0; i < n; i++) {
    const cy = Y + slot * (i + 0.5);
    const v = safe(list[i].value, 0);
    const filled = clampNum(v / denom, 0, 1) * trackW;
    strokeLine(ctx, trackX, cy, trackX + trackW, cy, SKIN.axis, 1);
    if (filled > 0.5) {
      ctx.fillStyle =
        typeof list[i].color === 'string' && list[i].color ? list[i].color : SKIN.blue;
      roundRectPath(ctx, trackX, cy - barH / 2, filled, barH, Math.min(3, barH / 2));
      ctx.fill();
    }
    ctx.fillStyle = SKIN.text;
    ctx.fillText(sig3(v), X + W - 2, cy);
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Placeholder component (the real content lives in the paper-specific widgets)
// ---------------------------------------------------------------------------

export const VizKit: React.FC<{ chapterId: string; moduleId: string }> = () => null;
export default VizKit;
