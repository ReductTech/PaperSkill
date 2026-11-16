import React, { useState } from 'react';
import type { WidgetProps } from './registry';

const C = {
  bg: '#f5f8f0', wood: '#92400e', woodSoft: '#f3e6d2', envL: '#b8c9a7', envD: '#76906a',
  blue: '#27446e', green: '#228d5c', red: '#c43f52', orange: '#f07e47',
  ink: '#21324a', muted: '#68778f', line: '#d7deea',
};

export function S10Correlation(_props: WidgetProps) {
  const [level, setLevel] = useState<'capability' | 'pair'>('capability');
  const cap = level === 'capability';

  const block = (id: 'capability' | 'pair', title: string, value: string, text: string, color: string) => {
    const active = level === id;
    return (
      <button type="button" onClick={() => setLevel(id)}
        style={{
          flex: 1, textAlign: 'left', padding: '14px 18px', borderRadius: 16, cursor: 'pointer', fontFamily: 'inherit',
          background: '#fff', border: `2px solid ${active ? color : C.line}`,
          boxShadow: active ? '0 8px 18px rgba(25,42,70,.10)' : 'none',
        }}>
        <div style={{ fontSize: 21, color: C.muted }}>{title}</div>
        <div style={{ fontSize: 38, fontWeight: 800, color, lineHeight: 1.15 }}>r = {value}</div>
        <div style={{ fontSize: 20, color: C.ink, lineHeight: 1.45, marginTop: 4 }}>{text}</div>
        {active && <div style={{ fontSize: 17, color, marginTop: 4 }}>当前查看</div>}
      </button>
    );
  };

  return (
    <div style={{ width: 1472, height: 622, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ background: C.bg, border: `2px solid ${C.line}`, borderRadius: 16, padding: '8px 12px', position: 'relative' }}>
        <img src="./images/fig5-cd.png" alt="论文图 5 的 (c)(d) 两联：能力级平均对齐与平均增益 r=0.795；133 个源-目标对 r=0.529"
          style={{ width: '100%', height: 356, objectFit: 'contain', display: 'block' }} />
        {[{ side: 'left', id: 'capability' as const, label: '(c) 能力级' }, { side: 'right', id: 'pair' as const, label: '(d) 任务对级' }].map((hot) => (
          <button key={hot.id} type="button" onClick={() => setLevel(hot.id)}
            aria-label={`查看 ${hot.label} 面板`}
            style={{
              position: 'absolute', top: 8, [hot.side]: 12, width: '48%', height: 356,
              background: level === hot.id ? 'rgba(39,68,110,.06)' : 'transparent',
              border: `2px ${level === hot.id ? 'solid' : 'dashed'} ${level === hot.id ? C.blue : 'transparent'}`,
              borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'flex-start', justifyContent: hot.side === 'left' ? 'flex-start' : 'flex-end',
              color: level === hot.id ? C.blue : 'transparent', fontSize: 18, padding: 8,
            } as React.CSSProperties}>{hot.label}</button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 14 }}>
        {block('capability', '能力级：7 个能力的平均对齐 vs 平均增益', '0.795', '梯度更兼容的能力，拿到的平均增益也更大。', C.green)}
        {block('pair', '任务对级：19 × 7 = 133 个源-目标对', '0.529', '方向仍同向，但单对更松：对齐高不一定迁移大。', C.blue)}
        <div style={{ width: 380, padding: '14px 18px', borderRadius: 16, background: '#fff', border: `2px solid ${C.orange}`, display: 'flex', gap: 12, alignItems: 'center' }}>
          <svg viewBox="0 0 100 72" width="86" height="62" aria-label="两把扳手，方向接近则分数为正">
            <path d="M14 58 L44 24" stroke={C.blue} strokeWidth="9" strokeLinecap="round" />
            <circle cx="48" cy="19" r="11" fill="none" stroke={C.blue} strokeWidth="7" />
            <path d="M26 60 L58 32" stroke={C.orange} strokeWidth="9" strokeLinecap="round" opacity=".85" />
            <circle cx="62" cy="27" r="11" fill="none" stroke={C.orange} strokeWidth="7" opacity=".85" />
          </svg>
          <div style={{ fontSize: 20, lineHeight: 1.45, color: C.ink }}>
            相关不是因果：论文的措辞是“与……相关”，不是“对齐导致迁移”。两把扳手的夹角越小，分数越大。
          </div>
        </div>
      </div>
    </div>
  );
}
