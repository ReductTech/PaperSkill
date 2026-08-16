// Canvas drawing kit — paper-agnostic helpers. Ported from the legacy utils.js.
// These are static; the generator does NOT edit this file. Paper-specific drawing
// lives in components/modules under src/modules/*.

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function lerpColor(c1: string, c2: string, t: number): string {
  const p = (h: string) => [
    parseInt(h.slice(1, 3), 16),
    parseInt(h.slice(3, 5), 16),
    parseInt(h.slice(5, 7), 16),
  ];
  const [r1, g1, b1] = p(c1);
  const [r2, g2, b2] = p(c2);
  return `rgb(${Math.round(lerp(r1, r2, t))},${Math.round(lerp(g1, g2, t))},${Math.round(
    lerp(b1, b2, t)
  )})`;
}

export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

export function easeSpring(t: number): number {
  return 1 - Math.cos(t * Math.PI * 0.5);
}

export function easeOutBounce(t: number): number {
  const n1 = 7.5625;
  const d1 = 2.75;
  if (t < 1 / d1) return n1 * t * t;
  if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
  if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
  return n1 * (t -= 2.625 / d1) * t + 0.984375;
}

export function dist(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

export function map(
  v: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number {
  return ((v - inMin) / (inMax - inMin)) * (outMax - outMin) + outMin;
}

/** Setup a canvas for HiDPI. Returns the 2D context scaled to CSS pixels. */
export function setupCanvas(canvas: HTMLCanvasElement, w: number, h: number): CanvasRenderingContext2D {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D context unavailable');
  ctx.scale(dpr, dpr);
  return ctx;
}

/**
 * Pause rAF when the canvas scrolls off-screen. Returns a stop() to disconnect.
 * `startFn` is called when it enters the viewport; `stopFn` when it leaves.
 */
export function observeCanvas(
  canvas: HTMLCanvasElement,
  startFn: () => void,
  stopFn: () => void
): () => void {
  if (typeof IntersectionObserver === 'undefined') {
    startFn();
    return () => {};
  }
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) startFn();
        else stopFn();
      });
    },
    { threshold: 0.05 }
  );
  observer.observe(canvas);
  return () => observer.disconnect();
}
