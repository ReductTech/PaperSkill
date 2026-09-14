import React, { useState, useEffect, useCallback } from 'react';
import { tutorial } from './data/tutorial';
import { Hero } from './components/Hero';
import { Module } from './components/Module';
import { BiliVideos } from './components/BiliVideos';
import { ReviewWall } from './modules/ReviewWall';
import { Soundtrack } from './components/Soundtrack';

export type NarrativePhase = 'opening' | 'investigation' | 'reveal' | 'comedy' | 'review';

export default function App() {
  const chapters = tutorial.chapters;
  const total = chapters.length;
  const bili = tutorial.bilibili || [];
  const hasBili = bili.length > 0;
  const reviewSlide = total + 1;
  const biliSlide = reviewSlide + 1;
  const lastSlide = reviewSlide + (hasBili ? 1 : 0); // 0=hero, 1..total=chapters, then review, then bili

  const [active, setActive] = useState(0);
  const [narrativePhase, setNarrativePhase] = useState<NarrativePhase>('opening');
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
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        next();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prev();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev]);

  useEffect(() => {
    const onContinue = () => next();
    window.addEventListener('lary-next-slide', onContinue);
    return () => window.removeEventListener('lary-next-slide', onContinue);
  }, [next]);

  useEffect(() => {
    if (active === 0) setNarrativePhase('opening');
    else if (active === reviewSlide) setNarrativePhase('review');
    else if (active >= 7 && active <= total) setNarrativePhase('reveal');
    else setNarrativePhase('investigation');
  }, [active, reviewSlide, total]);

  useEffect(() => {
    const revealTruth = () => setNarrativePhase('comedy');
    window.addEventListener('lary-truth-revealed', revealTruth);
    return () => window.removeEventListener('lary-truth-revealed', revealTruth);
  }, []);

  const sidebarItems = [
    { idx: 0, num: '封面', title: tutorial.meta.titleZh || tutorial.meta.titleEn },
    ...chapters.map((ch, i) => ({ idx: i + 1, num: `§${i + 1}`, title: ch.title })),
    { idx: reviewSlide, num: '复盘', title: '档案墙：还原论文逻辑链' },
    ...(hasBili ? [{ idx: biliSlide, num: '📺', title: '延伸视频' }] : []),
  ];

  const currentChapter = active >= 1 && active <= total ? chapters[active - 1] : null;

  return (
    <div className={`slide-layout ${sidebarOpen ? 'sidebar-open' : ''} ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <Soundtrack phase={narrativePhase} />
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
              {currentChapter.modules
                .filter((m) => m.componentId !== 'mod-1-1')
                .slice(0, 1)
                .map((m) => (
                <Module key={m.id} module={m} chapterId={currentChapter.id} />
              ))}
            </section>
          ) : active === reviewSlide ? (
            <ReviewWall />
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
          {active > reviewSlide ? (
            <button
              className="slide-nav-btn slide-nav-btn-primary"
              onClick={next}
              disabled={active === lastSlide}
            >
              下一页 →
            </button>
          ) : <span className="slide-nav-placeholder" />}
        </div>
      </main>
    </div>
  );
}
