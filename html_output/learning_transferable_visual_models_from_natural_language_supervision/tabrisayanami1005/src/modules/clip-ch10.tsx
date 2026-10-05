import React, { useEffect, useState } from 'react';
import { Canvas, C, card, label, Chips, Feedback } from './clip-scenes';
import type { WidgetProps } from './registry';

const datasets=['aYahoo','ImageNet','SUN'];
const values=[[98.4,72.4],[76.2,11.5],[58.5,23.0]];
const domains=['ImageNet','ImageNetV2','ImageNet Sketch'];
const shifted=[[76.2,76.2],[70.1,64.3],[60.2,25.2]];
function bars(ctx:CanvasRenderingContext2D,a:number,b:number,progress:number,secondName:string) {
  [a,b].forEach((v,i)=>{
    const y=70+i*100;const color=i?C.red:C.green;
    label(ctx,i?secondName:'CLIP',36,y+26,color);
    ctx.fillStyle=C.border;ctx.beginPath();ctx.roundRect(205,y,720,40,8);ctx.fill();
    if(v*progress>0){ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(205,y,720*v/100*progress,40,8);ctx.fill();}
    ctx.fillStyle=C.text;ctx.font='24px "Microsoft YaHei", sans-serif';ctx.fillText(`${(v*progress).toFixed(1)}%`,940,y+28);
  });
}
export const ClipCh10:React.FC<WidgetProps>=({moduleId})=>{
 const [dataset,setDataset]=useState(1);const [domain,setDomain]=useState(0);
 const [start,setStart]=useState<number|null>(null);const [running,setRunning]=useState(false);
 useEffect(()=>{if(!running)return;const timer=window.setTimeout(()=>setRunning(false),1300);return()=>window.clearTimeout(timer);},[running,start]);
 if(moduleId==='10.4'){
   const [a,b]=shifted[domain];
   return <div>
    <Canvas ariaLabel={`${domains[domain]}：CLIP ${a}%，ResNet101 ${b}%`} draw={ctx=>bars(ctx,a,b,1,'基线')}/>
    <Chips label="选择测试分布" options={domains} value={domain} onChange={setDomain}/>
    <Feedback tone={a>b?'good':''}>论文图7的 top-1 准确率（越高越好）：零样本 CLIP 为 {a.toFixed(1)}%，ImageNet 训练的 ResNet101 为 {b.toFixed(1)}%，相差 {(a-b).toFixed(1)} 个百分点。{domain===0?'这两个模型在原 ImageNet 验证集上同为76.2%，因此可以比较换分布后的表现。':'换分布后差距变大，支持在这些基准上的鲁棒性结论；不能推广为任何未知场景都可靠。'}</Feedback>
    <p>这里的基线是 ResNet101，评测的是分类 top-1 准确率；它与图4中的“ResNet50 特征上的线性分类器”不同。条形只重绘论文报告值，没有在浏览器里评测模型。</p>
   </div>;
 }
 const [a,b]=values[dataset];
 const change=(n:number)=>{setDataset(n);setRunning(false);setStart(null);};
 return <div>
  <Canvas ariaLabel={`${datasets[dataset]}历史零样本结果对照，点击开始显示论文数值`} animate={running} draw={(ctx,time)=>{
   const p=start===null?0:running?Math.min(1,Math.max(0,(time-start)/1100)):1;
   bars(ctx,a,b,p,'前作');
   if(start===null){card(ctx,330,15,350,38,'',C.blue);}
  }}/>
  <Chips label="选择论文表1数据集" options={datasets} value={dataset} onChange={change}/>
  <div className="ctrl"><button className="chip" disabled={running} onClick={()=>{setStart(performance.now());setRunning(true);}}>{running?'正在展示…':start===null?'开始论文结果对照':'重新展示'}</button></div>
  <Feedback tone={start===null?'':running?'':'good'}>{start===null?'先选数据集，再点击开始。数值取自论文表1；动画用于显示差距。':`表1：${datasets[dataset]} 的零样本准确率，CLIP ${a.toFixed(1)}%，Visual N-Grams ${b.toFixed(1)}%，差 ${ (a-b).toFixed(1)} 个百分点（准确率越高越好）。`}</Feedback>
  <p>来源：论文第4页表1与§3.1。CLIP 为最佳 ViT-L/14@336px 配置，前作为 Visual N-Grams；训练数据、模型和年代等多项条件不同，不能把差值解释为“只更换对比损失”的提升。</p>
 </div>;
};
