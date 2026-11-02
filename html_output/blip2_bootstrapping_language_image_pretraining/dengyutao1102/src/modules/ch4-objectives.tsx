import React, { useState } from 'react';
import type { WidgetProps } from './registry';

const objectives = [
  {
    key: 'ITC',
    title: '图像-文本对比学习 (ITC)',
    color: '#2563eb',
    desc: '拉近匹配的图文对，推远不匹配的对，学习全局跨模态对齐。',
    detail: '用对比学习损失，在批次内区分匹配和不匹配的图文对。',
    role: '全局对齐',
  },
  {
    key: 'ITM',
    title: '图像-文本匹配 (ITM)',
    color: '#16a34a',
    desc: '二分类任务，判断给定的图文对是否匹配，学习细粒度对齐。',
    detail: '输出二分类 logits，预测图文是否匹配。',
    role: '细粒度判断',
  },
  {
    key: 'ITG',
    title: '图像引导文本生成 (ITG)',
    color: '#ea580c',
    desc: '根据图像生成文本描述，学习从视觉到语言的生成能力。',
    detail: '自回归生成，每个 token 依赖前面的 token 和图像。',
    role: '生成能力',
  },
];

/**
 * Ch4Objectives — 三大训练目标标签页
 * 点击标签切换查看 ITC、ITM、ITG 的详细说明。
 */
export const Ch4Objectives: React.FC<WidgetProps> = () => {
  const [active, setActive] = useState(0);
  const obj = objectives[active];

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
        第一阶段三大训练目标
      </h3>

      <div style={{ display: 'flex', gap: '4px', width: '100%', borderRadius: '10px', overflow: 'hidden', border: '2px solid #e2e8f0' }}>
        {objectives.map((o, i) => (
          <button
            key={o.key}
            onClick={() => setActive(i)}
            style={{
              flex: 1,
              padding: '12px 8px',
              border: 'none',
              background: active === i ? o.color : '#f8fafc',
              color: active === i ? '#fff' : '#475569',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600,
              transition: 'all 0.2s ease',
            }}
          >
            {o.key}
          </button>
        ))}
      </div>

      <div style={{
        background: '#f8fafc',
        borderRadius: '12px',
        padding: '20px',
        border: `2px solid ${obj.color}`,
        width: '100%',
      }}>
        <div style={{
          display: 'inline-block',
          padding: '4px 12px',
          borderRadius: '20px',
          background: obj.color + '20',
          color: obj.color,
          fontSize: '12px',
          fontWeight: 600,
          marginBottom: '12px',
        }}>
          {obj.role}
        </div>
        <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
          {obj.title}
        </div>
        <div style={{ fontSize: '14px', color: '#475569', lineHeight: 1.6, marginBottom: '12px' }}>
          {obj.desc}
        </div>
        <div style={{
          background: '#fff',
          borderRadius: '8px',
          padding: '12px 14px',
          fontSize: '13px',
          color: '#475569',
          borderLeft: `3px solid ${obj.color}`,
        }}>
          {obj.detail}
        </div>
      </div>
    </div>
  );
};
