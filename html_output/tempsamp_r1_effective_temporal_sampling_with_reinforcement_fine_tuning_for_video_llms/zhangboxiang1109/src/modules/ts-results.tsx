const RESULTS:any={
 'Charades-STA':{unit:'时序定位 · 指标均为 %',metrics:['mIoU','R1@0.3','R1@0.5','R1@0.7'],rows:{'no-CoT':['61.7','83.3','73.6','52.2'],'CoT':['62.1','83.6','74.1','52.9'],'Mixed CoT':['64.2','85.0','76.0','56.3']}},
 'ActivityNet Captions':{unit:'时序定位 · 指标均为 %',metrics:['mIoU','R1@0.3','R1@0.5','R1@0.7'],rows:{'no-CoT':['52.1','72.8','55.4','34.2'],'CoT':['52.4','73.4','56.0','34.7'],'Mixed CoT':['54.9','75.7','58.7','37.6']}},
 'QVHighlights':{unit:'高光检测 · 指标均为 %',metrics:['mAP','HIT@1'],rows:{'no-CoT':['30.0','57.6'],'CoT':['28.3','54.9'],'Mixed CoT':['29.3','63.7']}}
};

/* Refined 2026-10-22. Internal provenance; not rendered. */
import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { Chip, Tag, Feedback, Timeline, Metric, SHAPE, stopRangeNav } from './ts-shared';

export const TsResults: React.FC<WidgetProps> = () => {
 const [dataset,setDataset]=useState('Charades-STA'); const [mode,setMode]=useState('Mixed CoT'); const d=RESULTS[dataset];
 const winners=d.metrics.map((_metric: string,i: number)=>Object.entries(d.rows).sort((a:any,b:any)=>Number(b[1][i])-Number(a[1][i]))[0][0]);
 return <div className="ts-widget"><div className="ts-toolbar">{Object.keys(RESULTS).map(x=><Chip key={x} active={dataset===x} onClick={()=>setDataset(x)}>{x}</Chip>)}</div><div className="ts-toolbar" role="group" aria-label="推理模式">{["no-CoT","CoT","Mixed CoT"].map(x=><Chip key={x} active={mode===x} onClick={()=>setMode(x)}>{x}</Chip>)}</div><Tag kind="paper">论文 Table 1 · {d.unit}</Tag><div className="ts-results-table-wrap"><table className="ts-table"><thead><tr><th>推理模式</th>{d.metrics.map((x:string)=><th key={x}>{x}</th>)}</tr></thead><tbody>{Object.entries(d.rows).map(([name,values]:any)=><tr className={mode===name?'selected':''} key={name}><th scope="row">{name}</th>{values.map((v:string,i:number)=><td key={i}>{v}{winners[i]===name&&<small className="ts-best">该列最高</small>}</td>)}</tr>)}</tbody></table></div><div className="ts-note">{dataset==='QVHighlights'?'注意任务变化：这里是高光检测。no-CoT 的 mAP 最高（30.0），Mixed CoT 的 HIT@1 最高（63.7）。':'该数据集是时间区间定位；Mixed CoT 在表中各列较高。'} Mixed CoT 按论文描述逐查询选取 CoT 与 no-CoT 中较优预测；应按论文的比较设定理解，不推断为无需额外选择信号的单次部署方式。</div><Feedback>当前选择：{mode}。论文报告的领先结果必须连同数据集、任务、指标一起读。</Feedback></div>;
};
