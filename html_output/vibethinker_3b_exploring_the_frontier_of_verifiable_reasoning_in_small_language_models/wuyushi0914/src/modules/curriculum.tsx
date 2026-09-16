import React,{useState} from 'react';
import {Canvas,Chips,Feedback,Stats,C,rect,label,target} from './notebook-scene';
const samples=[[4000,7],[8000,5],[8000,7],[5000,6]];
export function Curriculum(){const [sample,setSample]=useState(0);const [length,errors]=samples[sample];const a=length>=5000,b=errors/8>=.75;return <>
 <Canvas label="长度与难度联合筛选" draw={c=>{[a,b].forEach((ok,i)=>{const x=55+i*390;rect(c,x,30,330,173,'#fff');label(c,i?'错误率≥0.75':'长度≥5K',x+20,68);label(c,i?(errors/8).toFixed(3):String(length),x+25,148,40);target(c,x+272,127,ok,1.5);});}}/>
 <Chips options={['短但很难','长但较易','长且困难','恰好卡在阈值']} value={sample} onChange={setSample}/>
 <Stats items={[["推理长度",`${length.toLocaleString()} tokens`],["参考模型出错",`${errors} / 8 次`],["阶段二",a&&b?'保留':'排除']]}/>
 <Feedback tone={a&&b?'good':'bad'}>{a&&b?(sample===3?'5K和6/8都恰好达到阈值，因此保留；原文排除的是“低于”阈值的样本。':'两条条件同时满足，可以进入第二阶段的困难长推理子集。'):!a?'即使参考模型7/8次出错，轨迹不足5K，仍被第二阶段排除。':'轨迹虽长，但5/8=0.625低于0.75，对参考模型还不够难。'}</Feedback>
 </>;}
