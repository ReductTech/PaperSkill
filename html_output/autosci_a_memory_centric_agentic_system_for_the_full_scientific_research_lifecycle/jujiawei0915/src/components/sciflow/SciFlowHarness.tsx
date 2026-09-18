import React, { useState } from 'react';

type Guarantee = 'state' | 'context' | 'verification' | 'feedback' | 'orchestration';
type RunStatus = 'running' | 'paused' | 'resumed';

const guarantees: Array<{ id: Guarantee; label: string }> = [
  { id: 'state', label: 'State' },
  { id: 'context', label: 'Context' },
  { id: 'verification', label: 'Verification' },
  { id: 'feedback', label: 'Feedback' },
  { id: 'orchestration', label: 'Orchestration' },
];

export function SciFlowHarness({ onNext }: { onNext: () => void }) {
  const [selected, setSelected] = useState<Guarantee>('state');
  const [runStatus, setRunStatus] = useState<RunStatus>('running');
  const [contextPrepared, setContextPrepared] = useState(false);
  const [summaryExpanded, setSummaryExpanded] = useState(false);

  return (
    <section id="sciflow-harness" className="learning-chapter sciflow-harness-chapter">
      <div className="scimem-page-header">
        <span className="paper-section-tag">论文 §4 SciFlow · Harness</span>
        <div className="learning-section-number">§4.2</div>
        <h1>Harness：让科研能长期稳定运行</h1>
        <p>Lifecycle 决定研究做什么；Harness 让这些工作能长期、可恢复地运行。</p>
      </div>

      <p className="harness-interruption-intro">长期科研任务并不会总是一口气跑完。任务可能在执行过程中被暂停或中断，关键是系统能否保存状态并恢复执行。</p>
      <section className="harness-situation" aria-label="长周期实验中断情境">
        <div className={`interruption-card ${runStatus}`}>
          <span>EXPERIMENT</span>
          <b>{runStatus === 'paused' ? 'Status: Paused' : runStatus === 'resumed' ? 'Status: Resumed' : 'Status: Running'}</b>
          <small>{runStatus === 'paused' ? 'interruption' : runStatus === 'resumed' ? 'resume from Experiment' : 'long-running task'}</small>
        </div>
        {runStatus === 'running' ? <button type="button" className="primary-action" onClick={() => setRunStatus('paused')}>模拟中断</button> : runStatus === 'paused' ? <div className="interruption-answer"><p>如果项目运行十几个小时后中断，系统怎么知道从哪里继续？</p><strong>Harness 控制的是：这些科研阶段如何长期、可恢复地运行。</strong><button type="button" className="quiet-action" onClick={() => setRunStatus('resumed')}>从 Experiment 恢复 →</button></div> : <div className="interruption-answer resumed"><strong>阶段输出与项目进度已被保留，可以从 Experiment 继续。</strong><button type="button" className="quiet-action" onClick={() => setRunStatus('running')}>重新模拟</button></div>}
      </section>

      <section className="harness-control-section" aria-labelledby="harness-title">
        <div className="flow-step-heading"><span>HARNESS</span><div><h2 id="harness-title">五项执行保证</h2><p>选择一项，查看它如何支撑长期科研。</p></div></div>
        <div className="harness-control-panel">
          <div className="harness-guarantee-list" role="tablist" aria-label="Harness 五项保证">
            {guarantees.map((item) => <button type="button" role="tab" key={item.id} className={selected === item.id ? 'active' : ''} aria-selected={selected === item.id} onClick={() => setSelected(item.id)}>{item.label}</button>)}
          </div>
          <div className="harness-detail" key={selected}>
            {selected === 'state' ? <div className="harness-detail-state"><span>STATE</span><h3>阶段可恢复，而不依赖临时聊天上下文</h3><p>把阶段输出和项目进度保存到临时 LLM context 之外。</p><div className={`resume-strip ${runStatus}`}><b>Experiment</b><i>{runStatus === 'paused' ? 'interruption' : 'running'}</i><strong>{runStatus === 'paused' ? 'resume from Experiment' : runStatus === 'resumed' ? 'resumed' : 'progress retained'}</strong></div><small>Resumable</small></div> : null}
            {selected === 'context' ? <div className="harness-detail-context"><span>CONTEXT</span><h3>为当前 skill 准备相关视图</h3><p>每个 skill 只获得当前任务真正需要的 SciMem 内容。</p><div className={`context-view ${contextPrepared ? 'prepared' : ''}`}><div><b>{contextPrepared ? 'Tailored SciMem View' : 'Full SciMem'}</b><section>{(contextPrepared ? ['Idea A', 'Method', 'Prior Evidence', 'Failed Experiment'] : ['Paper', 'Method', 'Failed Experiment', 'Review', 'Concept', 'Idea']).map((item) => <i key={item}>{item}</i>)}</section></div></div>{!contextPrepared ? <button type="button" className="primary-action" onClick={() => setContextPrepared(true)}>Prepare Context</button> : <small>不是把整个 SciMem 塞进 context。</small>}</div> : null}
            {selected === 'verification' ? <div className="harness-detail-verification"><span>VERIFICATION</span><h3>重要交接先被检查</h3><p>重要写入和阶段交接，在被下游部分使用前先经过检查。</p><div className="verification-route"><b>Artifact</b><i>→</i><strong>Trust Guard</strong><i>→</i><b>Next Stage</b></div><small>这里不重复展开 Trust Guard 的具体规则。</small></div> : null}
            {selected === 'feedback' ? <div className="harness-detail-feedback"><span>FEEDBACK</span><h3>失败和批评是后续流程信号</h3><div className="feedback-route"><b>Insufficient Evidence</b><i>↓</i><strong>/refine</strong><em>or</em><strong>Self-Evolution</strong></div><small></small></div> : null}
            {selected === 'orchestration' ? <div className="harness-detail-orchestration"><span>ORCHESTRATION</span><h3>谁来把五个科研阶段真正串起来？</h3><p>/research 负责调用各阶段 Skill、记录整体进度、处理暂停点，并持续监控长时间运行的实验。</p><div className="orchestration-timeline"><b>Literature ✓</b><b>Ideation ✓</b><b className="running">Experiment running</b><b>Writing waiting</b><b>Rebuttal waiting</b></div></div> : null}
          </div>
        </div>
      </section>

      <div className="sciflow-summary-disclosure">
        <button type="button" className="quiet-action sciflow-summary-toggle" aria-expanded={summaryExpanded} aria-controls="sciflow-summary-content" onClick={() => setSummaryExpanded((expanded) => !expanded)}>{summaryExpanded ? '收起 SciFlow 总结 ↑' : '总结一下 SciFlow →'}</button>
        <div id="sciflow-summary-content" className={`sciflow-summary-disclosure-content ${summaryExpanded ? 'is-open' : ''}`}>
          <div>
            <div className="sciflow-responsibility-compare">
              <div><span>Five-Stage Lifecycle</span><strong>科研做什么？</strong><p>Literature · Ideation · Experiment · Writing · Rebuttal</p></div>
              <b>+</b>
              <div><span>Harness</span><strong>这些工作怎么长期稳定地执行？</strong><p>State · Context · Verification · Feedback · Orchestration</p></div>
              <em>SciFlow</em>
            </div>
            <div className="sciflow-statement harness-statement"><strong>Lifecycle 决定做什么，Harness 决定怎么把它可靠地做下去。</strong><span>SciMem 保存科研状态，SciFlow 根据这些状态推进科研过程。</span></div>
          </div>
        </div>
      </div>

      <div className="chapter-transition"><strong>现在，AutoSci 已经能够让完整科研流程持续运行。</strong><p>但如果某一个 skill 特别困难，一个 Agent 不够怎么办？</p><button type="button" className="primary-action" onClick={onNext}>进入 SciDAG →</button></div>
    </section>
  );
}
