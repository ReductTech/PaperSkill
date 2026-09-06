import React from 'react';
import type { WidgetProps } from './registry';

export const DarkroomAnalogy2: React.FC<WidgetProps> = () => (
  <div className="tokenizer-analogy-flow" aria-label="图像块经过 SigLIP 编码、向量量化并得到离散 Token ID">
    <div className="taf-node taf-patch"><span>输入</span><b>图像块</b><small>Patch</small><i aria-hidden="true" /></div>
    <em aria-hidden="true">→</em>
    <div className="taf-node taf-encoder"><span>特征提取</span><b>SigLIP2-g</b><small>ViT Encoder</small></div>
    <em aria-hidden="true">→</em>
    <div className="taf-node taf-vector"><span>连续特征</span><b>2048 维</b><small>语义向量 v</small></div>
    <em aria-hidden="true">→</em>
    <div className="taf-node taf-vq"><span>向量量化</span><b>Codebook</b><small>argmin ‖v-eᵢ‖₂</small><div><i>e₁</i><i className="is-nearest">eᵢ</i><i>eₙ</i></div></div>
    <em aria-hidden="true">→</em>
    <div className="taf-node taf-id"><span>输出</span><b>离散编号</b><small>Token ID · #18A4</small></div>
  </div>
);
