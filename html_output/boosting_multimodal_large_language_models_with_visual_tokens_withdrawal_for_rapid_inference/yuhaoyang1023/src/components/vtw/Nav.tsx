import React, { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '../../lib/hooks';
import { emitChapter } from '../../lib/bus';

/** 跳到页面中的某个锚点（章节或模块），并把焦点移到标题上。 */
export function jumpTo(id: string, reduced: boolean) {
  const el = document.getElementById(id);
  if (!el) return;
  // 目标在收起的“还想深入？”抽屉里时，先把抽屉打开，等内容渲染后再滚动
  const body = el.closest('.ch-more-body');
  if (body && body.hasAttribute('hidden')) {
    (body.parentElement?.querySelector('.ch-more-toggle') as HTMLButtonElement | null)?.click();
    window.setTimeout(() => jumpTo(id, reduced), 80);
    return;
  }
  el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  // 兜底：平滑滚动被节流（后台标签页、低功耗）时，0.9 秒后仍未到位就直接跳过去
  if (!reduced) {
    window.setTimeout(() => {
      if (Math.abs(el.getBoundingClientRect().top) > 60) el.scrollIntoView({ block: 'start' });
    }, 900);
  }
  const h = el.matches('h1, h2, h3') ? el : el.querySelector<HTMLElement>('h1, h2, h3, [tabindex="-1"]');
  window.setTimeout(() => h?.focus({ preventScroll: true }), reduced ? 0 : 480);
  if (history.replaceState) history.replaceState(null, '', '#' + id);
}

export interface NavItem {
  id: string;
  num: string;
  title: string;
}

/** 顶部阅读进度条：纯展示，pointer-events: none，不拦截任何点击。 */
export function ProgressBar() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = ref.current;
      if (!el) return;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      el.style.transform = `scaleX(${p})`;
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
      cancelAnimationFrame(raf);
    };
  }, []);
  return (
    <div className="progress" aria-hidden="true">
      <div className="progress-bar" ref={ref} />
    </div>
  );
}

/**
 * 悬浮章节导航：右下角一个按钮，点开选章、跳转后自动关闭。
 * 外层容器 pointer-events: none；只有按钮和打开的面板可点。关闭时面板 hidden（不占位、不可点）。
 */
export function FloatingNav({ items }: { items: NavItem[] }) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState(items[0]?.id ?? '');
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  // 滚动监听：当前阅读到哪一节
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const els = items.map((it) => document.getElementById(it.id)).filter(Boolean) as HTMLElement[];
    const visible = new Map<string, number>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) visible.set(e.target.id, e.isIntersecting ? e.intersectionRatio : 0);
        let best = '';
        let bestTop = Infinity;
        for (const el of els) {
          const r = el.getBoundingClientRect();
          if (r.top <= window.innerHeight * 0.35 && r.bottom > window.innerHeight * 0.2) {
            if (Math.abs(r.top) < bestTop) {
              bestTop = Math.abs(r.top);
              best = el.id;
            }
          }
        }
        if (best) setCurrent(best);
      },
      { threshold: [0, 0.1, 0.5], rootMargin: '-20% 0px -60% 0px' }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [items]);

  // 通知背景：当前读到第几章（封面 0，第 n 章 n，结尾各节 ≥ 11）
  useEffect(() => {
    emitChapter(Math.max(0, items.findIndex((it) => it.id === current)));
  }, [current, items]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (panelRef.current?.contains(t) || btnRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        btnRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onDown, true);
    document.addEventListener('keydown', onKey);
    // 打开后把焦点移到当前项
    const cur = panelRef.current?.querySelector<HTMLButtonElement>('[aria-current="true"]') ?? panelRef.current?.querySelector<HTMLButtonElement>('button');
    cur?.focus({ preventScroll: true });
    return () => {
      document.removeEventListener('pointerdown', onDown, true);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // 手机（≤ 640px）：读者停下阅读时，如果按钮下面有文字、图表或可操作控件，就把按钮收进右侧页边，
  // 只露出 14px 的光边（点它即可打开目录）；滚动时按钮重新出现（半透明），提醒导航在这里。
  // 按钮下方是空白时照常显示；附近 56 / 112px 处有空位时上移过去。桌面端不受影响。
  const [quiet, setQuiet] = useState(false);
  const [lift, setLift] = useState(0);
  const [tucked, setTucked] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const liftRef = useRef(0);
  liftRef.current = lift;
  const tuckedRef = useRef(false);
  tuckedRef.current = tucked;
  useEffect(() => {
    let timer = 0;
    const INTERACTIVE = 'input, button, a, select, textarea, [role="slider"], canvas, img, svg, .guess-opt, .sl, .seg-row, .tbar';
    const isContent = (el: Element) => {
      if (rootRef.current?.contains(el)) return false;
      if (el.closest(INTERACTIVE)) return true;
      // 自身带文字（段落、标题、列表项、行内文字等）
      for (const n of Array.from(el.childNodes)) if (n.nodeType === 3 && (n.textContent ?? '').trim()) return true;
      return false;
    };
    const blocked = (r: DOMRect, dy: number) => {
      const pts = [
        [r.left + r.width / 2, r.top + r.height / 2 - dy],
        [r.left + 4, r.top + 4 - dy],
        [r.right - 4, r.top + 4 - dy],
        [r.left + 4, r.bottom - 4 - dy],
        [r.right - 4, r.bottom - 4 - dy],
      ];
      return pts.some(([x, y]) => document.elementsFromPoint(x, y).some(isContent));
    };
    const narrow = () => window.innerWidth <= 640;
    const dodge = () => {
      const btn = btnRef.current;
      if (!btn || !narrow()) {
        setLift(0);
        setTucked(false);
        return;
      }
      const r = btn.getBoundingClientRect();
      if (tuckedRef.current) r.x -= 44; // 收起时按钮右移了 44px，按原位置检查
      const base = new DOMRect(r.left, r.top + liftRef.current, r.width, r.height); // 未上移时的位置
      for (const dy of [0, 56, 112]) {
        if (!blocked(base, dy)) {
          setLift(dy);
          setTucked(false);
          return;
        }
      }
      setLift(0);
      setTucked(true);
    };
    const onScroll = () => {
      setQuiet(true);
      if (narrow()) setTucked(false); // 滚动时重新露出，提醒导航在这里
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        setQuiet(false);
        dodge();
      }, 700);
    };
    const first = window.setTimeout(dodge, 900);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      window.clearTimeout(timer);
      window.clearTimeout(first);
    };
  }, []);

  const go = (id: string) => {
    setOpen(false);
    jumpTo(id, reduced);
  };

  const curItem = items.find((i) => i.id === current) ?? items[0];

  return (
    <div ref={rootRef} className={`fnav ${quiet && !open ? 'is-quiet' : ''} ${tucked && !open ? 'is-tucked' : ''}`} style={lift && !open ? { transform: `translateY(${-lift}px)` } : undefined}>
      <div ref={panelRef} id="fnav-panel" className={`fnav-panel ${open ? 'is-open' : ''}`} hidden={!open} role="dialog" aria-label="章节导航">
        <div className="fnav-head">
          <span>章节导航</span>
          <button
            type="button"
            className="fnav-close"
            aria-label="关闭章节导航"
            onClick={() => {
              setOpen(false);
              btnRef.current?.focus();
            }}
          >
            ×
          </button>
        </div>
        <ol className="fnav-list">
          {items.map((it) => (
            <li key={it.id}>
              <button type="button" aria-current={it.id === current ? 'true' : undefined} className={it.id === current ? 'is-cur' : ''} onClick={() => go(it.id)}>
                <span className="fnav-num">{it.num}</span>
                <span className="fnav-t">{it.title}</span>
              </button>
            </li>
          ))}
        </ol>
      </div>
      <button
        ref={btnRef}
        type="button"
        className="fnav-btn"
        aria-expanded={open}
        aria-controls="fnav-panel"
        aria-label={open ? '关闭章节导航' : `章节导航（当前：${curItem?.num ?? ''} ${curItem?.title ?? ''}）`}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="fnav-btn-num">{curItem?.num}</span>
        <span className="fnav-btn-t">{open ? '关闭' : '章节'}</span>
      </button>
    </div>
  );
}
