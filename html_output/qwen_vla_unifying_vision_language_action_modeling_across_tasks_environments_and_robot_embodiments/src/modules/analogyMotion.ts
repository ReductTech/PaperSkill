/** Shared easing + phase helpers for Analogy Micro-Cinema (244×130). */

export const ANA_DURATION = 4.2; // seconds, full loop

export function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

/** Map global loop progress [0,1] to local [0,1] within [start,end] fraction. */
export function phaseProgress(p: number, start: number, end: number): number {
  if (p <= start) return 0;
  if (p >= end) return 1;
  return (p - start) / (end - start);
}

/** Continuous loop phase in [0,1). */
export function loopPhase(nowMs: number, durationSec = ANA_DURATION): number {
  return ((nowMs / 1000) % durationSec) / durationSec;
}

/** Stagger index helper — returns delay fraction for item i of n. */
export function stagger(i: number, n: number, spread = 0.12): number {
  return (i / Math.max(n - 1, 1)) * spread;
}

/** Standard analogy design tokens (SVG stroke / fill). */
export const ANA = {
  navy: '#34476f',
  green: '#5A8F68',
  amber: '#d97706',
  gray: '#D9E0E8',
  grayStroke: '#b8c4d0',
  softBg: '#eef3fb',
  purple: '#7c6ba8',
  stroke: 1.2,
  radius: 4,
} as const;

export const ANA_CSS = {
  stage: 'ana-stage',
  orbit: 'ana-orbit',
  flowDot: 'ana-flow-dot',
  glow: 'ana-glow',
  enter: 'ana-enter',
  exit: 'ana-exit',
  pulse: 'ana-pulse',
} as const;
