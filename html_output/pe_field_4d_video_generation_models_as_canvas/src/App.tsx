import React, { useCallback, useEffect } from 'react';
import { tutorial } from './data/tutorial';
import { Hero } from './components/Hero';
import { ChapterBridge } from './components/ChapterBridge';
import { AnalogyCard } from './components/AnalogyCard';
import { Module } from './components/Module';
import { Formula } from './components/Formula';
import { InsightBar } from './components/InsightBar';
import { Takeaway } from './components/Takeaway';
import { BiliVideos } from './components/BiliVideos';
import { ChapterToc } from './modules/chapter-toc';
import { useProgressiveChapters } from './lib/useProgressiveChapters';

export default function App() {
  const total = tutorial.chapters.length;
  const { revealed, begin, revealNext } = useProgressiveChapters(total);
  const bili = tutorial.bilibili || [];

  const navigateToChapter = useCallback(
    (index: number) => {
      const chapter = tutorial.chapters[index];
      if (!chapter) return;
      const targetCount = index + 1;
      if (targetCount > revealed) {
        for (let count = revealed; count < targetCount; count += 1) {
          revealNext();
        }
        return;
      }
      document.getElementById(chapter.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },
    [revealed, revealNext],
  );

  // Auto-scroll to the most recently revealed chapter so the "next chapter" button
  // lands the new section in view instead of leaving it below the fold.
  useEffect(() => {
    if (revealed < 1) return;
    const ch = tutorial.chapters[revealed - 1];
    if (!ch) return;
    const el = document.getElementById(ch.id);
    if (!el) return;
    let settleFrame = 0;
    let settleTimer = 0;
    const scrollToChapter = () => el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const id = requestAnimationFrame(() => {
      scrollToChapter();
      settleFrame = requestAnimationFrame(scrollToChapter);
      // Newly revealed local figures can change the document height after the
      // first frame. Re-align once after that layout settles.
      settleTimer = window.setTimeout(scrollToChapter, 400);
    });
    return () => {
      cancelAnimationFrame(id);
      cancelAnimationFrame(settleFrame);
      window.clearTimeout(settleTimer);
    };
  }, [revealed]);

  return (
    <>
      <Hero meta={tutorial.meta} hero={tutorial.hero} onStart={begin} started={revealed > 0} />
      <div className="tutorial-layout">
        {revealed > 0 ? (
          <ChapterToc chapters={tutorial.chapters} revealed={revealed} onNavigate={navigateToChapter} />
        ) : null}
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
                <ChapterBridge text={ch.bridge} />
                {ch.analogy.title || ch.analogy.text || ch.analogy.componentId || ch.analogy.figure ? (
                  <AnalogyCard analogy={ch.analogy} chapterId={ch.id} />
                ) : null}
                {ch.modules.map((m) => (
                  <Module key={m.id} module={m} chapterId={ch.id} />
                ))}
                {ch.insight ? <InsightBar text={ch.insight} /> : null}
                {ch.formula ? <Formula formula={ch.formula} /> : null}
                {ch.takeaways.length > 0 ? <Takeaway items={ch.takeaways} /> : null}
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
      </div>
    </>
  );
}
