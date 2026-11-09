/* Refined 2026-10-22. Internal provenance; not rendered. */
import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { Chip, Tag, Feedback, Timeline, Metric, SHAPE, stopRangeNav } from './ts-shared';

export const TsLimits: React.FC<WidgetProps> = () => {
 const [issue,setIssue]=useState(0); const items=[['画面歧义','视觉证据不够明确时，模型可能选错事件边界。'],['动作重复','相似动作多次出现，而标注只给一个区间时，预测可能与标注不一致。'],['边界模糊','事件起止定义本身不清晰，会限制可评估的定位精度。']];
 return <div className="ts-widget"><Tag kind="paper">论文 Appendix · 定性失败分析</Tag><div className="ts-hotspots"><button className={'ts-hotspot '+(issue===0?'selected':'')} onClick={()=>setIssue(0)} aria-label="画面歧义">画面歧义</button><button className={'ts-hotspot '+(issue===1?'selected':'')} onClick={()=>setIssue(1)} aria-label="重复动作">重复动作</button><button className={'ts-hotspot '+(issue===2?'selected':'')} onClick={()=>setIssue(2)} aria-label="标注边界">标注边界</button></div><div className="ts-card"><b>{items[issue][0]}</b><p>{items[issue][1]}</p></div><div className="ts-synthesis"><b>把全文压缩成一条因果链</b><span>策略探索困难 → 加入真值指导 → 防止奖励失衡 → 学到更稳的时间定位</span></div><Feedback>方法改善训练信号，但不能自动解决视频歧义或定义不清的真值。这个限制也引出下一篇学习问题：怎样继续改进视频任务中的后训练信号与策略更新？</Feedback></div>;
};
