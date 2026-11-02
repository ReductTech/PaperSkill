import React, { useState } from 'react';
import type { WidgetProps } from './registry';

const steps = [
  { label: 'Q-Former 输出', desc: '32×768 的视觉特征矩阵 Z', color: '#7c3aed' },
  { label: '全连接层投影', desc: 'W · Z，投影到 LLM 词嵌入空间', color: '#ea580c' },
  { label: '软提示前缀', desc: '投影后的特征作为视觉前缀', color: '#2563eb' },
  { label: '冻结 LLM 输入', desc: '视觉前缀 + 文本指令，输入冻结 LLM', color: '#16a34a' },
  { label: '文本生成', desc: 'LLM 根据视觉提示生成回答', color: '#0891b2' },
];

/**
 * Ch6Llm — 视觉提示接入 LLM 步进
 * 点击步进查看视觉特征如何接入冻结 LLM。
 */
export const Ch6Llm: React.FC<WidgetProps> = () => {
  const [current, setCurrent] = useState(0);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '16px',
      padding: '20px',
      width: '100%',
      maxWidth: '640px',
      margin: '0 auto',
    }}>
      <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#0f172a' }}>
        视觉提示接入冻结 LLM
      </h3>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        width: '100%',
      }}>
        {steps.map((s, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              borderRadius: '10px',
              background: i <= current ? s.color + '15' : '#f8fafc',
              border: `2px solid ${i <= current ? s.color : '#e2e8f0'}`,
              opacity: i <= current ? 1 : 0.4,
              transition: 'all 0.3s ease',
            }}
          >
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: i <= current ? s.color : '#e2e8f0',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 700,
              flexShrink: 0,
            }}>
              {i + 1}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>{s.label}</div>
              {i === current && (
                <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>{s.desc}</div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          onClick={() => setCurrent(Math.max(0, current - 1))}
          disabled={current === 0}
          style={{
            padding: '8px 20px',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            background: current === 0 ? '#f1f5f9' : '#fff',
            cursor: current === 0 ? 'not-allowed' : 'pointer',
            fontSize: '14px',
          }}
        >
          上一步
        </button>
        <button
          onClick={() => setCurrent(Math.min(steps.length - 1, current + 1))}
          disabled={current === steps.length - 1}
          style={{
            padding: '8px 20px',
            borderRadius: '8px',
            border: 'none',
            background: current === steps.length - 1 ? '#cbd5e1' : '#16a34a',
            color: '#fff',
            cursor: current === steps.length - 1 ? 'not-allowed' : 'pointer',
            fontSize: '14px',
          }}
        >
          下一步
        </button>
      </div>
    </div>
  );
};
