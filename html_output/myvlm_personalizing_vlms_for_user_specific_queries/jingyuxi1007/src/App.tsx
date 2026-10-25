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

function slideFromHash(lastSlide: number) {
  const hash = window.location.hash;
  const match = /^#chap-(\d+)$/.exec(hash);
  const index = match ? Number(match[1]) : 0;
  return index >= 1 && index <= tutorial.chapters.length ? index :
    hash === '#videos' && lastSlide > tutorial.chapters.length ? lastSlide : 0;
}

export default function App() {
  const chapters = tutorial.chapters;
  const total = chapters.length;
  const bili = tutorial.bilibili || [];
  const hasBili = bili.length > 0;
  const lastSlide = total + (hasBili ? 1 : 0); // 0=hero, 1..total=chapters, total+1=bili

  const [active, setActive] = useState(() => slideFromHash(lastSlide));
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const goTo = useCallback(
    (i: number) => {
      const index = Math.max(0, Math.min(i, lastSlide));
      setActive(index);
      setSidebarOpen(false);
      const hash = index === 0 ? '#cover' : index <= total ? `#chap-${index}` : '#videos';
      if (window.location.hash !== hash) window.location.hash = hash;
    },
    [lastSlide, total]
  );

  const next = useCallback(() => goTo(active + 1), [active, goTo]);
  const prev = useCallback(() => goTo(active - 1), [active, goTo]);

  useEffect(() => {
    const syncHash = () => {
      const index = slideFromHash(lastSlide);
      setActive(index);
      setSidebarOpen(false);
      const expected = index === 0 ? '#cover' : index <= total ? `#chap-${index}` : '#videos';
      if (window.location.hash !== expected) window.history.replaceState(window.history.state, '', expected);
    };
    syncHash();
    window.addEventListener('hashchange', syncHash);
    return () => window.removeEventListener('hashchange', syncHash);
  }, [lastSlide, total]);

  useEffect(() => {
    if (active > lastSlide) goTo(lastSlide);
  }, [active, lastSlide, goTo]);

  // Reset scroll on every slide change so a long chapter always opens from the top.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [active]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || (e.target instanceof Element &&
          e.target.closest('button, a, input, select, textarea, summary, [contenteditable], [tabindex]'))) return;
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

  const sidebarItems = [
    { idx: 0, num: '封面', title: tutorial.meta.titleZh || tutorial.meta.titleEn },
    ...chapters.map((ch, i) => ({ idx: i + 1, num: `§${i + 1}`, title: ch.title })),
    ...(hasBili ? [{ idx: total + 1, num: '📺', title: '延伸视频' }] : []),
  ];

  const currentChapter = active >= 1 && active <= total ? chapters[active - 1] : null;

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
              title={item.title}
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
        <div className="slide-content" id={active === 0 ? 'cover' : undefined} key={active}>
          {active === 0 ? (
            <Hero meta={tutorial.meta} hero={tutorial.hero} />
          ) : currentChapter ? (
            <section className="chap slide-chap" id={currentChapter.id}>
              <h2 className="chap-title">
                <span className="num">§{active}.</span>
                {currentChapter.title}
                <span className={`badge-tag ${currentChapter.badge}`}>
                  {currentChapter.badgeLabel}
                </span>
              </h2>
              {currentChapter.bridge ? <ChapterBridge text={currentChapter.bridge} /> : null}
              {currentChapter.analogy.text ? (
                <AnalogyCard analogy={currentChapter.analogy} chapterId={currentChapter.id} />
              ) : null}
              {currentChapter.modules.map((m) => (
                <Module key={m.id} module={m} chapterId={currentChapter.id} />
              ))}
              {currentChapter.insight ? <InsightBar text={currentChapter.insight} /> : null}
              {currentChapter.formula ? <Formula formula={currentChapter.formula} /> : null}
              {currentChapter.takeaways.length > 0 ? <Takeaway items={currentChapter.takeaways} /> : null}
            </section>
          ) : hasBili ? (
            <BiliVideos items={bili} />
          ) : null}
        </div>

        <div className={`slide-nav ${active === 0 ? 'slide-nav-cover' : ''}`}>
          {active !== 0 ? (
            <>
              <div className="mv-progress" role="progressbar" aria-label="章节阅读进度" aria-valuemin={0} aria-valuemax={total} aria-valuenow={Math.min(active, total)}>
                <span style={{ width: `${Math.min(active, total) / total * 100}%` }} />
              </div>
              <button className="slide-nav-btn" onClick={prev}>
                ← 上一章
              </button>
              <span className="slide-nav-counter">
                {Math.min(active, total)} / {total}
              </span>
            </>
          ) : null}
          <button
            className="slide-nav-btn slide-nav-btn-primary"
            onClick={next}
            disabled={active === lastSlide}
          >
            {active === 0 ? '开始学习 →' : '下一章 →'}
          </button>
        </div>
      </main>
    </div>
  );
}
