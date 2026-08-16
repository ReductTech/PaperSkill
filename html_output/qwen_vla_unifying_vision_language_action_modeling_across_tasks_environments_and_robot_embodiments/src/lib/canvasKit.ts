// Canvas drawing kit — HiDPI-aware helpers for all paper-skill widgets.

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

/** Cap DPR at 2 for performance while keeping crisp text/lines on Windows scaling. */
export function getCanvasDpr(): number {
  return Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 2);
}

export interface CanvasMetrics {
  cssWidth: number;
  cssHeight: number;
  dpr: number;
}

/**
 * HiDPI setup from layout box. Drawing uses CSS pixel coordinates.
 * Backing store = round(cssSize * dpr); transform scales context accordingly.
 */
export function setupCanvasHiDPI(
  canvas: HTMLCanvasElement,
  cssWidth: number,
  cssHeight: number
): CanvasRenderingContext2D {
  const dpr = getCanvasDpr();
  const w = Math.max(1, Math.round(cssWidth));
  const h = Math.max(1, Math.round(cssHeight));
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D context unavailable');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

/** Read live layout size from canvas (after CSS layout) and apply HiDPI backing store. */
export function setupCanvasFromRect(canvas: HTMLCanvasElement): {
  ctx: CanvasRenderingContext2D;
  metrics: CanvasMetrics;
} {
  const rect = canvas.getBoundingClientRect();
  const cssWidth = Math.max(1, rect.width);
  const cssHeight = Math.max(1, rect.height);
  const ctx = setupCanvasHiDPI(canvas, cssWidth, cssHeight);
  return { ctx, metrics: { cssWidth, cssHeight, dpr: getCanvasDpr() } };
}

/** @deprecated Use setupCanvasHiDPI — kept for legacy modules during migration. */
export function setupCanvas(canvas: HTMLCanvasElement, w: number, h: number): CanvasRenderingContext2D {
  return setupCanvasHiDPI(canvas, w, h);
}

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

/** Observe container width; callback receives CSS width (height = width * aspectRatio). */
export function observeCanvasContainer(
  el: HTMLElement,
  aspectRatio: number,
  onResize: (cssWidth: number, cssHeight: number) => void
): () => void {
  const measure = () => {
    const w = Math.max(1, el.clientWidth || el.getBoundingClientRect().width);
    onResize(w, Math.max(1, w * aspectRatio));
  };
  measure();
  if (typeof ResizeObserver === 'undefined') {
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }
  const ro = new ResizeObserver(measure);
  ro.observe(el);
  return () => ro.disconnect();
}
