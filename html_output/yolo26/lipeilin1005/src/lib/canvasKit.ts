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

/** True when the user prefers reduced motion (OS accessibility setting). */
export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/**
 * Consolidated canvas animation loop: runs `render(time)` on every rAF,
 * marks the canvas `is-ready` after the first painted frame, pauses while
 * scrolled off-screen and renders a single representative static frame when
 * the user prefers reduced motion. Returns the cleanup function.
 */
export function startCanvasLoop(
  canvas: HTMLCanvasElement,
  render: (time: number) => void
): () => void {
  let raf: number | null = null;
  const tick = (time: number) => {
    render(time);
    if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    raf = requestAnimationFrame(tick);
  };
  const stop = () => {
    if (raf !== null) cancelAnimationFrame(raf);
    raf = null;
  };
  const start = () => {
    if (raf === null) raf = requestAnimationFrame(tick);
  };
  if (prefersReducedMotion()) {
    render(1200); // representative mid-loop frame, painted once
    canvas.classList.add('is-ready');
    return () => {};
  }
  const disconnect = observeCanvas(canvas, start, stop);
  return () => {
    stop();
    disconnect();
  };
}

/** Seamless-loop x position: enters from off-screen left, exits off-screen right. */
export function loopX(t: number, width: number, margin = 60): number {
  return -margin + t * (width + margin * 2);
}

export interface CyclistOpts {
  /** frame/rider stroke color */
  color?: string;
  /** rider head/body color */
  riderColor?: string;
  /** uniform scale of the whole cyclist (1 ≈ 76 px wheelbase) */
  scale?: number;
  /** crank/pedal angle in radians — drives the pedaling legs */
  pedalPhase?: number;
  /** spoke rotation in radians — pass travelled distance / wheel radius */
  wheelPhase?: number;
  /** draw a loaded pannier box behind the seat */
  loaded?: boolean;
  /** pannier color */
  loadColor?: string;
  /** pannier width override (px, before scale) */
  loadSize?: number;
  /** line width */
  lineWidth?: number;
}

/**
 * Shared cyclist drawing: frame, rider, spinning wheel spokes, pedaling crank
 * and optional pannier. (x, y) is the wheel axle height — wheels rest on y + 14*s.
 * Geometry matches the legacy hand-drawn bikes so scenes keep their layout.
 */
export function drawCyclist(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  opts: CyclistOpts = {}
): void {
  const s = opts.scale ?? 1;
  const color = opts.color ?? '#27446e';
  const rider = opts.riderColor ?? '#27446e';
  const lw = opts.lineWidth ?? 3;
  const wheelPhase = opts.wheelPhase ?? 0;
  const pedalPhase = opts.pedalPhase ?? wheelPhase * 0.6;
  const wx1 = x - 18 * s;
  const wx2 = x + 20 * s;
  const wr = 14 * s;

  // wheels + spinning spokes
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  for (const wx of [wx1, wx2]) {
    ctx.beginPath();
    ctx.arc(wx, y, wr, 0, Math.PI * 2);
    ctx.stroke();
    ctx.save();
    ctx.lineWidth = Math.max(1, lw * 0.45);
    ctx.globalAlpha = 0.55;
    for (let i = 0; i < 3; i++) {
      const a = wheelPhase + (i * Math.PI) / 3;
      ctx.beginPath();
      ctx.moveTo(wx - Math.cos(a) * wr * 0.82, y - Math.sin(a) * wr * 0.82);
      ctx.lineTo(wx + Math.cos(a) * wr * 0.82, y + Math.sin(a) * wr * 0.82);
      ctx.stroke();
    }
    ctx.restore();
  }

  // frame
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.beginPath();
  ctx.moveTo(wx1, y);
  ctx.lineTo(x - 2 * s, y - 16 * s);
  ctx.lineTo(wx2, y);
  ctx.lineTo(wx1, y);
  ctx.moveTo(x - 2 * s, y - 16 * s);
  ctx.lineTo(x + 4 * s, y - 20 * s);
  ctx.stroke();

  // crank + pedals (pedaling)
  const ccx = x - 2 * s;
  const ccy = y - 6 * s;
  const cr = 7 * s;
  ctx.lineWidth = Math.max(1.5, lw * 0.7);
  ctx.beginPath();
  ctx.arc(ccx, ccy, 3.2 * s, 0, Math.PI * 2);
  ctx.stroke();
  for (const ph of [pedalPhase, pedalPhase + Math.PI]) {
    const px2 = ccx + Math.cos(ph) * cr;
    const py2 = ccy + Math.sin(ph) * cr;
    ctx.beginPath();
    ctx.moveTo(ccx, ccy);
    ctx.lineTo(px2, py2);
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.fillRect(px2 - 3.5 * s, py2 - 1.5 * s, 7 * s, 3 * s);
  }

  // rider: torso + head
  ctx.strokeStyle = rider;
  ctx.lineWidth = lw;
  ctx.beginPath();
  ctx.moveTo(x + 2 * s, y - 24 * s);
  ctx.lineTo(x - 2 * s, y - 14 * s);
  ctx.stroke();
  ctx.fillStyle = rider;
  ctx.beginPath();
  ctx.arc(x + 2 * s, y - 30 * s, 6 * s, 0, Math.PI * 2);
  ctx.fill();

  // pannier
  if (opts.loaded) {
    const bw = (opts.loadSize ?? 16) * s;
    ctx.fillStyle = opts.loadColor ?? '#c43f52';
    ctx.fillRect(x - 34 * s - (bw - 16 * s) / 2, y - 26 * s, bw, 18 * s + bw / 4);
  }
}

/** A finish flag with a gentle wave. (x, top) is the pole top; pole drops poleH px. */
export function drawFlag(
  ctx: CanvasRenderingContext2D,
  x: number,
  top: number,
  poleH: number,
  time: number,
  color = '#228d5c',
  poleColor = '#92400e'
): void {
  const wave = Math.sin(time / 260) * 3;
  ctx.strokeStyle = poleColor;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, top);
  ctx.lineTo(x, top + poleH);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, top);
  ctx.quadraticCurveTo(x + 16, top + 2 + wave, x + 30, top + 7 + wave);
  ctx.lineTo(x + 30, top + 17 + wave * 0.6);
  ctx.quadraticCurveTo(x + 16, top + 12 + wave * 0.4, x, top + 15);
  ctx.fill();
}

/** Two soft drifting clouds; loop seamlessly across `width`. */
export function drawClouds(
  ctx: CanvasRenderingContext2D,
  time: number,
  width: number,
  y = 30
): void {
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  const specs = [
    { speed: 9000, yy: y, scale: 1 },
    { speed: 14000, yy: y + 26, scale: 0.7 },
  ];
  for (const c of specs) {
    const cx = ((time / c.speed) % 1) * (width + 160) - 80;
    ctx.beginPath();
    ctx.arc(cx, c.yy, 12 * c.scale, 0, Math.PI * 2);
    ctx.arc(cx + 13 * c.scale, c.yy + 3 * c.scale, 9 * c.scale, 0, Math.PI * 2);
    ctx.arc(cx - 13 * c.scale, c.yy + 3 * c.scale, 9 * c.scale, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
