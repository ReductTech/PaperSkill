import React, { useCallback, useEffect, useState } from 'react';
import { tutorial } from './data/tutorial';
import { Hero } from './components/Hero';
import { DefenseNav } from './components/DefenseNav';
import { DefenseConclusion } from './components/DefenseConclusion';
import { FlowMini } from './components/FlowMini';
import { ChapterBridge } from './components/ChapterBridge';
import { AnalogyCard } from './components/AnalogyCard';
import { Module } from './components/Module';
import { InsightBar } from './components/InsightBar';
import { Takeaway } from './components/Takeaway';
import { BiliVideos } from './components/BiliVideos';
import { useProgressiveChapters } from './lib/useProgressiveChapters';

export default function App() {
  const total = tutorial.chapters.length;
  const { revealed, begin, revealNext, revealThrough } = useProgressiveChapters(total);
  const bili = tutorial.bilibili || [];
  const [activeId, setActiveId] = useState('overview');
  const [pendingChapterId, setPendingChapterId] = useState<string | null>(null);
  const [navCollapsed, setNavCollapsed] = useState(false);

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

  // Large canvas modules establish their height just after mounting. Re-align a
  // direct navigation target briefly so those layout shifts cannot push it away.
  useEffect(() => {
    if (!pendingChapterId) return;
    const isConclusion = pendingChapterId === 'defense-conclusion';
    const chapterIndex = tutorial.chapters.findIndex((chapter) => chapter.id === pendingChapterId);
    const requiredRevealed = isConclusion ? total : chapterIndex + 1;
    if ((!isConclusion && chapterIndex < 0) || revealed < requiredRevealed) return;

    const delays = [0, 120, 300, 600, 1000, 1600];
    const timers = delays.map((delay, index) =>
      window.setTimeout(() => {
        document.getElementById(pendingChapterId)?.scrollIntoView({ behavior: 'auto', block: 'start' });
        if (index === delays.length - 1) setPendingChapterId(null);
      }, delay)
    );
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [pendingChapterId, revealed, total]);

  useEffect(() => {
    let frame = 0;
    const updateActiveChapter = () => {
      frame = 0;
      const marker = Math.min(220, window.innerHeight * 0.28);
      let nextId = 'overview';

      for (let index = 0; index < revealed; index += 1) {
        const chapter = tutorial.chapters[index];
        const element = document.getElementById(chapter.id);
        if (!element) continue;
        if (element.getBoundingClientRect().top <= marker) nextId = chapter.id;
        else break;
      }

      const conclusion = document.getElementById('defense-conclusion');
      const isAtPageEnd = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4;
      if (conclusion && (conclusion.getBoundingClientRect().top <= marker || isAtPageEnd)) {
        nextId = 'conclusion';
      }

      setActiveId((current) => (current === nextId ? current : nextId));
    };
    const scheduleUpdate = () => {
      if (frame) return;
      frame = requestAnimationFrame(updateActiveChapter);
    };

    updateActiveChapter();
    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
    };
  }, [revealed]);

  const navigateTo = useCallback(
    (chapterIndex: number | null) => {
      if (chapterIndex === null) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      const chapter = tutorial.chapters[chapterIndex];
      if (!chapter) return;
      if (chapterIndex >= revealed) {
        setPendingChapterId(chapter.id);
        revealThrough(chapterIndex + 1);
        return;
      }
      document.getElementById(chapter.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },
    [revealed, revealThrough]
  );

  const navigateToConclusion = useCallback(() => {
    if (revealed < total) {
      setPendingChapterId('defense-conclusion');
      revealThrough(total);
      return;
    }
    document.getElementById('defense-conclusion')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [revealed, revealThrough, total]);

  return (
    <div className={`defense-shell${navCollapsed ? ' is-nav-collapsed' : ''}`}>
      <DefenseNav
        chapters={tutorial.chapters}
        activeId={activeId}
        revealed={revealed}
        collapsed={navCollapsed}
        onNavigate={navigateTo}
        onConclusion={navigateToConclusion}
        onToggle={() => setNavCollapsed((collapsed) => !collapsed)}
      />
      <div className="defense-content">
        <Hero meta={tutorial.meta} hero={tutorial.hero} onStart={begin} started={revealed > 0} />
        <main>
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
              <FlowMini total={total} revealed={revealed} />
              <ChapterBridge text={ch.bridge} />
              <AnalogyCard analogy={ch.analogy} chapterId={ch.id} />
              {ch.modules.map((m) => {
                const formula = m.formula ?? (ch.formulaModuleId === m.id ? ch.formula : undefined);
                return <Module key={m.id} module={m} chapterId={ch.id} formula={formula} />;
              })}
              {ch.insight ? <InsightBar text={ch.insight} /> : null}
              <Takeaway items={ch.takeaways} />
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
        {revealed === total ? <DefenseConclusion /> : null}
        </main>
      </div>
    </div>
  );
}
