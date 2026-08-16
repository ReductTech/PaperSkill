import React from 'react';
import type { WidgetProps } from './registry';

// Ch5 Module 1 —— 完整算法闭环：总流程梳理（纯文字 + 静态示意图）
// 把整篇方法压成一条闭环，按数据流一步步串起来，让读者在方法讲完后做一次整体回顾。
const STEPS = [
  { key: '①', title: '输入+增强', desc: 'RGB 图 → multi-view，边界只在 global view 生成', color: '#27446e' },
  { key: '②', title: 'Predict', desc: 'Teacher 预测边界场 (d,θ,φ₁,φ₂)，分类化 K=32', color: '#7c3aed' },
  { key: '③', title: 'Decode+Vote', desc: '提 chord → 吸附角点 → 对角点对投票', color: '#d97706' },
  { key: '④', title: 'Validate', desc: 'a-contrario：NFA ≤ 1 才保留，剔除假线', color: '#c43f52' },
  { key: '⑤', title: 'Re-render', desc: '纯几何重算干净标签，编成 K-bin soft 目标', color: '#228d5c' },
  { key: '⑥', title: 'Mask', desc: '边界 token 集 B 并入随机掩码：M⁺ = M ∪ B', color: '#d97706' },
  { key: '⑦', title: 'Supervise', desc: 'CLS→L_DINO、掩码 patch→L_iBOT、边界→L_bnd', color: '#228d5c' },
  { key: '⑧', title: 'Update', desc: '反向传播更新 Student → EMA 更新 Teacher → 回到①', color: '#27446e' },
];

const chip: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  color: '#fff',
  borderRadius: 8,
  padding: '10px 8px',
  minWidth: 74,
  flex: '1 1 0',
};

export const M51Flow: React.FC<WidgetProps> = () => {
  return (
    <div className="m51-flow" style={{ fontSize: 13 }}>
      <div style={{ display: 'flex', gap: 6, alignItems: 'stretch', flexWrap: 'wrap' }}>
        {STEPS.map((s) => (
          <div key={s.key} style={{ ...chip, background: s.color }}>
            <span style={{ fontSize: 15, fontWeight: 700 }}>{s.key}</span>
            <span style={{ fontSize: 12.5, fontWeight: 600, marginTop: 2 }}>{s.title}</span>
            <span style={{ fontSize: 11, opacity: 0.92, marginTop: 4, lineHeight: 1.45 }}>{s.desc}</span>
          </div>
        ))}
      </div>
      <div
        style={{
          marginTop: 12,
          background: '#eef2f7',
          borderRadius: 8,
          padding: '10px 12px',
          lineHeight: 1.8,
          color: '#333',
        }}
      >
        <b>一句话记忆：</b>
        Predict → Decode → Vote → Validate → Re-render → Mask → Supervise → Update（EMA）。
        整条链路没有人工标注：<b>Teacher 在线造目标 → 学生学 → EMA 回传</b>，每一轮目标更准，
        形成自举闭环。
      </div>
    </div>
  );
};
