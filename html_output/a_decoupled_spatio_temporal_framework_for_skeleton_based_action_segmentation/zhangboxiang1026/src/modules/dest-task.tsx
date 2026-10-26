// Refinement 2026-10-22. Task comparison explains input conditions and output granularity; no model output.
import React, { useState } from 'react';
import type { WidgetProps } from './registry';
const modes = [
  { key: 'clip', name: '视频分类', input: '一段待识别的视频或动作片段', question: '整段主要在做什么？', output: '一个片段级类别', answer: '抬臂动作', detail: '整段只给一个标签，无法说明动作在哪一帧切换。这里仅对比答案形式，不表示分类任务采用与 DeST 完全相同的输入设置。' },
  { key: 'segment', name: '动作分割', input: 'DeST：整段骨架关节序列，无文本查询', question: '每一帧在做什么，类别何时变化？', output: '覆盖整段序列的逐帧类别', answer: '起势 → 抬臂 → 触点 → 收势', detail: '这就是本文任务。模型需要连续输出类别；把相同类别的相邻帧合起来，就得到动作片段及边界。' },
  { key: 'ground', name: '文本定位', input: '视频 + 文本查询，例如“练习者抬臂触碰标记”', question: '查询描述的事情发生在哪一段？', output: '与查询对应的时间区间', answer: '只返回相关区间 [开始，结束]', detail: '文本条件时序视频定位（TVG）把语言和时间片段联系起来。它与 DeST 都关心时间，但多了文本条件，答案形式也不同。' },
];
export const DestTask: React.FC<WidgetProps> = () => {
  const [selected, setSelected] = useState(1); const current = modes[selected];
  return <div className="dest-refined">
    <div className="ctrl">{modes.map((mode, i) => <button key={mode.key} className={'chip' + (selected === i ? ' active' : '')} aria-pressed={selected === i} onClick={() => setSelected(i)}>{mode.name}</button>)}</div>
    <div className="dest-task-card"><p className="dest-eyebrow">输入条件</p><strong>{current.input}</strong><div className="dest-task-question">{current.question}</div><span>{current.output}</span>
      <div className={'dest-task-answer dest-task-' + current.key}>{selected === 1 ? ['起势', '抬臂', '触点', '收势'].map(label => <b key={label}>{label}</b>) : <b>{current.answer}</b>}</div>
    </div>
    <div className={'feedback ' + (selected === 1 ? 'good' : '')} aria-live="polite">{current.detail}</div>
    <p className="module-note">输入与输出示例均为教学构造；任务定义依据原文 §1、§3。本文处理骨架动作分割。</p>
  </div>;
};
