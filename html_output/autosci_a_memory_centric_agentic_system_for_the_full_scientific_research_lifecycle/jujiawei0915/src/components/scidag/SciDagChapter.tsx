import React, { useEffect, useState } from 'react';
import { ChapterFrame, TeachingSection } from '../rework/LearningFrame';

type RouteAction = 'continue' | 'retry' | 'branch' | 'prune' | 'stop';
type TemplateId = 'ideation' | 'experiment' | 'writing';

const templates: Record<TemplateId, { label: string; operators: string[]; purpose: string }> = {
  ideation: { label: 'Ideation Template', operators: ['Generate', 'Variation', 'Debate', 'Ensemble'], purpose: '用于 Ideation 阶段，强调多样化生成与讨论。' },
  experiment: { label: 'Experiment Template', operators: ['Test', 'Refine', 'Review'], purpose: '用于 Experiment 阶段，强调可靠性检查与改进。' },
  writing: { label: 'Writing Template', operators: ['Review', 'Refine', 'Polish'], purpose: '用于 Writing 阶段，强调证据一致性与表达完善。' },
};

const routeDescriptions: Record<RouteAction, { graph: React.ReactNode; text: string }> = {
  continue: { graph: <div className="router-path"><b>Generate</b><i>→</i><b>Test</b><i>→</i><strong>Continue</strong><i>→</i><b>Review</b></div>, text: '沿现有 DAG 向后继续。' },
  retry: { graph: <div className="router-path"><b>Generate</b><i>→</i><b>Test</b><i>→</i><strong>Refine</strong><i>→</i><b>Re-Test</b></div>, text: '创建后继的 Refine / Re-Test 节点，而不是画回到旧节点的循环边。' },
  branch: { graph: <div className="router-branch router-branch-aligned"><b>Generate</b><div className="router-branch-split-arrows" aria-hidden="true"><i>↙</i><i>↘</i></div><div className="router-branch-operators"><strong>Variation A</strong><strong>Variation B</strong></div><div className="router-branch-merge-arrows" aria-hidden="true"><i>↘</i><i>↙</i></div><b>Review</b></div>, text: '根据当前状态扩展新的执行分支，再让中间结果汇合。' },
  prune: { graph: <div className="router-branch"><b>Generate</b><span><strong>Variation A</strong><strong className="pruned">Variation B · Pruned</strong></span><b>Review</b></div>, text: '质量差或成本高的 branch 可以被剪枝。' },
  stop: { graph: <div className="router-path"><b>Generate</b><i>→</i><b>Test</b><i>→</i><strong className="stopped">Stop</strong></div>, text: '当前 branch 或执行可以提前结束。' },
};

function ConceptualDagGraph({ stage, onNodeSelect }: { stage: number; onNodeSelect: (node: string) => void }) {
  return (
    <div className="dag-concept-graph" aria-label="Input 到 Generate，再分支到 Variation 与 Debate，最后汇合至 Review 和 Output 的教学化 DAG 示意图">
      <b className="dag-graph-node dag-input">Input</b>
      <span className="dag-edge dag-direct dag-input-generate" aria-hidden="true" />
      <button type="button" className="dag-graph-node dag-generate" onClick={() => onNodeSelect('generate')}>Generate</button>
      <span className="dag-edge dag-fork" aria-hidden="true"><i className="dag-fork-top" /><i className="dag-fork-bottom" /></span>
      <button type="button" className="dag-graph-node dag-variation" onClick={() => onNodeSelect('variation')}>Variation</button>
      <button type="button" className="dag-graph-node dag-debate" onClick={() => onNodeSelect('debate')}>Debate</button>
      {stage >= 3 ? <><span className="dag-edge dag-merge" aria-hidden="true"><i className="dag-merge-top" /><i className="dag-merge-bottom" /><i className="dag-merge-output" /></span><button type="button" className="dag-graph-node dag-review" onClick={() => onNodeSelect('review')}>Review</button></> : null}
      {stage >= 4 ? <><span className="dag-edge dag-direct dag-review-output" aria-hidden="true" /><b className="dag-graph-node dag-output">Output</b></> : null}
    </div>
  );
}

export function SciDagChapter({ onNext }: { onNext: () => void }) {
  const [buildStage, setBuildStage] = useState(0);
  const [isReplaying, setIsReplaying] = useState(false);
  const [selectedEdge, setSelectedEdge] = useState(false);
  const [cycleRejected, setCycleRejected] = useState(false);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [route, setRoute] = useState<RouteAction | null>(null);
  const [template, setTemplate] = useState<TemplateId>('ideation');

  const buildAction = ['加入 Generate →', '展开分支 →', '汇合到 Review →', '连接 Output →', '重新查看 DAG'][buildStage];
  useEffect(() => {
    if (!isReplaying) return;
    const timers = [
      window.setTimeout(() => setBuildStage(1), 350),
      window.setTimeout(() => setBuildStage(2), 700),
      window.setTimeout(() => setBuildStage(3), 1050),
      window.setTimeout(() => { setBuildStage(4); setIsReplaying(false); }, 1400),
    ];
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [isReplaying]);
  const advanceBuild = () => {
    if (buildStage === 4) { setBuildStage(0); setSelectedEdge(false); setCycleRejected(false); setIsReplaying(true); return; }
    setBuildStage((current) => current + 1);
  };

  return (
    <ChapterFrame
      section="§7"
      paperSection="论文 §5 SciDAG: DAG-Based Multi-Agent Augmentation"
      title="一个 Agent 不够时，怎么把任务拆成一张“DAG（有向无环图）”？"
      subtitle="SciDAG：困难 Skill 的可选多智能体增强"
      purpose={<><p>SciFlow 已经能够执行完整科研流程。</p><p>但如果其中某一个 Skill 需要更广的搜索、辩论、验证或反复修改呢？</p><p>SciDAG 允许选中的困难 Skill临时调用一张多智能体 DAG 来增强执行。</p></>}
      map={[{ id: '5.1', label: '为什么叫 DAG？' }, { id: '5.2', label: '节点和边如何工作？' }, { id: '5.3', label: '路径如何动态改变？' }, { id: '5.4', label: 'Stage-Aware Templates' }]}
    >
      <div className="scidag-optional"><span>OPTIONAL AUGMENTATION</span><strong>SciDAG 是 SciFlow 在需要时可以选择调用的增强工具。</strong></div>

      <TeachingSection number="5.1" title="为什么叫 DAG？">
        <p className="section-lead">Directed · Acyclic · Graph</p>
        <div className={`dag-build-lab build-${buildStage}`}>
          {buildStage === 0 ? <div className="dag-idle-node"><b>Input</b></div> : null}
          {buildStage === 1 ? <div className="dag-chain"><b>Input</b><i>→</i><button type="button" onClick={() => setSelectedNode('generate')}>Generate</button></div> : null}
          {buildStage >= 2 ? <ConceptualDagGraph stage={buildStage} onNodeSelect={setSelectedNode} /> : null}
          <button type="button" className="primary-action dag-build-action" onClick={advanceBuild} disabled={isReplaying}>{isReplaying ? '正在重新查看 DAG…' : buildAction}</button>
        </div>
        {buildStage === 4 ? <div className="dag-structure-controls"><button type="button" className={selectedEdge ? 'active' : ''} onClick={() => setSelectedEdge(true)}>选择 edge：Generate → Debate</button><button type="button" className="danger" onClick={() => setCycleRejected(true)}>尝试连接 Review → Generate</button>{selectedEdge ? <p><b>Directed</b>：上游节点的输出，沿着有方向的边传给下游节点。</p> : null}{cycleRejected ? <p className="cycle-rejected"><b>连接被拒绝：不能形成环。</b>后面的节点可以依赖前面的结果，但执行图不能通过边重新绕回形成 cycle。</p> : null}</div> : null}
        <div className="scidag-statement"><strong>DAG 不是一条固定流水线，而是一张有方向、无环的执行图。</strong></div>
      </TeachingSection>

      <TeachingSection number="5.2" title="节点和边如何工作？">
        <div className="operator-node-lab">
          <div className="operator-node-buttons">{['generate', 'variation', 'debate', 'test', 'refine', 'review'].map((operator) => <button type="button" key={operator} className={selectedNode === operator ? 'active' : ''} onClick={() => setSelectedNode(operator)}>{operator}</button>)}</div>
          {selectedNode ? <div className="operator-node-detail" key={selectedNode}><span>NODE vᵢ</span><b>Operator: {selectedNode}</b><div><i>Specialized Sub-Agent</i><em>+</em><i>Upstream Inputs</i><em>→</em><strong>Intermediate Output</strong></div></div> : <p className="operator-node-hint">点击一个节点，查看它的执行含义。</p>}
        </div>
        <div className="scidag-inline-conclusion">SciDAG 中的节点不是普通圆点，而是一个 operator 与对应的 specialized sub-agent。</div>
      </TeachingSection>

      <TeachingSection number="5.3" title="路径和边如何动态改变？">
        <div className="conditional-routing-lab">
          <div className="router-problem"><b>Input</b><i>↓</i><b>Generate</b><i>↓</i><b>Test</b></div>
          <div className="router-decision"><span>ROUTER DECISION</span><div>{(['continue', 'retry', 'branch', 'prune', 'stop'] as RouteAction[]).map((action) => <button type="button" key={action} className={route === action ? 'active' : ''} onClick={() => setRoute(action)}>{action}</button>)}</div></div>
          {route ? <div className="router-result" key={route}>{routeDescriptions[route].graph}<p>{routeDescriptions[route].text}</p>{route === 'retry' ? <small>Retry execution 保持 DAG特性：没有 Test → Generate 回边。</small> : null}</div> : <p className="router-hint">选择 Router Decision，观察执行图如何变化。</p>}
        </div>
        <p className="scidag-routing-explanation">Conditional edges 根据当前 execution state，决定继续、重试、分支、剪枝或停止。路径会根据中间质量、成本和收敛信号发生变化。</p>

      </TeachingSection>

      <TeachingSection number="5.4" title="不必每次从零开始：Stage-Aware Templates">
        <p className="template-section-subtitle">常见的多智能体协作结构可以被保存为 Template，并在不同科研阶段重复使用。</p>
        <div className="template-concept-callout"><b>Template = 可复用的 DAG 结构</b><span>下次遇到相似 Skill 时，可以直接检索合适的 Template，而不是重新设计整张 DAG。</span></div>
        <div className="stage-template-lab">
          <div className="template-tabs">{(Object.keys(templates) as TemplateId[]).map((key) => <button type="button" key={key} className={template === key ? 'active' : ''} onClick={() => setTemplate(key)}>{templates[key].label}</button>)}</div>
          <div className="template-focus-card" key={template}>
            <span>STAGE-AWARE DAG TEMPLATE</span>
            <b>{templates[template].label}</b>
            <div className="template-dag-line">{templates[template].operators.map((operator, index) => <React.Fragment key={operator}><strong>{operator}</strong>{index < templates[template].operators.length - 1 ? <i>→</i> : null}</React.Fragment>)}</div>
            <p><em>Purpose:</em> {templates[template].purpose}</p>
            <small>示意图为教学化简化，不代表论文中唯一固定的边结构。</small>
          </div>
        </div>
        <div className="template-reuse-flow"><div><b>Difficult Skill</b><i>↓</i><b>Retrieve Template</b><i>↓</i><b>Execute DAG</b><i>↓</i><b>Return Result to SciFlow</b></div><p>执行产生的 trace 和 feedback 可以被记录，供后续 Template 使用和改进。</p></div>
      </TeachingSection>
      <div className="chapter-transition"><strong>但执行过程中产生的失败、反馈和经验，除了被保存，还能不能真正改变系统？</strong><button type="button" className="primary-action" onClick={onNext}>进入 SciEvolve →</button></div>
    </ChapterFrame>
  );
}
