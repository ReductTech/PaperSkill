import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { Tool, Scene, Craft, Choices, Steps, Feedback, Source, colors, house, brush, gaussian, circle, line } from './kit';
const feedback=["冻结 VGM 提供几何特征、相机和早期深度先验。","Qgeo 跨注意力读取 Fgeo，再经过 query 自注意力与 MLP，得到 Zgeo 并预测 p、r、s。","RGB patch 与由输入预测相机计算的 Plücker ray embedding 组成 Fapp。","Zgeo 作为基础查询状态，加上可学习 Qapp，读取 Fapp，预测 alpha 与 SH。","每个 query 产生 64 个高斯；对应空间与外观属性组装后，在对齐的相机下 splatting。","原图来自 QuerySplat 项目页，作者 Yinglong Li 等，按页脚 CC BY-SA 4.0 声明使用，未修改图片内容。"];

export const Analogy8:React.FC<WidgetProps>=()=> <Craft action={7}/>;
export const Architecture:React.FC<WidgetProps>=()=>{
 const [node,setNode]=useState(0);
 const names=['VGM','几何解码器','RGB 与射线','外观解码器','高斯组装','原图核对'];
 const details=['冻结的 VGGT-Ω','Qgeo + Fgeo → Zgeo','RGB patch + Plücker → Fapp','Zgeo / Qapp / Fapp → Zapp','p / r / s / α / SH','作者方法总览图'];
 const dependencies=[[1,3,4],[3,4],[3,4],[4],[],[]];
 return <Tool><div className="qs-network">{names.map((s,i)=><button key={s} aria-pressed={node===i} className={dependencies[node].includes(i)?'downstream':''} onClick={()=>setNode(i)}>{s}<small>{details[i]}</small></button>)}</div>
 {node===5?<figure><img src={import.meta.env.BASE_URL+'images/overview.png'} alt="QuerySplat 作者方法总览：VGM、双分支查询与 Gaussian 属性输出"/><figcaption>QuerySplat 方法总览，Yinglong Li、Donghui Shen 等作者。来源：<a href="https://inspatio.github.io/querysplat/" target="_blank" rel="noreferrer">作者项目页</a>；依据该页 <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noreferrer">CC BY-SA 4.0</a> 许可声明公开使用。图片原样保留，仅按显示尺寸缩放；无作者背书。</figcaption></figure>:<Scene label="双分支特征依赖和属性输出示意" draw={c=>{
 const pts=[[120,70],[430,70],[120,210],[680,210],[945,130]];
 const edges=[[0,1],[1,3],[2,3],[1,4],[3,4]];
 edges.forEach(([a,b])=>line(c,pts[a][0]+35,pts[a][1],pts[b][0]-35,pts[b][1],a===node||b===node?colors.green:colors.line,a===node||b===node?5:2));
 pts.forEach(([x,y],i)=>{circle(c,x,y,30,i===node?colors.blue:dependencies[node].includes(i)?colors.green:colors.light);if(i===node){c.strokeStyle=colors.orange;c.lineWidth=4;c.strokeRect(x-38,y-38,76,76)}});
 c.fillStyle=colors.ink;c.font='23px sans-serif';c.fillText('几何',395,27);c.fillText('外观',645,270);
 }}/>}
 <div className="qs-readout"><strong>{node===1?'12 层 · 2,048 维 · 16 头':node===3?'6 层 · 2,048 维 · 16 头':node===4?'每个 query → 64 个 Gaussian':'共同坐标系中的属性聚合'}</strong></div>
 <Feedback tone={node===4?'good':''}>{feedback[node]}</Feedback></Tool>;
};
