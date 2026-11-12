import React, { useEffect, useRef, useState } from 'react';
import { SlidingChoices } from '../components/SlidingChoices';
import { reducedMotion, plotChange, signalReading } from '../lib/controlMotion';
import type { ChapterDef, DeepDive, Takeaway } from '../types';

// ============================================================================
//  共享交互 / 动效原语（遵循 Emil Kowalski 的动画准则）：
//  - 强 ease-out / ease-in-out 曲线，UI 反馈 ≤ 300ms，说明性动画可更长
//  - 只动 transform / opacity / clip-path，从不 scale(0)
//  - 滚动揭示只触发一次；数字变化直接写 DOM，不触发 React 重渲染
//  - prefers-reduced-motion 下保留淡入、去掉位移
// ============================================================================

export const prefersReduced = reducedMotion;

// ---------------------------------------------------------------------------
//  共用模式选择器，支持指针与方向键。
// ---------------------------------------------------------------------------
export function sliderFill(value: number, min: number, max: number): React.CSSProperties {
  return { '--filled': String((value - min) * 100 / (max - min)) + '%' } as React.CSSProperties;
}
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
  return (
    <div className="chip-group" role="radiogroup" aria-label={label}>
      <SlidingChoices className="chip-row chip-row-base" selected={value}>
        {options.map(o => (
          <button key={String(o.key)} type="button" data-k={String(o.key)}
            role="radio" aria-checked={o.key === value} className={'chip' + (o.key === value ? ' is-on' : '')}
            onClick={event => {
              if (o.key === value) return;
              const lab = event.currentTarget.closest('.module');
              lab?.dispatchEvent(new Event(plotChange));
              lab?.querySelectorAll<HTMLElement>('.feedback,.prune-path').forEach(signalReading);
              onChange(o.key);
            }}>
            {o.label}
          </button>
        ))}
      </SlidingChoices>
    </div>
  );
}

// ---------------------------------------------------------------------------
//  输入、读数与图表使用同一帧状态。
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
  return <span className={`num-tween ${className || ''}`}>{format(value)}</span>;
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
