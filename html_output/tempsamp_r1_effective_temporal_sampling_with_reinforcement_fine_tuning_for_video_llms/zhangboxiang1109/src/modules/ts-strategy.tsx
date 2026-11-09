/* Refined 2026-10-22. Internal provenance; not rendered. */
import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { Chip, Tag, Feedback, Timeline, Metric, SHAPE, stopRangeNav } from './ts-shared';

export const TsStrategy: React.FC<WidgetProps> = () => {
 const [strategy,setStrategy]=useState('nonlinear');
 const data=[{id:'mixed',name:'只混入真值',score:'41.3',note:'没有额外调节，可能出现分布偏移。'},{id:'scale',name:'奖励缩放',score:'48.1',note:'把外部奖励限制在最大可能值的 80%；只调整这条示范的奖励。'},{id:'anchor',name:'优势锚定',score:'49.1',note:'策略内候选单独标准化；外部优势设为 1.2 × 策略内最大优势（Eq. 3）。'},{id:'nonlinear',name:'非线性整形',score:'49.6',note:'先用 Eq. 4 变换各奖励，再一起标准化；这是本文最终采用的调节策略。'}];
 const active=data.find(x=>x.id===strategy)||data[3];
 return <div className="ts-widget"><div className="ts-toolbar" role="group" aria-label="奖励调节策略">{data.map(x=><Chip key={x.id} active={strategy===x.id} onClick={()=>setStrategy(x.id)}>{x.name}</Chip>)}</div><div className="ts-strategy-grid">{data.map(x=><button key={x.id} className={'ts-strategy-row '+(strategy===x.id?'selected':'')} onClick={()=>setStrategy(x.id)}><span>{x.name}</span><b>{x.score}</b><small>R1@0.7</small></button>)}</div><div className="ts-note"><Tag kind="paper">论文 Table 4 · Charades-STA</Tag><p>{active.note}</p><p>R1@0.7 是交并比阈值为 0.7 时的 Recall@1。GRPO 基线为 46.0%。只混入真值降到 41.3%（−4.7 个百分点）；非线性整形达到 49.6%（相对基线 +3.6 个百分点）。这组消融说明收益来自完整设计，而非真值注入本身。</p></div><Feedback>{active.id==='nonlinear'?'论文消融中，非线性整形在列出的策略里达到最高 R1@0.7。':'选中的调节方法是作者比较的一种方案。它们改变奖励尺度或归一化方式，不能把“加入真值”本身等同于完整方法。'}</Feedback></div>;
};
