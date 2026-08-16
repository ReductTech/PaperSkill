import React from 'react';
import type { WidgetProps } from './registry';

// Ch6 Module 4 —— 收尾：WHERE / WHAT / HOW（静态三卡片）
const CARD: Record<'where' | 'what' | 'how', { title: string; eq: string; note: string; color: string }> = {
  where: { title: 'WHERE 在哪学', eq: 'M⁺ = M ∪ B', note: '边界强制掩码：让结构决定掩码位置。', color: '#d97706' },
  what: { title: 'WHAT 学什么', eq: '边界几何（距离·方向·端点）', note: '显式几何：把边界结构变成可学习目标。', color: '#228d5c' },
  how: { title: 'HOW 怎么自举', eq: 'vote → validate → re-render', note: '教师预测 → 投票 → NFA 验证 → 重渲染干净目标。', color: '#27446e' },
};

export const M64Wh: React.FC<WidgetProps> = () => {
  return (
    <div className="m64-wh" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {(['where', 'what', 'how'] as const).map((k) => {
        const c = CARD[k];
        return (
          <div
            key={k}
            style={{
              borderLeft: `4px solid ${c.color}`,
              background: '#fafcf8',
              borderRadius: 8,
              padding: '8px 12px',
              lineHeight: 1.7,
              fontSize: 13,
            }}
          >
            <b style={{ color: c.color }}>{c.title}</b>
            <span style={{ color: '#21324a', fontWeight: 600 }}> —— {c.eq}</span>
            <div style={{ color: '#444' }}>{c.note}</div>
          </div>
        );
      })}
    </div>
  );
};
