import React, { useState } from 'react';
import type { WidgetProps } from './registry';

const steps = [
  {
    title: '输入图像',
    desc: '输入一张图片，进入冻结的图像编码器（ViT）。',
    color: '#64748b',
  },
  {
    title: '冻结图像编码器',
    desc: 'ViT 提取图像特征图，参数完全冻结不更新。',
    color: '#7c3aed',
  },
  {
    title: '阶段 1：表示学习',
    desc: 'Q-Former 通过 ITC/ITM/ITG 三个目标学习对齐图文表示。',
    color: '#2563eb',
  },
  {
    title: '阶段 2：生成学习',
    desc: 'Q-Former 输出投影为软提示，接入冻结的 LLM。',
    color: '#ea580c',
  },
  {
    title: '冻结 LLM',
    desc: '大语言模型根据视觉软提示生成文本，参数完全冻结。',
    color: '#16a34a',
  },
];

/**
 * Ch2Overview — 两阶段框架步进动画
 * 点击下一步逐步展示 BLIP-2 的完整流程。
 */
export const Ch2Overview: React.FC<WidgetProps> = () => {
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
        BLIP-2 两阶段流程
      </h3>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        width: '100%',
      }}>
        {steps.map((step, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              borderRadius: '10px',
              background: i <= current ? step.color + '20' : '#f8fafc',
              border: `2px solid ${i <= current ? step.color : '#e2e8f0'}`,
              opacity: i <= current ? 1 : 0.5,
              transition: 'all 0.3s ease',
            }}
          >
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: i <= current ? step.color : '#e2e8f0',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              fontWeight: 700,
              flexShrink: 0,
            }}>
              {i + 1}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>{step.title}</div>
              {i === current && (
                <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>{step.desc}</div>
              )}
            </div>
            {i <= current && (
              <div style={{ color: '#16a34a', fontSize: '16px' }}>✓</div>
            )}
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
            background: current === steps.length - 1 ? '#cbd5e1' : '#2563eb',
            color: '#fff',
            cursor: current === steps.length - 1 ? 'not-allowed' : 'pointer',
            fontSize: '14px',
          }}
        >
          下一步
        </button>
      </div>

      <div style={{ fontSize: '12px', color: '#64748b' }}>
        步骤 {current + 1} / {steps.length}
      </div>
    </div>
  );
};
