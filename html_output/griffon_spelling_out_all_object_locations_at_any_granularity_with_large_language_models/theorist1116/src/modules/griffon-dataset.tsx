import React, { useState } from 'react';
import type { WidgetProps } from './registry';

/** Discrete recipe points from the paper — no interpolation. */
const STACKS = [
  { id: 0, name: 'REC 堆', amount: 4, unit: 'M', detail: '预训练中近 4M REC（如 Visual Genome 等）', focus: 'pretrain' as const },
  { id: 1, name: '检测堆', amount: 2, unit: 'M', detail: '预训练中近 2M 检测（如 Objects365 等）', focus: 'pretrain' as const },
  { id: 2, name: '合计预训练', amount: 6, unit: 'M', detail: '过滤后约 6M image-text；GPT-4V 生成任务模板', focus: 'pretrain' as const },
  { id: 3, name: '指令册', amount: 900, unit: 'K', detail: '约 900K 指令；含 Flickr30K Entities 与 LVIS 负类', focus: 'instruct' as const },
];

export function GriffonDataset(_props: WidgetProps) {
  const [index, setIndex] = useState(2);
  const row = STACKS[index];
  const pre = row.focus === 'pretrain';
  const bar = pre ? (row.amount / 6) * 300 : 180;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 28, height: '100%', color: '#21324a' }}>
      <div style={{ background: '#dfe8d6', borderRadius: 18, border: '1px solid #76906a', padding: 24, position: 'relative' }}>
        <div style={{ fontSize: 28, color: '#68778f', marginBottom: 12 }}>档案柜 · 接触印样库</div>
        <svg viewBox="0 0 640 420" width="100%" height="78%">
          {[0, 1, 2, 3, 4].map((i) => (
            <rect key={i} x={40 + i * 18} y={40 + i * 14} width={420} height={260} rx="8"
              fill={pre ? '#fff' : '#eef6ff'} stroke={pre ? '#27446e' : '#228d5c'} strokeWidth="2" opacity={0.85 - i * 0.1} />
          ))}
          <text x="70" y="100" fill="#21324a" fontSize="28" fontWeight="700">{row.name}</text>
          <text x="70" y="150" fill="#68778f" fontSize="24">{`≈ ${row.amount}${row.unit}`}</text>
          <rect x="70" y="190" width={bar} height="28" rx="6" fill={pre ? '#27446e' : '#228d5c'} />
          <text x="70" y="260" fill="#21324a" fontSize="22">{row.detail}</text>
          <text x="70" y="300" fill="#21324a" fontSize="22">类别多样性 &gt; 76K</text>
        </svg>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, justifyContent: 'center' }}>
        <div style={{ fontSize: 34, fontWeight: 700, lineHeight: 1.3 }}>先补齐数据，才能释放 LVLM</div>
        <p style={{ fontSize: 28, margin: 0, color: '#68778f', lineHeight: 1.45 }}>
          拖滑块只跳到论文已报告的构成点，不会在 4M 与 2M 之间插值。
        </p>
        <label style={{ fontSize: 28, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span>印样堆切换 · {row.name}</span>
          <input
            type="range"
            min={0}
            max={3}
            step={1}
            value={index}
            onChange={(e) => setIndex(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#228d5c' }}
          />
        </label>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {STACKS.map((s, i) => (
            <button key={s.id} type="button" onClick={() => setIndex(i)} style={chip(i === index)}>
              {s.name}
            </button>
          ))}
        </div>
        <div style={{ fontSize: 28, padding: 16, borderRadius: 12, background: '#eef2f8', color: '#27446e', lineHeight: 1.4 }}>
          {pre
            ? '预训练关键不是堆百万级 REC，而是覆盖多目标检测与细粒度区分，再用 GPT-4V 模板对齐对话格式。'
            : '指令阶段把四场景写成人话，并加入负类 / 细粒度错误属性，练会拒识。'}
        </div>
      </div>
    </div>
  );
}

function chip(active: boolean): React.CSSProperties {
  return {
    fontSize: 24, padding: '8px 12px', borderRadius: 10, cursor: 'pointer',
    border: `2px solid ${active ? '#27446e' : '#d7deea'}`,
    background: active ? '#27446e' : '#fff', color: active ? '#fff' : '#21324a',
  };
}
