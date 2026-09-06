import React from 'react';
import type { WidgetProps } from './registry';

function PictureIcon() {
  return (
    <span className="hero-picture-icon" aria-hidden="true">
      <span className="hero-picture-sun" />
      <span className="hero-picture-hill hero-picture-hill-a" />
      <span className="hero-picture-hill hero-picture-hill-b" />
    </span>
  );
}

function FlowNode({ className = '', children, label, note }: { className?: string; children?: React.ReactNode; label: string; note?: string }) {
  return (
    <div className={`hero-flow-node ${className}`} tabIndex={0}>
      <div className="hero-node-shell">
        {children}
        <strong>{label}</strong>
        {note ? <small>{note}</small> : null}
      </div>
    </div>
  );
}

export const NeoHeroOld: React.FC<WidgetProps> = () => (
  <div className="hero-paradigm" aria-label="传统模块化视觉语言模型的信息流">
    <div className="hero-flow hero-flow-old">
      <FlowNode className="hero-node-input hero-node-visual" label="图片"><PictureIcon /></FlowNode>
      <FlowNode className="hero-node-major hero-node-visual" label="独立视觉编码器" note="先负责“看”">
        <span className="hero-vision-grid" aria-hidden="true">{Array.from({ length: 9 }, (_, i) => <i key={i} />)}</span>
      </FlowNode>
      <FlowNode className="hero-node-bridge" label="适配器 / 投影层" note="连接两种表示">
        <span className="hero-adapter-icon" aria-hidden="true"><i /><i /><i /></span>
      </FlowNode>
      <FlowNode className="hero-node-major hero-node-language" label="语言模型" note="理解 · 推理 · 回答">
        <span className="hero-text-tokens" aria-hidden="true"><i>T</i><i>T</i><i>T</i></span>
      </FlowNode>
      <FlowNode className="hero-node-output" label="回答"><span className="hero-answer-dots" aria-hidden="true">•••</span></FlowNode>
    </div>
  </div>
);
