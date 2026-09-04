import { easeOutCubic } from '../lib/canvasKit';

/** Animate numeric value over durationMs; returns cancel fn. */
export function animateValue(
  from: number,
  to: number,
  durationMs: number,
  onUpdate: (v: number) => void,
  onDone?: () => void
): () => void {
  const t0 = performance.now();
  let raf = 0;
  const tick = (now: number) => {
    const t = Math.min(1, (now - t0) / durationMs);
    onUpdate(from + (to - from) * easeOutCubic(t));
    if (t < 1) raf = requestAnimationFrame(tick);
    else onDone?.();
  };
  raf = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(raf);
}

export function lerpPt(a: number, b: number, t: number) {
  return a + (b - a) * t;
}
