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
import { VideoAgentMission } from './components/VideoAgentMission';
import {MethodComparison,ResearchLens,ResearchOverview,ResearchTakeaways} from './components/ResearchLens';

export default function App() {
  const total = tutorial.chapters.length;
  const { revealed, begin, revealNext, revealAll } = useProgressiveChapters(total);
  const bili = tutorial.bilibili || [];
  const [mode, setMode] = useState<'learn' | 'mission'>('learn');

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
      <Hero meta={tutorial.meta} hero={tutorial.hero} onStart={begin} started={revealed > 0} />
      <nav className="experience-switch" aria-label="学习模式">
        <button className={mode === 'learn' ? 'active' : ''} onClick={() => setMode('learn')}><span>01</span> 论文机制学习<small>保留完整 10 章证据链</small></button>
        <button className={mode === 'mission' ? 'active' : ''} onClick={() => setMode('mission')}><span>02</span> 交互式任务<small>亲自成为 VideoAgent</small></button>
      </nav>
      {mode === 'mission' ? <VideoAgentMission /> : <main>
        <ResearchOverview />
        <section className="principle-guide" aria-label="三个核心问题">
          <span><b>Storyboard</b>决定成片应该讲什么</span>
          <span><b>Agent Graph</b>决定工具如何依赖和执行</span>
          <span><b>Textual Gradient</b>负责发现并修复工作流问题</span>
        </section>
        <nav className="research-route" aria-label="研究讲解路线">{[['问题','chap-1'],['Storyboard','chap-3'],['真实视频','chap-4'],['Agent Graph','chap-7'],['Textual Gradient','chap-8'],['实验','chap-9'],['我的思考','chap-10']].map(([label,id])=><button key={id} onClick={()=>{revealAll();setTimeout(()=>document.getElementById(id)?.scrollIntoView({behavior:'smooth',block:'start'}),80)}}>{label}</button>)}</nav>
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
              <FlowMini total={total} revealed={revealed} />
              <ChapterBridge text={ch.bridge} />
              <ResearchLens chapterId={ch.id}/>
              {ch.id==='chap-7'?<MethodComparison/>:null}
              <AnalogyCard analogy={ch.analogy} chapterId={ch.id} />
              {ch.modules.map((m) => (
                <Module key={m.id} module={m} chapterId={ch.id} />
              ))}
              {ch.insight ? <InsightBar text={ch.insight} /> : null}
              {ch.formula ? <Formula formula={ch.formula} /> : null}
              {ch.id==='chap-10'?<ResearchTakeaways/>:null}
              <Takeaway items={ch.takeaways} />
              {idx === revealed - 1 && !isLast ? (
                <div className="chap-loader">
                  <div className="chap-loader-hint" />
                  <button className="chap-loader-btn" onClick={revealNext}>
                    继续学习 §{nextNum} <span className="chap-loader-arrow">→</span>
                  </button>
                </div>
              ) : isLast ? (
                // End of the last chapter: append Bilibili recommendations here when present.
                bili.length > 0 ? <BiliVideos items={bili} /> : null
              ) : null}
            </section>
          );
        })}
      </main>}
    </>
  );
}
