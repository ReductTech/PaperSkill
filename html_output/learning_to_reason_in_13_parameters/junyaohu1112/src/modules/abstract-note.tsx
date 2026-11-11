import React from 'react';
import type { WidgetProps } from './registry';

const notes: Record<string, string[]> = {
  oldMethod: [
    '常规 LoRA 的规模无法低于模型维度',
    'TinyLoRA 可把低秩适配器缩小到最少一个参数',
  ],
  newMethod: [
    'Qwen2.5 8B 只训练 13 个参数（bf16 共 26 字节），GSM8K 准确率达 91%',
    '只有强化学习能做到；SFT 需要大 100–1000 倍的更新量',
  ],
};

export function AbstractNote({ moduleId }: WidgetProps) {
  return <ul className="abstract-note">
    {(notes[moduleId] || []).map(text => <li key={text}>{text}</li>)}
  </ul>;
}
