import { useEffect, useMemo, useState } from 'react';
import type { NavSectionId } from './types';
import { challenges, navSections, presenterStops } from './data/paper';
import { ResearchSimulator, type SimulatorStage } from './modules/ResearchSimulator';
import { ExperimentSuite } from './modules/ExperimentSuite';
import { HeroResearchLoop, SystemOverview } from './modules/ResearchVisuals';

function scrollTo(targetId: string) {
  document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

const presenterSimulatorStages: Partial<Record<string, SimulatorStage>> = {
  hypothesis: 'hypothesis',
  failure: 'experiment',
  healing: 'healing',
  'result-debate': 'result',
  verification: 'verification',
  hitl: 'hitl',
  evolution: 'evolution',
};

function PaperOverview() {
  return <HeroResearchLoop />;
}

function ChallengeGrid() {
  const causes: Record<string, string> = {
    hypothesis: '同一个 Agent 提出并认可假设',
    execution: '一次运行失败就终止整条流程',
    memory: '每次运行都从零开始',
  };

  return (
    <div className="challenge-grid">
      {challenges.map((challenge) => (
        <article key={challenge.id}>
          <span>{challenge.number}</span>
          <h3>{challenge.title}</h3>
          <div><small>旧系统行为</small><b>{causes[challenge.id]}</b></div>
          <i>↓</i>
          <div><small>科研损失</small><p>{challenge.short}</p></div>
          <i>↓</i>
          <div className="challenge-answer"><small>本文需要的能力</small><strong>{challenge.response}</strong></div>
        </article>
      ))}
    </div>
  );
}

function TakeawayFigure() {
  const [closed, setClosed] = useState(false);

  return (
    <div className={closed ? 'takeaway-figure closed' : 'takeaway-figure'}>
      <div className="before-line"><span>BEFORE</span><b>IDEA</b><i>──────────────→</i><b>PAPER</b><small>一次向前的线性生成</small></div>
      <button className="primary-button" onClick={() => setClosed(true)}>{closed ? '科研闭环已形成' : '让直线变成闭环'}</button>
      <div className="closed-loop-figure" aria-label="自我强化科研闭环图">
        <div className="loop-center"><b>CLOSED-LOOP</b><span>RESEARCH</span><small>闭环科研</small></div>
        {['辩论', '假设', '实验', '失败 / 证据', '结果辩论', '验证', '论文', '经验'].map((label, index) => <span className={`loop-node node-${index + 1}`} key={label}>{label}</span>)}
        <i className="loop-path">↻</i><em className="refine-path">Refine</em><em className="pivot-path">Pivot ↶</em><em className="human-path">◆ 人类关键判断</em><em className="memory-path">经验 → 下一轮研究</em>
      </div>
      <div className="closing-statement"><small>Closing the Scientific Feedback Loop</small><strong>AutoResearchClaw 的核心，不是让 AI 自动完成更多科研步骤，<br />而是让质疑、失败、修正、证据、人类判断和历史经验，重新进入下一轮研究。</strong></div>
    </div>
  );
}

export default function App() {
  const [activeSection, setActiveSection] = useState<NavSectionId>('motivation');
  const [presenterIndex, setPresenterIndex] = useState<number | null>(null);
  const presenter = presenterIndex !== null;
  const currentStop = presenterIndex === null ? null : presenterStops[presenterIndex];
  const presenterSimulatorStage = currentStop ? presenterSimulatorStages[currentStop.id] : undefined;
  const totalSeconds = useMemo(() => presenterStops.reduce((sum, stop) => sum + stop.durationSeconds, 0), []);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) setActiveSection(visible.target.id as NavSectionId);
    }, { rootMargin: '-25% 0px -60% 0px', threshold: [0.1, 0.4, 0.7] });
    navSections.forEach((item) => {
      const section = document.getElementById(item.id);
      if (section) observer.observe(section);
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!presenter) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setPresenterIndex(null); return; }
      const target = event.target as HTMLElement;
      if (target.closest('input, textarea, select')) return;
      if (event.key === 'ArrowRight' || event.key === ' ') {
        event.preventDefault();
        setPresenterIndex((index) => Math.min((index ?? 0) + 1, presenterStops.length - 1));
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        setPresenterIndex((index) => Math.max((index ?? 0) - 1, 0));
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [presenter]);

  useEffect(() => {
    if (currentStop) window.setTimeout(() => scrollTo(currentStop.targetId), 0);
  }, [currentStop]);

  const startPresenter = () => setPresenterIndex(0);

  return (
    <div className={presenter ? 'app presenter-on' : 'app'}>
      <header className="site-header">
        <a className="brand" href="#top" onClick={(event) => { event.preventDefault(); scrollTo('top'); }}><span>ARC</span><div>AutoResearchClaw<small>Scientific feedback loop</small></div></a>
        <nav aria-label="主导航">{navSections.map((section) => <button key={section.id} className={activeSection === section.id ? 'active' : ''} onClick={() => scrollTo(section.id)}><span>{section.number}</span>{section.label}</button>)}</nav>
        <button className="presenter-button" onClick={startPresenter}>演示模式 <small>Presenter Mode</small> <kbd>→</kbd></button>
      </header>

      {presenter && currentStop ? <div className="presenter-bar" role="status"><div><span>Presenter Mode · {presenterIndex! + 1} / {presenterStops.length}</span><b>{currentStop.label}</b></div><div className="presenter-progress"><i style={{ width: `${((presenterIndex! + 1) / presenterStops.length) * 100}%` }} /></div><small>{currentStop.durationSeconds}s · total {Math.round(totalSeconds / 60)} min</small><button onClick={() => setPresenterIndex((index) => Math.max((index ?? 0) - 1, 0))} aria-label="上一个站点">←</button><button onClick={() => setPresenterIndex((index) => Math.min((index ?? 0) + 1, presenterStops.length - 1))} aria-label="下一个站点">→</button><button className="text-button" onClick={() => setPresenterIndex(null)}>Esc Exit</button></div> : null}

      <main id="top">
        <section id="motivation" className="page-section hero-section"><div className="section-index">01 / MOTIVATION</div><div className="hero-copy"><p className="eyebrow">AutoResearchClaw · arXiv 2026</p><h1>Real research<br /><em>is not a straight line.</em></h1><p>自我强化的自主科研：让质疑、失败、证据与经验进入下一轮研究。</p><a className="paper-source" href="https://arxiv.org/abs/2605.20025v2" target="_blank" rel="noreferrer">论文 v2 · arXiv:2605.20025</a></div><PaperOverview /></section>

        <section id="challenges" className="page-section compact-section"><div className="section-heading"><span>02</span><div><p className="eyebrow">CHALLENGES</p><h2>自主科研为什么会在关键处失效？</h2></div></div><ChallengeGrid /><div className="method-transition">Can we close the <b>scientific feedback loop?</b><i>↓</i></div></section>

        <section id="architecture" className="page-section compact-section"><div className="section-heading"><span>03</span><div><p className="eyebrow">PROPOSED METHOD</p><h2>在每个阶段，系统具体做了什么？</h2><p>点选或悬停阶段，查看其输入、动作、产物及科研护栏。</p></div></div><SystemOverview /></section>

        <section id="simulator" className="page-section simulator-section"><div className="section-heading"><span>04</span><div><p className="eyebrow">HOW IT WORKS</p><h2>亲自走一遍 AutoResearchClaw 的科研闭环</h2><p>教学示意案例 · 非 ARC-Bench 原始实验：在低数据场景下，Method X 是否能够提升分类性能？</p></div></div><ResearchSimulator presenterStage={presenterSimulatorStage} presenterKey={currentStop?.id} /><div className="method-summary"><span>假设质量不足</span><i>→</i><b>多智能体辩论</b><span>实验失败</span><i>→</i><b>自愈式执行</b><span>AI 编造主张</span><i>→</i><b>结果验证</b><span>重复犯错</span><i>→</i><b>跨运行经验演化</b></div></section>

        <section id="experiments" className="page-section"><div className="section-heading"><span>05</span><div><p className="eyebrow">EXPERIMENTS</p><h2>实验如何证明这些设计真的有效？</h2></div></div><ExperimentSuite /></section>

        <section id="takeaway" className="page-section takeaway-section"><div className="section-heading"><span>06</span><div><p className="eyebrow">TAKEAWAY</p><h2>从自动化更多步骤，到闭合科学反馈回路</h2></div></div><TakeawayFigure /></section>
      </main>
      <footer>AutoResearchClaw · Self-Reinforcing Autonomous Research with Human-AI Collaboration · based on arXiv:2605.20025v2</footer>
    </div>
  );
}
