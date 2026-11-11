import React from 'react';
import type { WidgetProps } from './registry';

const notes: Record<string, string[]> = {
  oldMethod: ['在一组更难的学推理基准上验证','包括 AIME、AMC 和 MATH500'],
  newMethod: ['训练参数少约 1000 倍','仍能恢复约 90% 的性能提升'],
};

export function AbstractNote({ moduleId }: WidgetProps) {
  return <ul className="abstract-note">
    {(notes[moduleId] || []).map(text => <li key={text}>{text}</li>)}
  </ul>;
}
