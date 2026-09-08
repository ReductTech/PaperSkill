import React, { useEffect } from 'react';
import { tutorial } from './data/tutorial';
import { Hero } from './components/Hero';
import { Module } from './components/Module';
import { Formula } from './components/Formula';
import { BiliVideos } from './components/BiliVideos';
import { useProgressiveChapters } from './lib/useProgressiveChapters';

export default function App() {
  const total = tutorial.chapters.length;
  const { revealed, begin, revealNext } = useProgressiveChapters(total);
  const bili = tutorial.bilibili || [];

  // Match the PaperSkill reader flow: after each reveal, bring the new chapter
  // to the reading position instead of leaving it below the fold.
  useEffect(() => {
    if (revealed < 1) return;
    const chapter = tutorial.chapters[revealed - 1];
    if (!chapter) return;
    const element = document.getElementById(chapter.id);
    if (!element) return;
    const frame = requestAnimationFrame(() => {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    return () => cancelAnimationFrame(frame);
  }, [revealed]);

  return (
    <>
      <Hero meta={tutorial.meta} hero={tutorial.hero} onStart={begin} started={revealed > 0} />
      <main>
        {tutorial.chapters.map((ch, idx) => {
          if (revealed < idx + 1) return null;
          const isLast = idx === tutorial.chapters.length - 1;
          const isCurrent = idx === revealed - 1;
          return (
            <section className="chap" id={ch.id} key={ch.id}>
              <h2 className="chap-title">
                <span className="num">§{idx + 1}.</span>
                {ch.title}
              </h2>
              {ch.insight ? <p className="chapter-thesis">{ch.insight}</p> : null}
              {ch.modules.map((m) => (
                <Module key={m.id} module={m} chapterId={ch.id} />
              ))}
              {ch.formula ? <Formula formula={ch.formula} /> : null}
              {isCurrent && !isLast ? (
                <div className="chap-loader">
                  <button className="chap-loader-btn" onClick={revealNext}>
                    继续学习 §{idx + 2} <span className="chap-loader-arrow">→</span>
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
