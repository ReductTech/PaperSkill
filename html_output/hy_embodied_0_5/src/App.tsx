import React, { useEffect, useMemo, useState } from 'react';
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

const quickMotModule = {
  kind: 'module' as const,
  id: '3.0',
  title: '先看架构：共享 Transformer vs MoT 模态分流',
  desc: '机器人已经知道必须看清哪些细节，接下来就要回答“模型怎样容纳这些细节”。左侧是视觉与语言共用参数的传统结构，右侧是 HY-Embodied-0.5 的模态专属计算。<span class="source-ref">论文 §2.2 · Figure 2</span>',
  componentId: 'mot-comparison-static',
};

const quickTrainingModule = {
  kind: 'module' as const,
  id: '7.0',
  title: '训练策略：探索、固化，再迁移',
  desc: '轨迹奖励已经能判断“怎样走得更好”，接下来要让模型通过训练稳定学会它。动画依次展示推理冷启动、RL 与 RFT 的自演化循环，以及从大模型到 MoT-2B 的同策略蒸馏。<span class="source-ref">论文 Figure 5 · §4.1–§4.4</span>',
  componentId: 'training-strategy-animation',
};

const quickResultsModule = {
  kind: 'module' as const,
  id: '8.0',
  title: '实验结果：真实机器人上是否真的有效？',
  desc: '用论文三项真实机器人任务的成功率收束讲解，并同时展示结论边界。<span class="source-ref">论文 §6 · Robot Control Results</span>',
  componentId: 'experiment-summary-static',
};

export default function App() {
  const [mode, setMode] = useState<'quick' | 'full' | null>(null);
  const quickChapterIds = ['chap-1', 'chap-3', 'chap-5', 'chap-7', 'chap-8'];
  const quickModuleIds = new Set(['1.1', '3.1', '5.2', '5.3', '7.2']);
  const chapters = useMemo(
    () => mode === 'full' ? tutorial.chapters : tutorial.chapters.filter(ch => quickChapterIds.includes(ch.id)),
    [mode]
  );
  const total = chapters.length;
  const { revealed, begin, revealNext } = useProgressiveChapters(total);
  const bili = tutorial.bilibili || [];

  // Auto-scroll to the most recently revealed chapter so the "next chapter" button
  // lands the new section in view instead of leaving it below the fold.
  useEffect(() => {
    if (revealed < 1) return;
    const ch = chapters[revealed - 1];
    if (!ch) return;
    const el = document.getElementById(ch.id);
    if (!el) return;
    const id = requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    return () => cancelAnimationFrame(id);
  }, [revealed, chapters]);

  const start = (selectedMode: 'quick' | 'full') => {
    setMode(selectedMode);
    begin();
  };

  return (
    <>
      <Hero meta={tutorial.meta} hero={tutorial.hero} onStart={start} started={revealed > 0} />
      <main className={mode === 'quick' ? 'quick-mode' : undefined}>
        {chapters.map((ch, idx) => {
          const isVisible = revealed >= idx + 1;
          if (!isVisible) return null;
          const nextNum = idx + 2;
          const isLast = idx === total - 1;
          return (
            <section className="chap" id={ch.id} key={ch.id}>
              <h2 className="chap-title">
                <span className="num">§{idx + 1}.</span>
                {mode === 'quick' && ch.id === 'chap-8' ? '实验结果：能力是否真正落到机器人上？' : ch.title}
                <span className={`badge-tag ${ch.badge}`}>{ch.badgeLabel}</span>
              </h2>
              <FlowMini total={total} revealed={revealed} />
              <ChapterBridge text={mode === 'quick' && ch.id === 'chap-8' ? 'OPD 已经把能力迁移到端侧小模型，最后不再停留在方法示意，而是直接看论文的真实机器人实验：这些能力是否真的转化成了任务成功率？' : ch.bridge} />
              {mode === 'full' || ch.id === 'chap-1' ? <AnalogyCard analogy={ch.analogy} chapterId={ch.id} /> : null}
              {mode === 'quick' && ch.id === 'chap-3' ? <Module module={quickMotModule} chapterId={ch.id} /> : null}
              {mode === 'quick' && ch.id === 'chap-7' ? <Module module={quickTrainingModule} chapterId={ch.id} /> : null}
              {mode === 'quick' && ch.id === 'chap-8' ? <Module module={quickResultsModule} chapterId={ch.id} /> : null}
              {ch.modules.filter(m => mode === 'full' || quickModuleIds.has(m.id)).map((m) => (
                <Module key={m.id} module={m} chapterId={ch.id} />
              ))}
              {ch.insight ? <InsightBar text={ch.insight} /> : null}
              {mode === 'full' && ch.formula ? <Formula formula={ch.formula} /> : null}
              {mode === 'full' ? <Takeaway items={ch.takeaways} /> : null}
              {idx === revealed - 1 && !isLast ? (
                <div className="chap-loader">
                  <div className="chap-loader-hint" />
                  <button className="chap-loader-btn" onClick={revealNext}>
                    {mode === 'quick' ? `下一站 · ${idx + 2}/5` : `继续学习 §${nextNum}`} <span className="chap-loader-arrow">→</span>
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
