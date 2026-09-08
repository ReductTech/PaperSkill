export function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function lerp(from: number, to: number, progress: number): number {
  return from + (to - from) * clamp01(progress);
}

export function easeInOutCubic(progress: number): number {
  const t = clamp01(progress);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function easeOutCubic(progress: number): number {
  const t = clamp01(progress);
  return 1 - Math.pow(1 - t, 3);
}

export function phaseProgress(progress: number, start: number, end: number): number {
  if (end <= start) return progress >= end ? 1 : 0;
  return clamp01((progress - start) / (end - start));
}
