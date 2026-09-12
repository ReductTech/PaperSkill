// Shared drawing kit for the TrackCraft3R tutorial — home-video dog tracking theme.
// Reused by the Hero panels, all analogy cards, and every module that draws the
// life metaphor. Semantic colors are fixed (contract §5): green = paper method /
// success / the tracked mark; red = old method / drift / failure; blue = guidance /
// current state; orange = user emphasis / time tags; purple = auxiliary (latents).

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
  orange: '#f07e47',
  purple: '#7c3aed',
  text: '#21324a',
  muted: '#68778f',
  border: '#d7deea',
  white: '#ffffff',
};

/** Quiet scene field + floor line; optionally a top-view grid. */
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
    // soft room contour
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
 * The recurring protagonist: a small side-view dog.
 * (x, y) is the ground point under the dog's front legs.
 */
export function drawDog(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  opts?: { mood?: 'idle' | 'walk' | 'hide'; flip?: boolean; t?: number }
) {
  const t = opts?.t ?? 0;
  const mood = opts?.mood ?? 'idle';
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(opts?.flip ? -scale : scale, scale);
  // tail (wags when idle/walk, tucked when hiding)
  ctx.strokeStyle = C.deep;
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  if (mood === 'hide') {
    ctx.moveTo(-22, -14);
    ctx.quadraticCurveTo(-34, -8, -26, -2);
  } else {
    const wag = Math.sin(t * 2 * Math.PI) * 0.5;
    ctx.moveTo(-22, -16);
    ctx.quadraticCurveTo(-34, -26 + wag * 6, -30, -34 + wag * 8);
  }
  ctx.stroke();
  // legs
  ctx.lineWidth = 3;
  const stride = mood === 'walk' ? Math.sin(t * 2 * Math.PI) * 3 : 0;
  [[-14, stride], [-6, -stride], [10, -stride], [17, stride]].forEach(([lx, off]) => {
    ctx.beginPath();
    ctx.moveTo(lx, -12);
    ctx.lineTo(lx + off, 0);
    ctx.stroke();
  });
  // body
  ctx.fillStyle = C.ground;
  ctx.strokeStyle = C.deep;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(-2, -18, 17, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // head
  ctx.beginPath();
  ctx.arc(16, -26, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // ear
  ctx.beginPath();
  ctx.moveTo(12, -32);
  ctx.lineTo(9, -40);
  ctx.lineTo(16, -34);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // snout dot (nose) — the place the green mark belongs
  ctx.fillStyle = C.deep;
  ctx.beginPath();
  ctx.arc(23, -25, 1.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** The green tracked-mark motif: fill + white ring + soft halo. */
export function drawTracker(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.save();
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = C.green;
  ctx.beginPath();
  ctx.arc(x, y, r * 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = C.green;
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = C.white;
  ctx.beginPath();
  ctx.arc(x, y, r * 0.55, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

/** Dashed (or solid) trajectory polyline. */
export function drawTrail(ctx: CanvasRenderingContext2D, pts: Pt[], color: string, dashed = true) {
  if (pts.length < 2) return;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  if (dashed) ctx.setLineDash([6, 5]);
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.stroke();
  ctx.restore();
}

/** Camcorder glyph + optional viewfinder rectangle (blue). */
export function drawCamcorder(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  opts?: { tilt?: number; scale?: number }
) {
  const s = opts?.scale ?? 1;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((opts?.tilt ?? 0) * 0.2);
  ctx.scale(s, s);
  ctx.fillStyle = C.blue;
  ctx.strokeStyle = C.blue;
  ctx.lineWidth = 2;
  // body
  ctx.beginPath();
  ctx.roundRect(-14, -8, 20, 15, 3);
  ctx.fill();
  // lens
  ctx.beginPath();
  ctx.moveTo(6, -4);
  ctx.lineTo(16, -9);
  ctx.lineTo(16, 7);
  ctx.lineTo(6, 3);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** The sofa occluder prop. */
export function drawSofa(ctx: CanvasRenderingContext2D, x: number, y: number, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = C.ground;
  ctx.strokeStyle = C.deep;
  ctx.lineWidth = 2;
  // back
  ctx.beginPath();
  ctx.roundRect(-46, -44, 92, 20, 5);
  ctx.fill();
  ctx.stroke();
  // seat
  ctx.beginPath();
  ctx.roundRect(-50, -26, 100, 26, 6);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

/** Orange timestamp chip with white text (keep label ≤ 8 chars). */
export function drawTimeCard(ctx: CanvasRenderingContext2D, x: number, y: number, label: string) {
  ctx.save();
  ctx.fillStyle = C.orange;
  ctx.beginPath();
  ctx.roundRect(x - 26, y - 12, 52, 24, 6);
  ctx.fill();
  ctx.fillStyle = C.white;
  ctx.font = '13px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x, y + 1);
  ctx.restore();
}

/** Film strip with n cells; optional highlighted cell index. */
export function drawFilmStrip(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  n: number,
  highlight?: number
) {
  const cell = 46;
  const gap = 8;
  const w = n * cell + (n - 1) * gap;
  ctx.save();
  ctx.strokeStyle = C.border;
  ctx.lineWidth = 1.5;
  ctx.fillStyle = C.white;
  ctx.beginPath();
  ctx.roundRect(x - 8, y - 20, w + 16, 68, 8);
  ctx.fill();
  ctx.stroke();
  for (let i = 0; i < n; i++) {
    const cx = x + i * (cell + gap);
    ctx.fillStyle = i === highlight ? '#e8f3ec' : C.bg;
    ctx.strokeStyle = i === highlight ? C.green : C.border;
    ctx.lineWidth = i === highlight ? 2 : 1.25;
    ctx.beginPath();
    ctx.roundRect(cx, y - 12, cell, 52, 4);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

/** In-canvas label (≤ 8 chars, one line). */
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

/** Compact legend, ≤ 3 entries: [text, color][]. */
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

/** Vertical value chip for bare numbers (e.g. metrics). */
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
