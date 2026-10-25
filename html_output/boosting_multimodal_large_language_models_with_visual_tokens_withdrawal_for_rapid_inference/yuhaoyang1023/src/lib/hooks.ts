// 共享 hooks（独立文件，避免组件与模块之间的循环 import）。
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';

const isBrowser = typeof window !== 'undefined';

/** URL 参数 ?motion=reduce 强制进入“减少动态效果”模式，与系统设置走同一条代码路径。 */
export const FORCE_REDUCE = isBrowser && new URLSearchParams(window.location.search).get('motion') === 'reduce';

const RM_QUERY = '(prefers-reduced-motion: reduce)';

/** 当前是否减少动态效果（非 hook 版本，供非 React 代码读取）。 */
export function prefersReduced(): boolean {
  if (FORCE_REDUCE) return true;
  return isBrowser && !!window.matchMedia && window.matchMedia(RM_QUERY).matches;
}

/** prefers-reduced-motion：订阅变化，运行中切换无需刷新。 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(prefersReduced);
  useEffect(() => {
    if (!isBrowser || !window.matchMedia || FORCE_REDUCE) return;
    const mq = window.matchMedia(RM_QUERY);
    const onChange = () => setReduced(mq.matches);
    onChange();
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);
  return reduced;
}

/** 元素是否在视口内（用于暂停离屏 Canvas 动画）。 */
export function useInView<T extends Element>(rootMargin = '120px'): [RefObject<T>, boolean] {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) setInView(e.isIntersecting);
    }, { rootMargin });
    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin]);
  return [ref, inView];
}

/** 观察容器内容宽度（ResizeObserver）。宽度未就绪时返回 0，调用方据此跳过绘制。 */
export function useWidth<T extends HTMLElement>(): [RefObject<T>, number] {
  const ref = useRef<T>(null);
  const [w, setW] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
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
  }, []);
  return [ref, w];
}

/** 标签页是否可见。 */
export function usePageVisible(): boolean {
  const [vis, setVis] = useState(() => !isBrowser || document.visibilityState !== 'hidden');
  useEffect(() => {
    const on = () => setVis(document.visibilityState !== 'hidden');
    document.addEventListener('visibilitychange', on);
    return () => document.removeEventListener('visibilitychange', on);
  }, []);
  return vis;
}

/** 把 canvas 设置为 HiDPI，返回已缩放到 CSS 像素的 2D context；尺寸无效时返回 null。 */
export function prepCanvas(canvas: HTMLCanvasElement, w: number, h: number, maxDpr = 2): CanvasRenderingContext2D | null {
  if (!(w > 1) || !(h > 1)) return null;
  const dpr = Math.min(maxDpr, (isBrowser && window.devicePixelRatio) || 1);
  const W = Math.max(1, Math.round(w * dpr));
  const H = Math.max(1, Math.round(h * dpr));
  if (canvas.width !== W) canvas.width = W;
  if (canvas.height !== H) canvas.height = H;
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/** 数字补间：目标值变化时用 ease-out 过渡；减少动态效果时直接跳到目标值。 */
export function useTween(target: number, duration = 480): number {
  const reduced = useReducedMotion();
  const [v, setV] = useState(target);
  const vRef = useRef(target);
  vRef.current = v;
  useEffect(() => {
    // 减少动态效果、标签页隐藏（rAF 暂停）时直接到终值
    if (reduced || !isBrowser || !Number.isFinite(target) || document.visibilityState === 'hidden') {
      setV(target);
      return;
    }
    const from = vRef.current;
    if (from === target || !Number.isFinite(from)) {
      setV(target);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const step = (now: number) => {
      const k = Math.min(1, (now - t0) / duration);
      setV(from + (target - from) * easeOutCubic(k));
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    // 兜底：rAF 被节流或暂停时，到时间也一定落到终值
    const done = window.setTimeout(() => {
      cancelAnimationFrame(raf);
      setV(target);
    }, duration + 120);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(done);
    };
  }, [target, duration, reduced]);
  return v;
}

/** 是否为精细指针（鼠标）+ 可悬停设备。 */
export function canHover(): boolean {
  return isBrowser && !!window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
}

/** 稳定回调 */
export function useEvent<A extends unknown[], R>(fn: (...a: A) => R): (...a: A) => R {
  const ref = useRef(fn);
  ref.current = fn;
  return useCallback((...a: A) => ref.current(...a), []);
}

/** 是否为窄屏（手机）。 */
export function useNarrow(max = 640): boolean {
  const q = `(max-width: ${max}px)`;
  const [n, setN] = useState(() => isBrowser && !!window.matchMedia && window.matchMedia(q).matches);
  useEffect(() => {
    if (!window.matchMedia) return;
    const mq = window.matchMedia(q);
    const on = () => setN(mq.matches);
    on();
    mq.addEventListener?.('change', on);
    return () => mq.removeEventListener?.('change', on);
  }, [q]);
  return n;
}
