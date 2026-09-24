// Shared drawing kit for the RT-2 tutorial — novice-chef theme.
// Reused by the Hero panels, all analogy cards, and every module that draws the
// life metaphor. Semantic colors are fixed: green = paper method / success;
// red = old method / failure; blue = guidance / current state; orange = user
// emphasis / time; purple = auxiliary (tokens / vocabulary).

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

/** Quiet scene field + counter/ground line; optionally a light grid. */
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
 * The recurring protagonist: a small chef. (x, y) is the ground point.
 * mode: 'read' holds a cookbook, 'cook' holds a spatula, 'shake' shakes head.
 */
export function drawChef(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  opts?: { mode?: 'read' | 'cook' | 'shake'; t?: number; chefColor?: string }
) {
  const t = opts?.t ?? 0;
  const mode = opts?.mode ?? 'read';
  const cloth = opts?.chefColor ?? C.blue;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  const shake = mode === 'shake' ? Math.sin(t * 2 * Math.PI) * 3 : 0;
  ctx.translate(shake, 0);
  // body (apron)
  ctx.fillStyle = cloth;
  ctx.strokeStyle = C.deep;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-11, -26, 22, 26, 6);
  ctx.fill();
  ctx.stroke();
  // apron string
  ctx.strokeStyle = C.white;
  ctx.lineWidth = 1.25;
  ctx.beginPath();
  ctx.moveTo(-8, -22);
  ctx.lineTo(8, -22);
  ctx.stroke();
  // head
  ctx.fillStyle = '#f2e3cf';
  ctx.strokeStyle = C.deep;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, -33, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // eyes
  ctx.fillStyle = C.text;
  ctx.beginPath();
  ctx.arc(-3, -34, 1.1, 0, Math.PI * 2);
  ctx.arc(3, -34, 1.1, 0, Math.PI * 2);
  ctx.fill();
  // chef hat
  ctx.fillStyle = C.white;
  ctx.strokeStyle = C.deep;
  ctx.lineWidth = 1.75;
  ctx.beginPath();
  ctx.roundRect(-7.5, -47, 15, 7, 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(-4, -49, 4.4, 0, Math.PI * 2);
  ctx.arc(4, -49, 4.4, 0, Math.PI * 2);
  ctx.arc(0, -52, 4.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // held item
  if (mode === 'read') {
    ctx.fillStyle = C.white;
    ctx.strokeStyle = C.support;
    ctx.lineWidth = 1.75;
    ctx.beginPath();
    ctx.roundRect(10, -24, 13, 10, 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = C.border;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(16.5, -23);
    ctx.lineTo(16.5, -15);
    ctx.stroke();
  } else if (mode === 'cook') {
    ctx.strokeStyle = C.support;
    ctx.lineWidth = 2.25;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(10, -18);
    ctx.lineTo(22, -24 + Math.sin(t * 2 * Math.PI) * 2);
    ctx.stroke();
    ctx.fillStyle = C.ground;
    ctx.beginPath();
    ctx.ellipse(24, -26 + Math.sin(t * 2 * Math.PI) * 2, 4, 6, 0.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** A customer order card. Keep `label` short (≤ 6 chars). */
export function drawOrderCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  label: string,
  color: string = C.blue
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.04);
  ctx.fillStyle = C.white;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-34, -20, 68, 40, 5);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.font = '12px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, 0, 0);
  ctx.restore();
}

/** One numeric command token chip. */
export function drawTokenChip(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  value: string,
  color: string = C.purple
) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x - 17, y - 13, 34, 26, 5);
  ctx.fill();
  ctx.fillStyle = C.white;
  ctx.font = '13px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(value, x, y + 1);
  ctx.restore();
}

/** A row of 8 command tokens starting at (x, y), spaced `gap` px. */
export function drawTokenString(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  values: (string | number)[],
  gap = 40,
  highlightIndex = -1
) {
  values.forEach((v, i) => {
    drawTokenChip(ctx, x + i * gap, y, String(v), i === highlightIndex ? C.orange : C.purple);
  });
}

/** A stack of cookbooks (web knowledge). */
export function drawCookbook(ctx: CanvasRenderingContext2D, x: number, y: number, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  const book = (dy: number, color: string) => {
    ctx.fillStyle = color;
    ctx.strokeStyle = C.deep;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(-20, dy - 8, 40, 9, 2);
    ctx.fill();
    ctx.stroke();
  };
  book(0, C.ground);
  book(-9, '#d9c7a7');
  book(-18, C.ground);
  // open book on top
  ctx.fillStyle = C.white;
  ctx.strokeStyle = C.deep;
  ctx.lineWidth = 1.75;
  ctx.beginPath();
  ctx.moveTo(-18, -26);
  ctx.lineTo(0, -21);
  ctx.lineTo(18, -26);
  ctx.lineTo(18, -36);
  ctx.lineTo(0, -31);
  ctx.lineTo(-18, -36);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, -31);
  ctx.lineTo(0, -21);
  ctx.stroke();
  ctx.restore();
}

/** A stovetop with two knobs. */
export function drawStove(ctx: CanvasRenderingContext2D, x: number, y: number, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = C.ground;
  ctx.strokeStyle = C.deep;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-36, -16, 72, 18, 4);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = C.deep;
  ctx.beginPath();
  ctx.arc(-14, -7, 4.5, 0, Math.PI * 2);
  ctx.arc(14, -7, 4.5, 0, Math.PI * 2);
  ctx.fill();
  // pan
  ctx.strokeStyle = C.support;
  ctx.lineWidth = 2.25;
  ctx.beginPath();
  ctx.arc(0, -20, 9, Math.PI * 0.15, Math.PI * 0.85, false);
  ctx.stroke();
  ctx.restore();
}

/** The old employee's button menu board (closed-set). */
export function drawMenuBoard(ctx: CanvasRenderingContext2D, x: number, y: number, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = C.white;
  ctx.strokeStyle = C.red;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-32, -34, 64, 68, 6);
  ctx.fill();
  ctx.stroke();
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 3; c++) {
      ctx.fillStyle = (r + c) % 2 === 0 ? '#f6e3e6' : '#efd6da';
      ctx.strokeStyle = C.red;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(-26 + c * 19, -26 + r * 15, 15, 11, 2);
      ctx.fill();
      ctx.stroke();
    }
  }
  ctx.restore();
}

/** A simple 2-segment robot arm with a gripper. */
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
  // base
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-9, -6, 18, 8, 2);
  ctx.fill();
  // two segments
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
  // gripper
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

/** Success check / failure cross marks. */
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

/**
 * Large verdict badge: filled disc + white check/cross with a pulsing halo,
 * so accept/reject is unmistakable at a glance.
 */
export function drawVerdict(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  ok: boolean,
  opts?: { r?: number; pulse?: number }
) {
  const r = opts?.r ?? 17;
  const pulse = opts?.pulse ?? 0; // 0..1 phase; halo breathes with it
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
  ctx.strokeStyle = C.white;
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

/** Value chip for bare numbers (metrics). */
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
