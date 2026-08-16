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
import { useProgressiveChapters } from './lib/useProgressiveChapters';
import { PresentationMode } from './modules/presentation-mode';

export default function App() {
  const total = tutorial.chapters.length;
  const { revealed, begin, revealNext } = useProgressiveChapters(total);
  const [view, setView] = useState<'landing' | 'tutorial' | 'presentation'>('landing');

  const openTutorial = () => {
    setView('tutorial');
    if (revealed === 0) begin();
    window.setTimeout(() => document.querySelector('main')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
  };

  const openPresentation = () => {
    setView('presentation');
    window.setTimeout(() => document.getElementById('presentation-mode')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
  };

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
      <Hero meta={tutorial.meta} hero={tutorial.hero} onStart={openTutorial} onPresentation={openPresentation} activeMode={view} />
      {view === 'presentation' ? <main><PresentationMode onOpenTutorial={openTutorial} /></main> : null}
      {view === 'tutorial' ? <main>
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
              <FlowMini total={total} revealed={idx + 1} />
              <ChapterBridge text={ch.bridge} />
              {ch.id === 'chap-1' || ch.id === 'chap-2' || ch.id === 'chap-3' || ch.id === 'chap-4' || ch.id === 'chap-5' || ch.id === 'chap-6' || ch.id === 'chap-7' || ch.id === 'chap-8' || ch.id === 'chap-9' || ch.id === 'chap-10' ? null : <AnalogyCard analogy={ch.analogy} chapterId={ch.id} />}
              {ch.modules.map((m) => (
                <Module key={m.id} module={m} chapterId={ch.id} />
              ))}
              {ch.insight ? <InsightBar text={ch.insight} /> : null}
              {ch.formula ? ch.id === 'chap-3' ? (
                <details className="deep-reading formula-details">
                  <summary>展开公式细节：四帧动作如何合并并注入视频表示</summary>
                  <Formula formula={ch.formula} />
                </details>
              ) : ch.id === 'chap-4' ? (
                <details className="deep-reading formula-details">
                  <summary>展开公式：模型只能看过去，再预测下一块</summary>
                  <Formula formula={ch.formula} />
                </details>
              ) : ch.id === 'chap-5' ? (
                <details className="deep-reading formula-details">
                  <summary>展开数学表达：从双向分布到因果分布</summary>
                  <Formula formula={ch.formula} />
                </details>
              ) : ch.id === 'chap-6' ? (
                <details className="deep-reading formula-details">
                  <summary>展开数学细节：ODE 蒸馏公式</summary>
                  <Formula formula={ch.formula} />
                </details>
              ) : <Formula formula={ch.formula} /> : null}
              {ch.takeaways.length > 0 ? <Takeaway items={ch.takeaways} /> : null}
              {idx === revealed - 1 && !isLast ? (
                <div className="chap-loader">
                  <div className="chap-loader-hint" />
                  <button className="chap-loader-btn" onClick={revealNext}>
                    {ch.id === 'chap-1'
                      ? '继续学习 §2：训练这样的世界，需要什么数据？'
                      : ch.id === 'chap-2'
                        ? '继续 §3：动作如何真正进入视频模型？'
                        : ch.id === 'chap-9'
                          ? '继续 §10：跑起来之后，效果到底怎么样？'
                        : `继续学习 §${nextNum}`} <span className="chap-loader-arrow">→</span>
                  </button>
                </div>
              ) : null}
            </section>
          );
        })}
      </main> : null}
    </>
  );
}
