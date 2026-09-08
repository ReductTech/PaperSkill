import React, { useEffect, useState } from 'react';
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
  const initialReveal = Math.max(0, tutorial.chapters.findIndex((chapter) => `#${chapter.id}` === window.location.hash) + 1);
  const { revealed, begin, revealNext, revealTo } = useProgressiveChapters(total, initialReveal);
  const bili = tutorial.bilibili || [];
  const [activeId, setActiveId] = useState('home');

  // Auto-scroll to the most recently revealed chapter so the "next chapter" button
  // lands the new section in view instead of leaving it below the fold.
  useEffect(() => {
    if (revealed < 1) return;
    const ch = tutorial.chapters[revealed - 1];
    if (!ch) return;
    const el = document.getElementById(ch.id);
    if (!el) return;
    if (window.location.hash === `#${ch.id}`) {
      const timeout = window.setTimeout(() => {
        const previous = document.documentElement.style.scrollBehavior;
        document.documentElement.style.scrollBehavior = 'auto';
        el.scrollIntoView({ block: 'start' });
        window.requestAnimationFrame(() => { document.documentElement.style.scrollBehavior = previous; });
      }, 650);
      return () => window.clearTimeout(timeout);
    }
    const id = requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    return () => cancelAnimationFrame(id);
  }, [revealed]);

  useEffect(() => {
    const targets = ['home', ...tutorial.chapters.slice(0, revealed).map((ch) => ch.id)]
      .map((id) => id === 'home' ? document.querySelector('section.hero') : document.getElementById(id))
      .filter((node): node is Element => Boolean(node));
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      setActiveId(visible.target.classList.contains('hero') ? 'home' : visible.target.id);
    }, { rootMargin: '-28% 0px -58% 0px', threshold: [0, .15, .35] });
    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, [revealed]);

  const navigateTo = (index: number) => {
    if (index < 0) {
      window.history.replaceState(null, '', window.location.pathname);
      document.querySelector('section.hero')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    revealTo(index + 1);
    window.history.replaceState(null, '', `#${tutorial.chapters[index].id}`);
    window.setTimeout(() => document.getElementById(tutorial.chapters[index].id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 40);
  };

  return (
    <>
      <Hero meta={tutorial.meta} hero={tutorial.hero} onStart={begin} started={revealed > 0} />
      <nav className="article-rail" aria-label="论文教程目录">
        <button aria-label="首页" title="首页" className={activeId === 'home' ? 'is-current' : ''} onClick={() => navigateTo(-1)}><span>00</span></button>
        {tutorial.chapters.map((chapter, index) => (
          <button key={chapter.id} aria-label={`Step ${index + 1}：${chapter.title}`} title={`Step ${index + 1}：${chapter.title}`} className={activeId === chapter.id ? 'is-current' : ''} onClick={() => navigateTo(index)}>
            <span>{String(index + 1).padStart(2, '0')}</span>
          </button>
        ))}
      </nav>
      <main>
        {tutorial.chapters.map((ch, idx) => {
          const isVisible = revealed >= idx + 1;
          if (!isVisible) return null;
          const isLast = idx === total - 1;
          return (
            <section className="chap" id={ch.id} key={ch.id}>
              <h2 className="chap-title">
                <span className="num">Step {idx + 1}</span>
                {ch.title}
                <span className={`badge-tag ${ch.badge}`}>{ch.badgeLabel}</span>
              </h2>
              <FlowMini total={total} current={idx + 1} />
              {ch.bridge.trim() ? <ChapterBridge text={ch.bridge} /> : null}
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
                    继续学习 <span className="chap-loader-arrow">→</span>
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
