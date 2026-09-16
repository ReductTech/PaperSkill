import React, { useEffect, useState } from 'react';
import { tutorial } from './data/tutorial';
import { Module } from './components/Module';
import { Formula } from './components/Formula';
import { InsightBar } from './components/InsightBar';
import { Takeaway } from './components/Takeaway';
import { GlossaryTooltip } from './components/GlossaryTooltip';
import { widgetRegistry } from './modules/registry';

const chapterLabels = ['SYSTEM', 'DECODER', 'NORM', 'TRAIN', 'WSD', 'ABLATION', 'SFT', 'ALIGN', 'EVIDENCE'];

export default function App() {
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);
  const Lineage = widgetRegistry['index-lineage'];

  useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-story-section]'));
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      setProgress(max > 0 ? scrollY / max : 0);
      const readingLine = scrollY + innerHeight * .32;
      const current = sections.reduce((found, section) => section.offsetTop <= readingLine ? section : found, sections[0]);
      setActive(Number(current?.dataset.storySection || 0));
    };
    onScroll();
    addEventListener('scroll', onScroll, { passive: true });
    return () => removeEventListener('scroll', onScroll);
  }, []);

  const goTo = (index: number) => document.getElementById(index === 0 ? 'top' : `chapter-${index}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return <div className="v2-site">
    <GlossaryTooltip />
    <div className="reading-progress" style={{ transform: `scaleX(${progress})` }} />
    <header className="research-nav">
      <button className="brand-mark" onClick={() => goTo(0)} aria-label="回到顶部"><i />INDEX <b>1.9B · V3</b></button>
      <nav aria-label="论文机制目录">
        {tutorial.chapters.map((chapter, i) => <button key={chapter.id} className={active === i + 1 ? 'active' : ''} onClick={() => goTo(i + 1)}><span>{String(i + 1).padStart(2, '0')}</span>{chapterLabels[i]}</button>)}
      </nav>
      <a href="https://arxiv.org/abs/2607.09885v3" target="_blank" rel="noreferrer">PAPER ↗</a>
    </header>

    <main>
      <section id="top" className="research-hero" data-story-section="0">
        <div className="hero-grid" />
        <div className="hero-orbit orbit-a" /><div className="hero-orbit orbit-b" />
        <div className="hero-copy">
          <div className="eyebrow">INDEX SLM TECHNICAL REPORT · INTERACTIVE FIELD GUIDE</div>
          <h1><span>1.9B</span> 参数预算，<br/>怎样榨出更强能力？</h1>
          <p>{tutorial.meta.coreProblem}</p>
          <div className="hero-stats">
            <div><b>1.9B</b><span>non-embedding params</span></div>
            <div><b>2.8T</b><span>training tokens</span></div>
            <div><b>36</b><span>decoder layers</span></div>
            <div><b>64.92</b><span>six-task average</span></div>
          </div>
          <button className="hero-cta" onClick={() => goTo(1)}>进入训练生命周期 <span>↓</span></button>
        </div>
        <div className="hero-machine" aria-label="Index 训练生命周期">
          <div className="machine-core"><small>MODEL CORE</small><b>Index-1.9B</b><span>hidden 2048 · 36L · 16H</span></div>
          {['DATA','TOKENIZER','ARCH','OPTIMIZE','ALIGN','EVAL'].map((label,i)=><div key={label} className={`machine-node node-${i}`}><i>{String(i+1).padStart(2,'0')}</i>{label}</div>)}
          <svg viewBox="0 0 520 520" aria-hidden="true"><circle cx="260" cy="260" r="190"/><circle cx="260" cy="260" r="126"/><path d="M260 70 A190 190 0 0 1 448 235"/></svg>
        </div>
        <div className="hero-sequence"><span>DATA</span><i>→</i><span>TOKENIZER</span><i>→</i><span>ARCHITECTURE</span><i>→</i><span>OPTIMIZATION</span><i>→</i><span>ALIGNMENT</span><i>→</i><span>EVIDENCE</span></div>
      </section>

      <section className="lineage-stage">
        <div className="section-intro"><span>00 / MODEL FAMILY</span><h2>不是四张卡片，是一棵实验谱系</h2><p>Base 与 Pure 构成预训练对照；Base 继续经过 SFT、DPO 与 RAG，形成 Chat 和 Character。</p></div>
        <div className="hero-lineage">{Lineage ? <Lineage chapterId="hero" moduleId="lineage" /> : null}</div>
      </section>

      <div className="story">
        {tutorial.chapters.map((chapter, index) => {
          const number = index + 1;
          const heroClass = number === 3 ? ' hero-interaction hero-norm' : number === 5 ? ' hero-interaction hero-wsd' : number === 6 ? ' hero-interaction hero-surge' : '';
          return <section key={chapter.id} id={`chapter-${number}`} className={`story-chapter tone-${number}${heroClass}`} data-story-section={number}>
            <div className="chapter-rail"><span>{String(number).padStart(2,'0')}</span><i /><small>{chapterLabels[index]}</small></div>
            <div className="chapter-body">
              <header className="story-heading">
                <div className="story-kicker"><span>{chapter.badgeLabel}</span> · INDEX SLM</div>
                <h2>{chapter.title}</h2>
                <p dangerouslySetInnerHTML={{ __html: chapter.bridge }} />
              </header>

              <div className="mechanism-question"><span>INTUITION HOOK</span><b>{chapter.analogy.title}</b><p>{chapter.analogy.text}</p></div>

              <div className="story-modules">
                {chapter.modules.map(module => <Module key={module.id} module={module} chapterId={chapter.id} />)}
              </div>

              {chapter.insight ? <InsightBar text={chapter.insight} /> : null}
              {chapter.formula ? <Formula formula={chapter.formula} /> : null}
              <Takeaway items={chapter.takeaways} />
            </div>
          </section>;
        })}
      </div>

      <footer className="research-footer">
        <span>ESTABLISHED</span><i>→</i><span>SUGGESTED</span><i>→</i><span>UNKNOWN</span>
        <p>读完一篇技术报告，也要保留它没有回答的问题。</p>
        <button onClick={() => goTo(0)}>回到模型入口 ↑</button>
      </footer>
    </main>
  </div>;
}
