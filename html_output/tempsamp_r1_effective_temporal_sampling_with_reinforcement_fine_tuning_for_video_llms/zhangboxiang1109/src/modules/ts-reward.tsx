/* Refined 2026-10-22. Internal provenance; not rendered. */
import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { Chip, Tag, Feedback, Timeline, Metric, SHAPE, stopRangeNav } from './ts-shared';

export const TsReward: React.FC<WidgetProps> = () => {
 const [task,setTask]=useState<'ground'|'highlight'>('ground');
 return <div className="ts-widget"><div className="ts-toolbar"><Chip active={task==='ground'} onClick={()=>setTask('ground')}>时序定位</Chip><Chip active={task==='highlight'} onClick={()=>setTask('highlight')}>高光检测</Chip></div><div className="ts-split"><div className="ts-card"><b>{task==='ground'?'时间区间匹配':'时间片段与显著性'}</b>{task==='ground'?<><Timeline/><div className="ts-formula-inline">RIoU = 区间交集长度 / 区间并集长度</div><small>核心问题：预测起止边界是否与真值对齐？</small></>:<><div className="ts-highlight-bars"><i/><i/><i/><i/><i/></div><div className="ts-formula-inline">Rₜₛ = 0.6 × F₂ + 0.4 × 1/(1 + WMSE)</div><small>同时关注时间覆盖和高光显著性分数。</small></>}</div><div className="ts-card"><b>奖励关注点</b><p>{task==='ground'?'预测区间与真值区间的 IoU（交并比）。':'时间匹配的 F₂ 分数与加权均方误差 WMSE。'}</p><Tag kind="paper">论文 Sec. 3.3</Tag></div></div><Feedback>{task==='ground'?'时序定位把“边界对不对”转成可计算的时间 IoU 奖励。':'高光任务还要求片段显著性分数准确，所以奖励由两部分组成。'}</Feedback></div>;
};
