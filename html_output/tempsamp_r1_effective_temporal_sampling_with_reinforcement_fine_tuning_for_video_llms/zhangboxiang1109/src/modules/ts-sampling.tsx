/* Refined 2026-10-22. Internal provenance; not rendered. */
import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { Tag, Feedback, Timeline, INTERVALS, intervalIoU } from './ts-shared';
export const TsSampling: React.FC<WidgetProps> = () => {
 const [step,setStep]=useState(0);
 const captions=['候选 A：只覆盖事件前段','候选 B：遗漏了动作开头','外部真值：精确的参考区间'];
 const score=intervalIoU(INTERVALS[step]);
 return <div className="ts-widget"><Tag kind="paper">区间来自 Figure 1；IoU 由区间实时计算</Tag><div className="ts-step-head"><span>查看步骤 {step+1} / 3</span><button className="ts-button" onClick={()=>setStep((step+1)%3)}>下一步</button></div><Timeline target candidate={step}/><div className="ts-interval-cards">{INTERVALS.map((x,i)=><button className={'ts-interval '+(i===step?'selected':'')} key={i} onClick={()=>setStep(i)} aria-pressed={i===step}><b>{x[0].toFixed(1)}–{x[1].toFixed(1)} 秒</b><span>{captions[i]}</span></button>)}</div><div className="ts-output"><span>与真值的时间 IoU</span><strong>{score.toFixed(3)}</strong><small>交集长度 ÷ 并集长度</small></div><div className="ts-note"><b>GRPO 怎样给方向？</b> 对同一个视频和查询，让模型生成多个完整答案。奖励函数为各答案评分，组内相对优势决定更鼓励哪些答案。这一步采样的是模型输出。</div><Feedback>{step===2?'第三条来自已有标注，不是模型突然采到了完美答案。论文用它为训练提供方向，但还要处理它如何影响组内统计。':`当前答案的 IoU 为 ${score.toFixed(3)}。比起只判断文字是否通顺，这个奖励直接评价预测区间有没有对准事件。`}</Feedback></div>;
};
