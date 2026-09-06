import React, { useState } from 'react';
import { tutorial } from './data/tutorial';
import { Hero } from './components/Hero';
import { ChapterBridge } from './components/ChapterBridge';
import { AnalogyCard } from './components/AnalogyCard';
import { Module } from './components/Module';
import { Formula } from './components/Formula';
import { InsightBar } from './components/InsightBar';
import { Takeaway } from './components/Takeaway';
import { PresentationNav } from './components/PresentationNav';

type ViewMode = 'landing' | 'presentation';

const presentationSteps = [
  { chapterIndex: 0, short: '问题', time: '35 秒' },
  { chapterIndex: 2, short: 'Teacher', time: '35 秒' },
  { chapterIndex: 4, short: 'Token Gate', time: '85 秒' },
  { chapterIndex: 5, short: '训练流程', time: '35 秒' },
  { chapterIndex: 9, short: '实验结果', time: '40 秒' },
] as const;

const presentationNotes: Record<number, { lead: string; text: string }> = {
  0: {
    lead: '先看信用分配问题：',
    text: '环境通常要等整条多轮轨迹结束才给奖励；如果第 3 步已经偏离，第 8 步才得到失败信号，奖励就很难告诉模型究竟是哪一个 token 出了问题。',
  },
  2: {
    lead: 'Teacher 不是绝对正确的 Oracle：',
    text: '它其实还是同一个策略，只是在训练时额外看到 Skill 上下文。即使有这份提示，Teacher 也可能被噪声误导，所以不能把所有 token 都一视同仁地蒸馏。',
  },
  4: {
    lead: 'SDAR 的关键是一个 token 级信任旋钮：',
    text: '对同一个学生生成的 token，比较 Teacher 与 Student 的 log-probability gap。Gap 越正，越值得听；Gap 越负，只是减少这条辅助指导，并不等于判定 token 一定错误。',
  },
  5: {
    lead: '训练时是两条互补的路：',
    text: 'GRPO 继续负责完整轨迹的环境目标，SDAR 作为辅助项提供更密集的 token 方向；Teacher 只在训练期参与额外评分，推理时不需要 Skill。',
  },
  9: {
    lead: '最后看收益，也要保留边界：',
    text: '在 Qwen3-1.7B 的 ALFWorld 设置中，GRPO 为 46.1，均匀 OPSD 降到 32.0，而 SDAR 达到 53.9。这个结果支持选择性信任，但不能直接推出它在所有模型和环境中都普遍最优。',
  },
};

export default function App() {
  const [mode, setMode] = useState<ViewMode>('landing');

  const startLearning = () => {
    setMode('presentation');
    requestAnimationFrame(() => document.getElementById('presentation-start')?.scrollIntoView({ behavior: 'smooth' }));
  };

  const renderChapter = (chapterIndex: number, presentationIndex: number) => {
    const ch = tutorial.chapters[chapterIndex];
    const step = presentationSteps[presentationIndex];
    const note = presentationNotes[chapterIndex];

    return (
      <section
        className="chap presentation-chap"
        id={ch.id}
        key={ch.id}
        data-presentation-step={presentationIndex + 1}
      >
        <div className="presentation-kicker">
          核心 {presentationIndex + 1} / {presentationSteps.length}
          <span>{step.time}</span>
        </div>
        <h2 className="chap-title">
          <span className="num">§{presentationIndex + 1}.</span>
          {ch.title}
          <span className={'badge-tag ' + ch.badge}>{ch.badgeLabel}</span>
        </h2>
        <ChapterBridge text={ch.bridge} />
        {note ? (
          <div className="presentation-speaker-note">
            <span>关键线索</span>
            <p><b>{note.lead}</b>{note.text}</p>
          </div>
        ) : null}
        <AnalogyCard analogy={ch.analogy} chapterId={ch.id} />
        {ch.modules.map((module, moduleIndex) => (
          <Module
            key={module.id}
            module={module}
            chapterId={ch.id}
            displayId={(presentationIndex + 1) + '.' + (moduleIndex + 1)}
          />
        ))}
        {ch.insight ? <InsightBar text={ch.insight} /> : null}
        {ch.formula ? <Formula formula={ch.formula} /> : null}
        <Takeaway items={ch.takeaways} />
      </section>
    );
  };

  return (
    <>
      <Hero
        meta={tutorial.meta}
        hero={tutorial.hero}
        mode={mode}
        onPresentation={startLearning}
      />

      {mode === 'presentation' ? (
        <>
          <PresentationNav
            steps={presentationSteps.map((step) => ({
              id: tutorial.chapters[step.chapterIndex].id,
              label: step.short,
            }))}
            onHome={() => { setMode('landing'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          />
          <main id="presentation-start" className="presentation-main">
            <section className="presentation-brief" aria-label="论文核心概览">
              <div><b>一句话问题</b><span>轨迹奖励太粗，盲目 token 蒸馏又会放大坏提示。</span></div>
              <div><b>一句话方法</b><span>用 Teacher–Student log-prob gap，为每个 token 算一个信任 Gate。</span></div>
              <div><b>一句话结论</b><span>不是“更强 Teacher”，而是“更会判断这一拍该不该听”。</span></div>
            </section>
            {presentationSteps.map((step, index) => renderChapter(step.chapterIndex, index))}
            <section className="presentation-finale">
              <span>SDAR 的内核</span>
              <strong>轨迹奖励负责方向，Token Gate 负责分辨率。</strong>
              <button onClick={() => document.getElementById('chap-5')?.scrollIntoView({ behavior: 'smooth' })}>再看一次核心 Gate</button>
            </section>
          </main>
        </>
      ) : null}
    </>
  );
}
