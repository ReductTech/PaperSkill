// 逐帧舞台（取自 VTW v7.3 的 live/stage.ts，配色改读 sv-palette）：
// - 画布按所在容器的实际宽度绘制（不经整体 zoom），字号、线宽保持网页上的真实尺寸；
// - requestAnimationFrame 只在“画布在视口内 + 标签页可见 + 允许动画”时运行，离屏即停止调度；
// - 状态变化时先同步画一帧（拖动立即响应），需要过渡时 draw 返回 true 继续下一帧；
// - 减少动态效果 / 离屏：只画一帧最终状态（final = true），内容完整可见。
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { C, isDirectInput, useLiveVisible, useReducedMotion } from '../modules/sv-kit';

// 滑块等“直接操作”刚发生过（sv-kit 的 Range 自动标记）：这一帧直接画到目标状态，不做缓动，保证跟手。
export { markDirectInput } from '../modules/sv-kit';

export interface Frame {
  ctx: CanvasRenderingContext2D;
  w: number;
  h: number;
  /** 累计时间（秒） */
  t: number;
  /** 本帧间隔（秒） */
  dt: number;
  /** true：直接画出最终状态 */
  final: boolean;
}

export interface StageOpts {
  heightOf: (w: number) => number;
  draw: (f: Frame) => boolean | void;
  /** 在视口内时持续运行（播放中的时间轴、持续的信息流）；false 时只在过渡期间运行 */
  live?: boolean;
}

export const FONT = 'system-ui, -apple-system, "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif';

/** 把 canvas 设为 HiDPI，返回已缩放到 CSS 像素的 2D context；尺寸无效时返回 null。 */
function prepCanvas(canvas: HTMLCanvasElement, w: number, h: number): CanvasRenderingContext2D | null {
  if (!(w > 1) || !(h > 1)) return null;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const W = Math.round(w * dpr);
  const H = Math.round(h * dpr);
  if (canvas.width !== W) canvas.width = W;
  if (canvas.height !== H) canvas.height = H;
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  // 尺寸不变时给 canvas.width 赋值不会清屏：每帧先清掉上一帧，过渡中的半透明层才不会叠加残留
  ctx.clearRect(0, 0, w, h);
  return ctx;
}

export function useStage(opts: StageOpts, deps: unknown[]) {
  const [wrapRef, visible] = useLiveVisible<HTMLDivElement>('80px');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [w, setW] = useState(0);
  const reduced = useReducedMotion();
  const drawRef = useRef(opts.draw);
  drawRef.current = opts.draw;
  const liveRef = useRef(!!opts.live);
  liveRef.current = !!opts.live;
  const tRef = useRef(0);
  const h = w > 0 ? Math.max(120, Math.round(opts.heightOf(w))) : 0;

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const read = () => setW(Math.max(0, Math.floor(el.clientWidth)));
    read();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', read);
      return () => window.removeEventListener('resize', read);
    }
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, [wrapRef]);

  const animate = visible && !reduced;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || w <= 0 || h <= 0) return;
    const render = (final: boolean, dt: number) => {
      const ctx = prepCanvas(canvas, w, h);
      if (!ctx) return false;
      try {
        return !!drawRef.current({ ctx, w, h, t: tRef.current, dt, final: final || isDirectInput() });
      } catch (err) {
        console.error(err);
        return false;
      }
    };
    if (!animate) {
      render(true, 0);
      return;
    }
    const firstMore = render(false, 0);
    if (!firstMore && !liveRef.current) return;
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.064, Math.max(0, (now - last) / 1000));
      last = now;
      tRef.current += dt;
      const more = render(false, dt);
      raf = more || liveRef.current ? requestAnimationFrame(loop) : 0;
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

/**
 * 一组平滑逼近目标的动画值（指数逼近）。final 时直接到位；
 * snap：一次变化不超过该值时直接到位（连续拖动滑杆时图形跟手，不拖尾）。
 * 新目标从当前显示值转向，不会排队回放旧目标。
 */
export class Anim {
  private v: Record<string, number> = {};
  moving = false;
  to(key: string, target: number, dt: number, final: boolean, rate = 10, snap = 0): number {
    const cur = this.v[key];
    if (cur === undefined || final || !Number.isFinite(cur) || Math.abs(target - cur) <= snap) {
      this.v[key] = target;
      return target;
    }
    const nv = cur + (target - cur) * (1 - Math.exp(-rate * dt));
    this.v[key] = Math.abs(nv - target) < 1e-3 ? target : nv;
    if (this.v[key] !== target) this.moving = true;
    return this.v[key];
  }
  begin() {
    this.moving = false;
  }
}

export function rgba(hex: string, a: number): string {
  const n = parseInt(hex.replace('#', ''), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${clamp(a, 0, 1)})`;
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

/** 柔光圆点（浅色背景上用较低的透明度） */
export function glow(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, a = 1) {
  const R = Math.max(0.5, r);
  const g = ctx.createRadialGradient(x, y, 0, x, y, R);
  g.addColorStop(0, rgba(color, 0.85 * a));
  g.addColorStop(0.4, rgba(color, 0.3 * a));
  g.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, R, 0, Math.PI * 2);
  ctx.fill();
}

export function txt(
  ctx: CanvasRenderingContext2D,
  s: string,
  x: number,
  y: number,
  o: { size?: number; color?: string; align?: CanvasTextAlign; weight?: number; alpha?: number } = {}
) {
  ctx.save();
  ctx.globalAlpha *= o.alpha ?? 1;
  ctx.font = `${o.weight ?? 500} ${o.size ?? 13}px ${FONT}`;
  ctx.fillStyle = o.color ?? C.ink;
  ctx.textAlign = o.align ?? 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(s, x, y);
  ctx.restore();
}

/** 白底标签：画在格子、连线之上的说明文字（应在 draw 的最后调用，保证不被遮挡）。返回标签宽度。 */
export function pill(
  ctx: CanvasRenderingContext2D,
  s: string,
  x: number,
  y: number,
  o: { size?: number; color?: string; align?: 'left' | 'right' | 'center'; weight?: number; minX?: number; maxX?: number } = {}
) {
  const size = o.size ?? 13;
  ctx.save();
  ctx.font = `${o.weight ?? 700} ${size}px ${FONT}`;
  const w = ctx.measureText(s).width + 16;
  const h = size + 10;
  let left = o.align === 'right' ? x - w : o.align === 'center' ? x - w / 2 : x;
  if (o.maxX !== undefined) left = Math.min(left, o.maxX - w);
  if (o.minX !== undefined) left = Math.max(left, o.minX);
  const top = y - h / 2;
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  rr(ctx, left, top, w, h, h / 2);
  ctx.fill();
  ctx.strokeStyle = o.color ?? C.ink;
  ctx.lineWidth = 1.5;
  rr(ctx, left + 0.75, top + 0.75, w - 1.5, h - 1.5, h / 2);
  ctx.stroke();
  ctx.fillStyle = o.color ?? C.ink;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(s, left + 8, y + 0.5);
  ctx.restore();
  return w;
}

/** 带箭头的连线（二次贝塞尔，可按进度 p “长出来”） */
export function arrowLine(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, p: number, color: string, width = 2, head = 7, curve = 0) {
  const t = clamp(p, 0, 1);
  if (t <= 0) return;
  const mx = (x1 + x2) / 2 + curve;
  const my = (y1 + y2) / 2 - Math.abs(curve) * 0.4;
  const q = (a: number, b: number, c: number, s: number) => (1 - s) * (1 - s) * a + 2 * (1 - s) * s * b + s * s * c;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  for (let i = 0; i <= 18; i++) {
    const s = (i / 18) * t;
    if (i === 0) ctx.moveTo(q(x1, mx, x2, s), q(y1, my, y2, s));
    else ctx.lineTo(q(x1, mx, x2, s), q(y1, my, y2, s));
  }
  ctx.stroke();
  if (t > 0.92 && head > 0) {
    const ex = q(x1, mx, x2, t);
    const ey = q(y1, my, y2, t);
    const ang = Math.atan2(ey - q(y1, my, y2, t - 0.06), ex - q(x1, mx, x2, t - 0.06));
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

/** 确定性随机数（mulberry32） */
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
