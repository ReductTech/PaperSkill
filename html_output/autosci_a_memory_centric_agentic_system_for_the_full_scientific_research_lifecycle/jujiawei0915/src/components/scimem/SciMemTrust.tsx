import React, { useState } from 'react';

const artifacts = [
  ['Artifact A', 'schema 正确、有 evidence support', 'PASS'],
  ['Artifact B', 'schema 正确，但 evidence support 不足', 'WARN'],
  ['Artifact C', '缺少必要字段 / link 错误', 'BLOCK'],
];

export function SciMemTrust({ onNext }: { onNext: () => void }) {
  const [stage, setStage] = useState(0);
  const [summaryExpanded, setSummaryExpanded] = useState(false);
  const actions = ['Try to write into SciMem', 'Run Content Check', 'View Trust Guard Decision'];

  return (
    <section className="learning-chapter scimem-chapter scimem-trust-chapter">
      <div className="scimem-page-header">
        <span className="paper-section-tag">论文 §3 SciMem · Trust Guard</span>
        <div className="learning-section-number">§5</div>
        <h1>哪有内容有资格被记住？</h1>
        <p>错误一旦进入长期记忆，就可能影响未来项目。</p>
      </div>

      <div className={`trust-guard-lab stage-${stage}`}>
        <div className="trust-artifacts">{artifacts.map(([name, detail, result]) => <div key={name} className={`trust-artifact result-${stage === 3 ? result.toLowerCase() : 'pending'}`}><strong>{name}</strong><span>{detail}</span>{stage === 3 ? <b>{result}</b> : null}</div>)}</div>
        <div className="trust-pipeline"><div className={stage >= 1 ? 'active' : ''}><span>Form Check</span><b>Deterministic Linting</b><small>schema fields · lifecycle states </small></div><i /><div className={stage >= 2 ? 'active' : ''}><span>Content Check</span><b>Independent Reviewer Agent</b><small>Evidence Support · Consistency with Existing Memory</small></div><i /><div className={stage >= 3 ? 'active' : ''}><span>Trust Guard Decision</span><b>PASS · WARN · BLOCK</b></div></div>
        {stage === 3 ? <div className="trust-results"><div className="result-pass"><b>PASS</b><span>进入 usable memory graph</span></div><div className="result-warn"><b>WARN</b><span>显示 warning 状态</span></div><div className="result-block"><b>BLOCK</b><span>Quarantined</span><small>blocked artifacts are quarantined until resolved</small></div></div> : null}
        {stage < 3 ? <button type="button" className="primary-action trust-action" onClick={() => setStage((current) => current + 1)}>{actions[stage]}</button> : <button type="button" className="quiet-action trust-action" onClick={() => setStage(0)}>重新检查候选 artifact</button>}
      </div>
      <div className="scimem-statement trust-statement"><strong>SciMem 会影响未来研究，所以写入 SciMem 的内容必须经过严格检查</strong></div>

      <div className="scimem-summary-disclosure">
        <button type="button" className="quiet-action scimem-summary-toggle" aria-expanded={summaryExpanded} aria-controls="scimem-summary-panel" onClick={() => setSummaryExpanded((current) => !current)}>{summaryExpanded ? '收起 SciMem 总结 ↑' : '总结一下 SciMem →'}</button>
        <div id="scimem-summary-panel" className={`scimem-summary-disclosure-content ${summaryExpanded ? 'is-open' : ''}`}>
          <div>
            <p className="scimem-summary-lead">学完 SciMem，可以把它记成：两个记忆区域、三种记忆流动方式，以及一道写入质量检测机制。</p>
            <section className="scimem-summary" aria-label="SciMem 总结">
              <header className="scimem-summary-heading"><strong>SCIMEM</strong><span>Schema-Governed Research Memory</span></header>
              <div className="scimem-region-summary">
                <div><b>Long-Term Knowledge Memory</b><span>跨项目积累和复用的科学知识</span></div>
                <div><b>Active Research Memory</b><span>当前项目中持续变化的研究状态</span></div>
              </div>
              <section className="scimem-flow-summary">
                <h3>Memory Growth &amp; Flow</h3>
                <div>
                  <b>Long-Term Aggregation</b>
                  <b>Cross-Region Flow <small>Activation / Consolidation</small></b>
                  <b>Cross-Cycle Accumulation</b>
                </div>
              </section>
              <section className="scimem-trust-gate">
                <b>Trust Guard</b>
                <div><span>Form Check</span><i>+</i><span>Content Check</span><i>→</i><strong>PASS / WARN / BLOCK</strong></div>
              </section>
            </section>
          </div>
        </div>
      </div>
      <div className="scimem-summary-transition"><p>现在，AutoSci 已经能够持续保存和复用科研记忆。<br />接下来的问题是：如何让一个完整科研项目真正跑起来？</p><button type="button" className="primary-action" onClick={onNext}>进入 SciFlow →</button></div>
    </section>
  );
}
