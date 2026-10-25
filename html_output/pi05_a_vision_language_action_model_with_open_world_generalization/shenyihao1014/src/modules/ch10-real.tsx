import React, { useState } from 'react';
import type { WidgetProps } from './registry';

// §10.1 「三所真实新家：持续成功」: bar chips {真实家 | 模拟屋}.
// 真实家 = three home cards (Home 1/2/3) with per-task qualitative progress
// marks (抽屉 / 衣物篮 / 餐具入池) — bars are 示意, conclusions follow paper
// Fig 7 — plus the green badge 「模拟屋成绩可代表真实家」 and the condition
// note 「2-5 分钟多阶段 · 10 trials」. 模拟屋 = short explainer card
// (controlled, reproducible comparison). No invented numeric scores.
type View = 'real' | 'mock';

const GREEN = '#228d5c';
const BLUE = '#27446e';
const MUTED = '#68778f';
const BORDER = '#d7deea';

const HOMES: { name: string; bars: number[] }[] = [
  { name: 'Home 1', bars: [0.88, 0.8, 0.92] },
  { name: 'Home 2', bars: [0.84, 0.9, 0.78] },
  { name: 'Home 3', bars: [0.9, 0.76, 0.86] },
];
const TASKS = ['抽屉', '衣物篮', '餐具入池'];

const badgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '4px 12px',
  background: '#e6f3ec',
  border: `1.5px solid ${GREEN}`,
  borderRadius: 999,
  color: GREEN,
  fontSize: 12,
  fontWeight: 700,
};
const noteStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '4px 12px',
  background: '#f5f8f0',
  border: `1px solid ${BORDER}`,
  borderRadius: 999,
  color: MUTED,
  fontSize: 12,
};

const taskRow = (label: string, w: number): React.ReactNode => (
  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '7px 0' }}>
    <div style={{ width: 56, flexShrink: 0, fontSize: 12, color: '#21324a' }}>{label}</div>
    <div style={{ flex: 1, height: 12, background: '#f5f8f0', border: `1px solid ${BORDER}`, borderRadius: 6, overflow: 'hidden' }}>
      <div style={{ width: `${w * 100}%`, height: '100%', background: GREEN, borderRadius: 5 }} />
    </div>
    <span aria-hidden="true" style={{ flexShrink: 0, color: GREEN, fontSize: 12, fontWeight: 700 }}>✓</span>
  </div>
);

export const Ch10Real: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [view, setView] = useState<View | null>(null);

  return (
    <div id={`w-${chapterId}-${moduleId}`}>
      <div className="chip-row">
        <button className={`chip ${view === 'real' ? 'selected' : ''}`} onClick={() => setView('real')}>
          真实家
        </button>
        <button className={`chip ${view === 'mock' ? 'selected' : ''}`} onClick={() => setView('mock')}>
          模拟屋
        </button>
      </div>

      {view === 'real' ? (
        <div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', margin: '4px 0 12px' }}>
            <span style={badgeStyle}>✓ 模拟屋成绩可代表真实家</span>
            <span style={noteStyle}>2-5 分钟多阶段 · 10 trials</span>
          </div>
          <div className="three-col-demo">
            {HOMES.map((home) => (
              <div key={home.name} className="three-col-panel clean">
                <div className="three-col-label" style={{ color: '#21324a' }}>
                  {home.name} · 卧室+厨房
                </div>
                {TASKS.map((task, i) => taskRow(task, home.bars[i]))}
                <div style={{ marginTop: 6, fontSize: 12, color: GREEN, fontWeight: 700, textAlign: 'center' }}>持续成功 ✓</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11, color: MUTED, marginTop: 6 }}>示意 · 结论以论文图 7 为准</div>
        </div>
      ) : null}

      {view === 'mock' ? (
        <div className="hotspot-info" style={{ borderLeftColor: BLUE }}>
          <div style={{ fontWeight: 700, color: '#21324a', marginBottom: 6 }}>模拟屋 = 可控、可复现的对照环境</div>
          <div style={{ color: '#21324a' }}>
            同一套布局与物体可以逐次复现，前几章的<b>消融对比</b>大多在这里跑分。论文验证的关键一环：
            <b style={{ color: GREEN }}>模拟屋成绩可代表真实家成绩</b>——在模拟屋里分高的配方，进了没见过的真实家同样分高。
          </div>
          <div style={{ marginTop: 10 }}>
            <span style={badgeStyle}>✓ 模拟屋成绩可代表真实家</span>
          </div>
        </div>
      ) : null}

      <div
        className={`feedback ${view === 'real' ? 'good' : ''}`}
        dangerouslySetInnerHTML={{
          __html:
            view === 'real'
              ? '2-5 分钟多阶段任务、10 次试验——<b>新家的门是照着成绩推开的</b>。'
              : view === 'mock'
                ? '可控、可复现的对照环境——消融结论由此安全外推到真实家。'
                : '切换「真实家 / 模拟屋」，看两种评测环境各司其职。',
        }}
      />
    </div>
  );
};

export default Ch10Real;
