import React, { useState, useEffect, useCallback } from 'react';
import { tutorial } from './data/tutorial';
import { ChapterBridge } from './components/ChapterBridge';
import { AnalogyCard } from './components/AnalogyCard';
import { Module } from './components/Module';
import { InsightBar } from './components/InsightBar';
import { TechnicalDetails } from './components/TechnicalDetails';
import { BiliVideos } from './components/BiliVideos';
import { OverloadedEngine } from './modules/OverloadedEngine';
import { MechanicalMuseum } from './modules/MechanicalMuseum';
import { DeltaWAutopsy } from './modules/DeltaWAutopsy';
import { LowRankLab } from './modules/LowRankLab';
import { FreezeAndTrain } from './modules/FreezeAndTrain';
import { RankRoulette } from './modules/RankRoulette';
import { TransformerSurgery } from './modules/TransformerSurgery';
import { PerformanceArena } from './modules/PerformanceArena';
import { MergeRoom } from './modules/MergeRoom';
import { LowRankAbyss } from './modules/LowRankAbyss';
import { TaskCartridgeVault } from './modules/TaskCartridgeVault';
import { EngineersVerdict } from './modules/EngineersVerdict';
import { VictorianCover } from './modules/VictorianCover';

export default function App() {
  const chapters = tutorial.chapters;
  const total = chapters.length;
  const bili = tutorial.bilibili || [];
  const hasBili = bili.length > 0;
  const vaultSlide = total + 1;
  const finalReviewSlide = total + 2;
  const biliSlide = total + 3;
  const lastSlide = finalReviewSlide + (hasBili ? 1 : 0);

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
    { idx: vaultSlide, num: '§11', title: 'ACT 10 — Task Cartridge Vault' },
    { idx: finalReviewSlide, num: '§12', title: 'Final Review' },
    ...(hasBili ? [{ idx: biliSlide, num: '📺', title: '延伸视频' }] : []),
  ];

  const currentChapter = active >= 1 && active <= total ? chapters[active - 1] : null;

  return (
    <div className={`slide-layout ${sidebarOpen ? 'sidebar-open' : ''} ${sidebarCollapsed ? 'sidebar-collapsed' : ''} ${active === 0 ? 'cover-mode' : ''} ${active === 1 ? 'act0-mode' : ''} ${active === 2 ? 'act1-mode' : ''} ${active === 3 ? 'act2-mode' : ''} ${active === 4 ? 'act3-mode' : ''} ${active === 5 ? 'act4-mode' : ''} ${active === 6 ? 'act5-mode' : ''} ${active === 7 ? 'act6-mode' : ''} ${active === 8 ? 'act7-mode' : ''} ${active === 9 ? 'act8-mode' : ''} ${active === 10 ? 'act9-mode' : ''} ${active === vaultSlide ? 'act10-mode' : ''} ${active === finalReviewSlide ? 'final-review-mode' : ''}`}>
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
            <VictorianCover />
          ) : currentChapter?.id === 'chap-1' ? (
            <OverloadedEngine onNext={next} />
          ) : currentChapter?.id === 'chap-2' ? (
            <MechanicalMuseum onNext={next} />
          ) : currentChapter?.id === 'chap-3' ? (
            <DeltaWAutopsy onNext={next} />
          ) : currentChapter?.id === 'chap-4' ? (
            <LowRankLab onNext={next} />
          ) : currentChapter?.id === 'chap-5' ? (
            <FreezeAndTrain onNext={next} />
          ) : currentChapter?.id === 'chap-6' ? (
            <RankRoulette onNext={next} />
          ) : currentChapter?.id === 'chap-7' ? (
            <TransformerSurgery onNext={next} />
          ) : currentChapter?.id === 'chap-8' ? (
            <PerformanceArena onNext={next} />
          ) : currentChapter?.id === 'chap-9' ? (
            <MergeRoom onNext={next} />
          ) : currentChapter?.id === 'chap-10' ? (
            <LowRankAbyss onNext={next} />
          ) : active === vaultSlide ? (
            <TaskCartridgeVault onNext={next} />
          ) : active === finalReviewSlide ? (
            <EngineersVerdict />
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
              <TechnicalDetails
                formula={currentChapter.formula}
                details={currentChapter.takeaways}
              />
            </section>
          ) : hasBili && active === biliSlide ? (
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
