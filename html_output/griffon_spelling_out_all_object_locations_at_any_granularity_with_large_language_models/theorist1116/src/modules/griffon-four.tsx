import React, { useEffect, useState } from 'react';
import type { WidgetProps } from './registry';

type Scenario = '1v1' | '1vn' | 'none' | 'nvn';

const SCENES: Record<Scenario, { title: string; prompt: string; output: string; note: string; boxes: { x: number; y: number; w: number; h: number; color: string; label: string }[] }> = {
  '1v1': {
    title: '1 vs. 1 单指称',
    prompt: 'Where is the man in the brown coat?',
    output: '[0.47, 0.41, 0.52, 0.65]',
    note: 'Fig.3 示例常省略 label；§3.2 实现统一为 label-[…]（label-first）。',
    boxes: [{ x: 280, y: 120, w: 90, h: 180, color: '#f07e47', label: 'referent' }],
  },
  '1vn': {
    title: '1 vs. n 一类多目标',
    prompt: 'Is there any bus in the image?',
    output: 'bus-[0.58,0.15,0.85,0.69]&bus-[0.31,0.26,0.50,0.64]',
    note: '统一拼写：同类多框用 & 连接。',
    boxes: [
      { x: 360, y: 110, w: 160, h: 120, color: '#228d5c', label: 'bus' },
      { x: 160, y: 150, w: 120, h: 100, color: '#228d5c', label: 'bus' },
    ],
  },
  none: {
    title: 'None 不存在目标',
    prompt: 'Please locate the baby sitting in the car.',
    output: 'None',
    note: '拒识场景：输出 None，而不是硬编一个框。',
    boxes: [],
  },
  nvn: {
    title: 'n vs. n 多类多目标',
    prompt: 'car, bus, person, backpack…',
    output: 'car-[0.80,0.44,1.00,0.76]&bus-[0.58,0.15,0.85,0.69]&person-[0.24,0.43,0.33,0.73]',
    note: '多类一次前向：按 label-first 拼写出全部可见目标。',
    boxes: [
      { x: 120, y: 160, w: 100, h: 80, color: '#228d5c', label: 'car' },
      { x: 280, y: 100, w: 150, h: 130, color: '#228d5c', label: 'bus' },
      { x: 460, y: 140, w: 70, h: 150, color: '#27446e', label: 'person' },
    ],
  },
};

export function GriffonFour(_props: WidgetProps) {
  const [scenario, setScenario] = useState<Scenario>('1v1');
  const [typed, setTyped] = useState(0);
  const s = SCENES[scenario];
  const shown = s.output.slice(0, Math.floor(typed * s.output.length));

  useEffect(() => {
    setTyped(0);
  }, [scenario]);

  useEffect(() => {
    if (typed >= 1) return;
    const id = window.setTimeout(() => setTyped((v) => Math.min(1, v + 0.04)), 28);
    return () => window.clearTimeout(id);
  }, [typed, scenario]);

  return (
    <div style={{ display: 'grid', gridTemplateRows: 'auto 1fr', gap: 18, height: '100%', color: '#21324a' }}>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {(Object.keys(SCENES) as Scenario[]).map((key) => (
          <button key={key} type="button" onClick={() => setScenario(key)} style={{
            fontSize: 28, padding: '8px 14px', borderRadius: 10, cursor: 'pointer',
            border: `2px solid ${scenario === key ? '#27446e' : '#d7deea'}`,
            background: scenario === key ? '#27446e' : '#fff',
            color: scenario === key ? '#fff' : '#21324a',
          }}>{SCENES[key].title}</button>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 24, minHeight: 0 }}>
        <div style={{ background: '#dfe8d6', borderRadius: 16, border: '1px solid #76906a', position: 'relative' }}>
          <svg viewBox="0 0 700 420" width="100%" height="100%">
            <rect x="30" y="30" width="640" height="360" rx="10" fill="#b8c9a7" />
            <text x="50" y="70" fill="#27446e" fontSize="24">简报：{s.prompt}</text>
            {scenario === 'none' ? (
              <g>
                <text x="250" y="220" fill="#c43f52" fontSize="44" fontWeight="700">拒拍 · None</text>
                <circle cx="350" cy="280" r="40" fill="none" stroke="#c43f52" strokeWidth="6" />
                <line x1="322" y1="252" x2="378" y2="308" stroke="#c43f52" strokeWidth="6" />
              </g>
            ) : (
              s.boxes.map((b, i) => (
                <g key={i}>
                  <rect x={b.x} y={b.y} width={b.w} height={b.h} fill="none" stroke={b.color} strokeWidth="4" />
                  <text x={b.x} y={b.y - 8} fill={b.color} fontSize="20">{b.label}</text>
                </g>
              ))
            )}
          </svg>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, justifyContent: 'center' }}>
          <div style={{ fontSize: 34, fontWeight: 700 }}>{s.title}</div>
          <p style={{ fontSize: 28, margin: 0, color: '#68778f', lineHeight: 1.4 }}>
            语言提示定位按「标签数量 × 目标数量」分成四种真实使用场景。
          </p>
          <div style={{ fontSize: 28, padding: 16, borderRadius: 12, background: '#fff', border: '1px solid #d7deea', wordBreak: 'break-all', minHeight: 120 }}>
            <div style={{ color: '#68778f', marginBottom: 8 }}>模型输出 · 正在拼写</div>
            <code style={{ color: scenario === 'none' ? '#c43f52' : '#228d5c', fontSize: 26 }}>
              {shown}
              <span style={{ opacity: typed < 1 ? 1 : 0 }}>▍</span>
            </code>
          </div>
          <div style={{ fontSize: 24, color: '#f07e47', lineHeight: 1.35 }}>{s.note}</div>
        </div>
      </div>
    </div>
  );
}
