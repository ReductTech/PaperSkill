// SparseVLM 精读共用的 hooks 与控件（网页真实尺寸，不经整体缩放）。
// 颜色一律取自 sv-palette.ts 的 C；控件样式在 sv.css。
import React, { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';
import { C } from './sv-palette';
import './sv.css';

export { C };

export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const fmt = (v: number, d = 1) => v.toFixed(d);

// 减少动态效果：系统设置或 URL 参数 ?motion=reduce（两者走同一条代码路径）。
// 整页共用一个 MediaQueryList 与一组订阅，组件每次渲染不会重新创建监听。
const FORCE_REDUCE = typeof location !== 'undefined' && new URLSearchParams(location.search).get('motion') === 'reduce';
const RM = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;
const rmSubscribe = (cb: () => void) => {
  if (!RM || FORCE_REDUCE) return () => {};
  RM.addEventListener('change', cb);
  return () => RM.removeEventListener('change', cb);
};
const rmSnapshot = () => FORCE_REDUCE || !!RM?.matches;
export function useReducedMotion() {
  return useSyncExternalStore(rmSubscribe, rmSnapshot, () => FORCE_REDUCE);
}

/** 元素是否在视口内且标签页可见（用于暂停离屏的帧循环与自动播放）。 */
export function useLiveVisible<T extends Element>(rootMargin = '80px'): [React.RefObject<T>, boolean] {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  const [pageVisible, setPageVisible] = useState(() => typeof document === 'undefined' || !document.hidden);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver((es) => setInView(es.some((e) => e.isIntersecting)), { rootMargin });
    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin]);
  useEffect(() => {
    const on = () => setPageVisible(!document.hidden);
    document.addEventListener('visibilitychange', on);
    return () => document.removeEventListener('visibilitychange', on);
  }, []);
  return [ref, inView && pageVisible];
}

/**
 * 按步播放（讲解类）：每步停留 stepMs / 速度；只在“可见 + 正在播放”时计时，屏外暂停、回来从原步骤继续。
 * 每一步是内容切换而不是位移动画，所以减少动态效果时仍按所选速度走步。
 * 用 setTimeout 计时，不开 rAF，React 只在换步时更新。
 */
export type Speed = 'slow' | 'mid' | 'fast';
export const SPEED_MS: Record<Speed, number> = { slow: 3600, mid: 2400, fast: 1400 };
export function useStepper(n: number, visible: boolean, speed: Speed) {
  const [step, setStepRaw] = useState(0);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    if (!playing || !visible) return;
    if (step >= n - 1) {
      setPlaying(false);
      return;
    }
    const id = window.setTimeout(() => setStepRaw((s) => Math.min(n - 1, s + 1)), SPEED_MS[speed]);
    return () => window.clearTimeout(id);
  }, [playing, visible, step, n, speed]);
  // 用函数式更新：连点、反向点时按当前值递推，不读渲染时的旧值
  const setStep = (s: number | ((cur: number) => number)) => {
    setPlaying(false);
    setStepRaw((cur) => clamp(typeof s === 'function' ? s(cur) : s, 0, n - 1));
  };
  const play = () => {
    if (step >= n - 1) setStepRaw(0);
    setPlaying(true);
  };
  return { step, setStep, next: () => setStep((c) => c + 1), prev: () => setStep((c) => c - 1), playing, play, pause: () => setPlaying(false) };
}

/** 讲解播放的速度选择 */
export function SpeedSeg({ value, onChange }: { value: Speed; onChange: (v: Speed) => void }) {
  return (
    <Seg
      label="播放速度"
      value={value}
      small
      options={[
        { value: 'slow', label: '慢' },
        { value: 'mid', label: '中' },
        { value: 'fast', label: '快' },
      ]}
      onChange={onChange}
    />
  );
}

/**
 * 分段切换：选中指示器在选项之间平移（换行时一起定位），文字颜色同步过渡；
 * 方向键 / Home / End 切换，Tab 只停在当前项（roving tabindex）。
 */
export function Seg<T extends string>({
  label,
  value,
  options,
  onChange,
  tone = 'blue',
  small = false,
}: {
  label: string;
  value: T;
  options: { value: T; label: React.ReactNode }[];
  onChange: (v: T) => void;
  tone?: 'blue' | 'green';
  small?: boolean;
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  const btns = useRef<(HTMLButtonElement | null)[]>([]);
  const idx = Math.max(0, options.findIndex((o) => o.value === value));
  const [box, setBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  useLayoutEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    const update = () => {
      const b = btns.current[idx];
      if (b) setBox({ x: b.offsetLeft, y: b.offsetTop, w: b.offsetWidth, h: b.offsetHeight });
    };
    update();
    window.addEventListener('resize', update);
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update);
    ro?.observe(row);
    return () => {
      window.removeEventListener('resize', update);
      ro?.disconnect();
    };
  }, [idx, options.length]);
  const onKey = (e: React.KeyboardEvent, i: number) => {
    const n = options.length;
    let j = -1;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') j = (i + 1) % n;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') j = (i - 1 + n) % n;
    else if (e.key === 'Home') j = 0;
    else if (e.key === 'End') j = n - 1;
    if (j < 0) return;
    e.preventDefault();
    onChange(options[j].value);
    btns.current[j]?.focus();
  };
  return (
    <div className={`sv-seg is-${tone} ${small ? 'is-small' : ''}`} role="radiogroup" aria-label={label} ref={rowRef}>
      {box && <span className="sv-seg-ind" aria-hidden="true" style={{ transform: `translate(${box.x}px, ${box.y}px)`, width: box.w, height: box.h }} />}
      {options.map((o, i) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={i === idx}
          tabIndex={i === idx ? 0 : -1}
          ref={(el) => {
            btns.current[i] = el;
          }}
          onClick={() => onChange(o.value)}
          onKeyDown={(e) => onKey(e, i)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/**
 * 直接操作（拖滑块）：画布这一帧直接画到目标（stage 读 isDirectInput），
 * 拖动期间给 <html> 加 sv-dragging，DOM 条形的 CSS 过渡暂时关闭，图形跟手、不在后面追赶。
 */
let lastDirectInput = -1e9;
export const markDirectInput = () => {
  lastDirectInput = performance.now();
};
export const isDirectInput = () => performance.now() - lastDirectInput < 120;
function startDrag() {
  const root = document.documentElement;
  root.classList.add('sv-dragging');
  const end = () => {
    root.classList.remove('sv-dragging');
    window.removeEventListener('pointerup', end);
    window.removeEventListener('pointercancel', end);
  };
  window.addEventListener('pointerup', end);
  window.addEventListener('pointercancel', end);
}

/** 滑块：拖动时由调用方直接更新状态，画布同步画到目标（跟手，不缓动）。 */
export function Range({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  display,
}: {
  label: React.ReactNode;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  display?: React.ReactNode;
}) {
  const p = ((value - min) / (max - min)) * 100;
  return (
    <label className="sv-range">
      <span className="sv-range-top">
        <span>{label}</span>
        <b>{display ?? value}</b>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        style={{ ['--p' as string]: `${p}%` } as React.CSSProperties}
        onPointerDown={startDrag}
        onChange={(e) => {
          markDirectInput();
          onChange(Number(e.target.value));
        }}
      />
    </label>
  );
}

export function Btn({
  children,
  onClick,
  primary = false,
  disabled = false,
  pressed,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  primary?: boolean;
  disabled?: boolean;
  pressed?: boolean;
  label?: string;
}) {
  return (
    <button type="button" className={`sv-btn ${primary ? 'is-primary' : ''}`} disabled={disabled} aria-pressed={pressed} aria-label={label} onClick={onClick}>
      {children}
    </button>
  );
}

/** 即时反馈：换内容时轻微淡入（key 随内容变化）。 */
export function Feedback({ tone = 'info', children, k }: { tone?: 'info' | 'ok' | 'warn' | 'bad'; children: React.ReactNode; k?: string | number }) {
  return (
    <div className={`sv-fb is-${tone}`} role="status" aria-live="polite">
      <span className="sv-fb-in" key={k}>
        {children}
      </span>
    </div>
  );
}

/** 读数卡：标题允许换行；数值保持一行。 */
export function Readout({ label, value, sub, tone }: { label: React.ReactNode; value: React.ReactNode; sub?: React.ReactNode; tone?: 'green' | 'amber' | 'red' | 'blue' | 'vis' | 'merged' | 'rater' }) {
  return (
    <div className={`sv-read ${tone ? `is-${tone}` : ''}`}>
      <span className="sv-read-k">{label}</span>
      <b className="sv-read-v">{value}</b>
      {sub ? <span className="sv-read-s">{sub}</span> : null}
    </div>
  );
}

/** 先猜：题干 + 选项按钮；作答后显示对错与解释。 */
export interface GuessItem<T extends string> {
  q: string;
  options: { value: T; label: string }[];
  answer: T;
  explain: string;
}
export function Guess<T extends string>({ item, onAnswered }: { item: GuessItem<T>; onAnswered?: (v: T) => void }) {
  const [picked, setPicked] = useState<T | null>(null);
  const right = picked !== null && picked === item.answer;
  const ans = item.options.find((o) => o.value === item.answer)?.label;
  return (
    <div className="sv-guess">
      <p className="sv-guess-q">
        <span className="sv-guess-k">先猜</span>
        {item.q}
      </p>
      {picked === null ? (
        <div className="sv-guess-opts" role="group" aria-label="选择答案">
          {item.options.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => {
                setPicked(o.value);
                onAnswered?.(o.value);
              }}
            >
              {o.label}
            </button>
          ))}
        </div>
      ) : (
        <>
          <Feedback tone={right ? 'ok' : 'warn'} k={String(picked)}>
            <b>{right ? '猜对了。' : `答案是“${ans}”。`}</b>
            {item.explain}
          </Feedback>
          <div>
            <Btn onClick={() => setPicked(null)}>再猜一次</Btn>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * 宽表 / 宽图的自身滑动容器：内容确实放不下时才显示“左右滑动查看完整内容 →”，
 * 可滑动时容器可用键盘聚焦；模块本身和整页都不横向滚动。
 */
export function XScroll({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scrollable, setScrollable] = useState(false);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => setScrollable(el.scrollWidth > el.clientWidth + 1);
    check();
    window.addEventListener('resize', check);
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(check);
    ro?.observe(el);
    if (el.firstElementChild) ro?.observe(el.firstElementChild);
    return () => {
      window.removeEventListener('resize', check);
      ro?.disconnect();
    };
  }, []);
  return (
    <>
      {scrollable ? <div className="sv-swipe-hint">左右滑动查看完整内容 →</div> : null}
      <div
        ref={ref}
        className={`sv-xscroll ${className ?? ''}`}
        tabIndex={scrollable ? 0 : undefined}
        role={scrollable ? 'region' : undefined}
        aria-label={scrollable ? `${label}（可左右滑动）` : undefined}
      >
        {children}
      </div>
    </>
  );
}

/** 小色块（与画布同色），用于模块内的局部图例 */
export function Swatch({ color, dashed = false }: { color: string; dashed?: boolean }) {
  return <i className={`sv-sw ${dashed ? 'is-dashed' : ''}`} style={{ background: color }} aria-hidden="true" />;
}

/** 内容口径标记（与 Rich 里的 [[tag:…]] 同一套样式） */
export type ContentTag = 'paper' | 'code' | 'extrap' | 'demo';
export const TAG_INFO: Record<ContentTag, { label: string; desc: string }> = {
  paper: { label: '论文实测', desc: '直接取自 ICML 2025 正式版的正文、表格或图（引用 arXiv 时注明版本号），未经修改。' },
  code: { label: '代码事实', desc: '直接取自官方仓库固定提交 734d900（视频实验为 video 分支 f05b898）的代码，链接带行号。' },
  extrap: { label: '公式外推', desc: '本页按论文公式或代码口径计算 / 反推得到，论文没有报告这个数字或配置。' },
  demo: { label: '教学示意', desc: '为讲解而绘制的示意数据、小模型或场景，不是论文或真实模型的数据。' },
};
export function Tag({ kind }: { kind: ContentTag }) {
  const info = TAG_INFO[kind];
  return (
    <span className={`sv-tag is-${kind}`} title={info.desc}>
      {info.label}
    </span>
  );
}
