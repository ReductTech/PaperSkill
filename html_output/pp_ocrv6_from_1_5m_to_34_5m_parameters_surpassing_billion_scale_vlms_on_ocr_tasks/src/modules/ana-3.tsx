import React from 'react';
import type { WidgetProps } from './registry';

export const Analogy3: React.FC<WidgetProps> = () => (
  <div className="mix4c-before-after" role="img" aria-label="旧式串联链与 LCNetV4 职责拆分对比">
    <div className="before"><span>Before</span><strong>DW → SE → PW</strong><small>串在一条链里</small></div>
    <b aria-hidden="true">→</b>
    <div className="after"><span>LCNetV4</span><strong>Token Mixer → Channel Mixer</strong><small>明确拆分职责</small></div>
    <p>空间关系与通道变换，不再挤在同一条职责链里。</p>
  </div>
);
