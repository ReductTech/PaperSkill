import React, { useState, useEffect, useCallback } from 'react';
import { tutorial } from './data/tutorial';
import { Hero } from './components/Hero';
import { ChapterBridge } from './components/ChapterBridge';
import { AnalogyCard } from './components/AnalogyCard';
import { Module } from './components/Module';
import { Formula } from './components/Formula';
import { InsightBar } from './components/InsightBar';
import { Takeaway } from './components/Takeaway';
import { BiliVideos } from './components/BiliVideos';

export default function App() {
  const chapters = tutorial.chapters;
  const total = chapters.length;
  const bili = tutorial.bilibili || [];
  const hasBili = bili.length > 0;
  const lastSlide = total + (hasBili ? 1 : 0); // 0=hero, 1..total=chapters, total+1=bili

  const [active, setActive] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

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
    window.scrollTo({ top: 0, behavior: 'instant' });
    setScrollProgress(0);
  }, [active]);

  // Reading progress within the current page, shown in the sidebar.
  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      setScrollProgress(max > 0 ? Math.min(100, Math.max(0, (window.scrollY / max) * 100)) : 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A'].includes(target.tagName)) return;

      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        if (e.shiftKey) prev();
        else next();
      } else if (e.key === 'Home') {
        e.preventDefault();
        goTo(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        goTo(lastSlide);
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        next();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        prev();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev, goTo, lastSlide]);

  const sidebarItems = [
    { idx: 0, num: '封面', title: tutorial.meta.titleZh || tutorial.meta.titleEn, structure: '' },
    ...chapters.map((ch, i) => ({ idx: i + 1, num: `§${i + 1}`, title: ch.title, structure: ch.badgeLabel })),
    ...(hasBili ? [{ idx: total + 1, num: '📺', title: '延伸视频', structure: '' }] : []),
  ];

  const currentChapter = active >= 1 && active <= total ? chapters[active - 1] : null;

  const scrollToAnchor = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className={`slide-layout ${sidebarOpen ? 'sidebar-open' : ''} ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <button className="slide-sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
        <span className="slide-sidebar-toggle-icon">{sidebarOpen ? '✕' : '☰'}</span>
        目录
      </button>

      {sidebarOpen ? (
        <div className="slide-sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      ) : null}

      <aside className="slide-sidebar">
        <div className="slide-sidebar-header">
          <div className="slide-sidebar-venue">{tutorial.meta.venue}</div>
          <div className="slide-sidebar-title">
            {tutorial.meta.titleZh || tutorial.meta.titleEn}
          </div>
          <div className="slide-sidebar-progress">
            <span className="slide-sidebar-progress-label">
              当前页阅读进度 {Math.round(scrollProgress)}%
            </span>
            <div className="slide-sidebar-progress-track">
              <div
                className="slide-sidebar-progress-fill"
                style={{ width: `${scrollProgress}%` }}
              />
            </div>
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
              {item.structure ? (
                <span className="slide-sidebar-structure">{item.structure}</span>
              ) : null}
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
        <div className="slide-content" key={active}>
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
              <nav className="slide-anchors">
                <span className="slide-anchors-label">快速跳转</span>
                {currentChapter.modules.map((m) => (
                  <button
                    key={m.id}
                    className="slide-anchor-chip"
                    onClick={() => scrollToAnchor(`module-${m.id}`)}
                  >
                    {m.id} {m.title}
                  </button>
                ))}
                {currentChapter.formula ? (
                  <button
                    className="slide-anchor-chip"
                    onClick={() => scrollToAnchor('chapter-formula')}
                  >
                    公式
                  </button>
                ) : null}
                <button
                  className="slide-anchor-chip"
                  onClick={() => scrollToAnchor('chapter-takeaways')}
                >
                  小结
                </button>
              </nav>
              <ChapterBridge text={currentChapter.bridge} />
              <AnalogyCard analogy={currentChapter.analogy} chapterId={currentChapter.id} />
              {currentChapter.modules.map((m) => (
                <div key={m.id} id={`module-${m.id}`} className="slide-module-anchor">
                  <Module module={m} chapterId={currentChapter.id} />
                </div>
              ))}
              {currentChapter.insight ? <InsightBar text={currentChapter.insight} /> : null}
              {currentChapter.formula ? (
                <div id="chapter-formula" className="slide-module-anchor">
                  <Formula formula={currentChapter.formula} />
                </div>
              ) : null}
              <div id="chapter-takeaways" className="slide-module-anchor">
                <Takeaway items={currentChapter.takeaways} />
              </div>
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
          >
            下一章 →
          </button>
        </div>
      </main>
    </div>
  );
}
