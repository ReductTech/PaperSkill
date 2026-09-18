import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { Tool, Scene, Craft, Choices, Steps, Feedback, Source, colors, house, brush, gaussian, circle, line, Bars } from './kit';
const feedback=["基础训练 300K，1,024 queries × 64 = 65,536 个高斯。","复制旧 queries 并加入小扰动，扩到 2,048；该阶段再训练 30K。","扩到 4,096 queries 后继续训练 30K，单个槽位仍产生 64 个高斯。","最终 8,192 × 64 = 524,288 个高斯；固定容量仍可能不足以覆盖极大或复杂场景。"];
const efficiency=[[1,0.08,0.071,0.621,0.703,9.276],[2,0.129,0.076,0.648,0.78,9.329],[3,0.205,0.08,0.675,0.884,9.383],[4,0.242,0.085,0.702,0.949,9.436],[5,0.345,0.09,0.729,1.082,9.489],[6,0.41,0.095,0.758,1.175,9.542],[8,0.55,0.105,0.818,1.377,9.648],[12,0.931,0.125,0.943,1.89,10.064],[24,2.559,0.182,1.293,3.88,11.549],[48,7.97,0.297,1.99,10.017,14.706],[72,16.393,0.411,2.687,19.158,18.431],[100,30.031,0.545,3.499,33.645,22.588],[200,111.95,1.025,6.4,118.574,29.979],[300,246.115,1.501,9.297,255.725,40.773]];

export const Analogy9:React.FC<WidgetProps>=()=> <Craft action={8}/>;
export const Capacity:React.FC<WidgetProps>=()=>{
 const [stage,setStage]=useState(0);const queries=1024*2**stage;
 return <Tool><Choices labels={['1,024','2,048','4,096','8,192']} label="查询数" value={stage} onChange={setStage}/>
 <Scene label="query 容量与高斯数的算术关系" draw={c=>{house(c,270,242,1.15,true);for(let i=0;i<8;i++){const x=610+(i%4)*92,y=65+Math.floor(i/4)*95;c.fillStyle=i<2**stage?colors.green:colors.line;c.fillRect(x,y,64,60);if(i<2**stage){for(let j=0;j<16;j++)circle(c,x+9+(j%4)*15,y+9+Math.floor(j/4)*14,3,colors.bg)}}}}/>
 <div className="qs-readout"><span>{queries.toLocaleString()} queries × 64</span><strong>{(queries*64).toLocaleString()} 个高斯</strong><span>{stage===0?'基础阶段 300K':'本次扩容 30K'}</span></div><Feedback>{feedback[stage]} 每块容量标记表示 1,024 queries，不是一个 query。</Feedback>
 <details><summary>测试时优化（TTO）的更新边界</summary><p>固定学习到的查询、解码器和输出头，仅优化提取的特征；监督信号来自输入视图。它额外增加运行时间，不能把 TTO 分数当作一次前馈的分数。</p><p>表 1 的 2 视图结果中，TTO-20 的 PSNR 为 22.0094，TTO-50 为 21.9437；因此“更多步必定更好”不成立。<Source anchor="Sx3.T1" label="表 1"/></p></details></Tool>;
};
export const Efficiency:React.FC<WidgetProps>=()=>{
 const [idx,setIdx]=useState(3),r=efficiency[idx];
 return <Tool><div className="qs-controls"><label>输入视图数<select aria-label="效率视图数" value={idx} onChange={e=>setIdx(+e.target.value)}>{efficiency.map((row,i)=><option key={row[0]} value={i}>{row[0]} 视图</option>)}</select></label><strong>单位：秒 · 越低越好</strong></div>
 <Bars max={r[4]} rows={[{label:'VGGT-Ω 聚合',value:r[1],color:colors.blue},{label:'解码器（8,192）',value:r[3],color:colors.green},{label:'总前向时间',value:r[4],color:colors.orange}]}/>
 <div className="qs-readout"><strong>峰值显存 {r[5].toFixed(3)} GiB</strong><span>1,024-query 解码器：{r[2].toFixed(3)} 秒</span></div>
 <Feedback>{r[0]<=12?'稀疏输入时，在论文的 H200 条件下可快速重建。':'视图数增加时，VGM 特征聚合逐渐成为主要耗时。'} 单 NVIDIA H200，5 次 CUDA 同步前向均值，排除一次热身；8,192-query 完整前向峰值已分配显存。各耗时项按原表列出，不强行相加；不含 TTO。<Source anchor="A3.T14" label="附录 C · 表 14"/></Feedback></Tool>;
};
