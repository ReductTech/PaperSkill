// Shared drawing kit for the detective-case tutorial. Every Canvas (Hero, analogies,
// modules) imports these helpers so geometry, line weights and semantic colors stay
// identical across chapters.
//
// Scene vocabulary: a case-desk with dossiers, exhibit bags, pinned clue tags, red
// thread, a magnifier and a rubber stamp. Semantic colors never change meaning:
// red = wrong lead, blue = current work, green = confirmed, orange = emphasis,
// purple = secondary mechanism.

export type Ctx = CanvasRenderingContext2D;

export const C = {
  bg: '#f6f1e4',
  envLight: '#cfc0a3',
  envDark: '#8b7a5b',
  route: '#8c2f1e',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#d97706',
  purple: '#7c3aed',
  ink: '#21324a',
  muted: '#6f6a5c',
  border: '#d8cdb6',
  card: '#fffdf6',
  wood: '#e3d7bd',
  brass: '#a98a52',
};

export function withAlpha(hex: string, a: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

export function roundRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number): void {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

export function clearScene(ctx: Ctx, w: number, h: number): void {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, w, h);
  // desk board
  ctx.fillStyle = C.wood;
  ctx.fillRect(0, h - 26, w, 26);
  ctx.strokeStyle = C.border;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, h - 26);
  ctx.lineTo(w, h - 26);
  ctx.stroke();
}

export function drawShelf(ctx: Ctx, x: number, y: number, w: number, h: number): void {
  ctx.fillStyle = withAlpha(C.envLight, 0.55);
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = C.envDark;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x, y, w, h);
}

export function drawSpine(
  ctx: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string = C.envLight,
  dashed = false
): void {
  ctx.save();
  if (dashed) {
    ctx.setLineDash([5, 4]);
    ctx.globalAlpha = 0.55;
  }
  ctx.fillStyle = dashed ? withAlpha(C.card, 0.9) : color;
  roundRect(ctx, x, y, w, h, 4);
  ctx.fill();
  ctx.strokeStyle = dashed ? C.border : withAlpha(C.envDark, 0.75);
  ctx.lineWidth = 1.2;
  roundRect(ctx, x, y, w, h, 4);
  ctx.stroke();
  if (!dashed && h > 18) {
    ctx.strokeStyle = withAlpha(C.card, 0.65);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 6, y + h * 0.28);
    ctx.lineTo(x + w - 6, y + h * 0.28);
    ctx.moveTo(x + 6, y + h * 0.72);
    ctx.lineTo(x + w - 6, y + h * 0.72);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawIndexCard(
  ctx: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  opts: { border?: string; lines?: number; fill?: string; alpha?: number } = {}
): void {
  const { border = C.border, lines = 3, fill = C.card, alpha = 1 } = opts;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = fill;
  roundRect(ctx, x, y, w, h, 5);
  ctx.fill();
  ctx.strokeStyle = border;
  ctx.lineWidth = 1.5;
  roundRect(ctx, x, y, w, h, 5);
  ctx.stroke();
  ctx.strokeStyle = withAlpha(C.border, 0.85);
  ctx.lineWidth = 1;
  for (let i = 1; i <= lines; i++) {
    const ly = y + (h / (lines + 1)) * i;
    ctx.beginPath();
    ctx.moveTo(x + 8, ly);
    ctx.lineTo(x + w - 8, ly);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawSlot(
  ctx: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  state: 'idle' | 'valid' | 'reject' | 'hover'
): void {
  const color =
    state === 'valid' ? C.green : state === 'reject' ? C.red : state === 'hover' ? C.blue : C.border;
  ctx.save();
  ctx.fillStyle = state === 'valid' ? withAlpha(C.green, 0.1) : state === 'reject' ? withAlpha(C.red, 0.1) : withAlpha(C.card, 0.6);
  roundRect(ctx, x, y, w, h, 4);
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = state === 'idle' ? 1.2 : 2;
  ctx.setLineDash(state === 'idle' ? [4, 4] : []);
  roundRect(ctx, x, y, w, h, 4);
  ctx.stroke();
  ctx.restore();
}

export function drawBin(ctx: Ctx, x: number, y: number, w: number, h: number, color = C.envDark): void {
  ctx.save();
  ctx.fillStyle = withAlpha(C.envLight, 0.35);
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.6;
  ctx.strokeRect(x, y, w, h);
  // mouth
  ctx.strokeStyle = withAlpha(color, 0.9);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x - 8, y);
  ctx.lineTo(x + w + 8, y);
  ctx.stroke();
  ctx.restore();
}

// Wide module canvases (1080 px) are displayed at roughly 0.5-0.8 of their intrinsic
// width, so their in-Canvas type must be drawn larger to stay legible after scaling.
function fontK(ctx: Ctx): number {
  const design = Number(ctx.canvas.dataset.designWidth || 0) || ctx.canvas.width;
  return design >= 900 ? 1.5 : 1;
}

export function drawTag(
  ctx: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  text: string,
  color: string = C.blue
): void {
  ctx.save();
  ctx.fillStyle = withAlpha(color, 0.12);
  roundRect(ctx, x, y, w, h, 4);
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  roundRect(ctx, x, y, w, h, 4);
  ctx.stroke();
  ctx.fillStyle = C.ink;
  const base = 13 * fontK(ctx);
  ctx.font = `${Math.round(base)}px "Segoe UI","PingFang SC",sans-serif`;
  const measured = ctx.measureText(text).width;
  const room = w - 12;
  if (measured > room && room > 0) {
    ctx.font = `${Math.max(8, Math.floor(base * room / measured))}px "Segoe UI","PingFang SC",sans-serif`;
  }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + w / 2, y + h / 2 + 0.5);
  ctx.restore();
}

export function drawBar(
  ctx: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  value: number,
  color: string,
  showValue = true
): void {
  const v = Math.max(0, Math.min(1, value));
  ctx.save();
  ctx.fillStyle = withAlpha(C.border, 0.35);
  roundRect(ctx, x, y, w, h, h / 2);
  ctx.fill();
  ctx.fillStyle = color;
  roundRect(ctx, x, y, Math.max(3, w * v), h, h / 2);
  ctx.fill();
  if (showValue) {
    ctx.fillStyle = C.ink;
    ctx.font = `${Math.round(12 * fontK(ctx))}px "Cascadia Code","Segoe UI",monospace`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillText(v.toFixed(2), x, y - 3);
  }
  ctx.restore();
}

export function drawVote(ctx: Ctx, x: number, y: number, count: number, max = 3, color = C.green): void {
  ctx.save();
  for (let i = 0; i < max; i++) {
    const cx = x + i * 12;
    ctx.beginPath();
    ctx.arc(cx, y, 4, 0, Math.PI * 2);
    ctx.fillStyle = i < count ? color : withAlpha(C.border, 0.9);
    ctx.fill();
    if (i < count) {
      ctx.strokeStyle = withAlpha(color, 0.6);
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }
  ctx.restore();
}

export function drawNib(ctx: Ctx, x: number, y: number, angle = 0): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = C.ink;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(10, 4);
  ctx.lineTo(14, 0);
  ctx.lineTo(10, -4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = C.route;
  ctx.fillRect(-14, -3, 14, 6);
  ctx.restore();
}

export function drawStamp(ctx: Ctx, x: number, y: number, scale = 1): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = C.route;
  roundRect(ctx, -22, -26, 44, 10, 3);
  ctx.fill();
  ctx.fillStyle = withAlpha(C.route, 0.85);
  roundRect(ctx, -14, -16, 28, 14, 3);
  ctx.fill();
  ctx.restore();
}

export function drawLabel(
  ctx: Ctx,
  x: number,
  y: number,
  text: string,
  color: string = C.ink,
  size = 14,
  align: CanvasTextAlign = 'left'
): void {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = `${Math.round(size * fontK(ctx))}px "Segoe UI","PingFang SC",sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
  ctx.restore();
}

export function drawLegend(
  ctx: Ctx,
  x: number,
  y: number,
  items: { text: string; color: string }[]
): void {
  ctx.save();
  ctx.font = `${Math.round(11 * fontK(ctx))}px "Segoe UI","PingFang SC",sans-serif`;
  ctx.textBaseline = 'middle';
  let cx = x;
  for (const item of items) {
    ctx.fillStyle = item.color;
    ctx.beginPath();
    ctx.arc(cx, y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = C.muted;
    ctx.fillText(item.text, cx + 9, y);
    cx += 9 + ctx.measureText(item.text).width + 14;
  }
  ctx.restore();
}

/** Map a pointer event to intrinsic Canvas coordinates. */
export function pointerToCanvas(
  e: { clientX: number; clientY: number },
  canvas: HTMLCanvasElement,
  w: number,
  h: number
): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((e.clientX - rect.left) / rect.width) * w,
    y: ((e.clientY - rect.top) / rect.height) * h,
  };
}

/* ---------- Detective kit: exhibits, thread, pins, magnifier ---------- */

/** A simple two-eared vessel silhouette, used as "the exhibit". */
export function drawVase(
  ctx: Ctx,
  cx: number,
  cy: number,
  scale = 1,
  color: string = C.envLight,
  outline: string = C.envDark
): void {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  ctx.beginPath();
  ctx.moveTo(-8, -22);
  ctx.quadraticCurveTo(-16, -6, -12, 8);
  ctx.quadraticCurveTo(-8, 22, 0, 22);
  ctx.quadraticCurveTo(8, 22, 12, 8);
  ctx.quadraticCurveTo(16, -6, 8, -22);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = withAlpha(outline, 0.8);
  ctx.lineWidth = 1.4;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-9, -22);
  ctx.lineTo(9, -22);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 2, 5.5, 0.2 * Math.PI, 0.8 * Math.PI);
  ctx.stroke();
  ctx.restore();
}

/** A transparent exhibit bag with a sealed top strip. */
export function drawBag(
  ctx: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string = C.envLight
): void {
  ctx.save();
  ctx.fillStyle = withAlpha(C.card, 0.9);
  roundRect(ctx, x, y, w, h, 4);
  ctx.fill();
  ctx.strokeStyle = withAlpha(color, 0.85);
  ctx.lineWidth = 1.3;
  roundRect(ctx, x, y, w, h, 4);
  ctx.stroke();
  ctx.fillStyle = withAlpha(color, 0.35);
  roundRect(ctx, x, y + 3, w, 6, 3);
  ctx.fill();
  ctx.strokeStyle = withAlpha(C.muted, 0.5);
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(x + 4, y + h - 4);
  ctx.lineTo(x + w - 4, y + h - 4);
  ctx.stroke();
  ctx.restore();
}

/** A watch-glass magnifier with a handle. */
export function drawLoupe(ctx: Ctx, x: number, y: number, r = 20, angle = 0.6): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = withAlpha(C.card, 0.9);
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = C.brass;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = C.brass;
  roundRect(ctx, r - 1, -4, 16, 8, 3);
  ctx.fill();
  ctx.restore();
}

/** A red thread from A to B, optionally with a knot at the tip. */
export function drawThread(
  ctx: Ctx,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  p = 1,
  color: string = C.route
): void {
  if (p <= 0) return;
  const xm = (x1 + x2) / 2;
  const ym = Math.min(y1, y2) - 26;
  const qx = (1 - p) * x1 + p * xm;
  const qy = (1 - p) * y1 + p * ym;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.quadraticCurveTo(qx, qy, (1 - p) * x1 + p * x2, (1 - p) * y1 + p * y2);
  ctx.stroke();
  if (p >= 0.98) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x2, y2, 4.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** A push-pin planted at (x, y). */
export function drawPin(ctx: Ctx, x: number, y: number, color: string = C.blue): void {
  ctx.save();
  ctx.strokeStyle = withAlpha(color, 0.5);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y + 10);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = withAlpha('#ffffff', 0.6);
  ctx.beginPath();
  ctx.arc(x - 1.6, y - 1.6, 1.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** A case box (档案盒) drawn as an open carton with a lid line. */
export function drawCaseBox(
  ctx: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string = C.envDark
): void {
  ctx.save();
  ctx.fillStyle = withAlpha(C.envLight, 0.35);
  roundRect(ctx, x, y, w, h, 5);
  ctx.fill();
  ctx.strokeStyle = withAlpha(color, 0.85);
  ctx.lineWidth = 1.6;
  roundRect(ctx, x, y, w, h, 5);
  ctx.stroke();
  ctx.fillStyle = withAlpha(color, 0.25);
  roundRect(ctx, x, y + 4, w, 8, 3);
  ctx.fill();
  ctx.restore();
}

/** A small paper clip. */
export function drawClip(ctx: Ctx, x: number, y: number, color: string = C.brass): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y + 18);
  ctx.arc(x + 5, y + 18, 5, Math.PI, Math.PI * 1.9);
  ctx.lineTo(x + 10, y + 6);
  ctx.moveTo(x, y);
  ctx.arc(x + 5, y, 5, Math.PI, Math.PI * 1.9);
  ctx.stroke();
  ctx.restore();
}
