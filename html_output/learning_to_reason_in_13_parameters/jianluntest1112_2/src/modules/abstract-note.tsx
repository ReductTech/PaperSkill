import React from 'react';
import type { WidgetProps } from './registry';

const notes: Record<string, string[]> = {
  oldMethod: ['提出 TinyLoRA，一种新的低秩适配器参数化','可把适配器规模缩小到常规 LoRA 达不到的程度'],
  newMethod: ['在这一参数化下，适配器可小到只有一个参数','后续实验都在这一参数化中完成'],
};

export function AbstractNote({ moduleId }: WidgetProps) {
  return <ul className="abstract-note">
    {(notes[moduleId] || []).map(text => <li key={text}>{text}</li>)}
  </ul>;
}
