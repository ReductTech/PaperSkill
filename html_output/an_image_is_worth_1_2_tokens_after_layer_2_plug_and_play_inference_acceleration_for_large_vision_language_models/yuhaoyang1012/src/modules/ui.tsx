import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ChapterDef, DeepDive, Takeaway } from '../types';

// ============================================================================
//  共享交互 / 动效原语（遵循 Emil Kowalski 的动画准则）：
//  - 强 ease-out / ease-in-out 曲线，UI 反馈 ≤ 300ms，说明性动画可更长
//  - 只动 transform / opacity / clip-path，从不 scale(0)
//  - 滚动揭示只触发一次；数字变化直接写 DOM，不触发 React 重渲染
//  - prefers-reduced-motion 下保留淡入、去掉位移
// ============================================================================

export const prefersReduced = () =>
  typeof window !== 'undefined' &&
  !!window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------------------------------------------------------------------------
//  ChipGroup：选中态由一层“激活副本”按 clip-path 揭示，在选项间平滑滑动，
//  文字与底色同步切换（比逐个按钮做颜色过渡更干净）。
// ---------------------------------------------------------------------------
export interface ChipOption<T> {
  key: T;
  label: React.ReactNode;
}

export function ChipGroup<T extends string | number>({
  options,
  value,
  onChange,
  label,
}: {
  options: ChipOption<T>[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [clip, setClip] = useState<string | null>(null);

  const measure = () => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const btn = wrap.querySelector<HTMLElement>(`.chip-row-base [data-k="${String(value)}"]`);
    if (!btn) {
      setClip(null); // 当前值不在快捷选项中：隐藏指示层
      return;
    }
    const W = wrap.clientWidth;
    const H = wrap.clientHeight;
    const top = btn.offsetTop;
    const left = btn.offsetLeft;
    const right = W - (left + btn.offsetWidth);
    const bottom = H - (top + btn.offsetHeight);
    setClip(`inset(${top}px ${right}px ${bottom}px ${left}px round 999px)`);
  };

  useLayoutEffect(measure, [value, options.length]);
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(wrap);
    return () => ro.disconnect();
  });

  return (
    <div className="chip-group" ref={wrapRef} role="radiogroup" aria-label={label}>
      <div className="chip-row chip-row-base">
        {options.map((o) => (
          <button
            key={String(o.key)}
            data-k={String(o.key)}
            role="radio"
            aria-checked={o.key === value}
            className={`chip ${o.key === value ? 'is-on' : ''}`}
            onClick={() => onChange(o.key)}
            onKeyDown={(e) => {
              // 方向键在选项间移动；阻止冒泡，避免与页面级快捷键冲突
              if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
              e.preventDefault();
              e.stopPropagation();
              const i = options.findIndex((x) => x.key === value);
              const n = options[(i + (e.key === 'ArrowRight' ? 1 : -1) + options.length) % options.length];
              onChange(n.key);
              const el = wrapRef.current?.querySelector<HTMLElement>(`.chip-row-base [data-k="${String(n.key)}"]`);
              el?.focus();
            }}
          >
            {o.label}
          </button>
        ))}
      </div>
      <div className="chip-row chip-row-active" aria-hidden="true" style={clip ? { clipPath: clip } : { opacity: 0 }}>
        {options.map((o) => (
          <span key={String(o.key)} className="chip">
            {o.label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
//  Num：数值变化时做一次 ease-out 补间（直接写 textContent）。
// ---------------------------------------------------------------------------
export function Num({
  value,
  format = (v: number) => String(Math.round(v)),
  className,
}: {
  value: number;
  format?: (v: number) => string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const cur = useRef(value);
  const fmt = useRef(format);
  fmt.current = format;
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const from = cur.current;
    const to = value;
    if (from === to || prefersReduced()) {
      cur.current = to;
      el.textContent = fmt.current(to);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const D = 480;
    const step = (now: number) => {
      const k = Math.min(1, (now - t0) / D);
      const e = 1 - Math.pow(1 - k, 4);
      const v = from + (to - from) * e;
      cur.current = v;
      el.textContent = fmt.current(v);
      if (k < 1) raf = requestAnimationFrame(step);
      else cur.current = to;
    };
    raf = requestAnimationFrame(step);
    el.classList.remove('num-bump');
    void el.offsetWidth;
    el.classList.add('num-bump');
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return (
    <span ref={ref} className={`num-tween ${className || ''}`}>
      {format(value)}
    </span>
  );
}

// ---------------------------------------------------------------------------
//  Reveal：逐个观察直接子元素，进入视口时（只一次）加 data-visible。
// ---------------------------------------------------------------------------
export function Reveal({
  as = 'section',
  className,
  id,
  children,
}: {
  as?: 'section' | 'div' | 'footer';
  className?: string;
  id?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const items = Array.from(root.children) as HTMLElement[];
    if (typeof IntersectionObserver === 'undefined') {
      items.forEach((el) => el.setAttribute('data-visible', ''));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.setAttribute('data-visible', '');
            io.unobserve(en.target);
          }
        });
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.01 }
    );
    items.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return React.createElement(as, { ref, className: `reveal-group ${className || ''}`, id }, children);
}

// ---------------------------------------------------------------------------
//  章节片头卡：巨大的描边章节号 + 遮罩揭示的标题
// ---------------------------------------------------------------------------
export function ChapterCard({ index, total, chapter }: { index: number; total: number; chapter: ChapterDef }) {
  const n = String(index).padStart(2, '0');
  return (
    <header className="chap-card">
      <div className="chap-card-num" aria-hidden="true">
        {n}
      </div>
      <div className="chap-card-body">
        <div className="chap-card-meta">
          <span>
            CHAPTER {n} / {String(total).padStart(2, '0')}
          </span>
          <span className={`badge-tag ${chapter.badge}`}>{chapter.badgeLabel}</span>
        </div>
        <h2 className="chap-title">
          <span className="chap-title-mask">{chapter.title}</span>
        </h2>
      </div>
    </header>
  );
}

// ---------------------------------------------------------------------------
//  精读块 + 常见误区
// ---------------------------------------------------------------------------
/** 精读：关键数字常驻，正文默认折叠（点击展开，高度用 grid 0fr→1fr 过渡）。 */
export function DeepDiveBlock({ dd, chapterId }: { dd: DeepDive; chapterId: string }) {
  const [open, setOpen] = useState(false);
  const bodyId = `dd-${chapterId}`;
  return (
    <div className={`deep-dive ${open ? 'is-open' : ''}`}>
      <button className="dd-head" aria-expanded={open} aria-controls={bodyId} onClick={() => setOpen((o) => !o)}>
        <span className="dd-tag">精读</span>
        <span className="dd-title">{dd.title}</span>
        <span className="dd-toggle" aria-hidden="true">
          {open ? '收起' : '展开'}
          <i />
        </span>
      </button>
      {dd.facts && dd.facts.length ? (
        <div className="dd-facts">
          {dd.facts.map((f, i) => (
            <div key={i} className="dd-fact">
              <div className="dd-fact-v">{f.value}</div>
              <div className="dd-fact-l" dangerouslySetInnerHTML={{ __html: f.label }} />
            </div>
          ))}
        </div>
      ) : null}
      <div className="dd-collapse" id={bodyId}>
        <div className="dd-collapse-inner">
          <div className="dd-body">
            {dd.paragraphs.map((p, i) => (
              <p key={i} dangerouslySetInnerHTML={{ __html: p }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** 小结 + 常见误区合并为一个收尾区块（有误区时左右两栏，无误区时单栏）。 */
export function Recap({ takeaways, pitfalls }: { takeaways: Takeaway[]; pitfalls?: string[] }) {
  const hasPit = !!(pitfalls && pitfalls.length);
  return (
    <div className={`recap ${hasPit ? 'has-pit' : ''}`}>
      <div className="recap-take">
        <div className="recap-head">本章要点</div>
        <ol>
          {takeaways.map((t, i) => (
            <li key={i}>
              <span className="rk-icon" aria-hidden="true">
                {t.icon}
              </span>
              <span>
                <b>{t.title}</b>
                <span dangerouslySetInnerHTML={{ __html: t.desc }} />
              </span>
            </li>
          ))}
        </ol>
      </div>
      {hasPit ? (
        <div className="recap-pit">
          <div className="recap-head pit">常见误区</div>
          <ul>
            {(pitfalls as string[]).map((p, i) => (
              <li key={i} dangerouslySetInnerHTML={{ __html: p }} />
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
//  滚动进度条（直接写 transform，不触发重渲染）
// ---------------------------------------------------------------------------
export function ScrollProgress() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = ref.current;
      if (!el) return;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      el.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
  return (
    <div className="scroll-progress" aria-hidden="true">
      <div ref={ref} />
    </div>
  );
}

// ---------------------------------------------------------------------------
//  窄屏判断（与 CSS 断点一致）
// ---------------------------------------------------------------------------
export const MOBILE_QUERY = '(max-width: 680px)';

export function useIsMobile() {
  const get = () => typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia(MOBILE_QUERY).matches;
  const [m, setM] = useState(get);
  useEffect(() => {
    if (!window.matchMedia) return;
    const mq = window.matchMedia(MOBILE_QUERY);
    const on = () => setM(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return m;
}


// ---------------------------------------------------------------------------
//  画布容器：窄屏下没有专门手机版式的画布，允许横向滑动查看（带提示）
// ---------------------------------------------------------------------------
export function CanvasPan({ fit, children }: { fit?: boolean; children: React.ReactNode }) {
  return <div className={`cv-pan ${fit ? 'cv-fit' : ''}`}>{children}</div>;
}
