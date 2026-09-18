import React from 'react';
import type { WidgetProps } from './registry';

export const AnalogyCh3: React.FC<WidgetProps> = () => (
  <div className="chapter3-analogy-mini" aria-label="相同连续刺激的局部窗口与长上下文比较">
    <div className="chapter3-analogy-track">
      <span>同一段连续刺激</span>
      <i aria-hidden="true" />
    </div>
    <div className="chapter3-analogy-views">
      <div className="local"><b>局部窗口</b><span>只观察邻近片段</span></div>
      <div className="long"><b>长上下文</b><span>整合更长时间范围</span></div>
    </div>
  </div>
);
