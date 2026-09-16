import React, { useState } from 'react';

type FlowStep = 'aggregation' | 'region' | 'cycle';
type ActiveEntity = 'idea' | 'experiment';

const topLevelFlows: Array<{ key: FlowStep; label: string; detail: string }> = [
  { key: 'aggregation', label: 'Long-Term Aggregation', detail: 'Long-Term 内部增长' },
  { key: 'region', label: 'Cross-Region Flow', detail: 'Long-Term ↔ Active' },
  { key: 'cycle', label: 'Cross-Cycle Accumulation', detail: '不同 research cycle 之间积累' },
];

export function SciMemFlow({ onNext }: { onNext: () => void }) {
  const [step, setStep] = useState<FlowStep>('aggregation');
  const [aggregated, setAggregated] = useState(false);
  const [regionPhase, setRegionPhase] = useState<'activation' | 'consolidation'>('activation');
  const [activeEntity, setActiveEntity] = useState<ActiveEntity>('idea');
  const [nextCycleStarted, setNextCycleStarted] = useState(false);
  const [summaryExpanded, setSummaryExpanded] = useState(false);

  const unlockedStep = nextCycleStarted ? 2 : regionPhase === 'consolidation' ? 2 : aggregated ? 1 : 0;
  const currentStepIndex = topLevelFlows.findIndex((item) => item.key === step);

  return (
    <section className="learning-chapter scimem-chapter scimem-flow-chapter">
      <div className="scimem-page-header">
        <span className="paper-section-tag">论文 §3 SciMem · Memory Growth and Flow</span>
        <div className="learning-section-number">§4</div>
        <h1>科研记忆如何积累、流动并跨项目复用？</h1>
        <p>SciMem通过三条互补路径， 实现增长、流动并跨研究周期保留经验。</p>
      </div>

      <div className="flow-path-stepper" aria-label="Memory Growth and Flow 的三个顶层路径">
        {topLevelFlows.map((item, index) => {
          const isCurrent = item.key === step;
          const isAvailable = index <= unlockedStep;
          const isDone = index < currentStepIndex || (item.key === 'aggregation' && aggregated) || (item.key === 'region' && regionPhase === 'consolidation');
          return (
            <button
              key={item.key}
              type="button"
              className={`${isCurrent ? 'active' : ''} ${isDone ? 'done' : ''}`}
              disabled={!isAvailable}
              onClick={() => setStep(item.key)}
            >
              <span>STEP {index + 1}</span>
              <strong>{item.label}</strong>
              <small>{item.detail}</small>
            </button>
          );
        })}
      </div>

      {step === 'aggregation' ? (
        <section className="flow-teaching-step aggregation-step" aria-labelledby="aggregation-title">
          <div className="flow-step-heading">
            <span>STEP 1</span>
            <div><h2 id="aggregation-title">Long-Term Aggregation</h2><p>长期知识如何自己“长起来”？</p></div>
          </div>
          <div className={`aggregation-scene ${aggregated ? 'is-aggregated' : ''}`}>
            <div className="flow-region-caption"><b>Long-Term Knowledge Memory</b><span>只在长期记忆区域内发生</span></div>
            <div className="aggregation-papers" aria-label="相对独立的论文实体">
              {['Paper A', 'Paper B', 'Paper C'].map((paper) => <div key={paper}><b>{paper}</b><small>observation</small></div>)}
            </div>
            <div className="aggregation-transfer" aria-hidden="true"><i /><i /><i /></div>
            <div className="aggregation-targets" aria-label="逐步丰富的高层科学记忆">
              <strong>Topic <small>多篇 Paper</small></strong>
              <strong>Concept <small>Paper A / B</small></strong>
              <strong>Method <small>Paper B / C</small></strong>
              <strong>Foundation <small>反复支持的背景</small></strong>
            </div>
          </div>
          <p className="flow-one-line">新读到的论文不会只是单独存成一篇笔记，而是会不断补充已有的Topic、Concept、Method 和 Foundation。</p>
          {!aggregated ? <button type="button" className="primary-action flow-action" onClick={() => setAggregated(true)}>聚合论文知识 →</button> : <div className="flow-step-complete"><strong>Long-Term Memory 不只是数量变多，还会变得更有组织。</strong><button type="button" className="quiet-action" onClick={() => setStep('region')}>继续到 Cross-Region Flow →</button></div>}
        </section>
      ) : null}

      {step === 'region' ? (
        <section className="flow-teaching-step region-step" aria-labelledby="region-title">
          <div className="flow-step-heading">
            <span>STEP 2</span>
            <div><h2 id="region-title">Cross-Region Flow</h2><p>长期知识和当前项目如何双向流动？</p></div>
          </div>
          <div className={`cross-region-scene ${regionPhase}`}>
            <div className="scimem-boundary"><b>SciMem</b><span>同一个 SciMem 内的两个 memory region</span></div>
            <div className="cross-region-layout">
              <div className="cross-memory-region long-term-region">
                <span>LONG-TERM KNOWLEDGE MEMORY</span>
                <b>长期知识</b>
                <div className="region-chip-list"><i>Topic</i><i>Prior Evidence</i><i>Concept</i><i>Method</i></div>
              </div>
              <div className={`cross-region-direction ${regionPhase}`}>
                <b>{regionPhase === 'activation' ? 'Activation' : 'Consolidation'}</b>
                <span>{regionPhase === 'activation' ? 'Long-Term → Active' : 'Active → Long-Term'}</span>
              </div>
              <div className="cross-memory-region active-region">
                <span>ACTIVE RESEARCH MEMORY</span>
                <b>{regionPhase === 'activation' ? 'New Project' : 'Current Project'}</b>
                {regionPhase === 'activation' ? <>
                  <div className="active-entity-choice" aria-label="选择当前项目中的实体">
                    <button type="button" className={activeEntity === 'idea' ? 'active' : ''} onClick={() => setActiveEntity('idea')}>Idea A</button>
                    <button type="button" className={activeEntity === 'experiment' ? 'active' : ''} onClick={() => setActiveEntity('experiment')}>Experiment #1</button>
                  </div>
                  <small>{activeEntity === 'idea' ? 'Idea 可能激活：Topic、Prior Evidence、Concept、Method。' : 'Experiment 可能激活：Method、Assumptions。'}</small>
                </> : <div className="terminal-traces"><i>Idea A · validated</i><i>Experiment #1 · completed</i><i className="failed">Experiment #2 · failed</i><i>Unresolved Limitation</i></div>}
              </div>
            </div>
          </div>
          {regionPhase === 'activation' ? <>
            <p className="flow-one-line">新项目不是从零开始，而是激活已有科研知识来支持当前研究。</p>
            <button type="button" className="primary-action flow-action" onClick={() => setRegionPhase('consolidation')}>完成当前项目 →</button>
          </> : <>
            <p className="flow-one-line">当前项目积累的研究经验，可以回写到长期记忆中，供未来项目复用。</p>
            <p className="flow-failure-note">失败尝试也可能成为未来项目避免重复错误的经验。</p>
            <div className="cross-region-summary">
              <div className="cross-region-summary-flow" aria-label="Long-Term Knowledge 与 Active Research 的双向流动">
                <div className="cross-region-summary-card">Long-Term Knowledge</div>
                <div className="cross-region-summary-arrows" aria-hidden="true">
                  <div className="cross-region-summary-arrow activation"><span>Activation</span><i /></div>
                  <div className="cross-region-summary-arrow consolidation"><span>Consolidation</span><i /></div>
                </div>
                <div className="cross-region-summary-card active">Active Research</div>
              </div>
              <strong>长期知识支持当前研究，当前研究也会反过来丰富长期知识</strong>
            </div>
            <button type="button" className="quiet-action flow-action" onClick={() => setStep('cycle')}>继续到 Cross-Cycle Accumulation →</button>
          </>}
        </section>
      ) : null}

      {step === 'cycle' ? (
        <section className="flow-teaching-step cycle-step" aria-labelledby="cycle-title">
          <div className="flow-step-heading">
            <span>STEP 3</span>
            <div><h2 id="cycle-title">Cross-Cycle Accumulation</h2><p>一个项目结束后，方法经验如何留给下一个项目？</p></div>
          </div>
          <div className={`cycle-accumulation-scene ${nextCycleStarted ? 'next-cycle-started' : ''}`}>
            <div className="research-cycle cycle-a">
              <span>RESEARCH CYCLE A</span>
              <div className="cycle-timeline"><b>Literature</b><i>→</i><b>Ideation</b><i>→</i><b>Experiment</b><i>→</i><b>Writing</b><i>→</i><b>Rebuttal</b></div>
              <div className="retained-experience"><strong>Reviewer Concern</strong><strong>Rebuttal Outcome</strong><strong>Methodological Lesson</strong></div>
            </div>
            <div className="cycle-transfer" aria-hidden="true"><span>retained experience</span></div>
            <div className="research-cycle cycle-b">
              <span>RESEARCH CYCLE B</span>
              {nextCycleStarted ? <><div className="cycle-timeline"><b>Literature</b><i>→</i><b>Ideation</b><i>→</i><b>Experiment</b><i>→</i><b className="highlight">Writing</b><i>→</i><b className="highlight">Rebuttal</b></div><small>读取上一轮留下的 reviewer / rebuttal / method experience。</small></> : <p>下一轮研究尚未开始。</p>}
            </div>
          </div>
          {!nextCycleStarted ? <><p className="flow-one-line">经验不会随着 Project A 结束而消失，它们可以留给后续 research cycle。</p><button type="button" className="primary-action flow-action" onClick={() => setNextCycleStarted(true)}>开始下一轮研究 →</button></> : <>
            <p className="flow-one-line flow-final-intro">SciMem 会积累以后怎么做 research、writing、rebuttal。</p>
            <button type="button" className="quiet-action flow-action flow-summary-toggle" aria-expanded={summaryExpanded} aria-controls="scimem-flow-summary" onClick={() => setSummaryExpanded((current) => !current)}>{summaryExpanded ? '收起总结 ↑' : '总结一下 SciMem 的三种记忆演化路径 →'}</button>
            <div id="scimem-flow-summary" className={`flow-summary-disclosure ${summaryExpanded ? 'is-open' : ''}`}>
              <div>
                <div className="flow-final-summary" aria-label="Memory Growth and Flow 总结">
                  <h3>Memory Growth and Flow</h3>
                  <div className="final-flow-items">
                    <div><b>① Long-Term Aggregation</b><span>在 Long-Term 内部，Paper 等 source 不断丰富高层知识。</span></div>
                    <div><b>② Cross-Region Flow</b><span>Long-Term → Active：Activation<br />Active → Long-Term：Consolidation</span></div>
                    <div><b>③ Cross-Cycle Accumulation</b><span>上一轮的 method、review / rebuttal lesson 可被后续 research cycle 使用。</span></div>
                  </div>
                  <strong>SciMem 不只记住研究结果，还会保留“以后怎么做科研”的经验。</strong>
                </div>
              </div>
            </div>
          </>}
        </section>
      ) : null}

      <div className="chapter-transition trust-guard-transition"><strong>科研中不是所有内容都值得被记住，Trust Guard的作用是检查内容是否应该被写入。</strong><button type="button" className="primary-action" onClick={onNext}>进入 Trust Guard →</button></div>
    </section>
  );
}
