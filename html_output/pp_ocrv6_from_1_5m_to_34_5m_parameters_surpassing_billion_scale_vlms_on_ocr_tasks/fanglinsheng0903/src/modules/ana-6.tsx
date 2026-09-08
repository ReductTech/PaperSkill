import React from 'react';
import type { WidgetProps } from './registry';

export const Analogy6: React.FC<WidgetProps> = () => (
  <div className="r7-hook" role="img" aria-label="同一条横向 feature sequence 先观察局部邻近位置，再建立整行依赖；NRTR 只在训练阶段提供辅助监督">
    <div className="r7-hook-sequence">
      {Array.from({ length: 13 }, (_, index) => <i key={index} className={index >= 4 && index <= 8 ? 'local' : ''} />)}
      <span>Feature positions · 不等于逐个字符</span>
    </div>
    <div className="r7-hook-flow">
      <div><span>Local first</span><strong>邻近边界与间距</strong></div>
      <b>→</b>
      <div><span>Global next</span><strong>整行依赖与消歧</strong></div>
    </div>
    <p><strong>LightSVTR 提供 local + global 表示</strong><span>NRTR 是训练辅助，不是全局上下文本身。</span></p>
  </div>
);
