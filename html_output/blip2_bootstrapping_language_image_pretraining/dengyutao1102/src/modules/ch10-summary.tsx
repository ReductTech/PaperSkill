import React, { useState } from 'react';
import type { WidgetProps } from './registry';

const contributions = [
  { id: 1, title: '两阶段引导策略', desc: '冻结图像编码器 + Q-Former + 冻结 LLM，用极少参数实现高效 VLP。', icon: '🧩' },
  { id: 2, title: 'Q-Former 桥接器', desc: '32 个可学习查询向量，通过交叉注意力提取文本相关视觉特征。', icon: '🌉' },
  { id: 3, title: '零样本 SOTA 性能', desc: '在 VQA、描述、检索等多任务上达到零样本 SOTA，参数效率极高。', icon: '🏆' },
];

/**
 * Ch10Summary — 核心贡献排序
 * 上下按钮调整贡献排序，理解 BLIP-2 的核心创新点。
 */
export const Ch10Summary: React.FC<WidgetProps> = () => {
  const [order, setOrder] = useState([0, 1, 2]);

  const move = (index: number, dir: -1 | 1) => {
    const newIndex = index + dir;
    if (newIndex < 0 || newIndex >= order.length) return;
    const newOrder = [...order];
    [newOrder[index], newOrder[newIndex]] = [newOrder[newIndex], newOrder[index]];
    setOrder(newOrder);
  };

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
        BLIP-2 核心贡献排序
      </h3>

      <div style={{ fontSize: '13px', color: '#64748b' }}>
        用上下按钮调整你认为的重要性排序
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
        {order.map((contribIdx, pos) => {
          const c = contributions[contribIdx];
          return (
            <div
              key={c.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px 16px',
                background: '#f8fafc',
                borderRadius: '12px',
                border: '2px solid #e2e8f0',
                transition: 'all 0.3s ease',
              }}
            >
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: pos === 0 ? '#16a34a' : pos === 1 ? '#2563eb' : '#64748b',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: 700,
                flexShrink: 0,
              }}>
                {pos + 1}
              </div>
              <div style={{ fontSize: '22px' }}>{c.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>{c.title}</div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{c.desc}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <button
                  onClick={() => move(pos, -1)}
                  disabled={pos === 0}
                  style={{
                    width: '28px',
                    height: '22px',
                    border: '1px solid #e2e8f0',
                    background: pos === 0 ? '#f1f5f9' : '#fff',
                    cursor: pos === 0 ? 'not-allowed' : 'pointer',
                    borderRadius: '4px',
                    fontSize: '12px',
                    color: pos === 0 ? '#cbd5e1' : '#475569',
                  }}
                >
                  ↑
                </button>
                <button
                  onClick={() => move(pos, 1)}
                  disabled={pos === order.length - 1}
                  style={{
                    width: '28px',
                    height: '22px',
                    border: '1px solid #e2e8f0',
                    background: pos === order.length - 1 ? '#f1f5f9' : '#fff',
                    cursor: pos === order.length - 1 ? 'not-allowed' : 'pointer',
                    borderRadius: '4px',
                    fontSize: '12px',
                    color: pos === order.length - 1 ? '#cbd5e1' : '#475569',
                  }}
                >
                  ↓
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{
        marginTop: '8px',
        padding: '14px 20px',
        background: '#eff6ff',
        borderRadius: '10px',
        border: '1px solid #bfdbfe',
        fontSize: '13px',
        color: '#1e40af',
        lineHeight: 1.6,
        textAlign: 'center',
      }}>
        💡 BLIP-2 的核心启示：<strong>站在巨人肩膀上</strong>，用轻量桥接器拼接冻结大模型，是高效多模态融合的新范式。
      </div>
    </div>
  );
};
