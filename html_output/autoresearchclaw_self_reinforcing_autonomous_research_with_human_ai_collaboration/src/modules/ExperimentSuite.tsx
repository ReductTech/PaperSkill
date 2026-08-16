import { useState, type CSSProperties } from 'react';
import { ablations, hitlRows, mainResults } from '../data/paper';
import { ArcBenchExplorer } from './ArcBenchExplorer';
import { T10CaseStudy } from './T10CaseStudy';

export function ExperimentSuite() {
  const [ablationId, setAblationId] = useState('full');
  const [revealed, setRevealed] = useState(false);
  const [guess, setGuess] = useState<number | null>(null);
  const [inspected, setInspected] = useState(false);
  const selected = ablations.find((row) => row.id === ablationId) ?? ablations[0];
  const shownHitl = hitlRows.filter((row) => ['Full-Auto', 'CoPilot', 'Thorough', 'Step-by-Step'].includes(row.mode));

  return (
    <div className="experiment-suite">
      <ArcBenchExplorer />
      <div className="experiment-method-strip" aria-label="实验设计共用条件"><b>读法：每组实验只回答一个问题</b><span>怎么做</span><i>→</i><span>看到什么结果</span><i>→</i><span>说明什么</span></div>

      <section className="experiment-pair pair-q1" aria-labelledby="q1-title">
        <header><span>实验 01 · Overall performance</span><h3 id="q1-title">闭环科研，整体上是否更好？</h3></header>
        <div className="pair-board"><article className="pair-design"><span>怎么做</span><b>25 个 ML 研究任务上的受控比较</b><p>四个系统使用相同基础模型、沙盒与预算；按代码开发、代码执行、结果分析评分。</p><small>CD / CE / RA = 25 / 25 / 50</small></article><i>→</i><article className="pair-result"><span>看到了什么</span><div className="pair-number"><b>0.648</b><em>vs</em><b>0.419</b></div><p>CoPilot 相对 AI Scientist v2 的 Overall 提升 <strong>+54.7%</strong>。</p><small>结果分析：0.523 vs 0.261，提升 +100.4%</small></article></div>
        <p className="pair-takeaway"><b>说明什么：</b>优势不只是“更会写代码”，而是更能判断实验结果是否真的支持一项主张。</p>
        <details className="experiment-evidence"><summary>展开查看 Q1 完整成绩与柱状图</summary><div className="result-bars figure-panel"><div className="chart-title">ARC-Bench experiment-stage overall score <small>25 个主题 · CD / CE / RA = 25 / 25 / 50</small></div>
          {mainResults.map((row) => <div className={`result-bar ${row.accent ?? ''}`} key={row.name}><div><span>{row.name}</span><b>{row.overall.toFixed(3)}</b></div><i className="animated" style={{ width: `${row.overall * 100}%` }} /></div>)}
          <div className="bar-axis"><span>0.0</span><span>0.2</span><span>0.4</span><span>0.6</span><span>0.8</span></div>
        </div>
        <div className="metric-callouts"><div><span>Overall 注释</span><b>↑ +54.7%</b><p>AutoResearchClaw CoPilot 0.648 相较 AI Scientist v2 0.419 的相对提升。</p></div><div className="ra-callout"><span>结果分析 · Result Analysis</span><div className="ra-bars"><i style={{height:'100%'}}>CoPilot <b>0.523</b></i><i style={{height:'50%'}}>AI Scientist v2 <b>0.261</b></i></div><p><strong>+100.4%</strong>：最大的提升不只是“更会写代码”，而是更会判断实验究竟支持什么结论。</p></div></div>
        <details className="evidence-table"><summary>查看 Table 2 完整三维成绩</summary><table><thead><tr><th>Framework</th><th>CD</th><th>CE</th><th>RA</th><th>Overall</th></tr></thead><tbody>{mainResults.map((row) => <tr key={row.name}><td>{row.name}</td><td>{row.codeDevelopment.toFixed(3)}</td><td>{row.codeExecution.toFixed(3)}</td><td>{row.resultAnalysis.toFixed(3)}</td><td>{row.overall.toFixed(3)}</td></tr>)}</tbody></table></details></details>
      </section>

      <section className="experiment-pair pair-q2" aria-labelledby="q2-title">
        <header><span>实验 02 · Ablation study</span><h3 id="q2-title">这些机制，分别起了什么作用？</h3></header>
        <div className="pair-board"><article className="pair-design"><span>怎么做</span><b>逐个关闭机制，其他条件不变</b><p>在同一 10-topic Full-Auto 设置中，每次只移除一个论文报告的机制，再比较完成数与证据可靠性。</p><small>同一任务 · best-of-3 · 单机制消融</small></article><i>→</i><article className="pair-result"><span>看到了什么</span><div className="pair-result-list"><b>无 Self-Healing：<strong>10/10 → 6/10</strong></b><b>无 Verification：<strong>接受 3/10 → 5/10</strong></b></div><p>后者多出的 3 篇“接受论文”含无记录数值。</p></article></div>
        <p className="pair-takeaway"><b>说明什么：</b>Self-Healing 让实验能走完；Verification 让“走完”不被伪造数值误判为可靠科研。</p>
        <details className="experiment-evidence"><summary>展开交互式 Q2 消融选择器</summary><p className="interaction-hint">点选任一“关闭机制”，看系统具体失去什么能力；未被论文报告的组合不提供选择。</p>
        <div className="ablation-selector" role="radiogroup" aria-label="选择论文报告的组件消融">
          {ablations.map((row) => <button key={row.id} role="radio" aria-checked={row.id === selected.id} className={row.id === selected.id ? 'selected' : ''} onClick={() => { setAblationId(row.id); setInspected(false); }}>{row.id === 'full' ? '所有机制开启' : row.label.replace('Disable Debate', '关闭多智能体辩论').replace('Disable Self-Healing', '关闭自愈式执行').replace('Disable Evolution', '关闭跨运行经验').replace('Disable Verification', '关闭结果验证').replace('Disable Debate + Self-Healing', '关闭辩论 + 自愈')}</button>)}
        </div>
        <div className={`ablation-result ${selected.fabricated ? 'integrity-warning' : ''}`} role="status" aria-live="polite">
          <div><span>完成率</span><b>{selected.completion}</b></div><div><span>质量</span><b>{selected.quality.toFixed(2)}</b></div><div><span>接受数</span><b>{selected.accept}</b></div><div><span>虚构情况</span><b>{selected.fabricated ? '发现' : '无'}</b></div>
          <p>{selected.insight}</p>
        </div>
        {selected.id === 'verification' ? <div className="integrity-note"><b>分数更高，不一定意味着科学更可靠。</b><span>Higher score ≠ better science.</span> 无结果验证时，表面接受数上升，但人工审计发现 3 篇被接受论文含有无法追溯到运行记录的数值。<button aria-expanded={inspected} onClick={() => setInspected(!inspected)}>查看审计结论</button>{inspected ? <div className="fabricated-papers" role="status"><i>审计条目 A<br /><b>未登记测量主张</b><small>论文未报告具体数值</small></i><i>审计条目 B<br /><b>未登记测量主张</b><small>论文未报告具体数值</small></i><i>审计条目 C<br /><b>未登记测量主张</b><small>论文未报告具体数值</small></i></div> : null}</div> : null}
        </details>
      </section>

      <section className="experiment-pair pair-q3" id="hitl-study" aria-labelledby="q3-title">
        <header><span>实验 03 · End-to-end HITL</span><h3 id="q3-title">人类介入越多，结果越好吗？</h3></header>
        <div className="pair-board"><article className="pair-design"><span>怎么做</span><b>同一端到端任务，不同介入策略</b><p>在 T01–T10 上比较 Full-Auto、CoPilot、Thorough、Step-by-Step 的介入次数与最终接受率。</p><small>端到端 HITL 协议 · 与 Q1 Overall 不混比</small></article><i>→</i><article className="pair-result"><span>看到了什么</span><div className="pair-result-list"><b>CoPilot：<strong>6 次 / 87.5%</strong></b><b>Step-by-Step：<strong>23 次 / 50.0%</strong></b></div><p>更多审批并没有带来更高的接受率。</p></article></div>
        <p className="pair-takeaway"><b>说明什么：</b>人类的价值在高不确定性、高影响的决策点；<strong>精准介入 &gt; 高频介入</strong>。</p>
        <details className="experiment-evidence"><summary>展开 Q3 猜测与完整 HITL 结果</summary><p className="interaction-hint">先选一个次数猜测结果，再看论文报告的端到端 HITL 消融。</p>
        {!revealed ? <div className="guess-board"><p>你认为哪种介入频率最好？</p><div>{[0, 3, 6, 8, 23].map((n) => <button key={n} className={guess === n ? 'selected' : ''} aria-pressed={guess === n} onClick={() => setGuess(n)}>{n} 次</button>)}</div><p className="guess-feedback" role="status" aria-live="polite">{guess === null ? '先选择一个猜测，再对照论文报告的结果。' : `已选择 ${guess} 次介入；现在查看论文的端到端 HITL 结果。`}</p><button className="primary-button" disabled={guess === null} onClick={() => setRevealed(true)}>查看论文报告的结果</button></div> : <><div className="hitl-chart figure-panel"><div className="chart-title">接受率 <small>Accept Rate</small></div><div className="lollipop-axis"><span>100%</span><span>50%</span><span>0%</span></div><div className="lollipop-points">{shownHitl.map((row) => <article className={row.mode === 'CoPilot' ? 'winner' : ''} style={{'--rate': row.accept} as CSSProperties} key={row.mode}><i /><b>{row.accept}</b><strong>{row.interventions} 次</strong><small>{row.mode}</small></article>)}</div><label>人类介入次数</label></div><div className="precision-note" role="status"><b>精准介入 &gt; 高频介入</b><span>Precision &gt; Frequency：人类不需要每一步都审批；真正有效的是在高价值决策点介入。</span></div></>}
        <details className="evidence-table"><summary>查看全部 7 种 HITL 模式</summary><table><thead><tr><th>Mode</th><th>Valid</th><th>Mean Q</th><th>Accept</th><th>Interventions</th></tr></thead><tbody>{hitlRows.map((row) => <tr key={row.mode}><td>{row.mode}</td><td>{row.valid}</td><td>{row.quality.toFixed(2)}</td><td>{row.accept}</td><td>{row.interventions}</td></tr>)}</tbody></table></details>
        </details>
      </section>

      <details className="experiment-case-detail"><summary>展开 T10 案例：执行成功，为什么仍不等于科学比较成功？</summary><T10CaseStudy /></details>

      <details className="explore-more"><summary>Explore More · 跨领域覆盖（不进入四分钟主线）</summary><p>论文还在 Biology、Statistics、HEP-ph 的 20 个科学任务上评估。CoPilot 的领域均分分别为 0.912、0.898、0.489，run-weighted overall 为 0.867；基线在 biology 和 HEP 的所需软件栈上无法产生有效输出。</p></details>

      <aside className="critical-reading"><span>Critical Reading</span><ul><li>ARC-Bench 是科学研究能力的代理指标，不等于原创科学发现本身。</li><li>workflow completion 不等于得到有意义、可推广的科学结论。</li><li>Cross-Run Evolution 是 memory-based adaptation，不是参数学习或模型重训练。</li><li>系统仍需要人类在问题选择、实验语义与最终主张上做高价值判断。</li></ul></aside>
    </div>
  );
}
