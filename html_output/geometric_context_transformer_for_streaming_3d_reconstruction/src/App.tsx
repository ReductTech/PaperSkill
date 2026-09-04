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
import { ChapterNav } from './components/ChapterNav';
import { useProgressiveChapters } from './lib/useProgressiveChapters';

function preferredScrollBehavior(): ScrollBehavior {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
}

export default function App() {
  const total = tutorial.chapters.length;
  const { revealed, begin, revealNext } = useProgressiveChapters(total);
  const bili = tutorial.bilibili || [];
  const [activeIndex, setActiveIndex] = useState(0);

  // Auto-scroll to the most recently revealed chapter so the "next chapter" button
  // lands the new section in view instead of leaving it below the fold.
  useEffect(() => {
    if (revealed < 1) return;
    const ch = tutorial.chapters[revealed - 1];
    if (!ch) return;
    const el = document.getElementById(ch.id);
    if (!el) return;
    const id = requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: preferredScrollBehavior(), block: 'start' });
      document.getElementById(`${ch.id}-title`)?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(id);
  }, [revealed]);

  useEffect(() => {
    if (revealed < 1) return;
    let frameId: number | null = null;
    const updateActive = () => {
      const navBottom = document.querySelector<HTMLElement>('.chapter-nav')
        ?.getBoundingClientRect().bottom ?? 0;
      const threshold = navBottom + 12;
      const visible = tutorial.chapters.slice(0, revealed);
      let next = 0;
      for (let i = 0; i < visible.length; i += 1) {
        const top = document.getElementById(visible[i].id)?.getBoundingClientRect().top ?? Infinity;
        if (top <= threshold) next = i;
      }
      setActiveIndex(next);
      frameId = null;
    };
    const scheduleUpdate = () => {
      if (frameId !== null) return;
      frameId = requestAnimationFrame(updateActive);
    };
    updateActive();
    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate, { passive: true });
    return () => {
      window.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
      if (frameId !== null) cancelAnimationFrame(frameId);
    };
  }, [revealed]);

  return (
    <>
      <Hero meta={tutorial.meta} hero={tutorial.hero} onStart={begin} started={revealed > 0} />
      <main>
        {revealed > 0 ? (
          <ChapterNav chapters={tutorial.chapters} revealed={revealed} activeIndex={activeIndex} />
        ) : null}
        {tutorial.chapters.map((ch, idx) => {
          const isVisible = revealed >= idx + 1;
          if (!isVisible) return null;
          const nextNum = idx + 2;
          const isLast = idx === total - 1;
          const primaryModules = ch.modules.filter((module) => module.role !== 'supplementary');
          const supplementaryModules = ch.modules.filter((module) => module.role === 'supplementary');
          return (
            <section
              className="chap"
              id={ch.id}
              key={ch.id}
              aria-labelledby={`${ch.id}-title`}
            >
              <h2 className="chap-title" id={`${ch.id}-title`} tabIndex={-1}>
                <span className="num">§{idx + 1}.</span>
                {ch.title}
                <span className={`badge-tag ${ch.badge}`}>{ch.badgeLabel}</span>
              </h2>
              <ChapterBridge text={ch.bridge} />
              {ch.analogy ? <AnalogyCard analogy={ch.analogy} chapterId={ch.id} /> : null}
              {primaryModules.map((m) => (
                <Module key={m.id} module={m} chapterId={ch.id} />
              ))}
              {supplementaryModules.length > 0 ? (
                <div className="supplementary-modules">
                  <div className="supplementary-modules-body">
                    {supplementaryModules.map((m) => (
                      <Module key={m.id} module={m} chapterId={ch.id} />
                    ))}
                  </div>
                </div>
              ) : null}
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
                bili.length > 0 ? <BiliVideos items={bili} /> : null
              ) : null}
            </section>
          );
        })}
      </main>
    </>
  );
}
