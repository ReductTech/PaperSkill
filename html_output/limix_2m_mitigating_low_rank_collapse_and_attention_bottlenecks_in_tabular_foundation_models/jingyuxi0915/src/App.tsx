import React, { useState, useEffect, useCallback, useRef } from 'react';
import { tutorial } from './data/tutorial';
import { Hero } from './components/Hero';
import { ChapterBridge } from './components/ChapterBridge';
import { AnalogyCard } from './components/AnalogyCard';
import { Module } from './components/Module';
import { Formula } from './components/Formula';
import { InsightBar } from './components/InsightBar';
import { Takeaway } from './components/Takeaway';
import { LearningResources } from './components/LearningResources';
import { learningResources } from './data/learning-resources';

export default function App() {
  const chapters = tutorial.chapters;
  const total = chapters.length;
  const hasResources = learningResources.length > 0;
  const lastSlide = total + (hasResources ? 1 : 0); // cover + chapters + learning resources

  const contentRef = useRef<HTMLDivElement>(null);
  const firstRender = useRef(true);
  const [active, setActive] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const goTo = useCallback(
    (i: number) => {
      setActive(Math.max(0, Math.min(i, lastSlide)));
      setSidebarOpen(false);
    },
    [lastSlide]
  );

  const next = useCallback(() => goTo(active + 1), [active, goTo]);
  const prev = useCallback(() => goTo(active - 1), [active, goTo]);

  // Reset scroll on every slide change so a long chapter always opens from the top.
  useEffect(() => {
    const heading = contentRef.current?.querySelector<HTMLElement>('h1, h2');
    if (!firstRender.current && heading) {
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    }
    firstRender.current = false;
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [active]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const target = e.target instanceof Element ? e.target : document.activeElement;
      if (target?.closest('input,select,textarea,button,a,summary,canvas,audio,video,[contenteditable]:not([contenteditable="false"]),[role="slider"],[role="button"],[role="link"],[role="tab"],[role="combobox"],[role="menuitem"],[role="spinbutton"],[tabindex]:not([tabindex="-1"])')) return;
      e.preventDefault();
      if (e.key === 'ArrowRight') next(); else prev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev]);

  const sidebarItems = [
    { idx: 0, num: '封面', title: '' },
    ...chapters.map((ch, i) => ({ idx: i + 1, num: `§${i + 1}`, title: ch.title })),
    ...(hasResources ? [{ idx: total + 1, num: '↗', title: '延伸学习' }] : []),
  ];

  const currentChapter = active >= 1 && active <= total ? chapters[active - 1] : null;

  return (
    <div className={`slide-layout ${sidebarOpen ? 'sidebar-open' : ''} ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <button className="slide-sidebar-toggle" aria-expanded={sidebarOpen} aria-controls="chapter-navigation" onClick={() => setSidebarOpen(!sidebarOpen)}>
        <span className="slide-sidebar-toggle-icon">{sidebarOpen ? '✕' : '☰'}</span>
        目录
      </button>

      {sidebarOpen ? (
        <div className="slide-sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      ) : null}

      <aside className="slide-sidebar" id="chapter-navigation">
        <div className="slide-sidebar-header">
          <div className="slide-sidebar-venue">{tutorial.meta.venue}</div>
          <div className="slide-sidebar-title">
            LimiX-2M｜交互式论文学习
          </div>
        </div>
        <nav className="slide-sidebar-nav">
          {sidebarItems.map((item) => (
            <button
              key={item.idx}
              className={`slide-sidebar-item ${active === item.idx ? 'active' : ''}`}
              aria-current={active === item.idx ? 'page' : undefined}
              onClick={() => goTo(item.idx)}
            >
              <span className="slide-sidebar-num">{item.num}</span>
              <span className="slide-sidebar-text">{item.title}</span>
            </button>
          ))}
        </nav>
      </aside>

      <button
        className="slide-sidebar-collapse"
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        title={sidebarCollapsed ? '展开目录' : '折叠目录'}
      >
        {sidebarCollapsed ? '☰' : '◀'}
      </button>

      <main className="slide-main">
        <div className="slide-content" key={active} ref={contentRef}>
          {active === 0 ? (
            <Hero meta={tutorial.meta} hero={tutorial.hero} />
          ) : currentChapter ? (
            <section className="chap slide-chap">
              <h2 className="chap-title">
                <span className="num">§{active}.</span>
                {currentChapter.title}
                <span className={`badge-tag ${currentChapter.badge}`}>
                  {currentChapter.badgeLabel}
                </span>
              </h2>
              <ChapterBridge text={currentChapter.bridge} />
              <AnalogyCard analogy={currentChapter.analogy} chapterId={currentChapter.id} />
              {currentChapter.modules.map((m) => (
                <Module key={m.id} module={m} chapterId={currentChapter.id} />
              ))}
              {currentChapter.insight ? <InsightBar text={currentChapter.insight} /> : null}
              {currentChapter.formula ? <Formula formula={currentChapter.formula} /> : null}
              <Takeaway items={currentChapter.takeaways} />
            </section>
          ) : hasResources ? (
            <LearningResources chapters={chapters} />
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
          >
            {active === 0 ? '开始学习 §1 →' : '下一章 →'}
          </button>
        </div>
      </main>
    </div>
  );
}
