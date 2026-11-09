/* Refined 2026-10-22. Internal provenance; not rendered. */
import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { Chip, Tag, Feedback, Timeline, Metric, SHAPE, stopRangeNav } from './ts-shared';

export const TsCot: React.FC<WidgetProps> = () => {
 const [mode,setMode]=useState<'direct'|'cot'>('cot');
 return <div className="ts-widget"><div className="ts-stage-line"><div className="ts-stage"><b>阶段 1</b><span>先优化准确的最终答案</span><small>不要求显式推理格式</small></div><span className="ts-arrow">→</span><div className="ts-stage"><b>阶段 2</b><span>加入格式奖励</span><small>&lt;Think&gt; 推理 · &lt;Answer&gt; 答案</small></div></div><div className="ts-toolbar"><Chip active={mode==='direct'} onClick={()=>setMode('direct')}>直接回答 · no-CoT</Chip><Chip active={mode==='cot'} onClick={()=>setMode('cot')}>显式推理 · CoT</Chip></div><div className="ts-card"><b>推理模式示意</b><p>{mode==='cot'?'先整理视频里的时间证据，再给出时间区间。':'直接给出预测区间，不输出显式思维链。'}</p><div className="ts-answer-box">{mode==='cot'?'回答格式：<Think>…</Think> → <Answer>[起点, 终点]</Answer>':'回答格式：<Answer>[起点, 终点]</Answer>'}</div></div><Feedback>统一模型支持两种模式。论文 Table 1 显示，时序定位的 CoT 指标更高，而 QVHighlights 的 no-CoT mAP 更高；不能把一种模式说成处处占优。</Feedback></div>;
};
