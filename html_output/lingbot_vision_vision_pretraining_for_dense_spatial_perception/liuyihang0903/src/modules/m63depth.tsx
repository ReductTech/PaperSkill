import React from 'react';
import type { WidgetProps } from './registry';

// Ch6 Module 3 —— 落地：LingBot-Depth 2.0（静态说明 + 论文 Fig.10）
const step: React.CSSProperties = {
  background: '#fafcf8',
  border: '1px solid #e4eaf2',
  borderRadius: 8,
  padding: '8px 12px',
  lineHeight: 1.7,
  fontSize: 13,
  color: '#444',
};

export const M63Depth: React.FC<WidgetProps> = () => {
  return (
    <div className="m63-depth" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={step}>
        <b style={{ color: '#21324a' }}>掩码深度建模（MDM）</b>——RGB 与原始深度双模态 patch 化，
        按传感器有效性掩码深度 token，解码器只凭上下文重建全分辨率深度。
      </div>
      <div style={step}>
        LingBot-Depth 2.0 保留配方，只做两处升级：
        <b>①把 DINOv2 编码器换成 LingBot-Vision</b>（换起点）；<b>②精修数据从 3M 扩到 150M</b>（加数据）。
      </div>
      <div style={step}>
        结果：<b>数据越多，LingBot-Vision 起点的优势越大</b>——预训练学到的边界锚定特征，
        直接转化为深度补全的下游收益。
      </div>
    </div>
  );
};
