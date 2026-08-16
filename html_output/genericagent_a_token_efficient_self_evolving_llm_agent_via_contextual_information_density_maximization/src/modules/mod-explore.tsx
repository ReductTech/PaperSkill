import React, { useState } from 'react';
import type { WidgetProps } from './registry';

const CANDIDATES = [
  { id: 'breadth', label: '补齐薄弱类别', category: 'web_automation', skill: 'multi-step form', b: 9, d: 2, u: 7, i: 6 },
  { id: 'depth', label: '强化高频技能', category: 'data_processing', skill: 'large CSV recovery', b: 3, d: 9, u: 8, i: 5 },
  { id: 'novel', label: '探索新技术', category: 'research', skill: 'citation graph', b: 6, d: 3, u: 6, i: 10 },
] as const;
type Candidate = (typeof CANDIDATES)[number]['id'];
const WEIGHTS = { b: 0.3, d: 0.2, u: 0.3, i: 0.2 };

export const ModExplore: React.FC<WidgetProps> = () => {
  const [candidateId, setCandidateId] = useState<Candidate>('breadth');
  const current = CANDIDATES.find((item) => item.id === candidateId)!;
  const dimensions = [
    { key: 'B', label: 'Breadth · 广度', value: current.b, weight: WEIGHTS.b },
    { key: 'D', label: 'Depth · 深度', value: current.d, weight: WEIGHTS.d },
    { key: 'U', label: 'Utility · 效用', value: current.u, weight: WEIGHTS.u },
    { key: 'I', label: 'Innovation · 创新', value: current.i, weight: WEIGHTS.i },
  ];
  const score = dimensions.reduce((sum, item) => sum + item.value * item.weight, 0);
  return (
    <div className="curriculum-planner">
      <div className="skill-tree-strip">
        <div><small>TWO-LEVEL SKILL TREE</small><b>Category</b><span>web_automation · data_processing · research · …</span></div>
        <i>→</i>
        <div><small>EACH NAMED SKILL STORES</small><b>Tool scripts + usage counter ↑</b><span>既是全局能力索引，也是课程规划数据集</span></div>
      </div>
      <div className="candidate-tabs">
        {CANDIDATES.map((item) => <button key={item.id} className={candidateId === item.id ? 'active' : ''} onClick={() => setCandidateId(item.id)}><small>{item.category}</small><b>{item.label}</b><span>{item.skill}</span></button>)}
      </div>
      <div className="candidate-score">
        <section>
          <small>CANDIDATE TASK</small><h4>{current.label}</h4><code>{current.category} / {current.skill}</code>
          <div className="score-total"><span>S(t)</span><b>{score.toFixed(1)}</b><small>/ 10</small></div>
        </section>
        <div className="dimension-bars">
          {dimensions.map((item) => <div key={item.key}><header><b>{item.key}</b><span>{item.label}</span><small>{item.value} × {item.weight}</small></header><i><em style={{ width: `${item.value * 10}%` }} /></i><p>加权贡献 {(item.value * item.weight).toFixed(1)}</p></div>)}
        </div>
      </div>
      <div className="planner-rules"><span><b>初始权重</b> B/D/U/I = 0.3 / 0.2 / 0.3 / 0.2</span><span><b>覆盖约束</b> 任务列表至少横跨 4 个技能类别</span><span><b>控制流</b> Planner 写表后立即 yield，下一次 invocation 才执行</span></div>
      <div className="feedback">候选的 1–10 分是交互示例；评分维度、初始权重、四类别覆盖约束及规划/执行分离均对应论文 §3.3。</div>
    </div>
  );
};
