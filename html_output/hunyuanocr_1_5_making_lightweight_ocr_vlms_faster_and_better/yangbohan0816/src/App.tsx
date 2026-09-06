import React, { useEffect, useState } from 'react';
import { tutorial } from './data/tutorial';
import { Hero } from './components/Hero';
import { FlowMini } from './components/FlowMini';
import { AnalogyCard } from './components/AnalogyCard';
import { Module } from './components/Module';
import { Formula } from './components/Formula';
import { InsightBar } from './components/InsightBar';
import { Takeaway } from './components/Takeaway';
import { BiliVideos } from './components/BiliVideos';
import { useProgressiveChapters } from './lib/useProgressiveChapters';

const presentationPlan = [
  {
    chapterIndex: 0,
    label: '问题与贡献：1.0 为什么还要升级',
    title: '为什么已经有 1.0，还需要 1.5？',
    moduleIds: ['1.1', '1.2'],
    showAnalogy: true,
    showInsight: true,
    showFormula: false,
    showTakeaways: false
  },
  {
    chapterIndex: 2,
    label: '速度：DFlash 草拟—校验',
    title: 'DFlash 怎样一次推进多个 token？',
    moduleIds: ['3.1'],
    showAnalogy: true,
    showInsight: true,
    showFormula: false,
    showTakeaways: false
  },
  {
    chapterIndex: 4,
    label: '能力：Agentic Data Flow',
    title: '怎样沿能力缺口搭建数据管线？',
    moduleIds: ['5.1'],
    showAnalogy: true,
    showInsight: true,
    showFormula: false,
    showTakeaways: false
  },
  {
    chapterIndex: 5,
    label: '训练：Stage3 → SFT → RL',
    title: '三个训练阶段各自解决什么？',
    moduleIds: ['6.1'],
    showAnalogy: true,
    showInsight: true,
    showFormula: false,
    showTakeaways: false
  },
  {
    chapterIndex: 8,
    label: '可靠性：任务奖励 → CHAOS 检验',
    title: '怎样提高视觉忠实性，又怎样用 CHAOS 检验？',
    moduleIds: ['9.1'],
    showAnalogy: true,
    showInsight: true,
    showFormula: true,
    showTakeaways: false
  },
  {
    chapterIndex: 9,
    label: '结果与部署：锁定协议 → 对照条件',
    title: '怎样比较实验结果，再判断真实场景是否适用？',
    moduleIds: ['10.1', '10.2'],
    showAnalogy: true,
    showInsight: false,
    showFormula: true,
    showTakeaways: false
  },
  {
    chapterIndex: 9,
    label: '边界：适用条件与主要局限',
    title: '适用条件与主要局限',
    moduleIds: ['10.3'],
    showAnalogy: false,
    showInsight: false,
    showFormula: false,
    showTakeaways: false
  }
];

export default function App() {
  const total = tutorial.chapters.length;
  const { revealed, begin, revealNext } = useProgressiveChapters(total);
  const bili = tutorial.bilibili || [];
  const [presentation, setPresentation] = useState(false);
  const [presentationStep, setPresentationStep] = useState(0);
  const activePresentation = presentationPlan[presentationStep];
  const beginTutorial = () => { setPresentation(false); begin(); };
  const beginPresentation = () => { setPresentation(true); setPresentationStep(0); begin(); };
  const movePresentation = (delta: number) => setPresentationStep((step) => Math.max(0, Math.min(presentationPlan.length - 1, step + delta)));

  // Auto-scroll to the most recently revealed chapter so the "next chapter" button
  // lands the new section in view instead of leaving it below the fold.
  useEffect(() => {
    if (!presentation && revealed < 1) return;
    const chapterIndex = presentation ? activePresentation.chapterIndex : revealed - 1;
    const ch = tutorial.chapters[chapterIndex];
    if (!ch) return;
    const el = document.getElementById(ch.id);
    if (!el) return;
    const id = requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    return () => cancelAnimationFrame(id);
  }, [revealed, presentation, presentationStep, activePresentation.chapterIndex]);

  useEffect(() => {
    if (!presentation) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') movePresentation(1);
      if (event.key === 'ArrowLeft') movePresentation(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [presentation]);

  return (
    <>
      <Hero meta={tutorial.meta} hero={tutorial.hero} onStart={beginTutorial} onPresent={beginPresentation} started={revealed > 0} />
      {presentation ? (
        <nav className="presentation-dock" aria-label="4 分钟展示导航">
          <div className="presentation-top">
            <div className="presentation-meta"><strong>{activePresentation.label}</strong><span>{presentationStep + 1}/{presentationPlan.length}</span></div>
            <div className="presentation-actions"><button className="tiny ghost" onClick={() => movePresentation(-1)} disabled={presentationStep === 0}>← 上一场景</button><button className="tiny" onClick={() => movePresentation(1)} disabled={presentationStep === presentationPlan.length - 1}>下一场景 →</button><button className="tiny ghost" onClick={() => setPresentation(false)}>退出展示</button></div>
          </div>
        </nav>
      ) : null}
      <main className={presentation ? 'is-presentation' : undefined}>
        {tutorial.chapters.map((ch, idx) => {
          const isVisible = presentation ? idx === activePresentation.chapterIndex : revealed >= idx + 1;
          if (!isVisible) return null;
          const visibleModules = presentation
            ? ch.modules.filter((module) => activePresentation.moduleIds.includes(module.id))
            : ch.modules;
          const nextNum = idx + 2;
          const isLast = idx === total - 1;
          return (
            <section className="chap" id={ch.id} key={presentation ? `${ch.id}-${presentationStep}` : ch.id}>
              <h2 className="chap-title">
                <span className="num">§{idx + 1}.</span>
                {presentation ? activePresentation.title : ch.title}
                <span className={`badge-tag ${ch.badge}`}>{ch.badgeLabel}</span>
              </h2>
              <FlowMini total={presentation ? presentationPlan.length : total} revealed={presentation ? presentationStep + 1 : revealed} />
              {(!presentation || activePresentation.showAnalogy) ? <AnalogyCard analogy={ch.analogy} chapterId={ch.id} /> : null}
              {visibleModules.map((m) => (
                <Module key={m.id} module={m} chapterId={ch.id} />
              ))}
              {ch.insight && (!presentation || activePresentation.showInsight) ? <InsightBar text={ch.insight} /> : null}
              {ch.formula && (!presentation || activePresentation.showFormula) ? <Formula formula={ch.formula} /> : null}
              {(!presentation || activePresentation.showTakeaways) ? <Takeaway items={ch.takeaways} /> : null}
              {!presentation && idx === revealed - 1 && !isLast ? (
                <div className="chap-loader">
                  <div className="chap-loader-hint" />
                  <button className="chap-loader-btn" onClick={revealNext}>
                    继续学习 §{nextNum} <span className="chap-loader-arrow">→</span>
                  </button>
                </div>
              ) : !presentation && isLast ? (
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
