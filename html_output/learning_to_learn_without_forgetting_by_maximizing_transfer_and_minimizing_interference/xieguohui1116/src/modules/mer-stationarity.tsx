import React, { useState } from 'react';

const GREEN = '#228d5c';
const BLUE = '#27446e';
const RED = '#c43f52';
const ORANGE = '#f07e47';
const INK = '#21324a';
const MUTED = '#68778f';
const LINE = '#d7deea';

const DATA = {
  many: { title: 'Many Permutations（100 任务 × 200 样本）', bars: [
    { name: 'Online', v: 32.62, c: RED }, { name: 'EWC', v: 33.46, c: ORANGE },
    { name: 'GEM 5120', v: 56.76, c: BLUE }, { name: 'GEM 500', v: 32.14, c: BLUE },
    { name: 'MER 5120', v: 62.52, c: GREEN }, { name: 'MER 500', v: 47.40, c: GREEN },
  ], note: '任务翻 5 倍、每个任务样本只剩 1/5，非平稳性大增：GEM 在记忆 500 时只剩 32.14，MER 仍有 47.40。' },
  omni: { title: 'Omniglot（50 个字母表）', bars: [
    { name: 'Online', v: 4.36, c: RED }, { name: 'EWC', v: 4.63, c: ORANGE },
    { name: 'GEM 5120', v: 18.03, c: BLUE }, { name: 'MER 5120', v: 75.23, c: GREEN }, { name: 'MER 500', v: 32.05, c: GREEN },
  ], note: '最非平稳的基准：MER（75.23）约为 GEM（18.03）的 4 倍；GEM 在记忆 500 时二次规划无法稳定收敛，MER 仍能跑。' },
};

const DOTS = [
  { name: 'Permuted', er: -0.569, mer: 0.042 },
  { name: 'Rotations', er: -1.652, mer: 0.017 },
  { name: 'Many Perm', er: -1.280, mer: 0.131 },
];

export function MerStationarity() {
  const [which, setWhich] = useState<'many' | 'omni'>('many');
  const d = DATA[which];
  const max = Math.max(...d.bars.map(b => b.v));

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={() => setWhich('many')} style={{ fontSize: 24, padding: '8px 16px', borderRadius: 10, cursor: 'pointer', border: `2px solid ${which === 'many' ? GREEN : LINE}`, background: which === 'many' ? GREEN : '#fff', color: which === 'many' ? '#fff' : INK, fontWeight: 700 }}>Many Permutations</button>
        <button onClick={() => setWhich('omni')} style={{ fontSize: 24, padding: '8px 16px', borderRadius: 10, cursor: 'pointer', border: `2px solid ${which === 'omni' ? GREEN : LINE}`, background: which === 'omni' ? GREEN : '#fff', color: which === 'omni' ? '#fff' : INK, fontWeight: 700 }}>Omniglot</button>
        <span style={{ fontSize: 26, color: MUTED, alignSelf: 'center' }}>{d.title}</span>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: 16, padding: '0 20px', borderBottom: `2px solid ${LINE}`, minHeight: 0 }}>
        {d.bars.map(b => (
          <div key={b.name} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
            <div style={{ fontSize: 26, color: INK, fontWeight: 700, fontFamily: 'Consolas, monospace' }}>{b.v.toFixed(2)}</div>
            <div style={{ width: '66%', height: `${Math.max(8, Math.round((b.v / max) * 260))}px`, background: b.c, borderRadius: '6px 6px 0 0' }} />
            <div style={{ fontSize: 21, color: b.c, fontWeight: 700, whiteSpace: 'nowrap' }}>{b.name}</div>
          </div>
        ))}
      </div>
      <p style={{ fontSize: 25, color: MUTED, margin: 0, lineHeight: 1.35 }}>{d.note} 来源：论文 Table 3。</p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 18, background: '#fff', border: '1px solid #d7deea', borderRadius: 14, padding: 14 }}>
        <div style={{ fontSize: 26, color: INK, fontWeight: 700 }}>平均梯度点积（Table 4）</div>
        {DOTS.map(dt => (
          <div key={dt.name} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ fontSize: 22, color: MUTED }}>{dt.name}</div>
            <div style={{ fontSize: 24, fontFamily: 'Consolas, monospace', fontWeight: 700 }}>
              <span style={{ color: RED }}>ER {dt.er.toFixed(3)}</span> → <span style={{ color: GREEN }}>MER {dt.mer.toFixed(3)}</span>
            </div>
          </div>
        ))}
        <div style={{ fontSize: 24, color: BLUE, maxWidth: 300, lineHeight: 1.35 }}>MER 把新样本与旧样本的梯度点积从「显著为负（干扰）」扭转为「略为正（轻微迁移）」，直接验证了目标 Eq.7。</div>
      </div>
    </div>
  );
}
