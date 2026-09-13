import React, { useState, useEffect, useCallback } from 'react';
import { tutorial } from './data/tutorial';
import { Hero } from './components/Hero';
import { PrerequisiteMap } from './components/PrerequisiteMap';
import { ChapterBridge } from './components/ChapterBridge';
import { AnalogyCard } from './components/AnalogyCard';
import { Module } from './components/Module';
import { Formula } from './components/Formula';
import { InsightBar } from './components/InsightBar';
import { Takeaway } from './components/Takeaway';
import { ChapterQuiz } from './components/ChapterQuiz';
import { Closing } from './components/Closing';
import { BiliVideos } from './components/BiliVideos';

export default function App() {
  const chapters = tutorial.chapters;
  const total = chapters.length;
  const prereq = tutorial.prerequisites || [];
  const hasPrereq = prereq.length > 0;
  const bili = tutorial.bilibili || [];
  const hasBili = bili.length > 0;
  const hasClosing = Boolean(tutorial.closing);

  // Slide layout: 0 = hero, [1 = prerequisites], chapters..., [closing], [bili].
  const chapterStart = 1 + (hasPrereq ? 1 : 0);
  const closingSlide = chapterStart + total;
  const biliSlide = closingSlide + (hasClosing ? 1 : 0);
  const lastSlide = hasBili
    ? biliSlide
    : hasClosing
      ? closingSlide
      : chapterStart + total - 1;

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
    window.scrollTo({ top: 0, behavior: 'instant' });
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
    ...(hasPrereq ? [{ idx: 1, num: '前置', title: '开始之前：几个必要概念' }] : []),
    ...chapters.map((ch, i) => ({ idx: chapterStart + i, num: `§${i + 1}`, title: ch.title })),
    ...(hasClosing ? [{ idx: closingSlide, num: '结语', title: tutorial.closing.title }] : []),
    ...(hasBili ? [{ idx: biliSlide, num: '📺', title: '延伸视频' }] : []),
  ];

  const chapterIndex = active - chapterStart;
  const currentChapter =
    chapterIndex >= 0 && chapterIndex < total ? chapters[chapterIndex] : null;

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
          ) : hasPrereq && active === 1 ? (
            <PrerequisiteMap items={prereq} />
          ) : currentChapter ? (
            <section className="chap slide-chap">
              <h2 className="chap-title">
                <span className="num">§{chapterIndex + 1}.</span>
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
              <ChapterQuiz quiz={currentChapter.quiz} />
            </section>
          ) : hasClosing && active === closingSlide ? (
            <Closing closing={tutorial.closing} />
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
