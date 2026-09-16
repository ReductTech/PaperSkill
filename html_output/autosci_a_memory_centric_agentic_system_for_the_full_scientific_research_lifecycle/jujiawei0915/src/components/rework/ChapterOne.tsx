import React, { useMemo, useState } from 'react';
import { ChapterFrame, TeachingSection } from './LearningFrame';

const artifacts = ['Paper 1', 'Paper 2', 'Paper 3', 'Hypothesis A', 'Hypothesis B', 'Experiment #1', 'Failed Attempt', 'Experiment #2', 'Result', 'Manuscript', 'Reviewer #1', 'Rebuttal'];
const operations = ['Literature Search', 'Hypothesis Generation', 'Simulation', 'Code Execution'];
const levels = [
  { level: 'Level 1', title: 'Individual Task Agent', summary: '完成一项明确操作。', detail: '完成一个明确的科研操作。' },
  { level: 'Level 2', title: 'End-to-End Research Workflow', summary: '连接一次完整流程。', detail: '把多个科研阶段连接成一次完整研究流程。' },
  { level: 'Level 3', title: 'Persistent Research System', summary: '让研究状态持续存在。', detail: ['Persistent State', 'Controlled Context', 'Verification Gates', 'Recoverable Execution', 'Cross-Project Memory', 'System Evolution'] },
];
const requirements = [
  'Full-Lifecycle Support',
  'Execution Harness',
  'Structured & Persistent Memory',
  'Self-Evolution',
];
const dimensions = ['System Harness', 'Structured Scientific Memory', 'Persistent Scientific Memory', 'System Evolution'];
const rows = [
  { label: '单项任务型 Agent', values: ['–', '◦', '–', '–'] },
  { label: '单项目工作流', values: ['◦', '◦', '◦', '–'] },
  { label: 'AutoSci', values: ['✓', '✓', '✓', '✓'] },
];

export function ChapterOne({ onNext }: { onNext: () => void }) {
  const [days, setDays] = useState(1);
  const [operation, setOperation] = useState(operations[0]);
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [activeRequirements, setActiveRequirements] = useState<string[]>([]);
  const [dimension, setDimension] = useState<number | null>(null);
  const [showMemoryInfo, setShowMemoryInfo] = useState(false);
  const artifactCount = Math.min(artifacts.length, Math.max(1, Math.ceil((days / 30) * artifacts.length)));
  const complexity = Math.round(10 + (days / 30) * 82);
  const dependency = Math.round(8 + (days / 30) * 86);
  const allRequirements = activeRequirements.length === requirements.length;
  const visibleArtifacts = useMemo(() => artifacts.slice(0, artifactCount), [artifactCount]);
  const toggleRequirement = (name: string) => setActiveRequirements((current) => current.includes(name) ? current.filter((item) => item !== name) : [...current, name]);

  return (
    <ChapterFrame
      section="§1"
      paperSection="论文 §1 Introduction"
      title="为什么科研不能只靠聊天记录？"
      subtitle="当一次任务从几分钟变成几十个小时，“对话”就不能等于一个“科研系统”。"
      purpose={<><p>这一节先不讲 AutoSci 的具体模块组成。</p><p>我们先回答论文提出的根本问题：</p><p className="purpose-question">“为什么一个已经很聪明的 LLM Agent，在长周期科研中仍然需要额外的系统设计？”</p><p>答案不只是“模型还不够强”。长期科研还需要能够实现状态保存、上下文控制、验证、反馈，以及可恢复的执行机制等等。</p></>}
      map={[
        { id: '1.1', label: '亲手制造一次“科研上下文失控”' },
        { id: '1.2', label: '单项科研 Agent ≠ 完整科研系统' },
        { id: '1.3', label: 'End-to-End 也还不够' },
        { id: '1.4', label: '一个长期科研系统究竟需要解决什么需求？' },
      ]}
    >
      <TeachingSection number="1.1" title="亲手制造一次“科研上下文失控”">
        <p className="section-lead">科研越长，问题不只是文本越来越多，而是状态之间的依赖越来越复杂。</p>
        <div className="duration-simulation">
          <div className="duration-controls">
            <label htmlFor="research-days">研究持续时间 <b>{days} day{days > 1 ? 's' : ''}</b></label>
            <input id="research-days" type="range" min="1" max="30" value={days} onChange={(event) => setDays(Number(event.target.value))} />
            <div className="duration-range"><span>1 day</span><span>30 days</span></div>
          </div>
          <div className="research-state-board">
            <div className="state-board-head"><span>RESEARCH STATE</span><b>{visibleArtifacts.length} artifacts</b></div>
            <div className="artifact-cloud">{visibleArtifacts.map((artifact, index) => <span key={artifact} style={{ '--artifact-index': index } as React.CSSProperties}>{artifact}</span>)}</div>
            <div className="simulation-metrics"><div><span>Context Complexity</span><b>{complexity}</b><i style={{ width: `${complexity}%` }} /></div><div><span>State Dependency</span><b>{dependency}</b><i style={{ width: `${dependency}%` }} /></div></div>
          </div>
        </div>
        <p className="simulation-note">概念演示，不代表论文实测数值。</p>
        {days >= 16 ? <div className="state-questions"><b>当前实验依赖哪个 Idea？</b><b>哪些实验已经失败？</b><b>Reviewer #1 的问题解决了吗？</b></div> : <div className="state-questions muted">把滑杆移向 30 days，观察依赖与待解决问题何时开始显性出现。</div>}
      </TeachingSection>

      <TeachingSection number="1.2" title="单项能力 ≠ 完整科研生命周期">
        <div className="operation-lifecycle-compare">
          <div className="operations-side"><span className="panel-kicker">INDIVIDUAL SCIENTIFIC OPERATIONS</span>{operations.map((item) => <button key={item} type="button" className={operation === item ? 'active' : ''} onClick={() => setOperation(item)}>{item}</button>)}</div>
          <div className="not-equals"><b>≠</b><small>单项能力不会自动形成完整生命周期</small></div>
          <div className="lifecycle-side"><span className="panel-kicker">FULL RESEARCH LIFECYCLE</span>{['Literature', 'Ideation', 'Experiment', 'Writing', 'Rebuttal'].map((item, index) => <React.Fragment key={item}><b>{item}</b>{index < 4 ? <i>↓</i> : null}</React.Fragment>)}</div>
        </div>
      </TeachingSection>

      <TeachingSection number="1.3" title="End-to-End 也还不够">
        <div className="system-levels">{levels.map((item, index) => <button type="button" key={item.level} className={selectedLevel === index ? 'active' : ''} aria-expanded={selectedLevel === index} onClick={() => setSelectedLevel((current) => current === index ? null : index)}><span>{item.level}</span><strong>{item.title}</strong><small>{item.summary}</small>{selectedLevel === index ? <span className="level-detail">{Array.isArray(item.detail) ? <span className="level-detail-chips">{item.detail.map((point) => <span key={point}>{point}</span>)}</span> : <em>{item.detail}</em>}</span> : null}</button>)}</div>
        <div className="chapter-statement compact"><strong>一次完整科研流程，不等于一个长期科研系统。</strong></div>
      </TeachingSection>

      <TeachingSection number="1.4" title="一个长期科研系统需要解决什么需求？">
        <p className="section-lead">依次探点击四个系统需求，组成一个长期科研系统</p>
        <div className="requirement-puzzle">{requirements.map((name) => {
          const expanded = activeRequirements.includes(name);
          return <button type="button" key={name} className={expanded ? 'active' : ''} aria-expanded={expanded} onClick={() => toggleRequirement(name)}><strong>{name}</strong></button>;
        })}</div>
        {allRequirements ? <div className="persistent-environment complete">Persistent Research Environment</div> : null}
      </TeachingSection>

      <TeachingSection number="Table 1" title="几种scientific-agentic systems的能力比较">
        <p className="table-caption">点击比较维度，可高亮查看对应列。<br /></p>
        <div className="feature-matrix" role="table" aria-label="系统特征比较">
          <div className="feature-row feature-head" role="row"><span>系统</span>{dimensions.map((item, index) => <div key={item} className={`feature-heading-cell ${dimension === index ? 'active' : ''}`}><button type="button" onClick={() => setDimension(index)}>{item}</button>{item === 'Persistent Scientific Memory' ? <button type="button" className="matrix-info" aria-label="查看 Persistent Scientific Memory 说明" aria-expanded={showMemoryInfo} onClick={() => setShowMemoryInfo((current) => !current)}>i</button> : null}{item === 'Persistent Scientific Memory' && showMemoryInfo ? <div className="matrix-info-popover">跨完整 research / paper-generation pipeline 保存，并被之后的 pipeline 再次使用的科研记忆。</div> : null}</div>)}</div>
          {rows.map((row) => <div className={`feature-row ${row.label === 'AutoSci' ? 'autosci-row' : ''}`} role="row" key={row.label}><strong>{row.label}</strong>{row.values.map((value, index) => <span key={`${row.label}-${index}`} className={dimension === index ? 'active' : ''} title={value === '✓' ? 'Full support' : value === '◦' ? 'Partial or project-local support' : 'Not a primary focus'}>{value}</span>)}</div>)}
        </div>
        <div className="matrix-legend"><span>✓ Full support</span><span>◦ Partial or project-local support</span><span>– Not a primary focus</span></div>
      </TeachingSection>

      <div className="chapter-transition"><strong>一次完整科研流程，不等于一个长期科研系统。</strong><p>那么，一个真正长期工作的科研系统应该长什么样？</p><button type="button" className="primary-action" onClick={onNext}>进入整体架构 →</button></div>
    </ChapterFrame>
  );
}
