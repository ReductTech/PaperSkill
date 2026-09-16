import React from 'react';
import type { WidgetProps } from './registry';

export const AnalogyCh2: React.FC<WidgetProps> = () => (
  <div className="chapter2-analogy-mini" role="img" aria-label="三条规格不同的轨道分别转成统一格式，再对齐到同一时间轴">
    <div className="chapter2-analogy-tracks">
      <span className="text">文字轨</span>
      <span className="audio">声音轨</span>
      <span className="video">画面轨</span>
    </div>
    <b aria-hidden="true">→</b>
    <div className="chapter2-analogy-normalized">
      <span>统一格式</span><span>统一格式</span><span>统一格式</span>
    </div>
    <b aria-hidden="true">→</b>
    <div className="chapter2-analogy-timeline"><i /><span>同一时间轴</span></div>
  </div>
);
