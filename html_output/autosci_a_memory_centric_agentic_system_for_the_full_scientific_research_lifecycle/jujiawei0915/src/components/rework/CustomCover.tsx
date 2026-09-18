import React, { useState } from 'react';

const artifacts = [
  ['Literature', 'evidence'],
  ['Idea', 'hypothesis'],
  ['Experiment', 'running'],
  ['Result', 'observed'],
  ['Review', 'pending'],
];
const dependencies = ['Idea A → Experiment #1', 'Experiment #1 → Result', 'Result → Review'];
const route = [
  ['问题', '为什么普通对话不够'], ['记忆', 'SciMem'], ['执行', 'SciFlow'],
  ['增强', 'SciDAG'], ['进化', 'SciEvolve'], ['证据', 'Case Studies'],
];

export function CustomCover({ onEnter }: { onEnter: () => void }) {
  const [phase, setPhase] = useState<'session' | 'questions' | 'autosci'>('session');

  return (
    <section className="autosci-cover">
      <div className="cover-eyebrow">INTERACTIVE PAPER TUTORIAL · arXiv 2605.31468</div>
      <div className="cover-title-block">
        <p className="cover-question">一次对话结束后，科研Agent还记得什么？</p>
        <h1>AutoSci：让科研 Agent 能够执行、记忆，并跨项目持续进化</h1>
        <p className="cover-paper-title">AutoSci: A Memory-Centric Agentic System for the Full Scientific Research Lifecycle</p>
      </div>

      {phase === 'session' ? (
        <div className="cover-session-scene cover-session-scene-v2">
          <div className="session-workspace" aria-label="逐渐累积的研究会话">
            <div className="session-window-head"><span>RESEARCH SESSION</span><b>● ● ●</b></div>
            <div className="workspace-title"><span>当前研究上下文</span><small>artifacts persist in this session</small></div>
            <div className="session-canvas">
              <svg className="session-dependency-lines" viewBox="0 0 760 280" aria-hidden="true">
                <defs><marker id="session-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" /></marker></defs>
                <path className="session-link session-link-1" d="M330 76 C405 76 426 80 488 80" markerEnd="url(#session-arrow)" />
                <path className="session-link session-link-2" d="M566 113 C540 160 475 183 402 198" markerEnd="url(#session-arrow)" />
                <path className="session-link session-link-3" d="M466 212 C544 212 580 212 636 212" markerEnd="url(#session-arrow)" />
              </svg>
              <div className="session-artifact-grid">
                {artifacts.map(([name, state], index) => (
                  <div key={name} className={`session-artifact-card artifact-${index + 1}`}>
                    <strong>{name}</strong><span>{state}</span>
                  </div>
                ))}
              </div>
              <div className="session-dependency-list">
                {dependencies.map((item, index) => <span key={item} className={`session-dependency dependency-${index + 1}`}>{item}</span>)}
              </div>
            </div>
            <div className="workspace-indicators" aria-label="概念性研究状态指标">
              <div><span>Context Load</span><i>{artifacts.map((item, index) => <b key={item[0]} className={`meter-block meter-${index + 1}`} />)}</i></div>
              <div><span>State Complexity</span><i>{artifacts.map((item, index) => <b key={item[0]} className={`meter-block meter-${index + 1}`} />)}</i></div>
            </div>
          </div>
          <div className="cover-scene-copy">
            <strong>长期科研的问题不只是文本变多，更重要的是需要追踪的状态和依赖关系越来越复杂。</strong>
            <button type="button" className="primary-action session-finish" onClick={() => setPhase('questions')}>结束本次会话</button>
          </div>
        </div>
      ) : null}

      {phase === 'questions' ? (
        <div className="cover-break-scene" aria-live="polite">
          <div className="break-questions">
            {['上一个实验做到哪里？', '哪个 Idea 已经失败？', '哪个 Review 问题还没解决？'].map((question, index) => (
              <p key={question} className={`break-question break-question-${index + 1}`}>{question}<b>？</b></p>
            ))}
          </div>
          <strong className="break-next-question">下一次研究，从哪里继续？</strong>
          <button type="button" className="quiet-action cover-answer-button" onClick={() => setPhase('autosci')}>查看 AutoSci 的回答</button>
        </div>
      ) : null}

      {phase === 'autosci' ? (
        <div className="cover-autosci-scene">
          <p className="architecture-kicker">ACROSS PROJECTS · PERSISTENT MEMORY</p>
          <div className="autosci-architecture" aria-label="跨项目 AutoSci 架构">
            <div className="architecture-project-row">
              <div className="architecture-stage architecture-project project-a"><strong>Research Project A</strong><span>read / write</span></div>
              <div className="architecture-stage architecture-project project-b"><strong>Research Project B</strong><span>read / write</span></div>
              <div className="architecture-stage architecture-project project-c"><strong>Research Project C</strong><span>read / write</span></div>
            </div>
            <div className="architecture-stage project-memory-links" aria-hidden="true"><span /><span /><span /></div>
            <div className="architecture-stage scimem-node"><strong>SciMem</strong><span>Persistent Shared Research Memory</span><small>projects end; retained knowledge and experience do not reset</small></div>
            <div className="architecture-stage flow-memory-relationship"><span>read / write</span></div>
            <div className="architecture-module-row">
              <div className="architecture-stage sciflow-node"><strong>SciFlow</strong><span>Full Research Lifecycle</span></div>
              <div className="architecture-stage scidag-node"><strong>SciDAG</strong><span>Optional Augmentation</span></div>
              <div className="architecture-stage optional-relationship"><span>optional augmentation</span></div>
            </div>
            <div className="architecture-stage evolve-input">Research Feedback · Execution Traces · Review / Experiment Signals</div>
            <div className="architecture-stage scievolve-node"><strong>SciEvolve</strong><span>Feedback → Versioned Updates</span><small>/dream · /forge · /morph</small></div>
            <div className="architecture-stage evolve-updates"><span>updates SciMem</span><span>updates SciFlow</span><span>updates SciDAG</span></div>
          </div>
          <h2>项目会结束，但科研记忆不会跟着项目清空。</h2>
          <p>AutoSci 让多个研究项目围绕同一份持续积累的科研记忆执行、增强与演化。</p>
          <button type="button" className="quiet-action" onClick={() => setPhase('session')}>重新观看会话断裂</button>
        </div>
      ) : null}

      <div className="cover-route" aria-label="学习路线">
        {route.map(([name, note], index) => <React.Fragment key={name}><div><b>{name}</b><span>{note}</span></div>{index < route.length - 1 ? <i>→</i> : null}</React.Fragment>)}
      </div>
      <button type="button" className="cover-enter" onClick={onEnter}>进入 AutoSci 的科研现场 →</button>
    </section>
  );
}
