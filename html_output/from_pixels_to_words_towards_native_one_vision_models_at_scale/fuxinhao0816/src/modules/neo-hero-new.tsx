import React from 'react';
import type { WidgetProps } from './registry';

function MiniPicture({ kind }: { kind: 'single' | 'multi' | 'video' }) {
  return <span className={`hero-mini-media hero-mini-${kind}`} aria-hidden="true"><i /><i /><i /></span>;
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

export const NeoHeroNew: React.FC<WidgetProps> = () => (
  <div className="hero-paradigm" aria-label="NEO-ov 统一视觉语言建模的信息流">
    <div className="hero-flow hero-flow-new">
      <FlowNode className="hero-node-input hero-node-visual" label="图像 / 视频">
        <span className="hero-media-group"><MiniPicture kind="single" /><MiniPicture kind="multi" /><MiniPicture kind="video" /></span>
      </FlowNode>
      <FlowNode className="hero-node-absence" label="无独立视觉编码器" note="架构选择改变">
        <span className="hero-open-space" aria-hidden="true" />
      </FlowNode>
      <FlowNode className="hero-node-bridge hero-node-visual" label="轻量视觉入口" note="patch embedding">
        <span className="hero-entry-grid" aria-hidden="true"><i /><i /><i /><i /></span>
      </FlowNode>
      <FlowNode className="hero-node-unified" label="统一主干" note="视觉 + 语言共同建模">
        <span className="hero-joint-stream" aria-hidden="true">
          <span className="hero-joint-visual"><i /><i /><i /><em>视觉</em></span>
          <b>+</b>
          <span className="hero-joint-text"><i>T</i><i>T</i><i>T</i><em>文字</em></span>
        </span>
      </FlowNode>
      <FlowNode className="hero-node-output" label="回答"><span className="hero-answer-dots" aria-hidden="true">•••</span></FlowNode>
    </div>
  </div>
);
