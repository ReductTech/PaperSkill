import React from 'react';
import type { WidgetProps } from './registry';

export const DarkroomAnalogy1: React.FC<WidgetProps> = () => (
  <div className="representation-analogy" aria-label="两套视觉表示收束为同一套语义离散 Token 的对比动画">
    <div className="representation-analogy__side is-old">
      <span className="representation-analogy__label">旧路线</span>
      <div className="representation-analogy__photo" aria-hidden="true"><i /><i /></div>
      <div className="representation-analogy__split">
        <b>理解特征</b>
        <b>重建 Token</b>
      </div>
      <small>同一画面，两套表示</small>
    </div>
    <div className="representation-analogy__arrow" aria-hidden="true">→</div>
    <div className="representation-analogy__side is-new">
      <span className="representation-analogy__label">本文路线</span>
      <div className="representation-analogy__photo is-semantic" aria-hidden="true"><i /><i /></div>
      <div className="representation-analogy__tokens" aria-hidden="true">
        <b>物体</b><b>属性</b><b>关系</b>
      </div>
      <small>SigLIP-VQ 语义离散 Token</small>
    </div>
  </div>
);
