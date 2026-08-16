import React, { useEffect } from 'react';
import { tutorial } from './data/tutorial';
import { Hero } from './components/Hero';
import { ChapterBridge } from './components/ChapterBridge';
import { Module } from './components/Module';
import { InsightBar } from './components/InsightBar';
import { BiliVideos } from './components/BiliVideos';
import { useProgressiveChapters } from './lib/useProgressiveChapters';

export default function App() {
  const chapterTotal = tutorial.chapters.length;
  const pageTotal = chapterTotal + 1;
  const { revealed, begin, revealNext } = useProgressiveChapters(chapterTotal);
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
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    return () => cancelAnimationFrame(id);
  }, [revealed]);

  return (
    <>
      <Hero meta={tutorial.meta} hero={tutorial.hero} onStart={begin} started={revealed > 0} pageTotal={pageTotal} />
      <main>
        {tutorial.chapters.map((ch, idx) => {
          const isVisible = revealed >= idx + 1;
          if (!isVisible) return null;
          const pageNum = idx + 2;
          const isLast = idx === chapterTotal - 1;
          const moduleWrapClass = ch.id === 'chap-6' ? 'experiment-grid' : undefined;
          return (
            <section className="chap presentation-page" id={ch.id} key={ch.id}>
              <div className="page-kicker">PAGE {pageNum} / {pageTotal}</div>
              <h2 className="chap-title">
                {ch.title}
                {ch.badgeLabel ? <span className={`badge-tag ${ch.badge}`}>{ch.badgeLabel}</span> : null}
              </h2>
              <ChapterBridge text={ch.bridge} />
              <div className={moduleWrapClass}>
                {ch.modules.filter((m) => !m.title.startsWith('__validator')).map((m) => (
                  <Module key={m.id} module={m} chapterId={ch.id} />
                ))}
              </div>
              {ch.insight ? <InsightBar text={ch.insight} /> : null}
              {idx === revealed - 1 && !isLast ? (
                <div className="chap-loader clean-loader">
                  <button className="chap-loader-btn" onClick={revealNext}>
                    下一页 <span className="chap-loader-arrow">→</span>
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
