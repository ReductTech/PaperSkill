// ddpm-common.ts — shared EXACT DDPM schedule math and small helpers for all modules.
//
// Schedule per the paper (Section 4 + Appendix B):
//   T = 1000, β_t increases linearly from β_1 = 1e-4 to β_T = 0.02,
//   α_t = 1 − β_t, ᾱ_t = ∏_{s≤t} α_s (cumulative product, no approximation).
// Every module that displays β/α/ᾱ-derived numbers imports from here so the
// tutorial never shows hand-tuned or "animation-friendly" values.

export const T = 1000;
export const BETA_START = 1e-4; // β₁ (paper: "β1 = 10−4")
export const BETA_END = 0.02; // β_T (paper: "βT = 0.02")

const betaArr: number[] = new Array(T + 1).fill(0);
const alphaArr: number[] = new Array(T + 1).fill(1);
const abarArr: number[] = new Array(T + 1).fill(1);

for (let t = 1; t <= T; t += 1) {
  betaArr[t] = BETA_START + ((BETA_END - BETA_START) * (t - 1)) / (T - 1);
  alphaArr[t] = 1 - betaArr[t];
  abarArr[t] = abarArr[t - 1] * alphaArr[t];
}

export function clampI(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(v)));
}

export function betaAt(t: number): number {
  return betaArr[clampI(t, 1, T)];
}

export function alphaAt(t: number): number {
  return alphaArr[clampI(t, 1, T)];
}

/** ᾱ_t with the convention ᾱ_0 = 1 (empty product). */
export function abarAt(t: number): number {
  if (t <= 0) return 1;
  return abarArr[clampI(t, 0, T)];
}

/** √ᾱ_t — the signal coefficient of x_t = √ᾱ_t x_0 + √(1−ᾱ_t) ε (Eq. (4)). */
export function signalCoef(t: number): number {
  return Math.sqrt(abarAt(t));
}

/** √(1−ᾱ_t) — the noise coefficient of the forward process at time t (Eq. (4)). */
export function noiseCoef(t: number): number {
  return Math.sqrt(Math.max(0, 1 - abarAt(t)));
}

export interface PosteriorStats {
  /** weight of x_0 in μ̃_t. */
  c0: number;
  /** weight of x_t in μ̃_t. */
  ctx: number;
  /** β̃_t: variance of q(x_{t−1}|x_t, x_0). */
  variance: number;
}

/**
 * q(x_{t−1}|x_t, x_0) = N(μ̃_t, β̃_t I) — paper Eq. (6)–(7):
 *   μ̃_t = √ᾱ_{t−1}·β_t/(1−ᾱ_t)·x_0 + √α_t(1−ᾱ_{t−1})/(1−ᾱ_t)·x_t,
 *   β̃_t = (1−ᾱ_{t−1})/(1−ᾱ_t)·β_t.
 * Valid for t ≥ 2. At t = 1 the posterior is degenerate (β̃_1 = 0) and the paper
 * instead uses the discrete decoder p_θ(x_0|x_1) in Eq. (13) (the L_0 term), so
 * this function returns null and callers must show the t = 1 special case.
 */
export function posteriorAt(t: number): PosteriorStats | null {
  if (t < 2) return null;
  const tt = clampI(t, 2, T);
  const denom = 1 - abarArr[tt];
  const prev = abarArr[tt - 1];
  return {
    c0: (Math.sqrt(prev) * betaArr[tt]) / denom,
    ctx: (Math.sqrt(alphaArr[tt]) * (1 - prev)) / denom,
    variance: ((1 - prev) / denom) * betaArr[tt],
  };
}

// ---------------------------------------------------------------------------
// Number formatting
// ---------------------------------------------------------------------------

const SUP: Record<string, string> = {
  '-': '⁻',
  '0': '⁰',
  '1': '¹',
  '2': '²',
  '3': '³',
  '4': '⁴',
  '5': '⁵',
  '6': '⁶',
  '7': '⁷',
  '8': '⁸',
  '9': '⁹',
};

/** Compact display: fixed decimals when ≥ 1e-3, otherwise 4.29×10⁻⁵ style. */
export function fmt(x: number, digits = 4): string {
  if (!Number.isFinite(x)) return '—';
  const ax = Math.abs(x);
  if (ax === 0) return '0';
  if (ax >= 1e-3) return x.toFixed(digits);
  const e = Math.floor(Math.log10(ax));
  const m = x / 10 ** e;
  const sup = String(e)
    .split('')
    .map((ch) => SUP[ch] ?? ch)
    .join('');
  return `${m.toFixed(2)}×10${sup}`;
}

// ---------------------------------------------------------------------------
// Deterministic RNG (teaching demos only — never used to imply paper data)
// ---------------------------------------------------------------------------

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------------
// Tiny shared canvas helpers (keeps the scene language consistent)
// ---------------------------------------------------------------------------

export function clearField(ctx: CanvasRenderingContext2D, w: number, h: number, bg = '#f5f8f0'): void {
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
}

export function sceneLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  opts?: { size?: number; color?: string; align?: CanvasTextAlign }
): void {
  ctx.fillStyle = opts?.color ?? '#21324a';
  ctx.font = `700 ${opts?.size ?? 18}px "Segoe UI","PingFang SC",sans-serif`;
  ctx.textAlign = opts?.align ?? 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(text, x, y);
}

export function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
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

/** Diagonal hatch overlay — marks "not applicable / not reported" states. */
export function drawHatch(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color = '#b9c4d6'
): void {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.55;
  for (let i = -h; i < w; i += 14) {
    ctx.beginPath();
    ctx.moveTo(x + i, y + h);
    ctx.lineTo(x + i + h, y);
    ctx.stroke();
  }
  ctx.restore();
}
