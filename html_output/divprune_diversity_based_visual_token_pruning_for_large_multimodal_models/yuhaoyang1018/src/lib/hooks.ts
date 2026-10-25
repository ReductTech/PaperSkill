// 共享 hooks（独立文件，避免组件与模块之间的循环 import）。
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';

const isBrowser = typeof window !== 'undefined';

/** URL 参数 ?motion=reduce 可强制进入“减少动态效果”模式（便于在无法修改系统设置的环境中复核） */
export const FORCE_REDUCE = isBrowser && new URLSearchParams(window.location.search).get('motion') === 'reduce';

/** prefers-reduced-motion：为 true 时关闭位移类动画，内容直接显示最终状态。 */
export function useReducedMotion(): boolean {
  const query = '(prefers-reduced-motion: reduce)';
  const [reduced, setReduced] = useState<boolean>(() =>
    FORCE_REDUCE || (isBrowser && window.matchMedia ? window.matchMedia(query).matches : false)
  );
  useEffect(() => {
    if (!isBrowser || !window.matchMedia || FORCE_REDUCE) return;
    const mq = window.matchMedia(query);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);
  return reduced;
}

/** 元素是否在视口内（用于暂停离屏 Canvas 动画）。 */
export function useInView<T extends Element>(rootMargin = '80px'): [RefObject<T>, boolean] {
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

/** 观察容器宽度（ResizeObserver），返回 CSS 像素宽度。 */
export function useWidth<T extends HTMLElement>(): [RefObject<T>, number] {
  const ref = useRef<T>(null);
  const [w, setW] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setW(el.clientWidth);
    if (typeof ResizeObserver === 'undefined') {
      const onResize = () => setW(el.clientWidth);
      window.addEventListener('resize', onResize);
      return () => window.removeEventListener('resize', onResize);
    }
    const ro = new ResizeObserver(() => setW(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w];
}

// 交互引起的整幅重绘：把旧画面复制到一层“残影”画布上淡出，新画面从下面透出来，
// 避免切换按钮 / 步进时画面瞬间跳变。连续重绘（拖动滑块、逐帧动画）间隔很短，不加残影。
const lastPrep = new WeakMap<HTMLCanvasElement, number>();
const FADE_MS = 420;
function ghostFade(canvas: HTMLCanvasElement) {
  const parent = canvas.parentElement;
  if (!parent || !canvas.width || !canvas.height) return;
  if (getComputedStyle(parent).position === 'static') parent.style.position = 'relative';
  const ghost = document.createElement('canvas');
  ghost.className = 'cv-ghost';
  ghost.setAttribute('aria-hidden', 'true');
  ghost.width = canvas.width;
  ghost.height = canvas.height;
  const g = ghost.getContext('2d');
  if (!g) return;
  g.drawImage(canvas, 0, 0);
  const s = ghost.style;
  s.position = 'absolute';
  s.left = canvas.offsetLeft + 'px';
  s.top = canvas.offsetTop + 'px';
  s.width = canvas.style.width || canvas.offsetWidth + 'px';
  s.height = canvas.style.height || canvas.offsetHeight + 'px';
  s.pointerEvents = 'none';
  s.borderRadius = getComputedStyle(canvas).borderRadius;
  s.opacity = '1';
  parent.insertBefore(ghost, canvas.nextSibling);
  void ghost.offsetWidth;
  s.transition = `opacity ${FADE_MS}ms cubic-bezier(0.23, 1, 0.32, 1), filter ${FADE_MS}ms ease`;
  s.opacity = '0';
  s.filter = 'blur(2px)';
  window.setTimeout(() => ghost.remove(), FADE_MS + 40);
}

/** 把 canvas 设置为 HiDPI，返回已缩放到 CSS 像素的 2D context。 */
export function prepCanvas(canvas: HTMLCanvasElement, w: number, h: number, fade = true): CanvasRenderingContext2D | null {
  const dpr = Math.min(2.5, (isBrowser && window.devicePixelRatio) || 1);
  const W = Math.max(1, Math.round(w * dpr));
  const H = Math.max(1, Math.round(h * dpr));
  const now = isBrowser ? performance.now() : 0;
  const prev = lastPrep.get(canvas);
  lastPrep.set(canvas, now);
  const reduced =
    FORCE_REDUCE || (isBrowser && !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  if (fade && prev !== undefined && now - prev > 140 && canvas.width === W && canvas.height === H && !reduced) {
    ghostFade(canvas);
  }
  if (canvas.width !== W) canvas.width = W;
  if (canvas.height !== H) canvas.height = H;
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

/**
 * requestAnimationFrame 循环：只在 active 为 true 时运行（通常 = 在视口内 && 正在播放）。
 * cb 收到 (dt 毫秒, 累计时间 毫秒)。
 */
export function useRaf(cb: (dt: number, t: number) => void, active: boolean) {
  const cbRef = useRef(cb);
  cbRef.current = cb;
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    let last = performance.now();
    let acc = 0;
    const loop = (now: number) => {
      const dt = Math.min(64, now - last);
      last = now;
      acc += dt;
      cbRef.current(dt, acc);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [active]);
}

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

/** 数字补间：目标值变化时用 ease-out 过渡；减少动态效果时直接跳到目标值。 */
export function useTween(target: number, duration = 420): number {
  const reduced = useReducedMotion();
  const [v, setV] = useState(target);
  const fromRef = useRef(target);
  const vRef = useRef(target);
  vRef.current = v;
  useEffect(() => {
    if (reduced || !isBrowser) {
      setV(target);
      return;
    }
    const from = vRef.current;
    fromRef.current = from;
    if (from === target) return;
    let raf = 0;
    const t0 = performance.now();
    const step = (now: number) => {
      const k = Math.min(1, (now - t0) / duration);
      setV(from + (target - from) * easeOut(k));
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
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

/** 画布盒子：宽度随容器变化，高度由宽度决定。 */
export function useCanvasBox(heightOf: (w: number) => number) {
  const [wrapRef, rawW] = useWidth<HTMLDivElement>();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // 首次布局时容器可能还没有宽度（样式未就绪、隐藏标签页），此时不绘制，避免出现负半径
  const w = rawW >= 160 ? rawW : 0;
  const h = w ? Math.max(60, Math.round(heightOf(w))) : 0;
  return { wrapRef, canvasRef, w, h };
}

/**
 * 逐帧舞台（参照 FastV 版的 useStage）：画布在视口内时持续 requestAnimationFrame 重绘，
 * draw 收到 (ctx, 累计秒, 帧间隔秒)；离开视口即暂停。
 * 减少动态效果时不跑循环，只在依赖变化时画一次“最终状态”（t 传一个很大的值）。
 */
export function useStageLoop(
  canvasRef: RefObject<HTMLCanvasElement>,
  w: number,
  h: number,
  draw: (ctx: CanvasRenderingContext2D, t: number, dt: number) => void,
  deps: unknown[]
) {
  const reduced = useReducedMotion();
  const drawRef = useRef(draw);
  drawRef.current = draw;
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver((es) => es.forEach((e) => setVisible(e.isIntersecting)), { rootMargin: '120px' });
    io.observe(c);
    return () => io.disconnect();
  }, [canvasRef, w]);
  // 静态绘制：减少动态效果、或画布不在视口内（保证静止时画面完整）
  useEffect(() => {
    const c = canvasRef.current;
    if (!c || !w || (!reduced && visible)) return;
    const ctx = prepCanvas(c, w, h, false);
    if (ctx) drawRef.current(ctx, 999, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [w, h, reduced, visible, ...deps]);
  useEffect(() => {
    const c = canvasRef.current;
    if (!c || !w || reduced || !visible) return;
    let raf = 0;
    let last = performance.now();
    const t0 = last;
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const ctx = prepCanvas(c, w, h, false);
      if (ctx) drawRef.current(ctx, (now - t0) / 1000, dt);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [canvasRef, w, h, reduced, visible]);
}

/** 指数趋近：每帧把 cur 往 target 拉一点（k 越大越快），与帧率无关。 */
export function approach(cur: number, target: number, dt: number, k = 9): number {
  return target + (cur - target) * Math.exp(-k * dt);
}
