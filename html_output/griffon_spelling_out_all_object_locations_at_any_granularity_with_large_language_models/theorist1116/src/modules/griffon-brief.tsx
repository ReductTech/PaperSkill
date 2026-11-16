import React, { useState } from 'react';
import type { WidgetProps } from './registry';

const CARDS = [
  { prompt: 'Where is the man wearing a light brown coat?', answer: 'single', hint: '单指称 → 一个框' },
  { prompt: 'Is there any bus in the image?', answer: 'multi', hint: '一类多目标 → 多框 & 拼接' },
  { prompt: 'Please help us locate the baby sitting in the car.', answer: 'none', hint: '不存在 → None' },
  { prompt: 'Examine objects from: car, skateboard, bus, person…', answer: 'set', hint: '多类多目标 → 多标签拼接' },
] as const;

type Choice = 'single' | 'multi' | 'none' | 'set';

export function GriffonBrief(_props: WidgetProps) {
  const [idx, setIdx] = useState(0);
  const [choice, setChoice] = useState<Choice | null>(null);
  const card = CARDS[idx];
  const correct = choice === card.answer;
  const revealed = choice !== null;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: 28, height: '100%', color: '#21324a' }}>
      <div style={{ background: '#fff', borderRadius: 18, border: '2px solid #27446e', padding: 28, alignSelf: 'center' }}>
        <div style={{ fontSize: 28, color: '#68778f' }}>拍摄简报 #{idx + 1}</div>
        <div style={{ fontSize: 34, fontWeight: 700, marginTop: 16, lineHeight: 1.35 }}>{card.prompt}</div>
        <div style={{ marginTop: 28, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {([
            ['single', '输出单个框'],
            ['multi', '输出多个同类框'],
            ['none', '输出 None'],
            ['set', '输出多类拼接'],
          ] as [Choice, string][]).map(([id, label]) => (
            <button key={id} type="button" onClick={() => setChoice(id)} style={{
              fontSize: 28, padding: '10px 14px', borderRadius: 10, cursor: 'pointer',
              border: `2px solid ${choice === id ? '#f07e47' : '#d7deea'}`,
              background: choice === id ? '#fff4ee' : '#f5f8f0',
            }}>{label}</button>
          ))}
        </div>
        <button type="button" onClick={() => { setIdx((i) => (i + 1) % CARDS.length); setChoice(null); }}
          style={{ marginTop: 20, fontSize: 28, padding: '8px 16px', borderRadius: 10, border: '2px solid #76906a', background: '#dfe8d6', cursor: 'pointer' }}>
          下一张简报
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, justifyContent: 'center' }}>
        <div style={{ fontSize: 34, fontWeight: 700 }}>把日常说法映射到四场景</div>
        <p style={{ fontSize: 28, margin: 0, color: '#68778f', lineHeight: 1.45 }}>
          指令数据用更贴近人类表达的模板，把同一套定位能力接到不同提问方式上。
        </p>
        <div style={{
          fontSize: 28, padding: 18, borderRadius: 12, lineHeight: 1.4,
          background: !revealed ? '#eef2f8' : correct ? '#e7f6ee' : '#fde8eb',
          color: !revealed ? '#27446e' : correct ? '#228d5c' : '#c43f52',
        }}>
          {!revealed ? '选择你认为正确的输出行为。' : correct ? `正确：${card.hint}` : `再想想。提示：${card.hint}`}
        </div>
      </div>
    </div>
  );
}
