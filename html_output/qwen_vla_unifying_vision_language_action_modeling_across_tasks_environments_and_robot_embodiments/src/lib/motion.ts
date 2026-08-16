export const EASE_PANEL = 'cubic-bezier(0.22, 0.61, 0.36, 1)';

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function motionDuration(normalMs: number): number {
  return prefersReducedMotion() ? 0 : normalMs;
}
