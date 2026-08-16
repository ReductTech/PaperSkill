import React from 'react';
import type { WidgetProps } from './registry';

// §9 非创新点，只列技术名与流程顺序（论文 §3.5 / Figure 8）。
const STEPS = ['长时程 rollout 采样', '短片段计奖', '双奖励模型（相机控制 + 画质）', 'KL 正则', 'DiffusionNFT 渐进 soft update'];

export const Mod91: React.FC<WidgetProps> = () => (
  <div style={{ fontSize: 14, lineHeight: 2 }}>{STEPS.join(' → ')}</div>
);

export default Mod91;
