import { clamp, lerp } from '../lib/canvasKit';

// ---------------------------------------------------------------------------
// Shared drawing kit for all module widgets (palette, labels, sample cards).
// The old per-chapter analogy animations were removed; analogy slots now show
// original paper figures or plain text instead.
// ---------------------------------------------------------------------------

export const K = {
  bg: '#fafbfc',
  paper: '#f6f8fc',
  paperShadow: '#d7deea',
  dust: '#94a3b8',
  envLight: '#6b8f7a',
  envDark: '#3f5c52',
  support: '#64748b',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#c05621',
  purple: '#5b4b8a',
  text: '#21324a',
  muted: '#68778f',
  border: '#d7deea',
  card: '#ffffff',
  sky: '#d7e3ee',
  hand: '#e8edf3',
  handDark: '#9fb0c8',
};

export function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function drawSceneBg(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = K.bg;
  ctx.fillRect(0, 0, w, h);
}

/** Deterministic pseudo-random stream for stable speckle layouts. */
export function makeRand(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

/** Clean-image RGB for a landscape sample at uv∈[0,1]² (v=0 is sky). */
function landscapeRgb(u: number, v: number): [number, number, number] {
  const sun = Math.hypot(u - 0.74, v - 0.22);
  if (v < 0.40) {
    if (sun < 0.07) return [236, 196, 118];
    if (sun < 0.11) return [214, 186, 140];
    const t = v / 0.4;
    return [Math.round(186 + t * 28), Math.round(206 + t * 16), Math.round(222 + t * 8)];
  }
  const ridgeA = 0.40 + 0.22 * Math.exp(-((u - 0.32) ** 2) / 0.05);
  const ridgeB = 0.48 + 0.16 * Math.exp(-((u - 0.68) ** 2) / 0.06);
  if (v < ridgeA) return [72, 102, 96];
  if (v < ridgeB) return [110, 140, 122];
  const water = 0.55 + 0.04 * Math.sin(u * 18 + v * 6);
  if (v > water) {
    const refl = 0.12 * Math.sin(u * 22);
    return [118 + Math.round(refl * 40), 142, 156];
  }
  const bank = v > 0.78 ? 1 : 0;
  return bank ? [148, 156, 132] : [126, 148, 118];
}

/**
 * A sample image: smooth landscape when clean, pixel-grid scramble when noisy.
 */
export function drawPhotoCard(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  noise: number, seed = 7
) {
  const n = clamp(noise, 0, 1);
  roundRect(ctx, x, y, w, h, 3);
  ctx.fillStyle = K.card;
  ctx.fill();
  ctx.strokeStyle = K.border;
  ctx.lineWidth = 1;
  ctx.stroke();

  const m = Math.max(2, Math.min(4, w * 0.035));
  const px = x + m, py = y + m, pw = w - m * 2, ph = h - m * 2;
  ctx.save();
  roundRect(ctx, px, py, pw, ph, 2);
  ctx.clip();

  ctx.fillStyle = '#c5d6e4';
  ctx.fillRect(px, py, pw, ph);
  ctx.fillStyle = '#e8c47a';
  ctx.beginPath();
  ctx.arc(px + pw * 0.74, py + ph * 0.22, Math.min(pw, ph) * 0.09, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#3f5c52';
  ctx.beginPath();
  ctx.moveTo(px, py + ph);
  ctx.bezierCurveTo(px + pw * 0.12, py + ph * 0.42, px + pw * 0.28, py + ph * 0.38, px + pw * 0.48, py + ph);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#6b8f7a';
  ctx.beginPath();
  ctx.moveTo(px + pw * 0.28, py + ph);
  ctx.bezierCurveTo(px + pw * 0.52, py + ph * 0.46, px + pw * 0.78, py + ph * 0.52, px + pw, py + ph);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#7a96a8';
  ctx.fillRect(px, py + ph * 0.72, pw, ph * 0.28);
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.beginPath();
  ctx.moveTo(px, py + ph * 0.78);
  ctx.quadraticCurveTo(px + pw * 0.5, py + ph * 0.74, px + pw, py + ph * 0.8);
  ctx.stroke();

  if (n > 0.04) {
    const cols = Math.max(8, Math.round(pw / 7));
    const rows = Math.max(6, Math.round(ph / 7));
    const cw = pw / cols, ch = ph / rows;
    const rand = makeRand(seed * 17 + 3);
    ctx.globalAlpha = Math.min(1, n * 1.15);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const u = (c + 0.5) / cols;
        const v = (r + 0.5) / rows;
        const nr = 150 + rand() * 70;
        const ng = 155 + rand() * 60;
        const nb = 160 + rand() * 50;
        const jx = (rand() - 0.5) * n;
        const jy = (rand() - 0.5) * n;
        const [jr, jg, jb] = landscapeRgb(clamp(u + jx, 0, 1), clamp(v + jy, 0, 1));
        ctx.fillStyle = `rgb(${Math.round(lerp(jr, nr, n))},${Math.round(lerp(jg, ng, n))},${Math.round(lerp(jb, nb, n))})`;
        ctx.fillRect(px + c * cw, py + r * ch, cw + 0.4, ch + 0.4);
      }
    }
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

/**
 * The u-space panel. on∈[0,1] fades the blue frame in; warp∈[0,1]: 1 = wavy
 * grid (coordinates still bent), 0 = perfectly straight grid.
 */
export function drawLightTable(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  on: number, warp = 0
) {
  roundRect(ctx, x - 3, y - 3, w + 6, h + 6, 5);
  ctx.fillStyle = K.paperShadow;
  ctx.fill();
  roundRect(ctx, x, y, w, h, 3);
  ctx.fillStyle = K.card;
  ctx.fill();
  if (on > 0.01) {
    roundRect(ctx, x, y, w, h, 3);
    ctx.fillStyle = `rgba(39, 68, 110, ${(0.1 * on).toFixed(3)})`;
    ctx.fill();
    ctx.strokeStyle = `rgba(39, 68, 110, ${(0.85 * on).toFixed(3)})`;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  // grid
  ctx.save();
  roundRect(ctx, x, y, w, h, 3);
  ctx.clip();
  ctx.strokeStyle = on > 0.5 ? 'rgba(39,68,110,0.35)' : 'rgba(159,176,200,0.55)';
  ctx.lineWidth = 1;
  const cols = 6, rows = 4;
  for (let i = 1; i < cols; i++) {
    const gx = x + (w / cols) * i;
    ctx.beginPath();
    for (let yy = 0; yy <= h; yy += 4) {
      const off = warp * 4 * Math.sin(yy * 0.12 + i * 1.7);
      if (yy === 0) ctx.moveTo(gx + off, y + yy);
      else ctx.lineTo(gx + off, y + yy);
    }
    ctx.stroke();
  }
  for (let j = 1; j < rows; j++) {
    const gy = y + (h / rows) * j;
    ctx.beginPath();
    for (let xx = 0; xx <= w; xx += 4) {
      const off = warp * 4 * Math.sin(xx * 0.1 + j * 2.1);
      if (xx === 0) ctx.moveTo(x + xx, gy + off);
      else ctx.lineTo(x + xx, gy + off);
    }
    ctx.stroke();
  }
  ctx.restore();
}

export function drawLabel(
  ctx: CanvasRenderingContext2D,
  text: string, x: number, y: number,
  color = K.muted, size = 11,
  align: CanvasTextAlign = 'left'
) {
  ctx.fillStyle = color;
  ctx.font = `${size}px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
  ctx.textAlign = 'left';
}

export function drawLegendDot(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, color: string, text: string
) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, 4, 0, Math.PI * 2);
  ctx.fill();
  drawLabel(ctx, text, x + 8, y, K.muted, 10);
}

export function drawCheck(ctx: CanvasRenderingContext2D, x: number, y: number, r = 9) {
  ctx.fillStyle = K.green;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - r * 0.45, y);
  ctx.lineTo(x - r * 0.1, y + r * 0.35);
  ctx.lineTo(x + r * 0.5, y - r * 0.35);
  ctx.stroke();
}
