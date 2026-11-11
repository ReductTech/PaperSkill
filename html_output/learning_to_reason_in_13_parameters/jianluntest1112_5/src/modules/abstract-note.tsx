import React from 'react';
import type { WidgetProps } from './registry';

const notes: Record<string, string[]> = {
  oldMethod: ['只有用强化学习训练，才能在极少参数下达到上述效果'],
  newMethod: ['用 SFT 训练的模型，要达到同样性能','需要大 100–1000 倍的更新量'],
};

export function AbstractNote({ moduleId }: WidgetProps) {
  return <ul className="abstract-note">
    {(notes[moduleId] || []).map(text => <li key={text}>{text}</li>)}
  </ul>;
}
