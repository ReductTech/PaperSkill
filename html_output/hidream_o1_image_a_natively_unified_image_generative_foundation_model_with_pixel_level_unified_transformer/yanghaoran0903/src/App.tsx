import React, { useEffect } from 'react';
import { tutorial } from './data/tutorial';
import { Hero } from './components/Hero';
import { FlowMini } from './components/FlowMini';
import { ChapterBridge } from './components/ChapterBridge';
import { AnalogyCard } from './components/AnalogyCard';
import { Module } from './components/Module';
import { Formula } from './components/Formula';
import { InsightBar } from './components/InsightBar';
import { BiliVideos } from './components/BiliVideos';
import { useProgressiveChapters } from './lib/useProgressiveChapters';

export default function App() {
  const total = tutorial.chapters.length;
  const { revealed, begin, revealNext } = useProgressiveChapters(total);
  const bili = tutorial.bilibili || [];
  const flowLabels = ['模型整体架构', '数据底座', '数据质检', '提示词构建', '三阶段训练', '快速推理', '性能对比', '应用总结'];

  useEffect(() => {
    if (revealed < 1) return;
    const ch = tutorial.chapters[revealed - 1];
    const el = ch ? document.getElementById(ch.id) : null;
    if (!el) return;
    const id = requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    return () => cancelAnimationFrame(id);
  }, [revealed]);

  useEffect(() => {
    const targets = Array.from(document.querySelectorAll<HTMLElement>('.reveal-on-scroll'));
    if (!targets.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.14 },
    );
    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [revealed]);

  return (
    <>
      <Hero onStart={begin} />

      <main>
        {tutorial.chapters.map((ch, idx) => {
          if (revealed < idx + 1) return null;
          const isLast = idx === total - 1;
          const isActive = idx === revealed - 1 && !isLast;

          return (
            <React.Fragment key={ch.id}>
              <section className="chap reveal-on-scroll" id={ch.id}>
                <div className="chap-topline">
                  <h2 className="chap-title">
                    <span className="num">S{idx + 1}</span>
                    {ch.title}
                    <span className={`badge-tag ${ch.badge}`}>{ch.badgeLabel}</span>
                  </h2>
                </div>
                <FlowMini labels={flowLabels} activeIndex={idx} />
                <ChapterBridge text={ch.bridge} chapterIndex={idx} />
                {idx > 0 ? <AnalogyCard analogy={ch.analogy} chapterId={ch.id} /> : null}
                {ch.modules.map((m) => (
                  <Module key={m.id} module={m} chapterId={ch.id} chapterIndex={idx} />
                ))}
                {ch.insight ? <InsightBar text={ch.insight} /> : null}
                {ch.formula ? <Formula formula={ch.formula} /> : null}
                {isLast && bili.length > 0 ? <BiliVideos items={bili} /> : null}
              </section>

              {isActive ? (
                <div className="chap-loader chap-loader-below">
                  <button className="chap-loader-btn" onClick={revealNext}>
                    继续学习下一章<span className="chap-loader-arrow">→</span>
                  </button>
                </div>
              ) : null}
            </React.Fragment>
          );
        })}
      </main>
    </>
  );
}
