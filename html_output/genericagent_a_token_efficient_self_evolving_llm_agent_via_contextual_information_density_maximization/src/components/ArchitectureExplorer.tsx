import React, { useState } from 'react';

type Part = 'tools' | 'memory' | 'evolution' | 'context';

const PARTS: Record<Part, { title: string; question: string; chain: string[]; note: string }> = {
  tools: {
    title: 'Minimal Atomic Tools',
    question: '为什么只保留少量原子工具？',
    chain: ['更短的 Tool Schema', '更小的动作空间', '通过组合获得复杂能力'],
    note: 'GA 使用 9 个无重叠原语。减少的不只是提示长度，也包括选错工具与重试的成本。',
  },
  memory: {
    title: 'Hierarchical Memory',
    question: '为什么记住，不等于全部放进 Context？',
    chain: ['L1 轻量索引常驻', 'L2 事实 / L3 SOP 按需', 'L4 原始会话仅存档'],
    note: '深层知识默认位于活动上下文之外，只有当前任务真正需要时才检索。',
  },
  evolution: {
    title: 'Self-Evolution',
    question: 'Agent 如何把一次成功变成下次的捷径？',
    chain: ['Verified Trajectory', 'Reflection', 'SOP / Code / Skill'],
    note: '演化的是可读、可修改的信息资产，不是底座模型权重。',
  },
  context: {
    title: 'Context Manager',
    question: '窗口满了以后，什么应该留下？',
    chain: ['截断单条输出', '压缩与淘汰旧内容', '工作记忆锚保住状态'],
    note: '目标不是追求更大的窗口，而是在有限预算里持续保住决策相关信息。',
  },
};

export function ArchitectureExplorer() {
  const [selected, setSelected] = useState<Part>('tools');
  const current = PARTS[selected];

  return (
    <div className="architecture-explorer">
      <div className="architecture-map" aria-label="GenericAgent 四模块交互架构">
        <button className={`arch-node arch-top ${selected === 'evolution' ? 'active' : ''}`} onClick={() => setSelected('evolution')}>
          <span>Self-Evolution</span><small>把经验变成能力</small>
        </button>
        <button className={`arch-node arch-left ${selected === 'tools' ? 'active' : ''}`} onClick={() => setSelected('tools')}>
          <span>Minimal Tools</span><small>减少常驻开销</small>
        </button>
        <div className="arch-hub"><strong>GenericAgent</strong><small>Decision Loop</small></div>
        <button className={`arch-node arch-right ${selected === 'memory' ? 'active' : ''}`} onClick={() => setSelected('memory')}>
          <span>Memory</span><small>按需读取</small>
        </button>
        <button className={`arch-node arch-bottom ${selected === 'context' ? 'active' : ''}`} onClick={() => setSelected('context')}>
          <span>Context Manager</span><small>维持信息密度</small>
        </button>
        <div className="arch-environment">Environment / Task</div>
      </div>
      <aside className="architecture-detail" aria-live="polite">
        <div className="architecture-kicker">CLICKED MODULE</div>
        <h3>{current.title}</h3>
        <p className="architecture-question">{current.question}</p>
        <div className="architecture-chain">
          {current.chain.map((item, i) => (
            <React.Fragment key={item}>
              <div>{item}</div>{i < current.chain.length - 1 ? <span>↓</span> : null}
            </React.Fragment>
          ))}
        </div>
        <p>{current.note}</p>
      </aside>
    </div>
  );
}
