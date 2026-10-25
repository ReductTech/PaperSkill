import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  const [active, setActive] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const sections = useRef<(HTMLElement | null)[]>([]);

  const goTo = useCallback(
    (i: number) => {
      setSidebarOpen(false);
      sections.current[i]?.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        block: 'start',
      });
    },
    []
  );

  // Track a reading line near the top of the viewport, including within long chapters.
  // Keep every module mounted so scrolling and TOC jumps preserve exploration state.
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const readingLine = Math.min(160, window.innerHeight * 0.25);
      let current = 0;
      sections.current.forEach((section, index) => {
        if (section && section.getBoundingClientRect().top <= readingLine) current = index;
      });
      setActive(current);
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    const observer = new ResizeObserver(schedule);
    sections.current.forEach(section => {
      if (section) observer.observe(section);
    });
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    update();
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      observer.disconnect();
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [total, hasBili]);

  useEffect(() => {
    const closeDrawer = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', closeDrawer);
    return () => window.removeEventListener('keydown', closeDrawer);
  }, []);

  const sidebarItems = [
    { idx: 0, num: '封面', title: tutorial.meta.titleZh || tutorial.meta.titleEn },
    ...chapters.map((ch, i) => ({ idx: i + 1, num: `§${i + 1}`, title: ch.title })),
    ...(hasBili ? [{ idx: total + 1, num: '📺', title: '延伸视频' }] : []),
  ];

  return (
    <div className={`slide-layout reading-layout ${sidebarOpen ? 'sidebar-open' : ''} ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <button className="slide-sidebar-toggle" aria-expanded={sidebarOpen} aria-controls="reading-sidebar" onClick={() => setSidebarOpen(!sidebarOpen)}>
        <span className="slide-sidebar-toggle-icon">{sidebarOpen ? '✕' : '☰'}</span>
        目录
      </button>

      {sidebarOpen ? (
        <div className="slide-sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      ) : null}

      <aside className="slide-sidebar" id="reading-sidebar">
        <div className="slide-sidebar-header">
          <div className="slide-sidebar-venue">{tutorial.meta.venue}</div>
          <div className="slide-sidebar-title">
            {tutorial.meta.titleZh || tutorial.meta.titleEn}
          </div>
        </div>
        <nav className="slide-sidebar-nav" aria-label="论文章节目录">
          {sidebarItems.map((item) => (
            <button
              key={item.idx}
              className={`slide-sidebar-item ${active === item.idx ? 'active' : ''}`}
              aria-current={active === item.idx ? 'location' : undefined}
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
        <div className="slide-content reading-content">
          <section className="reading-section reading-cover" id="cover" aria-label="论文封面" ref={node => { sections.current[0] = node; }}>
            <Hero meta={tutorial.meta} hero={tutorial.hero} />
            <p className="reading-intro">连续阅读 · 向下滚动进入下一章，左侧目录同步标记当前位置。</p>
          </section>
          {chapters.map((chapter, index) => (
            <section className="chap slide-chap reading-section" id={chapter.id} key={chapter.id} aria-labelledby={`${chapter.id}-title`} ref={node => { sections.current[index + 1] = node; }}>
              <h2 className="chap-title" id={`${chapter.id}-title`}>
                <span className="num">§{index + 1}.</span>
                {chapter.title}
                <span className={`badge-tag ${chapter.badge}`}>
                  {chapter.badgeLabel}
                </span>
              </h2>
              <ChapterBridge text={chapter.bridge} />
              <AnalogyCard analogy={chapter.analogy} chapterId={chapter.id} />
              {chapter.modules.map((m) => (
                <Module key={m.id} module={m} chapterId={chapter.id} />
              ))}
              {chapter.insight ? <InsightBar text={chapter.insight} /> : null}
              {chapter.formula ? <Formula formula={chapter.formula} /> : null}
              <Takeaway items={chapter.takeaways} />
            </section>
          ))}
          {hasBili ? (
            <section className="reading-section" id="videos" aria-label="延伸视频" ref={node => { sections.current[total + 1] = node; }}>
              <BiliVideos items={bili} />
            </section>
          ) : null}
        </div>
      </main>
    </div>
  );
}
