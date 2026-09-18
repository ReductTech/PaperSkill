import React, { useState, useEffect, useCallback } from 'react';
import { tutorial } from './data/tutorial';
import { Hero } from './components/Hero';
import { PipelineOverview } from './components/PipelineOverview';
import { ReadingJourney } from './components/ReadingJourney';
import type { JourneyStage } from './components/ReadingJourney';
import { ChapterBridge } from './components/ChapterBridge';
import { AnalogyCard } from './components/AnalogyCard';
import { Module } from './components/Module';
import { Formula } from './components/Formula';
import { InsightBar } from './components/InsightBar';
import { Takeaway } from './components/Takeaway';
import { BiliVideos } from './components/BiliVideos';

interface TocItem {
  id: string;
  num: string;
  title: string;
}

// 连续阅读版式：单页纵向流动（封面 → §1–§10 → 延伸视频），
// 章节间以中轴连线衔接，顶部提供进度、当前章节与抽屉目录。
export default function App() {
  const chapters = tutorial.chapters;
  const bili = tutorial.bilibili || [];
  const hasBili = bili.length > 0;

  const [tocOpen, setTocOpen] = useState(false);
  const [activeId, setActiveId] = useState('cover');
  const [progress, setProgress] = useState(0);
  const [showTop, setShowTop] = useState(false);

  const tocItems: TocItem[] = [
    { id: 'cover', num: '封面', title: tutorial.meta.titleZh || tutorial.meta.titleEn },
    { id: 'pipeline', num: '总览', title: '一张图理解全文' },
    ...chapters.map((ch, i) => ({ id: `chap-${i + 1}`, num: `§${i + 1}`, title: ch.title })),
    ...(hasBili ? [{ id: 'videos', num: '📺', title: '延伸视频' }] : []),
  ];

  // 阅读进度与回到顶部
  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0);
      setShowTop(window.scrollY > 640);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // 当前章节探测
  useEffect(() => {
    const ids = [
      'cover',
      'pipeline',
      ...chapters.map((_, i) => `chap-${i + 1}`),
      ...(hasBili ? ['videos'] : []),
    ];
    const els = ids
      .map((id) => document.getElementById(id))
      .filter((e): e is HTMLElement => e !== null);
    if (els.length === 0 || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: '-18% 0px -62% 0px', threshold: [0, 0.2] }
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [chapters, hasBili]);

  // Esc 关闭目录
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setTocOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const goTo = useCallback((id: string) => {
    setTocOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const activeItem = tocItems.find((t) => t.id === activeId) || tocItems[0];

  // 论文阅读六阶段（辅助导航）：与章节滚动探测联动，点击仅跳转，不改变正文。
  const journeyStages: JourneyStage[] = [
    { id: 'problem', label: '问题', target: 'cover' },
    { id: 'scaling', label: '缩放律', target: 'chap-3' },
    { id: 'architecture', label: '架构', target: 'chap-5' },
    { id: 'distillation', label: '蒸馏', target: 'chap-9' },
    { id: 'evaluation', label: '评估', target: 'chap-10' },
    { id: 'conclusion', label: '结论', target: hasBili ? 'videos' : 'chap-10' },
  ];

  const stageOf = (sectionId: string): number => {
    if (sectionId === 'videos') return 5;
    if (sectionId.startsWith('chap-')) {
      const num = Number(sectionId.slice(5));
      if (num <= 2) return 0;
      if (num <= 4) return 1;
      if (num <= 8) return 2;
      if (num === 9) return 3;
      return 4;
    }
    return 0;
  };
  const activeStage = stageOf(activeId);

  return (
    <div className={`reading-layout${tocOpen ? ' toc-open' : ''}`}>
      <div className="reading-progress" aria-hidden="true">
        <div className="reading-progress-fill" style={{ width: `${(progress * 100).toFixed(2)}%` }} />
      </div>

      <header className="reading-topbar">
        <div className="reading-topbar-row">
          <button
            className="reading-toc-btn"
            onClick={() => setTocOpen((v) => !v)}
            aria-expanded={tocOpen}
            aria-label="打开目录"
          >
            <span className="reading-toc-icon">{tocOpen ? '✕' : '☰'}</span> 目录
          </button>
          <div className="reading-topbar-center">
            <span className="reading-topbar-num">{activeItem.num}</span>
            <span className="reading-topbar-title">{activeItem.title}</span>
          </div>
          <span className="reading-topbar-venue">{tutorial.meta.venue}</span>
        </div>
        <ReadingJourney stages={journeyStages} active={activeStage} onJump={goTo} />
      </header>

      {tocOpen ? <div className="reading-toc-overlay" onClick={() => setTocOpen(false)} /> : null}
      <aside className="reading-toc" aria-hidden={!tocOpen}>
        <div className="reading-toc-head">
          <div className="reading-toc-venue">{tutorial.meta.venue}</div>
          <div className="reading-toc-title">{tutorial.meta.titleZh || tutorial.meta.titleEn}</div>
        </div>
        <nav className="reading-toc-nav">
          {tocItems.map((item) => (
            <button
              key={item.id}
              className={`reading-toc-item${activeId === item.id ? ' active' : ''}`}
              onClick={() => goTo(item.id)}
            >
              <span className="reading-toc-num">{item.num}</span>
              <span className="reading-toc-text">{item.title}</span>
            </button>
          ))}
        </nav>
      </aside>

      <main className="reading-main">
        <div id="cover" className="reading-cover">
          <Hero meta={tutorial.meta} hero={tutorial.hero} />
        </div>

        <PipelineOverview />

        <div className="reading-thread">
          {chapters.map((ch, i) => {
            const nextChap = i + 2 <= chapters.length ? `chap-${i + 2}` : null;
            const nextLabel = nextChap
              ? `下一节：${chapters[i + 1].title}`
              : hasBili
              ? '继续观看：延伸视频'
              : '回到顶部';
            return (
              <React.Fragment key={ch.id}>
                <div className="chap-join" aria-hidden="true">
                  <span className="chap-join-line" />
                  <span className="chap-join-dot">§{i + 1}</span>
                </div>
                <section className="chap scroll-chap" id={`chap-${i + 1}`}>
                  <h2 className="chap-title">
                    <span className="num">§{i + 1}.</span>
                    {ch.title}
                    <span className={`badge-tag ${ch.badge}`}>{ch.badgeLabel}</span>
                  </h2>
                  <ChapterBridge text={ch.bridge} />
                  <AnalogyCard analogy={ch.analogy} chapterId={ch.id} />
                  {ch.modules.map((m) => (
                    <Module key={m.id} module={m} chapterId={ch.id} />
                  ))}
                  {ch.insight ? <InsightBar text={ch.insight} /> : null}
                  {ch.formula ? <Formula formula={ch.formula} /> : null}
                  <Takeaway items={ch.takeaways} />
                  <button
                    className="chap-next"
                    onClick={() => goTo(nextChap || (hasBili ? 'videos' : 'cover'))}
                  >
                    {nextLabel}
                    <span className="chap-next-arrow">↓</span>
                  </button>
                </section>
              </React.Fragment>
            );
          })}

          {hasBili ? (
            <React.Fragment>
              <div className="chap-join" aria-hidden="true">
                <span className="chap-join-line" />
                <span className="chap-join-dot">📺</span>
              </div>
              <section className="scroll-bili" id="videos">
                <BiliVideos items={bili} />
              </section>
            </React.Fragment>
          ) : null}
        </div>
      </main>

      <button
        className={`reading-backtop${showTop ? ' visible' : ''}`}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        ↑ 回到顶部
      </button>
    </div>
  );
}
