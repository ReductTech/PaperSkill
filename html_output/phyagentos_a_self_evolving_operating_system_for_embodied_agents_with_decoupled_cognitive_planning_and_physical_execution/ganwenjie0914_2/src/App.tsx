import React, { useState, useEffect, useCallback, useRef } from 'react';
import { tutorial } from './data/tutorial';
import { Hero } from './components/Hero';
import { ChapterBridge } from './components/ChapterBridge';
import { AnalogyCard } from './components/AnalogyCard';
import { Prose } from './components/Prose';
import { Module } from './components/Module';
import { Formula } from './components/Formula';
import { InsightBar } from './components/InsightBar';
import { Takeaway } from './components/Takeaway';
import { BiliVideos } from './components/BiliVideos';

const POS_KEY = 'phyagentos-position';

export default function App() {
  const chapters = tutorial.chapters;
  const total = chapters.length;
  const bili = tutorial.bilibili || [];
  const hasBili = bili.length > 0;
  const lastSlide = total + (hasBili ? 1 : 0);

  const [active, setActive] = useState(() => {
    try {
      const saved = Number(localStorage.getItem(POS_KEY));
      if (Number.isFinite(saved) && saved >= 0 && saved <= total) return saved;
    } catch {
      /* ignore */
    }
    return 0;
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const mainRef = useRef<HTMLElement>(null);

  const goTo = useCallback(
    (i: number) => {
      setActive(Math.max(0, Math.min(i, lastSlide)));
      setSidebarOpen(false);
    },
    [lastSlide]
  );

  const next = useCallback(() => goTo(active + 1), [active, goTo]);
  const prev = useCallback(() => goTo(active - 1), [active, goTo]);

  // Reset scroll on slide change; remember position across reloads.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    try {
      localStorage.setItem(POS_KEY, String(active));
    } catch {
      /* ignore */
    }
  }, [active]);

  // 焦点在表单控件上时不劫持方向键（滑块需要 ← → 微调）。
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      // 原生表单控件和 SVG/ARIA slider 都要独占方向键；否则 ReturnCodeLab 的
      // 可键盘拖动手柄会一边微调位置、一边触发整页翻章。
      if (t?.closest('input, textarea, select, [contenteditable="true"], [role="slider"]')) return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault();
        next();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        prev();
      } else if (e.key === 'Home') {
        e.preventDefault();
        goTo(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        goTo(lastSlide);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev, goTo, lastSlide]);

  // 术语说明默认向左展开；若窗口缩窄或术语位于边缘，再以最小位移收回到可视区域。
  // 术语来自 prose 的 HTML 字符串，事件委托可覆盖所有章节与后续切换出的内容。
  useEffect(() => {
    let frame = 0;
    const viewportPadding = 16;

    const place = (term: HTMLElement) => {
      const popover = term.querySelector<HTMLElement>('.term-popover');
      if (!popover) return;
      term.classList.add('is-popover-open');
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        popover.style.setProperty('--term-popover-offset', '0px');
        const rect = popover.getBoundingClientRect();
        const offset = Math.max(viewportPadding - rect.left, 0) - Math.max(rect.right - (window.innerWidth - viewportPadding), 0);
        popover.style.setProperty('--term-popover-offset', `${offset}px`);

        const shifted = popover.getBoundingClientRect();
        const trigger = term.getBoundingClientRect();
        const arrowX = Math.min(Math.max(trigger.right - shifted.left, 12), shifted.width - 12);
        popover.style.setProperty('--term-popover-arrow-x', `${arrowX}px`);
      });
    };

    const close = (term: HTMLElement) => {
      requestAnimationFrame(() => {
        const focused = document.activeElement;
        if (!term.matches(':hover') && !term.contains(focused)) term.classList.remove('is-popover-open');
      });
    };

    const resolveTerm = (target: EventTarget | null) =>
      target instanceof Element ? target.closest<HTMLElement>('.term') : null;
    const onPointerOver = (event: PointerEvent) => {
      const term = resolveTerm(event.target);
      if (term && !term.contains(event.relatedTarget as Node | null)) place(term);
    };
    const onPointerOut = (event: PointerEvent) => {
      const term = resolveTerm(event.target);
      if (term && !term.contains(event.relatedTarget as Node | null)) close(term);
    };
    const onFocusIn = (event: FocusEvent) => {
      const term = resolveTerm(event.target);
      if (term) place(term);
    };
    const onFocusOut = (event: FocusEvent) => {
      const term = resolveTerm(event.target);
      if (term && !term.contains(event.relatedTarget as Node | null)) close(term);
    };
    const onResize = () => document.querySelectorAll<HTMLElement>('.term.is-popover-open').forEach(place);

    document.addEventListener('pointerover', onPointerOver);
    document.addEventListener('pointerout', onPointerOut);
    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('focusout', onFocusOut);
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('pointerover', onPointerOver);
      document.removeEventListener('pointerout', onPointerOut);
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('focusout', onFocusOut);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  const progress = lastSlide > 0 ? ((active + 1) / (lastSlide + 1)) * 100 : 0;

  const sidebarItems = [
    { idx: 0, num: '封面', title: 'PhyAgentOS 导读' },
    ...chapters.map((ch, i) => ({ idx: i + 1, num: `§${i + 1}`, title: ch.title })),
    ...(hasBili ? [{ idx: total + 1, num: '📺', title: '延伸视频' }] : []),
  ];

  const currentChapter = active >= 1 && active <= total ? chapters[active - 1] : null;

  return (
    <div
      className={`slide-layout ${sidebarOpen ? 'sidebar-open' : ''} ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}
    >
      {/* 顶部阅读进度条 */}
      <div className="reading-progress" aria-hidden>
        <i style={{ width: `${progress}%` }} />
      </div>

      <button
        type="button"
        className="slide-sidebar-toggle"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-expanded={sidebarOpen}
        aria-controls="tutorial-sidebar"
      >
        <span className="slide-sidebar-toggle-icon">{sidebarOpen ? '✕' : '☰'}</span>
        目录
      </button>

      {sidebarOpen ? (
        <div className="slide-sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      ) : null}

      <aside className="slide-sidebar" id="tutorial-sidebar">
        <div className="slide-sidebar-header">
          <div className="slide-sidebar-venue">{tutorial.meta.venue}</div>
          <div className="slide-sidebar-title">{tutorial.meta.titleZh}</div>
          <div className="slide-sidebar-progress">
            <span>已读 {Math.round(progress)}%</span>
          </div>
        </div>
        <nav className="slide-sidebar-nav">
          {sidebarItems.map((item) => (
            <button
              key={item.idx}
              className={`slide-sidebar-item ${active === item.idx ? 'active' : ''}`}
              onClick={() => goTo(item.idx)}
            >
              <span className="slide-sidebar-num">{item.num}</span>
              <span className="slide-sidebar-text">{item.title}</span>
            </button>
          ))}
        </nav>
        <div className="slide-sidebar-foot">
          <div className="slide-sidebar-kbd">
            <kbd>←</kbd>
            <kbd>→</kbd>
            翻页
          </div>
        </div>
      </aside>

      <button
        type="button"
        className="slide-sidebar-collapse"
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        title={sidebarCollapsed ? '展开目录' : '折叠目录'}
        aria-label={sidebarCollapsed ? '展开目录' : '折叠目录'}
      >
        {sidebarCollapsed ? '☰' : '◀'}
      </button>

      <main className="slide-main" ref={mainRef}>
        <div className="slide-content" key={active}>
          {active === 0 ? (
            <Hero meta={tutorial.meta} hero={tutorial.hero} onStart={() => goTo(1)} />
          ) : currentChapter ? (
            <section className="chap slide-chap">
              <h2 className="chap-title">
                <span className="num">§{active}</span>
                <span className="chap-title-text">{currentChapter.title}</span>
                <span className={`badge-tag ${currentChapter.badge}`}>{currentChapter.badgeLabel}</span>
              </h2>
              <ChapterBridge text={currentChapter.bridge} />
              <AnalogyCard analogy={currentChapter.analogy} chapterId={currentChapter.id} />
              <Prose blocks={currentChapter.prose ?? []} />
              {currentChapter.modules.map((m) => (
                <Module key={m.id} module={m} chapterId={currentChapter.id} />
              ))}
              {currentChapter.insight ? <InsightBar text={currentChapter.insight} /> : null}
              {currentChapter.formula ? <Formula formula={currentChapter.formula} /> : null}
              <Takeaway items={currentChapter.takeaways} />
            </section>
          ) : hasBili ? (
            <BiliVideos items={bili} />
          ) : null}
        </div>

        <div className="slide-nav">
          <button className="slide-nav-btn" onClick={prev} disabled={active === 0}>
            ← 上一章
          </button>
          <span className="slide-nav-counter">
            {active + 1} / {lastSlide + 1}
          </span>
          <button
            className="slide-nav-btn slide-nav-btn-primary"
            onClick={next}
            disabled={active === lastSlide}
            title={active < lastSlide ? sidebarItems[active + 1]?.title : undefined}
          >
            下一章 →
          </button>
        </div>
      </main>
    </div>
  );
}
