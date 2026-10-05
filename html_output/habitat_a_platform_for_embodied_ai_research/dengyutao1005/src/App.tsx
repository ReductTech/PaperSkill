import React, { useState, useEffect, useCallback } from 'react';
import { tutorial, quizData, comicData } from './data/tutorial';
import { figureData } from './data/figureData';
import { Hero } from './components/Hero';
import { ChapterBridge } from './components/ChapterBridge';
import { AnalogyCard } from './components/AnalogyCard';
import { Module } from './components/Module';
import { Formula } from './components/Formula';
import { InsightBar } from './components/InsightBar';
import { Takeaway } from './components/Takeaway';
import { BiliVideos } from './components/BiliVideos';
import { Quiz } from './components/Quiz';
import { ComicViewer } from './components/ComicViewer';
import { SymbolCard } from './components/SymbolCard';
import { FigureGallery } from './components/FigureGallery';
import { FigureButton } from './components/FigureButton';

export default function App() {
  const chapters = tutorial.chapters;
  const total = chapters.length;
  const bili = tutorial.bilibili || [];
  const hasBili = bili.length > 0;
  // 0=hero, 1..total=chapters, total+1=gallery, total+2=symbols, total+3=bili
  const galIdx = total + 1;
  const symIdx = total + 2;
  const biliIdx = total + 3;
  const lastSlide = biliIdx + (hasBili ? 0 : -1);

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
    ...chapters.map((ch, i) => ({ idx: i + 1, num: `§${i + 1}`, title: ch.title })),
    { idx: galIdx, num: '📚', title: '图表库' },
    { idx: symIdx, num: '∑', title: '符号概念' },
    ...(hasBili ? [{ idx: biliIdx, num: '📺', title: '延伸视频' }] : []),
  ];

  const currentChapter = active >= 1 && active <= total ? chapters[active - 1] : null;
  const chapterQuizzes = currentChapter
    ? quizData.filter((q) => q.chapterId === currentChapter.id)
    : [];
  const chapterComics = currentChapter
    ? comicData.filter((c) => c.chapterId === currentChapter.id)
    : [];
  const chapterFigures = currentChapter
    ? figureData.filter((f) => f.chapter === active)
    : [];

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
              {currentChapter.insight ? <InsightBar text={currentChapter.insight} /> : null}
              {currentChapter.formula ? <Formula formula={currentChapter.formula} /> : null}
              <Takeaway items={currentChapter.takeaways} />
              {chapterComics.length > 0 ? <ComicViewer comics={chapterComics} /> : null}
              {chapterFigures.length > 0 ? (
                <div className="chapter-figrefs">
                  <h4 className="figrefs-heading">📎 本章图表</h4>
                  <div className="figrefs-list">
                    {chapterFigures.map((f) => (
                      <FigureButton key={f.id} id={f.id} />
                    ))}
                  </div>
                </div>
              ) : null}
              {chapterQuizzes.length > 0 ? (
                <div className="chapter-quizzes">
                  <h3 className="quizzes-heading">📝 本章测验</h3>
                  {chapterQuizzes.map((qz) => (
                    <Quiz key={qz.id} quiz={qz} />
                  ))}
                </div>
              ) : null}
            </section>
          ) : active === galIdx ? (
            <FigureGallery />
          ) : active === symIdx ? (
            <section className="slide-chap">
              <h2 className="chap-title">
                <span className="num">∑</span> 符号概念
              </h2>
              <p className="gallery-intro">
                论文 §4–§5 的核心记号，逐个点开查看论文定义、直觉解释与出处（A4 全量表）。
              </p>
              <SymbolCard />
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
