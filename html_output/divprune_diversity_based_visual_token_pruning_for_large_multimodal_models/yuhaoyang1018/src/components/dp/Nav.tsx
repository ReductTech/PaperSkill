import React, { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '../../lib/hooks';

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

  const go = (id: string) => {
    setOpen(false);
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    const h = el.querySelector<HTMLElement>('h1, h2, [tabindex="-1"]');
    window.setTimeout(() => h?.focus({ preventScroll: true }), reduced ? 0 : 450);
    if (history.replaceState) history.replaceState(null, '', '#' + id);
  };

  const curItem = items.find((i) => i.id === current) ?? items[0];

  return (
    <div className="fnav">
      <div ref={panelRef} id="fnav-panel" className={`fnav-panel ${open ? 'is-open' : ''}`} hidden={!open} role="dialog" aria-label="章节导航">
        <div className="fnav-head">章节导航</div>
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
        onClick={() => setOpen((o) => !o)}
      >
        <span className="fnav-btn-num">{curItem?.num}</span>
        <span className="fnav-btn-t">{open ? '关闭' : '章节'}</span>
      </button>
    </div>
  );
}
