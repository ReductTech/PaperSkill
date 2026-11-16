import React, { useState } from 'react';

const GREEN = '#228d5c';
const BLUE = '#27446e';
const RED = '#c43f52';
const ORANGE = '#f07e47';
const INK = '#21324a';
const MUTED = '#68778f';
const LINE = '#d7deea';

const TABLE1: Record<string, { name: string; color: string; rot: number; perm: number }[]> = {
  Rotations: [
    { name: 'Online', color: RED, rot: 53.38, perm: 55.42 },
    { name: 'Independent', color: MUTED, rot: 60.74, perm: 55.80 },
    { name: 'Task Input', color: MUTED, rot: 79.98, perm: 80.46 },
    { name: 'EWC', color: ORANGE, rot: 57.96, perm: 62.32 },
    { name: 'GEM', color: BLUE, rot: 87.58, perm: 83.02 },
    { name: 'MER', color: GREEN, rot: 89.56, perm: 85.50 },
  ],
  Permutations: [
    { name: 'Online', color: RED, rot: 53.38, perm: 55.42 },
    { name: 'Independent', color: MUTED, rot: 60.74, perm: 55.80 },
    { name: 'Task Input', color: MUTED, rot: 79.98, perm: 80.46 },
    { name: 'EWC', color: ORANGE, rot: 57.96, perm: 62.32 },
    { name: 'GEM', color: BLUE, rot: 87.58, perm: 83.02 },
    { name: 'MER', color: GREEN, rot: 89.56, perm: 85.50 },
  ],
};

const TABLE2: Record<string, { label: string; color: string; v5120: number; v500: number; v200: number }[]> = {
  Rotations: [
    { label: 'GEM', color: BLUE, v5120: 87.58, v500: 74.88, v200: 67.38 },
    { label: 'MER', color: GREEN, v5120: 89.56, v500: 82.08, v200: 77.42 },
  ],
  Permutations: [
    { label: 'GEM', color: BLUE, v5120: 83.02, v500: 69.26, v200: 55.42 },
    { label: 'MER', color: GREEN, v5120: 85.50, v500: 77.50, v200: 73.46 },
  ],
};

export function MerBench() {
  const [bench, setBench] = useState<'Rotations' | 'Permutations'>('Rotations');
  const [view, setView] = useState<'all' | 'buffer'>('all');

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={() => setBench('Rotations')} style={{ fontSize: 24, padding: '8px 16px', borderRadius: 10, cursor: 'pointer', border: `2px solid ${bench === 'Rotations' ? GREEN : LINE}`, background: bench === 'Rotations' ? GREEN : '#fff', color: bench === 'Rotations' ? '#fff' : INK, fontWeight: 700 }}>MNIST Rotations</button>
        <button onClick={() => setBench('Permutations')} style={{ fontSize: 24, padding: '8px 16px', borderRadius: 10, cursor: 'pointer', border: `2px solid ${bench === 'Permutations' ? GREEN : LINE}`, background: bench === 'Permutations' ? GREEN : '#fff', color: bench === 'Permutations' ? '#fff' : INK, fontWeight: 700 }}>MNIST Permutations</button>
        <span style={{ flex: 1 }} />
        <button onClick={() => setView('all')} style={{ fontSize: 24, padding: '8px 16px', borderRadius: 10, cursor: 'pointer', border: `2px solid ${view === 'all' ? BLUE : LINE}`, background: view === 'all' ? BLUE : '#fff', color: view === 'all' ? '#fff' : INK, fontWeight: 700 }}>Table 1 · 全方法</button>
        <button onClick={() => setView('buffer')} style={{ fontSize: 24, padding: '8px 16px', borderRadius: 10, cursor: 'pointer', border: `2px solid ${view === 'buffer' ? BLUE : LINE}`, background: view === 'buffer' ? BLUE : '#fff', color: view === 'buffer' ? '#fff' : INK, fontWeight: 700 }}>Table 2 · 缓冲对比</button>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: 18, padding: '0 20px', borderBottom: `2px solid ${LINE}`, minHeight: 0 }}>
        {view === 'all' ? TABLE1[bench].map(m => {
          const v = bench === 'Rotations' ? m.rot : m.perm;
          return (
            <div key={m.name} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
              <div style={{ fontSize: 26, color: INK, fontWeight: 700, fontFamily: 'Consolas, monospace' }}>{v.toFixed(2)}</div>
              <div style={{ width: '70%', height: `${Math.round(v * 3)}px`, background: m.color, borderRadius: '6px 6px 0 0' }} />
              <div style={{ fontSize: 24, color: m.name === 'MER' ? GREEN : m.name === 'GEM' ? BLUE : MUTED, fontWeight: 700, whiteSpace: 'nowrap' }}>{m.name}</div>
            </div>
          );
        }) : TABLE2[bench].flatMap(m => [
          { label: `${m.label} 5120`, color: m.color, v: m.v5120 },
          { label: `${m.label} 500`, color: m.color, v: m.v500 },
          { label: `${m.label} 200`, color: m.color, v: m.v200 },
        ].map(item => (
          <div key={item.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
            <div style={{ fontSize: 26, color: INK, fontWeight: 700, fontFamily: 'Consolas, monospace' }}>{item.v.toFixed(2)}</div>
            <div style={{ width: '60%', height: `${Math.round(item.v * 3)}px`, background: item.color, borderRadius: '6px 6px 0 0' }} />
            <div style={{ fontSize: 22, color: item.color, fontWeight: 700, whiteSpace: 'nowrap' }}>{item.label}</div>
          </div>
        )))}
      </div>

      <p style={{ fontSize: 25, color: MUTED, margin: 0, lineHeight: 1.4 }}>
        {view === 'all'
          ? `RA（最终保留准确率，越高越好）：${bench === 'Rotations' ? 'MER 89.56 领先 GEM 87.58' : 'MER 85.50 领先 GEM 83.02'}；EWC 与 Online 明显落后。来源：论文 Table 1。`
          : `缓冲从 5120 缩到 200：${bench === 'Rotations' ? 'MER 只从 89.56 降到 77.42' : 'MER 只从 85.50 降到 73.46'}，而 GEM ${bench === 'Rotations' ? '从 87.58 跌到 67.38' : '从 83.02 跌到 55.42'}——缓冲越小，MER 优势越大。来源：论文 Table 2。`}
      </p>
    </div>
  );
}
