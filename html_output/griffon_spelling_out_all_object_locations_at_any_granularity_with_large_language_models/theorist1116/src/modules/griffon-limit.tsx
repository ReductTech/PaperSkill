import React, { useState } from 'react';
import type { WidgetProps } from './registry';

const people = [
  { id: 0, x: 160, label: '穿棕衣的人' },
  { id: 1, x: 340, label: '左侧行人' },
  { id: 2, x: 520, label: '右侧行人' },
];

export function GriffonLimit(_props: WidgetProps) {
  const [mode, setMode] = useState<'single' | 'insight'>('single');
  const [selected, setSelected] = useState<number | null>(null);

  const pick = (id: number) => {
    if (mode === 'single') setSelected(id);
    else setSelected(id);
  };

  const missed = mode === 'single' && selected !== null;
  const ok = mode === 'insight';

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.35fr 0.85fr', gap: 28, height: '100%', color: '#21324a' }}>
      <div style={{ position: 'relative', background: '#dfe8d6', borderRadius: 18, border: '1px solid #76906a', overflow: 'hidden' }}>
        <svg viewBox="0 0 700 520" width="100%" height="100%" role="group" aria-label="棚拍场景，点击人物框选">
          <rect x="40" y="40" width="620" height="360" rx="12" fill="#c5d4b4" />
          <text x="60" y="78" fill="#68778f" fontSize="22">摄影棚试拍</text>
          {people.map((p) => {
            const active = selected === p.id;
            const fail = missed && selected !== p.id;
            return (
              <g key={p.id} style={{ cursor: 'pointer' }} onClick={() => pick(p.id)}>
                <ellipse cx={p.x} cy="260" rx="42" ry="78" fill={fail ? '#c43f52' : '#68778f'} opacity={fail ? 0.45 : 0.95} />
                <circle cx={p.x} cy="168" r="28" fill="#21324a" opacity={fail ? 0.45 : 1} />
                {active && (
                  <rect x={p.x - 55} y="120" width="110" height="210" fill="none" stroke={ok ? '#228d5c' : '#f07e47'} strokeWidth="5" />
                )}
                {ok && (
                  <rect x={p.x - 55} y="120" width="110" height="210" fill="none" stroke="#228d5c" strokeWidth="4" />
                )}
                {fail && (
                  <text x={p.x - 24} y="400" fill="#c43f52" fontSize="22" fontWeight="700">漏检</text>
                )}
                <text x={p.x - 40} y="430" fill="#21324a" fontSize="18">{p.label}</text>
              </g>
            );
          })}
        </svg>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, justifyContent: 'center' }}>
        <div style={{ fontSize: 34, fontWeight: 700, lineHeight: 1.25 }}>为什么只框一个不够？</div>
        <p style={{ fontSize: 28, margin: 0, lineHeight: 1.45, color: '#68778f' }}>
          现有 LVLM 常被训练成 REC：找到单个、已存在目标。复杂场面里，同场其他人会被直接丢掉。
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button type="button" onClick={() => { setMode('single'); setSelected(null); }}
            style={btn(mode === 'single')}>单目标模式</button>
          <button type="button" onClick={() => setMode('insight')}
            style={btn(mode === 'insight')}>需要全场景定位</button>
        </div>
        <div style={{
          marginTop: 8, padding: '16px 18px', borderRadius: 12, fontSize: 28, lineHeight: 1.4,
          background: ok ? '#e7f6ee' : missed ? '#fde8eb' : '#eef2f8',
          color: ok ? '#228d5c' : missed ? '#c43f52' : '#27446e',
          border: `1px solid ${ok ? '#228d5c' : missed ? '#c43f52' : '#27446e'}33`,
        }}>
          {ok
            ? '洞察：要在任意粒度标出全部目标，而不是只留一个框。'
            : missed
              ? '反馈：锁定单框后，其他人全部漏检（红）。'
              : '点选人物试试：单目标模式只会保留一个橙框。'}
        </div>
      </div>
    </div>
  );
}

function btn(active: boolean): React.CSSProperties {
  return {
    fontSize: 28, padding: '10px 18px', borderRadius: 10, cursor: 'pointer',
    border: `2px solid ${active ? '#27446e' : '#d7deea'}`,
    background: active ? '#27446e' : '#fff', color: active ? '#fff' : '#21324a',
  };
}
