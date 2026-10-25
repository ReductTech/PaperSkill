// 逐帧舞台：requestAnimationFrame 只在“画布在视口内 + 标签页可见 + 允许动画”时运行；
// 状态变化时让元素平滑过渡（draw 返回 true 表示还在过渡中，需要下一帧）。
// 减少动态效果 / 离屏时：只画一帧最终状态（final = true），内容完整可见。
// 容器宽度未就绪（首次布局、隐藏标签页）时不绘制，避免负尺寸导致异常。
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { prepCanvas, usePageVisible, useReducedMotion } from './hooks';
import { FONT_SANS, rgba } from './palette';

export interface Frame {
  ctx: CanvasRenderingContext2D;
  w: number;
  h: number;
  /** 累计时间（秒） */
  t: number;
  /** 本帧间隔（秒） */
  dt: number;
  /** true：直接画出最终状态（减少动态效果 / 离屏 / 首帧） */
  final: boolean;
}

export interface StageOpts {
  heightOf: (w: number) => number;
  draw: (f: Frame) => boolean | void;
  /** 在视口内时持续运行（用于表达机制的循环动画）；false 时只在过渡期间运行 */
  live?: boolean;
}

export function useStage(opts: StageOpts, deps: unknown[]) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [w, setW] = useState(0);
  const [inView, setInView] = useState(false);
  const reduced = useReducedMotion();
  const visible = usePageVisible();
  const drawRef = useRef(opts.draw);
  drawRef.current = opts.draw;
  const liveRef = useRef(!!opts.live);
  liveRef.current = !!opts.live;
  const tRef = useRef(0);
  // 舞台高度会参考视口高度（同屏布局）；只在视口高度明显变化时重算，
  // 避免手机地址栏收放（几十像素）导致舞台在滚动中跳动
  const [vh, setVh] = useState(() => (typeof window !== 'undefined' ? window.innerHeight : 0));
  useEffect(() => {
    const onResize = () => setVh((old) => (Math.abs(window.innerHeight - old) > 120 ? window.innerHeight : old));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  void vh; // 只用于触发重算；heightOf 内部读取经过同样过滤的视口高度（见 ui/StageSplit 的 viewH）
  const h = w > 0 ? Math.max(80, Math.round(opts.heightOf(w))) : 0;

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const read = () => setW(Math.max(0, Math.floor(el.clientWidth)));
    read();
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(read);
      ro.observe(el);
    } else window.addEventListener('resize', read);
    let io: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== 'undefined') {
      io = new IntersectionObserver((es) => {
        for (const e of es) setInView(e.isIntersecting);
      }, { rootMargin: '80px' });
      io.observe(el);
    } else setInView(true);
    return () => {
      ro?.disconnect();
      io?.disconnect();
      window.removeEventListener('resize', read);
    };
  }, []);

  const animate = inView && visible && !reduced;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || w <= 0 || h <= 0) return;
    const render = (final: boolean, dt: number) => {
      const ctx = prepCanvas(canvas, w, h);
      if (!ctx) return false;
      try {
        return !!drawRef.current({ ctx, w, h, t: tRef.current, dt, final });
      } catch (err) {
        // 让错误边界接住，而不是在 rAF 里静默失败
        console.error(err);
        return false;
      }
    };
    if (!animate) {
      render(true, 0);
      return;
    }
    // 状态变化时先同步画一帧（dt = 0）：拖动进度条立即响应，后台标签页里也不会停在旧画面
    const firstMore = render(false, 0);
    if (!firstMore && !liveRef.current) return;
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.064, Math.max(0, (now - last) / 1000));
      last = now;
      tRef.current += dt;
      const more = render(false, dt);
      if (more || liveRef.current) raf = requestAnimationFrame(loop);
      else raf = 0;
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [w, h, animate, ...deps]);

  return { wrapRef, canvasRef, w, h, reduced, animate };
}

// ---------------------------------------------------------------------------
// 绘图小工具
// ---------------------------------------------------------------------------

export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const easeOut = (t: number) => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
export const easeInOut = (t: number) => {
  const x = clamp(t, 0, 1);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};

/** 一组平滑逼近目标的动画值：指数逼近（强 ease-out 手感）；final 时直接到位。 */
export class Anim {
  private v: Record<string, number> = {};
  /** 取得 key 的当前值并向 target 逼近；返回 [当前值, 是否仍在运动] */
  to(key: string, target: number, dt: number, final: boolean, rate = 9, snap = 0): number {
    const cur = this.v[key];
    // snap：变化小于该值时直接到位（连续拖动滑块时直接绘制，不拖尾）
    if (cur === undefined || final || !Number.isFinite(cur) || Math.abs(target - cur) <= snap) {
      this.v[key] = target;
      return target;
    }
    const k = 1 - Math.exp(-rate * dt);
    const nv = cur + (target - cur) * k;
    this.v[key] = Math.abs(nv - target) < 1e-3 ? target : nv;
    if (this.v[key] !== target) this.moving = true;
    return this.v[key];
  }
  set(key: string, v: number) {
    this.v[key] = v;
  }
  get(key: string, fallback = 0) {
    return this.v[key] ?? fallback;
  }
  moving = false;
  /** 每帧开始时调用；结束时读取 moving 判断是否还要下一帧 */
  begin() {
    this.moving = false;
  }
}

/** 一次性“事件”动画：记录触发时间，返回 0→1 的进度。 */
export class Pulse {
  private start = -1;
  private dur: number;
  constructor(dur = 0.7) {
    this.dur = dur;
  }
  fire(t: number) {
    this.start = t;
  }
  reset() {
    this.start = -1;
  }
  /** 返回进度 0..1；未触发或已结束返回 -1 */
  p(t: number, final: boolean): number {
    if (this.start < 0 || final) return -1;
    const x = (t - this.start) / this.dur;
    return x >= 1 ? -1 : Math.max(0, x);
  }
}

export function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const ww = Math.max(0, w);
  const hh = Math.max(0, h);
  const rad = Math.max(0, Math.min(r, ww / 2, hh / 2));
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + ww, y, x + ww, y + hh, rad);
  ctx.arcTo(x + ww, y + hh, x, y + hh, rad);
  ctx.arcTo(x, y + hh, x, y, rad);
  ctx.arcTo(x, y, x + ww, y, rad);
  ctx.closePath();
}

export function circle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath();
  ctx.arc(x, y, Math.max(0, r), 0, Math.PI * 2);
}

/** 柔光圆点 */
export function glow(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, a = 1) {
  const R = Math.max(0.5, r);
  const g = ctx.createRadialGradient(x, y, 0, x, y, R);
  g.addColorStop(0, rgba(color, 0.9 * a));
  g.addColorStop(0.35, rgba(color, 0.35 * a));
  g.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = g;
  circle(ctx, x, y, R);
  ctx.fill();
}

export interface TextOpts {
  size?: number;
  color?: string;
  align?: CanvasTextAlign;
  baseline?: CanvasTextBaseline;
  weight?: number | string;
  font?: string;
  alpha?: number;
}

export function txt(ctx: CanvasRenderingContext2D, s: string, x: number, y: number, o: TextOpts = {}) {
  ctx.save();
  ctx.globalAlpha *= o.alpha ?? 1;
  ctx.font = `${o.weight ?? 500} ${o.size ?? 12}px ${o.font ?? FONT_SANS}`;
  ctx.fillStyle = o.color ?? '#EAF2FF';
  ctx.textAlign = o.align ?? 'left';
  ctx.textBaseline = o.baseline ?? 'middle';
  ctx.fillText(s, x, y);
  ctx.restore();
}

/** 画布底色：深海渐变 + 轻微网格感的水纹 */
export function stageBg(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#0B1534');
  g.addColorStop(1, '#070D24');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

/** 带箭头的连线（可按进度“长出来”） */
export function arrowLine(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  p: number,
  color: string,
  width = 1.5,
  head = 6,
  curve = 0
) {
  const t = clamp(p, 0, 1);
  if (t <= 0) return;
  const mx = (x1 + x2) / 2 + curve;
  const my = (y1 + y2) / 2 - Math.abs(curve) * 0.4;
  // 二次贝塞尔按 t 截断
  const qx = (a: number, b: number, c: number, s: number) => (1 - s) * (1 - s) * a + 2 * (1 - s) * s * b + s * s * c;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  const steps = 18;
  for (let i = 0; i <= steps; i++) {
    const s = (i / steps) * t;
    const x = qx(x1, mx, x2, s);
    const y = qx(y1, my, y2, s);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  if (t > 0.92 && head > 0) {
    const ex = qx(x1, mx, x2, t);
    const ey = qx(y1, my, y2, t);
    const bx = qx(x1, mx, x2, t - 0.06);
    const by = qx(y1, my, y2, t - 0.06);
    const ang = Math.atan2(ey - by, ex - bx);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(ex, ey);
    ctx.lineTo(ex - head * Math.cos(ang - 0.45), ey - head * Math.sin(ang - 0.45));
    ctx.lineTo(ex - head * Math.cos(ang + 0.45), ey - head * Math.sin(ang + 0.45));
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

/** 涟漪：p ∈ [0,1) */
export function ripple(ctx: CanvasRenderingContext2D, x: number, y: number, p: number, color: string, maxR = 26) {
  if (p < 0) return;
  ctx.save();
  for (let i = 0; i < 2; i++) {
    const q = p - i * 0.18;
    if (q <= 0) continue;
    ctx.strokeStyle = rgba(color, (1 - q) * 0.85);
    ctx.lineWidth = 2 * (1 - q) + 0.5;
    circle(ctx, x, y, 4 + q * maxR);
    ctx.stroke();
  }
  ctx.restore();
}

/** 简单确定性随机数（mulberry32） */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * 带深色底的标签：用于画在格子、连线之上的说明文字（应在 draw 的最后调用，保证不被遮挡）。
 * align = 'left' 时 x 为左端；'right' 时为右端；'center' 时为中心。
 */
export function pill(
  ctx: CanvasRenderingContext2D,
  s: string,
  x: number,
  y: number,
  o: { size?: number; color?: string; align?: 'left' | 'right' | 'center'; weight?: number; maxX?: number; minX?: number } = {}
) {
  const size = o.size ?? 11;
  ctx.save();
  ctx.font = `${o.weight ?? 700} ${size}px system-ui, -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif`;
  const tw = ctx.measureText(s).width;
  const padX = 8;
  const w = tw + padX * 2;
  const h = size + 9;
  let left = o.align === 'right' ? x - w : o.align === 'center' ? x - w / 2 : x;
  if (o.maxX !== undefined) left = Math.min(left, o.maxX - w);
  if (o.minX !== undefined) left = Math.max(left, o.minX);
  const top = y - h / 2;
  ctx.fillStyle = 'rgba(5,10,30,0.88)';
  rr(ctx, left, top, w, h, h / 2);
  ctx.fill();
  ctx.strokeStyle = o.color ?? '#EAF2FF';
  const baseAlpha = ctx.globalAlpha; // 尊重调用方设置的整体透明度（淡入淡出）
  ctx.globalAlpha = baseAlpha * 0.55;
  ctx.lineWidth = 1;
  rr(ctx, left + 0.5, top + 0.5, w - 1, h - 1, h / 2);
  ctx.stroke();
  ctx.globalAlpha = baseAlpha;
  ctx.fillStyle = o.color ?? '#EAF2FF';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(s, left + padX, y + 0.5);
  ctx.restore();
  return w;
}
