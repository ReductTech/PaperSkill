import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { Tool, Scene, Craft, Choices, Steps, Feedback, Source, colors, house, brush, gaussian, circle, line } from './kit';
const feedback=["L1、SSIM、可见性和临时先验共同作用；Chamfer 初始权重 1，opacity 正则初始权重 0.1。","前 20K 步内两项临时正则退火到零，释放位置与 opacity 的后续调整。","100K 后渐进加入 LPIPS，最终权重 0.05；加入新损失会改变总损失数值的可比性。","完成 300K 基础训练后，以 1,024 queries 作为扩容起点。","每次加倍 queries 后训练 30K，学习率 1e-5，输入视图随机取 2–12。"];

export const Analogy7:React.FC<WidgetProps>=()=> <Craft action={6}/>;
export const Schedule:React.FC<WidgetProps>=()=>{
 const [stage,setStage]=useState(0),[term,setTerm]=useState(0);
 const termNames=['L1','SSIM','LPIPS','可见性','Chamfer','Opacity 下限'];
 const descriptions=['L1 对齐像素数值，提供基本图像重建信号。','SSIM 约束局部结构，权重 0.2。','LPIPS 提供感知纹理信号，100K 后渐进加入，最终权重 0.05。','惩罚处于所有相关相机视锥外或相机后方的中心，减少收不到有效渲染梯度的高斯。','Lcd = dCD(Gp, P)。P 来自输入视图 VGM 深度的反投影；论文用双向 Chamfer，但正文未展开其距离与归一化实现，故不另造展开公式。','对低于 0.1 的 opacity 使用对数下限惩罚，避免高斯在初始化时过早透明。'];
 const active=[true,true,stage>=2,true,stage===0,stage===0];
 const weights=['1','0.2',stage<2?'尚未引入':stage===2?'渐进 → 0.05':'0.05','1.0',stage===0?'初始 1.0':'0',stage===0?'初始 0.1':'0'];
 return <Tool><div className="qs-timeline">{['起步','20K','100K 后','300K','渐进微调'].map((s,i)=><button aria-pressed={stage===i} key={s} onClick={()=>setStage(i)}>{s}</button>)}</div>
 <Scene label="训练阶段中的临时支撑与损失状态" draw={c=>{house(c,240,237,1.1,stage>=2);if(stage===0){c.fillStyle=colors.orange;c.fillRect(100,130,15,120);c.fillRect(365,130,15,120)}for(let i=0;i<6;i++){const x=540+(i%3)*160,y=70+Math.floor(i/3)*110;circle(c,x,y,28,active[i]?(i>=4?colors.purple:colors.green):colors.line);if(i===term){c.strokeStyle=colors.orange;c.lineWidth=4;c.strokeRect(x-36,y-36,72,72)}}}}/>
 <div className="qs-losses">{termNames.map((s,i)=><div key={s} className={active[i]?'on':''}><button aria-pressed={term===i} onClick={()=>setTerm(i)}>{s}</button><span>权重：{weights[i]}</span></div>)}</div>
 <Feedback tone={stage>0?'good':''}>{feedback[stage]}<br/>{descriptions[term]}</Feedback></Tool>;
};
export const OpacityFloor:React.FC<WidgetProps>=()=>{
 const [alpha,setAlpha]=useState(.01);const penalty=Math.max(0,Math.log(.1)-Math.log(alpha));
 return <Tool><Scene label="不透明度下限惩罚函数" draw={c=>{
 line(c,95,235,990,235,colors.ink,2);line(c,95,235,95,30,colors.ink,2);
 c.strokeStyle=colors.blue;c.lineWidth=4;c.beginPath();for(let k=0;k<=500;k++){const a=.001+k/500*.999,v=Math.max(0,Math.log(.1)-Math.log(a)),x=95+a*880,y=235-v/4.61*190;if(k===0)c.moveTo(x,y);else c.lineTo(x,y)}c.stroke();
 line(c,183,235,183,35,colors.light,2);circle(c,95+alpha*880,235-penalty/4.61*190,9,penalty?colors.orange:colors.green);
 c.fillStyle=colors.ink;c.font='22px sans-serif';c.fillText('α',1004,245);c.fillText('惩罚',36,34);
 }}/><label className="qs-controls">不透明度 α<input type="range" min=".001" max="1" step=".001" value={alpha} onChange={e=>setAlpha(+e.target.value)}/><output>{alpha.toFixed(3)}</output></label>
 <div className="qs-readout"><span>αmin = 0.1</span><strong>当前单个 opacity 惩罚：{penalty.toFixed(4)}</strong></div>
 <div className="qs-equation">Lα = Eα[max(0, log αmin − log(max(α, ε)))]</div>
 <Feedback tone={penalty?'bad':'good'}>{penalty?'低于 0.1 时产生惩罚，防止过早透明。':'超过下限后此项为 0，不奖励继续增大 opacity。'} 原文未给 ε 数值；演示仅在 α≥0.001 且 ε≤0.001 的范围计算，因此不依赖其具体取值。这是单个参数的未加权项，不是实测训练损失。 <Source anchor="Sx3.SSx4" label="式 (7)"/></Feedback></Tool>;
};
