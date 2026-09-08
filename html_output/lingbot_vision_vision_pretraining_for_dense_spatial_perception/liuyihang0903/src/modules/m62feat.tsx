import React from 'react';
import type { WidgetProps } from './registry';

// Ch6 Module 2 —— 特征对比：语义与几何如何分布（静态 + 论文 Fig.6）
// 上图是论文 Fig.6：LingBot 的 patch 特征既按语义分组、又携带边界几何结构。
const card: React.CSSProperties = {
  background: '#fafcf8',
  border: '1px solid #e4eaf2',
  borderRadius: 8,
  padding: '8px 12px',
  lineHeight: 1.7,
  fontSize: 13,
  color: '#444',
};

export const M62Feat: React.FC<WidgetProps> = () => {
  return (
    <div className="m62-feat" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={card}>
        <b style={{ color: '#21324a' }}>DINOv2 / SigLIP2 / V-JEPA2.1：</b>patch 特征主要按语义分组，
        几何信息稀疏——物体内部有斑点噪声、边界处特征不连贯。
      </div>
      <div style={card}>
        <b style={{ color: '#21324a' }}>LingBot-Vision：</b>特征既按语义聚团、又沿边界几何展开——物体内部连贯、
        边界锐利。这正是深度估计与分割需要的表示。
      </div>
      <div style={card}>
        结果呼应：<b>NYUv2 深度 RMSE</b> LingBot（1B）0.296 &lt; DINOv3（7B）0.309 &lt; V-JEPA 2.1（1B）0.350
        &lt; DINOv2（1B）0.372——<b>1B 在深度上击败 7B</b>。
      </div>
    </div>
  );
};
