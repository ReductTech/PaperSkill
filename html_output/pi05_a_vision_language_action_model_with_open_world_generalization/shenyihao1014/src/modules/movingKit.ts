// Shared drawing kit for the π0.5 tutorial — moving & cleaning crew theme.
// Semantic colors fixed per contract: green = π0.5 / success; red = old
// in-lab-only method / failure; blue = current state / model / high-level;
// orange = user emphasis; purple = action expert / tokens.

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

/** Quiet field + ground line; optional light grid. */
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
 * The recurring protagonist: a crew member. (x, y) = ground point.
 * mode: 'coach' holds a megaphone (high-level), 'work' bends to work
 * (low-level), 'shrug' stands helpless.
 */
export function drawCrew(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  opts?: { mode?: 'coach' | 'work' | 'shrug'; t?: number; color?: string }
) {
  const t = opts?.t ?? 0;
  const mode = opts?.mode ?? 'work';
  const cloth = opts?.color ?? C.green;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  if (mode === 'work') {
    // bent posture
    ctx.rotate(0.12);
  }
  // body (overalls)
  ctx.fillStyle = cloth;
  ctx.strokeStyle = C.deep;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-11, -26, 22, 26, 6);
  ctx.fill();
  ctx.stroke();
  // strap
  ctx.strokeStyle = C.white;
  ctx.lineWidth = 1.25;
  ctx.beginPath();
  ctx.moveTo(-7, -22);
  ctx.lineTo(7, -22);
  ctx.stroke();
  // head + cap
  ctx.fillStyle = '#f2e3cf';
  ctx.strokeStyle = C.deep;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, -33, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = C.orange;
  ctx.beginPath();
  ctx.roundRect(-9, -42, 18, 5, 2);
  ctx.fill();
  ctx.strokeStyle = C.deep;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = C.text;
  ctx.beginPath();
  ctx.arc(-3, -32, 1.1, 0, Math.PI * 2);
  ctx.arc(3, -32, 1.1, 0, Math.PI * 2);
  ctx.fill();
  if (mode === 'coach') {
    // megaphone in right hand
    ctx.save();
    ctx.strokeStyle = C.support;
    ctx.lineWidth = 2.25;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(10, -18);
    ctx.lineTo(17, -22);
    ctx.stroke();
    ctx.fillStyle = C.support;
    ctx.beginPath();
    ctx.moveTo(17, -28);
    ctx.lineTo(26, -32);
    ctx.lineTo(26, -12);
    ctx.lineTo(17, -16);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  } else if (mode === 'work') {
    // holding a cloth, wiping motion
    const off = Math.sin(t * 2 * Math.PI) * 3;
    ctx.strokeStyle = '#f2e3cf';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(10, -14);
    ctx.lineTo(18, -6 + off);
    ctx.stroke();
    ctx.fillStyle = C.white;
    ctx.strokeStyle = C.border;
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    ctx.roundRect(14, -8 + off, 12, 8, 2);
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

/**
 * A home card: roof + interior whose tidiness grows with tidy01.
 * familiar=false gives a different wall/roof palette ("unseen home").
 */
export function drawHome(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  opts?: { familiar?: boolean; tidy01?: number; label?: string }
) {
  const familiar = opts?.familiar ?? true;
  const tidy = Math.max(0, Math.min(1, opts?.tidy01 ?? 0));
  const wall = familiar ? '#e9f0e6' : '#f0e8e4';
  const roof = familiar ? C.ground : '#c9a08a';
  ctx.save();
  // body
  ctx.fillStyle = wall;
  ctx.strokeStyle = C.deep;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x, y + h * 0.22, w, h * 0.78, 6);
  ctx.fill();
  ctx.stroke();
  // roof
  ctx.fillStyle = roof;
  ctx.beginPath();
  ctx.moveTo(x - 5, y + h * 0.24);
  ctx.lineTo(x + w / 2, y - 4);
  ctx.lineTo(x + w + 5, y + h * 0.24);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // clutter items: count decreases with tidiness
  const clutter = Math.round((1 - tidy) * 5);
  for (let k = 0; k < clutter; k++) {
    const cx = x + 12 + ((k * 53) % Math.max(1, w - 24));
    const cy = y + h * 0.55 + ((k * 31) % Math.max(1, h * 0.35));
    ctx.fillStyle = k % 2 === 0 ? '#d4b98d' : '#c4b8d4';
    ctx.strokeStyle = C.deep;
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    ctx.roundRect(cx, cy, 10, 8, 2);
    ctx.fill();
    ctx.stroke();
  }
  // sparkle marks when tidy
  if (tidy > 0.7) {
    ctx.strokeStyle = C.green;
    ctx.lineWidth = 1.5;
    [[0.2, 0.35], [0.8, 0.3], [0.5, 0.6]].forEach(([fx, fy]) => {
      const sx = x + w * fx;
      const sy = y + h * fy;
      ctx.beginPath();
      ctx.moveTo(sx - 4, sy);
      ctx.lineTo(sx + 4, sy);
      ctx.moveTo(sx, sy - 4);
      ctx.lineTo(sx, sy + 4);
      ctx.stroke();
    });
  }
  // door
  ctx.strokeStyle = C.deep;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x + w * 0.38, y + h * 0.5, w * 0.24, h * 0.5, 3);
  ctx.stroke();
  if (opts?.label) {
    ctx.fillStyle = C.muted;
    ctx.font = '11px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(opts.label, x + w / 2, y + h + 12);
  }
  ctx.restore();
}

/** A study notebook with a colored tab label. */
export function drawNotebook(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  label: string,
  opts?: { dim?: boolean; struck?: boolean; color?: string }
) {
  const color = opts?.color ?? C.blue;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.globalAlpha = opts?.dim ? 0.35 : 1;
  // cover
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-16, -20, 32, 40, 3);
  ctx.fill();
  ctx.stroke();
  // spine
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-10, -20);
  ctx.lineTo(-10, 20);
  ctx.stroke();
  // tab
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(-6, -24, 14, 8, 2);
  ctx.fill();
  ctx.fillStyle = C.white;
  ctx.font = '8px "Segoe UI", "PingFang SC", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, 1, -20);
  // note lines
  ctx.strokeStyle = C.border;
  ctx.lineWidth = 1;
  for (let r = 0; r < 4; r++) {
    ctx.beginPath();
    ctx.moveTo(-6, -10 + r * 8);
    ctx.lineTo(10, -10 + r * 8);
    ctx.stroke();
  }
  if (opts?.struck) {
    ctx.strokeStyle = C.red;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-18, -22);
    ctx.lineTo(18, 22);
    ctx.stroke();
  }
  ctx.restore();
}

/** A coach speech bubble with short text (≤ 10 chars per line). */
export function drawSpeechOut(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
  opts?: { color?: string; w?: number }
) {
  const color = opts?.color ?? C.blue;
  const w = opts?.w ?? Math.max(64, text.length * 12 + 20);
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(x - w / 2, y - 16, w, 28, 10);
  ctx.fill();
  // tail
  ctx.beginPath();
  ctx.moveTo(x - 8, y + 11);
  ctx.lineTo(x - 14, y + 22);
  ctx.lineTo(x + 2, y + 12);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = C.white;
  ctx.font = '12px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y - 2);
  ctx.restore();
}

/** Small task glyphs: pick / place / wipe / close. */
export function drawTaskGlyph(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  kind: 'pick' | 'place' | 'wipe' | 'close'
) {
  ctx.save();
  ctx.strokeStyle = C.blue;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  if (kind === 'pick') {
    // hand + up arrow
    ctx.beginPath();
    ctx.moveTo(x, y + 6);
    ctx.lineTo(x, y - 8);
    ctx.moveTo(x - 4, y - 4);
    ctx.lineTo(x, y - 8);
    ctx.lineTo(x + 4, y - 4);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y + 10, 4, 0, Math.PI * 2);
    ctx.stroke();
  } else if (kind === 'place') {
    // box + down arrow
    ctx.beginPath();
    ctx.roundRect(x - 7, y + 2, 14, 10, 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y - 10);
    ctx.lineTo(x, y);
    ctx.moveTo(x - 4, y - 4);
    ctx.lineTo(x, y);
    ctx.lineTo(x + 4, y - 4);
    ctx.stroke();
  } else if (kind === 'wipe') {
    // zigzag sweep
    ctx.beginPath();
    ctx.moveTo(x - 9, y + 4);
    ctx.lineTo(x - 3, y - 4);
    ctx.lineTo(x + 3, y + 4);
    ctx.lineTo(x + 9, y - 4);
    ctx.stroke();
  } else {
    // door closing
    ctx.beginPath();
    ctx.roundRect(x - 8, y - 10, 16, 18, 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x + 4, y - 1, 1.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + 7, y - 1);
    ctx.lineTo(x + 12, y - 6);
    ctx.stroke();
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
