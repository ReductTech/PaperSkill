import React, { useEffect, useState } from 'react';
import { tutorial } from './data/tutorial';
import { Hero } from './components/Hero';
import { ChapterBridge } from './components/ChapterBridge';
import { AnalogyCard } from './components/AnalogyCard';
import { Module } from './components/Module';
import { Formula } from './components/Formula';
import { InsightBar } from './components/InsightBar';
import { Takeaway } from './components/Takeaway';
import { BiliVideos } from './components/BiliVideos';
import { EvidencePanel } from './components/EvidencePanel';
import { useProgressiveChapters } from './lib/useProgressiveChapters';

export default function App() {
  const total = tutorial.chapters.length;
  const { revealed, begin, revealNext } = useProgressiveChapters(total);
  const bili = tutorial.bilibili || [];
  const [activeChapter, setActiveChapter] = useState(0);

  const railNotes = [
    '看懂统一系统',
    '从单视角到 3D',
    '把空间意图画出来',
    '改对，也要保住',
    '用新视角补充证据',
    '串起空间智能闭环'
  ];

  // Auto-scroll to the most recently revealed chapter so the "next chapter" button
  // lands the new section in view instead of leaving it below the fold.
  useEffect(() => {
    if (revealed < 1) return;
    const ch = tutorial.chapters[revealed - 1];
    if (!ch) return;
    const el = document.getElementById(ch.id);
    if (!el) return;
    const id = requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    return () => cancelAnimationFrame(id);
  }, [revealed]);

  useEffect(() => {
    if (revealed < 1) return;
    const visibleChapters = tutorial.chapters.slice(0, revealed);
    const observer = new IntersectionObserver(
      (entries) => {
        const candidates = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const current = candidates[0];
        if (!current) return;
        const index = visibleChapters.findIndex((chapter) => chapter.id === current.target.id);
        if (index >= 0) setActiveChapter(index);
      },
      { rootMargin: '-18% 0px -58% 0px', threshold: [0.05, 0.2, 0.5] }
    );
    visibleChapters.forEach((chapter) => {
      const element = document.getElementById(chapter.id);
      if (element) observer.observe(element);
    });
    return () => observer.disconnect();
  }, [revealed]);

  const jumpToChapter = (index: number) => {
    if (index >= revealed) return;
    const chapter = tutorial.chapters[index];
    document.getElementById(chapter.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <>
      <Hero meta={tutorial.meta} hero={tutorial.hero} onStart={begin} started={revealed > 0} />
      {revealed > 0 ? (
        <div className="learning-shell">
          <aside className="chapter-rail" aria-label="章节导航">
            <div className="rail-kicker">SPATIAL ROUTE</div>
            <div className="rail-title">空间任务导航</div>
            <div className="rail-progress-meta">
              <span>LEARNING PROGRESS</span>
              <b>{String(revealed).padStart(2, '0')} / {String(total).padStart(2, '0')}</b>
            </div>
            <div className="rail-progress-track" aria-hidden="true">
              <span style={{ width: `${(revealed / total) * 100}%` }} />
            </div>
            <nav className="rail-list">
              {tutorial.chapters.map((chapter, index) => {
                const unlocked = index < revealed;
                const active = unlocked && index === activeChapter;
                return (
                  <button
                    type="button"
                    key={chapter.id}
                    className={`rail-item ${active ? 'active' : ''} ${unlocked ? 'unlocked' : 'locked'} task-${chapter.badge}`}
                    onClick={() => jumpToChapter(index)}
                    disabled={!unlocked}
                    aria-current={active ? 'step' : undefined}
                  >
                    <span className="rail-index">{String(index + 1).padStart(2, '0')}</span>
                    <span className="rail-copy">
                      <span className="rail-chapter-title">{chapter.title.split('：')[0]}</span>
                      <span className="rail-note">{unlocked ? railNotes[index] : '尚未解锁'}</span>
                    </span>
                  </button>
                );
              })}
            </nav>
          </aside>
          <main className="learning-content">
            {tutorial.chapters.map((ch, idx) => {
          const isVisible = revealed >= idx + 1;
          if (!isVisible) return null;
          const nextNum = idx + 2;
          const isLast = idx === total - 1;
          return (
            <section className="chap" id={ch.id} key={ch.id}>
              <h2 className="chap-title">
                <span className="num">§{idx + 1}.</span>
                {ch.title}
                <span className={`badge-tag ${ch.badge}`}>{ch.badgeLabel}</span>
              </h2>
              <ChapterBridge text={ch.bridge} chapterId={ch.id} />
              <EvidencePanel chapterIndex={idx} mode="inline" />
              {ch.analogy ? <AnalogyCard analogy={ch.analogy} chapterId={ch.id} /> : null}
              {ch.modules.map((m) => (
                <Module key={m.id} module={m} chapterId={ch.id} />
              ))}
              {ch.insight ? <InsightBar text={ch.insight} /> : null}
              {ch.formula ? <Formula formula={ch.formula} /> : null}
              <Takeaway items={ch.takeaways} chapterId={ch.id} />
              {idx === revealed - 1 && !isLast ? (
                <div className="chap-loader">
                  <div className="chap-loader-hint" />
                  <button className="chap-loader-btn" onClick={revealNext}>
                    继续学习 §{nextNum} <span className="chap-loader-arrow">→</span>
                  </button>
                </div>
              ) : isLast ? (
                // End of the last chapter: append Bilibili recommendations here when present.
                bili.length > 0 ? <BiliVideos items={bili} /> : null
              ) : null}
            </section>
          );
            })}
          </main>
          <EvidencePanel chapterIndex={activeChapter} mode="side" />
        </div>
      ) : null}
    </>
  );
}
