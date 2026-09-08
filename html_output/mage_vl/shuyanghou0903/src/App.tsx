import React, { useEffect } from 'react';
import { tutorial } from './data/tutorial';
import { Hero } from './components/Hero';
import { FlowMini } from './components/FlowMini';
import { ChapterBridge } from './components/ChapterBridge';
import { AnalogyCard } from './components/AnalogyCard';
import { Module } from './components/Module';
import { Formula } from './components/Formula';
import { InsightBar } from './components/InsightBar';
import { Takeaway } from './components/Takeaway';
import { BiliVideos } from './components/BiliVideos';
import { useProgressiveChapters } from './lib/useProgressiveChapters';

export default function App() {
  const total = tutorial.chapters.length;
  const { revealed, begin, revealNext } = useProgressiveChapters(total);
  const bili = tutorial.bilibili || [];

  // Auto-scroll to the most recently revealed chapter so the "next chapter" button
  // lands the new section in view instead of leaving it below the fold.
  useEffect(() => {
    if (revealed < 1) return;
    const ch = tutorial.chapters[revealed - 1];
    if (!ch) return;
    const el = document.getElementById(ch.id);
    if (!el) return;
    const id = requestAnimationFrame(() => {
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      el.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
    });
    return () => cancelAnimationFrame(id);
  }, [revealed]);

  return (
    <>
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
              {ch.modules.map((m) => (
                <Module key={m.id} module={m} chapterId={ch.id} />
              ))}
              {ch.insight ? <InsightBar text={ch.insight} /> : null}
              {ch.formula ? <Formula formula={ch.formula} /> : null}
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
      </main>
    </>
  );
}
