// Shared Canvas drawing kit for the SWIM tutorial — photography ("focus") theme.
// One quiet scene, one recurring photographed subject (a potted flower), one target
// (a green AF focus ring), and one attention "heat" blob that maps cross-attention
// concentration to how tight the focus lands. Semantic colors follow contract.md §5:
// red = diffuse/old, green = sharp/SWIM, blue = guidance/current, orange = user emphasis.

export const C = {
  bg: '#f5f8f0',
  light: '#b8c9a7',
  dark: '#76906a',
  route: '#92400e',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#d97706',
  purple: '#7c3aed',
  ink: '#21324a',
  muted: '#68778f',
  border: '#d7deea',
};

export type Ctx = CanvasRenderingContext2D;

// --- background & ground -----------------------------------------------------
export function clearScene(ctx: Ctx, w: number, h: number): void {
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, w, h);
  // soft ground band
  ctx.fillStyle = C.light;
  ctx.fillRect(0, h - 22, w, 22);
  ctx.fillStyle = 'rgba(118,144,106,0.35)';
  ctx.fillRect(0, h - 7, w, 7);
}

// --- photographed subject: a potted flower ----------------------------------
// `focus` in [0,1]: 1 = sharp (full contrast), 0 = blurred (washed out).
export function drawFlower(ctx: Ctx, x: number, y: number, s: number, focus: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  const alpha = 0.45 + 0.55 * focus;

  // stem + leaves
  ctx.strokeStyle = C.route;
  ctx.globalAlpha = alpha;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -34);
  ctx.stroke();
  // leaves
  ctx.fillStyle = C.dark;
  ctx.beginPath();
  ctx.ellipse(-9, -20, 8, 4, -0.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(9, -26, 8, 4, 0.6, 0, Math.PI * 2);
  ctx.fill();

  // petals (a simple blossom)
  ctx.globalAlpha = alpha;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    ctx.fillStyle = i % 2 === 0 ? '#d97706' : '#e0a83f';
    ctx.beginPath();
    ctx.ellipse(Math.cos(a) * 11, -40 + Math.sin(a) * 11, 7, 7, a, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#92400e';
  ctx.beginPath();
  ctx.arc(0, -40, 5, 0, Math.PI * 2);
  ctx.fill();

  // pot
  ctx.globalAlpha = alpha;
  ctx.fillStyle = C.dark;
  ctx.beginPath();
  ctx.moveTo(-12, 0);
  ctx.lineTo(12, 0);
  ctx.lineTo(8, 18);
  ctx.lineTo(-8, 18);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.restore();
}

// --- target: an AF focus ring (corner brackets) -----------------------------
export function drawFocusRing(
  ctx: Ctx,
  cx: number,
  cy: number,
  halfW: number,
  halfH: number,
  color: string,
  pulse: number
): void {
  const t = 8 + Math.sin(pulse * Math.PI * 2) * 1.5; // corner length
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  const x = cx - halfW;
  const y = cy - halfH;
  const w = halfW * 2;
  const h = halfH * 2;
  ctx.beginPath();
  // corners
  ctx.moveTo(x, y + t); ctx.lineTo(x, y); ctx.lineTo(x + t, y);
  ctx.moveTo(x + w - t, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + t);
  ctx.moveTo(x + w, y + h - t); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w - t, y + h);
  ctx.moveTo(x + t, y + h); ctx.lineTo(x, y + h); ctx.lineTo(x, y + h - t);
  ctx.stroke();
}

// --- attention "heat" blob: cross-attention concentration --------------------
// spread = radius of the glow. Small = sharp/localized, large = diffuse.
export function drawHeat(
  ctx: Ctx,
  cx: number,
  cy: number,
  spread: number,
  color: string,
  clipW: number,
  clipH: number,
  clipX = 0,
  clipY = 0
): void {
  ctx.save();
  ctx.beginPath();
  ctx.rect(clipX, clipY, clipW, clipH);
  ctx.clip();
  const r = Math.max(4, spread);
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  g.addColorStop(0, color);
  g.addColorStop(0.55, color);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(clipX, clipY, clipW, clipH);
  ctx.restore();
}

// --- a gaussian curve for the attention distribution ------------------------
export function drawGaussian(
  ctx: Ctx,
  cx: number,
  baseY: number,
  amp: number,
  sigma: number,
  color: string,
  clipX: number,
  clipW: number
): void {
  ctx.save();
  ctx.beginPath();
  ctx.rect(clipX, baseY - amp - 6, clipW, amp + 12);
  ctx.clip();
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let px = clipX; px <= clipX + clipW; px += 2) {
    const dx = px - cx;
    const y = baseY - amp * Math.exp(-(dx * dx) / (2 * sigma * sigma));
    if (px === clipX) ctx.moveTo(px, y);
    else ctx.lineTo(px, y);
  }
  ctx.stroke();
  ctx.restore();
}

// --- horizontal bars for comparison -----------------------------------------
export interface Bar {
  label: string;
  value: number;
  color: string;
  highlight?: boolean;
}
export function drawBars(
  ctx: Ctx,
  x: number,
  y: number,
  w: number,
  bars: Bar[],
  max: number
): void {
  const rowH = 26;
  ctx.textBaseline = 'middle';
  bars.forEach((b, i) => {
    const yy = y + i * rowH;
    const bw = Math.max(2, (b.value / max) * (w - 130));
    ctx.fillStyle = b.color;
    ctx.fillRect(x, yy, bw, 16);
    if (b.highlight) {
      ctx.strokeStyle = C.orange;
      ctx.lineWidth = 2;
      ctx.strokeRect(x, yy, bw, 16);
    }
    ctx.fillStyle = C.ink;
    ctx.font = '12px "Segoe UI", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(b.label, x + bw + 6, yy + 8);
    ctx.fillStyle = C.muted;
    ctx.textAlign = 'right';
    ctx.fillText(String(b.value), x - 6, yy + 8);
  });
  ctx.textAlign = 'left';
}

// --- scene label -------------------------------------------------------------
export function sceneLabel(
  ctx: Ctx,
  text: string,
  x: number,
  y: number,
  color = C.ink,
  size = 13,
  align: CanvasTextAlign = 'left'
): void {
  ctx.fillStyle = color;
  ctx.font = `${size}px "Segoe UI", "PingFang SC", sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'top';
  ctx.fillText(text, x, y);
  ctx.textAlign = 'left';
}

// --- a small legend key ------------------------------------------------------
export function drawLegend(ctx: Ctx, x: number, y: number, items: { color: string; text: string }[]): void {
  let cx = x;
  ctx.textBaseline = 'middle';
  ctx.font = '11px "Segoe UI", "PingFang SC", sans-serif';
  items.forEach((it) => {
    ctx.fillStyle = it.color;
    ctx.fillRect(cx, y, 10, 10);
    ctx.fillStyle = C.muted;
    ctx.textAlign = 'left';
    ctx.fillText(it.text, cx + 14, y + 5);
    cx += 14 + ctx.measureText(it.text).width + 14;
  });
  ctx.textAlign = 'left';
}
