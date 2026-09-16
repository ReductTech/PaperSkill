import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { Tool, Scene, Craft, Choices, Steps, Feedback, Source, colors, house, brush, gaussian, circle, line } from './kit';
const feedback=["当前场景需要反复调整高斯参数，才能逼近观察图像。","已训练网络直接预测高斯；可选 TTO 是额外适配，不是前馈的必要步骤。"];
export const Analogy1:React.FC<WidgetProps>=()=> <Craft action={0}/>;
export const Inference:React.FC<WidgetProps>=()=>{

 const [mode,setMode]=useState(0),[step,setStep]=useState(0);
 const labels=['输入照片',mode?'网络预测':'场景拟合','渲染视图'];
 return <Tool><Choices labels={['逐场景优化','前馈预测']} value={mode} onChange={v=>{setMode(v);setStep(0)}}/>
 <Scene label="一次预测与逐场景拟合的概念过程" draw={(c)=>{
 for(let i=0;i<3;i++){const x=190+i*350;c.strokeStyle=i===step?colors.blue:colors.line;c.lineWidth=i===step?5:2;c.strokeRect(x-105,40,210,190);house(c,x,211,.84,step===2,i===step?colors.blue:colors.dark);if(i<2)line(c,x+110,130,x+232,130,i<step?colors.green:colors.line,5)}
 if(!mode&&step===1){c.strokeStyle=colors.orange;c.lineWidth=5;c.beginPath();c.arc(540,140,109,0,Math.PI*1.7);c.stroke()}
 }}/>
 <div className="qs-readout">{labels.map((s,i)=><strong key={s} style={{color:i===step?colors.blue:'#84908d'}}>{i+1}. {s}</strong>)}</div><Steps value={step} max={2} onChange={setStep}/>
 <Feedback tone={mode&&step===2?'good':''}>{step===0?'输入是稀疏图像集合；还需要建立可渲染的空间表示。':step===1?feedback[mode]:mode?'高斯集合已经预测完成，可按指定相机渲染新视角；TTO 是独立的可选步骤。':'优化得到的高斯可以换视角渲染；换一个场景通常还需重新拟合。'}</Feedback></Tool>;

};
