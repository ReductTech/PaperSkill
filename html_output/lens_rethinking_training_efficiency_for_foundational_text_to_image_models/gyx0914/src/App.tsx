import React, { useState, useEffect, useCallback } from 'react';
import { tutorial } from './data/tutorial';
import { Hero } from './components/Hero';
import { ChapterBridge } from './components/ChapterBridge';
import { AnalogyCard } from './components/AnalogyCard';
import { Module } from './components/Module';
import { Formula } from './components/Formula';
import { InsightBar } from './components/InsightBar';
import { Takeaway } from './components/Takeaway';
import { ModelGallery } from './components/ModelGallery';

export default function App() {
  const chapters = tutorial.chapters;
  const total = chapters.length;
  const lastSlide = total + 1; // 0=hero, 1..total=chapters, total+1=real output gallery

  const [active, setActive] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [centerTarget, setCenterTarget] = useState(0);

  const goTo = useCallback(
    (i: number) => {
      setActive(Math.max(0, Math.min(i, lastSlide)));
      setSidebarOpen(false);
    },
    [lastSlide]
  );

  const next = useCallback(() => goTo(active + 1), [active, goTo]);
  const prev = useCallback(() => goTo(active - 1), [active, goTo]);

  // Cycle through the teaching card, every module, then the chapter ending.
  // Centre each card in the visible area above the fixed bottom navigation.
  const centerContent = useCallback(() => {
    const chapter = document.querySelector<HTMLElement>('.slide-content .slide-chap');
    if (!chapter) return;
    const cards = Array.from(chapter.children).filter(
      (child): child is HTMLElement => child instanceof HTMLElement && child.matches('.analogy-card, .module')
    );
    const targetCount = cards.length + 1;
    const index = centerTarget % targetCount;
    const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    if (index === cards.length) {
      window.scrollTo({ top: maxScroll, behavior: 'smooth' });
    } else {
      const rect = cards[index].getBoundingClientRect();
      const navHeight = document.querySelector<HTMLElement>('.slide-nav')?.getBoundingClientRect().height ?? 0;
      const visibleHeight = window.innerHeight - navHeight;
      const desiredTop = window.scrollY + rect.top + rect.height / 2 - visibleHeight / 2;
      window.scrollTo({ top: Math.max(0, Math.min(desiredTop, maxScroll)), behavior: 'smooth' });
    }
    setCenterTarget((index + 1) % targetCount);
  }, [centerTarget]);

  // Reset scroll on every slide change so a long chapter always opens from the top.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    setCenterTarget(0);
  }, [active]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        next();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        prev();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev]);

  const sidebarItems = [
    { idx: 0, num: '封面', title: tutorial.meta.titleZh || tutorial.meta.titleEn },
    ...chapters.map((ch, i) => ({ idx: i + 1, num: `§${i + 1}`, title: ch.title })),
    { idx: total + 1, num: '🖼', title: '结论' },
  ];

  const currentChapter = active >= 1 && active <= total ? chapters[active - 1] : null;
  const nextCenterLabel = !currentChapter || centerTarget === 0
    ? '教学图'
    : centerTarget <= currentChapter.modules.length
      ? `模块 ${centerTarget}/${currentChapter.modules.length}`
      : '章末总结';
  const nextIsChapterEnd = Boolean(currentChapter && centerTarget === currentChapter.modules.length + 1);

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
              <ChapterBridge text={currentChapter.bridge} />
              <AnalogyCard analogy={currentChapter.analogy} chapterId={currentChapter.id} />
              {currentChapter.modules.map((m) => (
                <Module key={m.id} module={m} chapterId={currentChapter.id} />
              ))}
              <div className="chapter-outro">
                {currentChapter.insight ? <InsightBar text={currentChapter.insight} /> : null}
                {currentChapter.formula ? <Formula formula={currentChapter.formula} /> : null}
                <Takeaway items={currentChapter.takeaways} />
              </div>
            </section>
          ) : (
            <ModelGallery />
          )}
        </div>

        <div className="slide-nav">
          <button className="slide-nav-btn" onClick={prev} disabled={active === 0}>
            ← 上一页
          </button>
          {currentChapter ? (
            <button className="slide-nav-btn slide-nav-center" onClick={centerContent} title="依次居中教学图和每个模块，最后滚到本章结尾">
              {nextIsChapterEnd ? '↓ 翻到章末' : `⌖ 居中${nextCenterLabel}`}
            </button>
          ) : null}
          <span className="slide-nav-counter">
            {active + 1} / {lastSlide + 1}
          </span>
          <button
            className="slide-nav-btn slide-nav-btn-primary"
            onClick={next}
            disabled={active === lastSlide}
          >
            下一页 →
          </button>
        </div>
      </main>
    </div>
  );
}
