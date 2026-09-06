import React, { useCallback, useEffect, useRef } from 'react';
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
import { LineIcon } from './components/LineIcon';
import { useProgressiveChapters } from './lib/useProgressiveChapters';

export default function App() {
  const total = tutorial.chapters.length;
  const { revealed, begin, revealNext } = useProgressiveChapters(
    total,
    'ppocrv6:tutorial-progress'
  );
  const bili = tutorial.bilibili || [];
  const handledRevealed = useRef<number | null>(null);

  const navigateToChapter = useCallback((chapterNumber: number) => {
    if (chapterNumber < 1 || chapterNumber > revealed) return;
    const chapter = tutorial.chapters[chapterNumber - 1];
    const element = chapter ? document.getElementById(chapter.id) : null;
    if (!chapter || !element) return;
    window.history.replaceState(null, '', `#${chapter.id}`);
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [revealed]);

  // Auto-scroll to the most recently revealed chapter so the "next chapter" button
  // lands the new section in view instead of leaving it below the fold.
  useEffect(() => {
    if (revealed < 1) return;
    if (handledRevealed.current === revealed) return;
    const hashChapter = tutorial.chapters.find(
      (chapter, index) => `#${chapter.id}` === window.location.hash && index < revealed
    );
    const ch = handledRevealed.current === null && hashChapter
      ? hashChapter
      : tutorial.chapters[revealed - 1];
    if (!ch) return;
    const el = document.getElementById(ch.id);
    if (!el) return;
    handledRevealed.current = revealed;
    const id = requestAnimationFrame(() => {
      window.history.replaceState(null, '', `#${ch.id}`);
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
          const primaryModules = isLast
            ? ch.modules.filter((module) => module.componentId !== 'ppocrv6-series')
            : ch.modules;
          const trailingModules = isLast
            ? ch.modules.filter((module) => module.componentId === 'ppocrv6-series')
            : [];
          return (
            <section
              className="chap"
              id={ch.id}
              key={ch.id}
              aria-labelledby={`${ch.id}-title`}
            >
              <h2 className="chap-title" id={`${ch.id}-title`}>
                <span className="num">§{idx + 1}.</span>
                {ch.title}
                <span className={`badge-tag ${ch.badge}`}>{ch.badgeLabel}</span>
              </h2>
              <FlowMini
                total={total}
                current={idx + 1}
                revealed={revealed}
                labels={tutorial.chapters.map((chapter) => chapter.shortTitle)}
                onNavigate={navigateToChapter}
              />
              <ChapterBridge text={ch.bridge} icon={ch.bridgeIcon} />
              <AnalogyCard analogy={ch.analogy} chapterId={ch.id} />
              {primaryModules.map((m) => (
                <Module key={m.id} module={m} chapterId={ch.id} />
              ))}
              {ch.insight ? <InsightBar text={ch.insight} /> : null}
              {ch.formula ? <Formula formula={ch.formula} /> : null}
              <Takeaway items={ch.takeaways} />
              {idx === revealed - 1 && !isLast ? (
                <div className="chap-loader">
                  <div className="chap-loader-hint" />
                  <button className="chap-loader-btn" onClick={revealNext}>
                    继续学习 §{nextNum} <LineIcon name="arrow-right" className="chap-loader-arrow" />
                  </button>
                </div>
              ) : null}
              {isLast && bili.length > 0 ? <BiliVideos items={bili} /> : null}
              {trailingModules.map((m) => (
                <Module key={m.id} module={m} chapterId={ch.id} />
              ))}
            </section>
          );
        })}
      </main>
    </>
  );
}
