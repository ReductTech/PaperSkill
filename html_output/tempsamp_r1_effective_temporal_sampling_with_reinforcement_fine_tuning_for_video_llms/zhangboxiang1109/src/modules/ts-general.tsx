/* Refined 2026-10-22. Internal provenance; not rendered. */
import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { Chip, Tag, Feedback, Timeline, Metric, SHAPE, stopRangeNav } from './ts-shared';

export const TsGeneral: React.FC<WidgetProps> = () => {
 const [method,setMethod]=useState('TempSamp-R1'); const rows:any={'SFT':['20.6','16.7','7.9'],'GRPO':['30.7','27.5','12.9'],'TempSamp-R1':['34.7','32.2','16.2']};
 return <div className="ts-widget"><Tag kind="paper">论文 Table 2 · 跨数据集测试</Tag><div className="ts-transfer"><div><span>训练集</span><b>Charades-STA</b></div><i>→</i><div><span>直接测试</span><b>ActivityNet Captions</b></div></div><div className="ts-toolbar">{Object.keys(rows).map(x=><Chip key={x} active={method===x} onClick={()=>setMethod(x)}>{x}</Chip>)}</div><div className="ts-stat-row"><Metric label="mIoU" value={rows[method][0]}/><Metric label="R1@0.5" value={rows[method][1]}/><Metric label="R1@0.7" value={rows[method][2]}/></div><p className="ts-note">数值单位：%。该表是从 Charades-STA 到 ActivityNet Captions 的零样本跨域测试协议。</p><Feedback>{method==='TempSamp-R1'?'相对 GRPO，mIoU 提升 4.0 个百分点，R1@0.5 提升 4.7 个百分点；这是跨数据集结果，不是目标域重新训练后的成绩。':method==='GRPO'?'GRPO 在该跨数据集协议下高于 SFT，但仍低于 TempSamp-R1。比较必须保持训练域和测试域相同。':'SFT 是这个迁移实验的监督微调基线。仅在 Charades-STA 训练，不使用 ActivityNet 的目标域训练标注。'}</Feedback></div>;
};
