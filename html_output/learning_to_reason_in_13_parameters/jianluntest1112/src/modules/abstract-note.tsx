import React from 'react';
import type { WidgetProps } from './registry';

const notes: Record<string, string[]> = {
  oldMethod: ['已有工作表明语言模型可以学会推理，常借助强化学习','也有工作为推理训练低秩参数'],
  newMethod: ['但常规 LoRA 无法缩小到模型维度以下','本文追问：rank=1 的 LoRA 是否都已多余'],
};

export function AbstractNote({ moduleId }: WidgetProps) {
  return <ul className="abstract-note">
    {(notes[moduleId] || []).map(text => <li key={text}>{text}</li>)}
  </ul>;
}
