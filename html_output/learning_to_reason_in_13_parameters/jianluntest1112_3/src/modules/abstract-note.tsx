import React from 'react';
import type { WidgetProps } from './registry';

const notes: Record<string, string[]> = {
  oldMethod: ['模型：8B 参数规模的 Qwen2.5','只训练 13 个参数，bf16 下共 26 字节'],
  newMethod: ['GSM8K 准确率达到 91%','对应论文标题中的 13 个参数'],
};

export function AbstractNote({ moduleId }: WidgetProps) {
  return <ul className="abstract-note">
    {(notes[moduleId] || []).map(text => <li key={text}>{text}</li>)}
  </ul>;
}
