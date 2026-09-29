import React, { useState } from 'react';
import type { WidgetProps } from './registry';

// Module 9.2 — 大师赛 (P2: step carousel, DOM only; the module figure is the
// paper's figure-13 score chart rendered by the module shell). Seven master
// tasks of 5-20 minutes each; every other method fails these, so π0 only
// competes against its own ablations — the full recipe is best everywhere and
// ALL seven tasks score above half of the maximum (10-trial average).

interface MasterTask {
  name: string;
  diff: string; // one difficulty note, <= 20 chars
  line: string; // one-sentence feedback
}

const TASKS: MasterTask[] = [
  { name: '叠皱衣', diff: '柔性布料带褶皱，最吃手感', line: '最难的一项：完整配方在最难任务上提升最大。' },
  { name: '移动叠衣', diff: '叠好还要端走，长程再加一程', line: '两段长程接连完成，中途不脱手。' },
  { name: '卸烘干机', diff: '开门取衣，多阶段连贯', line: '机门与衣物两类交互串成一条流程。' },
  { name: '新物收拾', diff: '没见过的物件照收不误', line: '泛化到新物件，得分仍过半。' },
  { name: '纸箱组装', diff: '折页合箱，精细对位', line: '折页对位的精细活，同样过半。' },
  { name: '外带盒', diff: '装盒扣盖，一步不能差', line: '装箱同族的精细装配任务。' },
  { name: '装鸡蛋', diff: '易碎品，最怕失手', line: '最怕失手的易碎任务也稳稳过半。' },
];

const ABLATIONS: { label: string; pct: number; color: string }[] = [
  { label: '完整配方', pct: 92, color: '#228d5c' },
  { label: '开箱', pct: 58, color: '#76906a' },
  { label: '从零', pct: 34, color: '#68778f' },
];

const cardStyle: React.CSSProperties = {
  flex: '1 1 320px',
  padding: '14px 18px',
  background: '#fff',
  border: '1px solid #d7deea',
  borderRadius: 10,
};
const badgeStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '3px 12px',
  background: 'rgba(34, 141, 92, 0.12)',
  border: '1px solid #228d5c',
  borderRadius: 999,
  color: '#228d5c',
  fontSize: 13,
  fontWeight: 600,
};
const trackStyle: React.CSSProperties = {
  flex: 1,
  height: 14,
  background: '#e8edf4',
  borderRadius: 7,
  overflow: 'hidden',
};

export const Ch9Master: React.FC<WidgetProps> = () => {
  const [idx, setIdx] = useState(0);
  const task = TASKS[idx];
  const prev = () => setIdx((i) => (i - 1 + TASKS.length) % TASKS.length);
  const next = () => setIdx((i) => (i + 1) % TASKS.length);

  return (
    <div>
      <div className="step-ctrl">
        <button className="tiny ghost" onClick={prev}>
          上一项
        </button>
        <span className="step-label">
          第 <b>{idx + 1}</b> / {TASKS.length} 项 · {task.name}
        </span>
        <button className="tiny ghost" onClick={next}>
          下一项
        </button>
      </div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'stretch' }}>
        <div style={cardStyle}>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#21324a' }}>{task.name}</div>
          <div style={{ margin: '6px 0 12px', color: '#68778f' }}>{task.diff}</div>
          <span style={badgeStyle}>全任务 &gt;50%</span>
        </div>
        <div style={cardStyle}>
          <div style={{ marginBottom: 10, color: '#21324a', fontWeight: 600 }}>
            自我消融对比（柱高示意）
          </div>
          {ABLATIONS.map((a) => (
            <div key={a.label} style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '8px 0' }}>
              <span style={{ width: 64, color: '#68778f', fontSize: 13 }}>{a.label}</span>
              <div style={trackStyle}>
                <div style={{ width: `${a.pct}%`, height: '100%', background: a.color, borderRadius: 7 }} />
              </div>
            </div>
          ))}
          <div style={{ marginTop: 10, color: '#68778f', fontSize: 12 }}>
            完整配方全场最佳；最难任务提升最大
          </div>
        </div>
      </div>
      <div className="step-desc">10 trials 平均分 · 柱高为示意，结论以论文图 13 为准</div>
      <div className="feedback good">
        别的队伍交了白卷——这三根柱子是 π0 和自己的比赛。{task.line}
      </div>
    </div>
  );
};

export default Ch9Master;
