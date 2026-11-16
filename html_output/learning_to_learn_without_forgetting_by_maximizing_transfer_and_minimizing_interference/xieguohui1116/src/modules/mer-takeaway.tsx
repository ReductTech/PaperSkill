import React, { useState } from 'react';

const GREEN = '#228d5c';
const BLUE = '#27446e';
const RED = '#c43f52';
const INK = '#21324a';
const MUTED = '#68778f';
const LINE = '#d7deea';

const BEATS = [
  { color: RED, tag: '问题', title: '遗忘 = 干扰', body: '顺序学习时，新样本的梯度与旧任务点积为负，一步更新就把旧知识冲掉。' },
  { color: BLUE, tag: '洞察', title: '迁移与干扰是时间对称的', body: '点积 >0 迁移、<0 干扰；共享越多两者潜力越大，所以要「学会何时共享」而不是一味减少共享。' },
  { color: GREEN, tag: '方法', title: '回放 + 元学习对齐', body: '蓄水池采样的小记忆近似平稳分布，Reptile 一阶近似最大化点积——小记忆就够，越非平稳越强。' },
];

export function MerTakeaway() {
  const [idx, setIdx] = useState(0);

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', gap: 14 }}>
        {BEATS.map((b, i) => (
          <button key={i} onClick={() => setIdx(i)}
            style={{ flex: 1, textAlign: 'left', background: idx === i ? '#fff' : '#f7f9fc', border: `2px solid ${idx === i ? b.color : LINE}`, borderRadius: 14, padding: '16px 18px', cursor: 'pointer' }}>
            <div style={{ fontSize: 24, color: b.color, fontWeight: 700 }}>{b.tag}</div>
            <div style={{ fontSize: 28, color: INK, fontWeight: 700, marginTop: 6 }}>{b.title}</div>
          </button>
        ))}
      </div>
      <div style={{ flex: 1, background: '#fff', border: '1px solid #d7deea', borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: 44, fontWeight: 800, color: BEATS[idx].color }}>{BEATS[idx].title}</div>
        <p style={{ fontSize: 30, color: INK, lineHeight: 1.5, margin: 0 }}>{BEATS[idx].body}</p>
      </div>
      <div style={{ fontSize: 26, color: MUTED, background: '#f2f6ee', borderLeft: `6px solid ${GREEN}`, borderRadius: 8, padding: 14, lineHeight: 1.5 }}>
        对照上次读的 EWC：EWC 是「减少共享、钉住重要参数」，只护住过去；MER 是「学会何时共享」，把过去和未来一起经营。这是从「防遗忘」到「会迁移」的一步升级。
      </div>
    </div>
  );
}
