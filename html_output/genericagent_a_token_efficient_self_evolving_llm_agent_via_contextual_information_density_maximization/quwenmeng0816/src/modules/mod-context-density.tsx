import React, { useState } from 'react';
import type { WidgetProps } from './registry';

type Segment = { label: string; value: number; cls: string };

function normalize(values: Segment[]) {
  const total = values.reduce((sum, item) => sum + item.value, 0);
  return values.map((item) => ({ ...item, pct: (item.value / total) * 100 }));
}

function ContextPanel({ title, badge, segments, method }: { title: string; badge: string; segments: Segment[]; method: 'naive' | 'ga' }) {
  const normalized = normalize(segments);
  const useful = segments.filter((item) => item.cls === 'useful').reduce((sum, item) => sum + item.value, 0);
  const total = segments.reduce((sum, item) => sum + item.value, 0);
  return (
    <section className={`density-panel ${method}`}>
      <div className="density-head"><div><b>{title}</b><small>{badge}</small></div><strong>{Math.round((useful / total) * 100)}% useful</strong></div>
      <div className="density-stack" aria-label={`${title} 上下文构成`}>
        {normalized.map((item) => <i key={item.label} className={item.cls} style={{ width: `${item.pct}%` }} title={`${item.label} ${item.value.toFixed(1)}k`} />)}
      </div>
      <div className="density-legend">
        {segments.map((item) => <span key={item.label}><i className={item.cls} />{item.label}<b>{item.value.toFixed(1)}k</b></span>)}
      </div>
    </section>
  );
}

export const ModContextDensity: React.FC<WidgetProps> = () => {
  const [budget, setBudget] = useState(30);
  const naiveUseful = 4 + budget * 0.04;
  const naive: Segment[] = [
    { label: '工具描述', value: budget * 0.18, cls: 'tools' },
    { label: '对话历史', value: budget * 0.22, cls: 'history' },
    { label: '网页 / 输出', value: budget * 0.28, cls: 'web' },
    { label: '中间日志', value: Math.max(0.5, budget - naiveUseful - budget * 0.68), cls: 'logs' },
    { label: '决策相关信息', value: naiveUseful, cls: 'useful' },
  ];
  const gaUseful = Math.min(budget * 0.7, 7 + budget * 0.38);
  const ga: Segment[] = [
    { label: '最小工具接口', value: budget * 0.08, cls: 'tools' },
    { label: '任务状态', value: budget * 0.13, cls: 'state' },
    { label: '按需记忆', value: budget * 0.09, cls: 'memory' },
    { label: '决策相关信息', value: gaUseful, cls: 'useful' },
    { label: '保留余量', value: Math.max(0.3, budget - gaUseful - budget * 0.3), cls: 'free' },
  ];

  return (
    <div className="density-lab">
      <div className="density-grid">
        <ContextPanel title="Naive Agent" badge="历史默认进入窗口" segments={naive} method="naive" />
        <ContextPanel title="GenericAgent" badge="信息按规则进入窗口" segments={ga} method="ga" />
      </div>
      <div className="ctrl density-control">
        <label>Context Budget <span className="val">{budget}K</span></label>
        <input type="range" min="10" max="50" step="5" value={budget} onChange={(event) => setBudget(Number(event.target.value))} />
        <div className="density-scale"><span>10K</span><span>30K</span><span>50K</span></div>
      </div>
      <div className="density-punchline"><span>The goal is not more context.</span><strong>The goal is denser context.</strong></div>
      <div className="feedback good">拖动预算会改变可容纳的信息量，但不会自动改变准入策略。数值是用于解释“密度”的可视化模型，不是论文表格中的测量结果。</div>
    </div>
  );
};
