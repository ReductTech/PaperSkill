import React from 'react';
import type { WidgetProps } from './registry';

const notes: Record<string, string[]> = {
  oldMethod: [
    '能以任意顺序理解和生成图像与文本',
    '论文给出稳定训练方法、对齐方案和针对早期融合的架构参数化',
  ],
  newMethod: [
    '评测任务包括视觉问答、图像描述、文本生成、图像生成和长篇混合模态生成',
    '摘要称其图像描述达到先进水平，纯文本任务优于 Llama-2',
  ],
};

export function AbstractNote({ moduleId }: WidgetProps) {
  return <ul className="abstract-note">
    {(notes[moduleId] || []).map(text => <li key={text}>{text}</li>)}
  </ul>;
}
