import React from 'react';
import type { WidgetProps } from './registry';

// Ch5 Module 2 —— 训练总损失 L（静态公式卡 + 逐项说明）
// 四路目标加权重加；各支 Teacher 目标都在 stop-gradient 下，梯度只回传学生。
const ROWS = [
  { sym: 'L_DINO', color: '#27446e', desc: '图像级蒸馏：CLS token 对齐 Teacher 的语义分布（学「整图是什么」）' },
  { sym: 'L_iBOT', color: '#7c3aed', desc: '掩码 patch 的语义重建：学生预测被藏 token 的分布（学「每块是什么」）' },
  { sym: 'L_bnd', color: '#228d5c', desc: '边界几何目标：对边界位置做 K-bin 分类交叉熵（学「结构在哪」）' },
  { sym: 'L_KoLeo', color: '#d97706', desc: 'KoLeo 正则：让同 batch 的类 token 特征保持分散，避免挤成一团（次要项）' },
];

const rowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 10,
  padding: '8px 12px',
  borderBottom: '1px solid #e4eaf2',
  lineHeight: 1.7,
};
const symStyle: React.CSSProperties = {
  minWidth: 84,
  fontWeight: 700,
  color: '#fff',
  borderRadius: 6,
  padding: '2px 8px',
  textAlign: 'center',
  fontSize: 13,
};

export const M52Loss: React.FC<WidgetProps> = () => {
  return (
    <div className="m52-loss" style={{ fontSize: 13 }}>
      <div
        style={{
          background: '#fafcf8',
          border: '1px solid #e4eaf2',
          borderRadius: 8,
          padding: '12px 14px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 700, color: '#21324a' }}>
          L = L<sub>DINO</sub> + λ<sub>i</sub>·L<sub>iBOT</sub> + λ<sub>b</sub>·L<sub>bnd</sub> + λ<sub>k</sub>·L<sub>KoLeo</sub>
        </div>
        <div style={{ marginTop: 6, color: '#556' }}>
          各支 Teacher 目标都在 stop-gradient 下，<b>梯度只回传 Student</b>。
        </div>
      </div>
      {ROWS.map((r) => (
        <div key={r.sym} style={rowStyle}>
          <span style={{ ...symStyle, background: r.color }}>{r.sym}</span>
          <span style={{ color: '#444' }}>{r.desc}</span>
        </div>
      ))}
    </div>
  );
};
