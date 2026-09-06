import React, { useEffect, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { C, clearStage, drawSceneLabel, startObservedLoop } from './stage-analogy';

type Layer='q'|'k'|'v'|'o'|'ffn';type Fact='model'|'optim'|'data'|'geometry';
const details:Record<Layer,string>={q:'q：目标token如何提问',k:'k：记忆如何被匹配',v:'v：最终取回什么内容',o:'o：汇总注意力输出',ffn:'FFN：继续变换token'};
const facts:Record<Fact,[string,string]>={model:['底座模型','Wan2.1 T2V 14B'],optim:['优化设置','LoRA rank 32 · 学习率 1×10^-4'],data:['训练数据','MultiCam多视角视频'],geometry:['几何条件','ViPE估计深度与相机参数']};
export const LoraMap: React.FC<WidgetProps> = () => {
  const ref=useRef<HTMLCanvasElement>(null);const st=useRef({layer:'q' as Layer,fact:'model' as Fact});const [layer,setLayer]=useState<Layer>('q');const [fact,setFact]=useState<Fact>('model');const visited=useRef(new Set<Layer>(['q']));
  useEffect(()=>{const c=ref.current;if(!c)return;return startObservedLoop(c,560,265,(ctx)=>{const s=st.current;clearStage(ctx,560,265);const layers:Layer[]=['q','k','v','o','ffn'];layers.forEach((l,i)=>{const x=28+i*102;const active=s.layer===l;ctx.fillStyle=active?'rgba(39,68,110,.18)':C.white;ctx.strokeStyle=active?C.blue:C.line;ctx.lineWidth=active?4:1.5;ctx.fillRect(x,48,80,54);ctx.strokeRect(x,48,80,54);drawSceneLabel(ctx,l==='ffn'?'FFN':l.toUpperCase(),x+40,80,active?C.blue:C.ink,'center');ctx.fillStyle=C.green;ctx.fillRect(x+53,39,22,12);drawSceneLabel(ctx,'LoRA',x+64,35,C.green,'center');if(i<4){ctx.strokeStyle=C.line;ctx.beginPath();ctx.moveTo(x+80,75);ctx.lineTo(x+102,75);ctx.stroke();}});ctx.fillStyle=C.white;ctx.strokeStyle=C.line;ctx.fillRect(28,132,504,105);ctx.strokeRect(28,132,504,105);drawSceneLabel(ctx,details[s.layer],48,160,C.blue);drawSceneLabel(ctx,facts[s.fact][0],48,190,C.muted);drawSceneLabel(ctx,facts[s.fact][1],48,216,C.green);drawSceneLabel(ctx,'论文未单独给出新的损失公式',512,160,C.orange,'right');});},[]);
  const chooseLayer=(l:Layer)=>{visited.current.add(l);st.current={...st.current,layer:l};setLayer(l);};const chooseFact=(f:Fact)=>{st.current={...st.current,fact:f};setFact(f);};
  return <div><canvas ref={ref} width={560} height={265}/><div className="ctrl">{(['q','k','v','o','ffn'] as Layer[]).map(l=><button key={l} className={`chip ${layer===l?'active':''}`} onClick={()=>chooseLayer(l)}>{l==='ffn'?'FFN':l.toUpperCase()}</button>)}</div><div className="ctrl">{([['model','模型'],['optim','优化'],['data','数据'],['geometry','几何']] as [Fact,string][]).map(([f,label])=><button key={f} className={`chip ${fact===f?'active':''}`} onClick={()=>chooseFact(f)}>{label}</button>)}</div><div className={`feedback ${visited.current.size===5?'good':''}`}>{visited.current.size===5?'五类主要层都通过LoRA适配，而不是全参数重训。':details[layer]}</div></div>;
};
export default LoraMap;
