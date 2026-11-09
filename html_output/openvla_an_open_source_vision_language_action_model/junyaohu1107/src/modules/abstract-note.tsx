import React from 'react';
import type { WidgetProps } from './registry';

const notes: Record<string, string[]> = {
  oldMethod: [
    '在 97 万条真实机器人演示上训练',
    '基于 Llama 2，视觉编码器融合 DINOv2 和 SigLIP 的预训练特征',
  ],
  newMethod: [
    '在 29 个任务上，绝对成功率比 RT-2-X（55B）高 16.5%，参数量少 7 倍',
    '微调后比从零训练的 Diffusion Policy 高 20.4%',
  ],
};

export function AbstractNote({ moduleId }: WidgetProps) {
  return <ul className="abstract-note">
    {(notes[moduleId] || []).map(text => <li key={text}>{text}</li>)}
  </ul>;
}
