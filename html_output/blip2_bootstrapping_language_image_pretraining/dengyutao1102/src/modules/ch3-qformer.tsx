import React, { useState } from 'react';
import type { WidgetProps } from './registry';

const components = [
  {
    name: '查询嵌入 (Queries)',
    desc: '32 个可学习的查询向量，维度 768。每个查询专门提取一类对文本有用的视觉特征。',
    detail: 'Z ∈ ℝ^(32×768)，是 Q-Former 的核心可训练参数。',
  },
  {
    name: '自注意力 (Self-Attention)',
    desc: '查询之间互相交互，让多个查询协同工作，避免重复提取相同信息。',
    detail: '双向自注意力，查询可以互相看到彼此。',
  },
  {
    name: '交叉注意力 (Cross-Attention)',
    desc: '查询通过交叉注意力与冻结的图像编码器交互，从图像特征图中提取相关信息。',
    detail: '查询作为 Query，图像特征作为 Key/Value。',
  },
  {
    name: '前馈网络 (FFN)',
    desc: '每个 Transformer 块后的前馈网络，进一步处理提取的特征。',
    detail: '标准 Transformer 架构，两层全连接 + 激活函数。',
  },
];

/**
 * Ch3QFormer — Q-Former 内部结构点击切换
 * 点击按钮查看不同组件的详细说明。
 */
export const Ch3QFormer: React.FC<WidgetProps> = () => {
  const [active, setActive] = useState(0);

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
        Q-Former 内部结构
      </h3>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {components.map((c, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: `2px solid ${active === i ? '#2563eb' : '#e2e8f0'}`,
              background: active === i ? '#eff6ff' : '#fff',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: active === i ? 600 : 400,
              color: active === i ? '#2563eb' : '#475569',
              transition: 'all 0.2s ease',
            }}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div style={{
        background: '#f8fafc',
        borderRadius: '12px',
        padding: '20px',
        border: '2px solid #e2e8f0',
        width: '100%',
      }}>
        <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
          {components[active].name}
        </div>
        <div style={{ fontSize: '14px', color: '#475569', lineHeight: 1.6, marginBottom: '12px' }}>
          {components[active].desc}
        </div>
        <div style={{
          background: '#eff6ff',
          borderRadius: '8px',
          padding: '10px 14px',
          fontSize: '13px',
          color: '#2563eb',
          fontFamily: 'monospace',
        }}>
          {components[active].detail}
        </div>
      </div>

      <div style={{ fontSize: '12px', color: '#64748b', textAlign: 'center' }}>
        点击上方按钮切换查看不同组件
      </div>
    </div>
  );
};
