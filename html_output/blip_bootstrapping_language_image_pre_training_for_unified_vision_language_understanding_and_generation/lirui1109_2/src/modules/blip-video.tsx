import { useState } from 'react';
import { useTween } from './blip-kit';
import { C, SvgText as T } from './blip-revision-kit';
function Frame({x,boat,step}:{x:number;boat:number;step:number}){
 return <g transform={`translate(${x} 14)`}>
  <rect width={450} height={285} rx={16} fill="#fffdf8" stroke={C.line} strokeWidth={3}/>
  <svg x={10} y={10} width={430} height={230} viewBox="0 0 430 230">
   <rect width={430} height={230} rx={10} fill="#e1eceb"/><circle cx={360} cy={44} r={24} fill="#e4cf9e"/>
   <path d="M0 145 L76 47 L174 145 L272 77 L430 152 V230 H0Z" fill="#b8c9bf"/>
   <path d="M0 165 Q110 145 220 169 T430 163 V230 H0Z" fill="#a7c3cb"/>
   <g transform={`translate(${boat} 177)`}><path d="M-30 0 H33 L20 19 H-14Z" fill="#92400e"/><path d="M2 0 V-78 L34 -8 H2" fill="#fffdf8" stroke={C.blue} strokeWidth={3}/><path d="M2 -68 L-24 -12 H2" fill={C.orange}/></g>
  </svg><T x={225} y={271} anchor="middle" color={C.muted}>第 {step} 帧</T>
 </g>;
}
export function BlipVideo(){
 const [reverse,setReverse]=useState(false);
 const swap=useTween(reverse?1:0,650);
 return <div className="blip-page rev-page">
  <svg className="rev-scene" viewBox="0 0 1472 490" role="img" aria-label={reverse?'同样三帧倒放，小船从右向左移动':'三帧正放，小船从左向右移动'}>
   {[0,1,2].map(i=><Frame key={i} x={i*510} boat={i===0?60+swap*310:i===2?370-swap*310:215} step={i+1}/>)}
   <path d={reverse?'M1210 344 H255 L277 327 M255 344 L277 361':'M255 344 H1210 L1188 327 M1210 344 L1188 361'} stroke={C.blue} strokeWidth={6} fill="none"/>
   <rect x={0} y={394} width={714} height={86} rx={16} fill="#eaf3ed"/>
   <T x={357} y={446} anchor="middle" size={34} weight={700} color={C.green}>有什么？小船、山、湖，没变</T>
   <rect x={746} y={394} width={726} height={86} rx={16} fill="#fff1e6"/>
   <T x={1109} y={446} anchor="middle" size={34} weight={700} color={C.blue}>怎么动？{reverse?'向左 ←':'向右 →'}</T>
  </svg>
  <div className="rev-action"><button type="button" className="blip-control rev-primary" aria-pressed={reverse} onClick={()=>setReverse(!reverse)}>{reverse?'切回正放 →':'把这段视频倒放 ←'}</button><span>照片相同，先后不同。</span><span>MSRVTT 检索 R@1：43.3%</span></div>
  <p className="rev-foot" aria-live="polite">零样本指未在视频任务训练；仍经过图像微调。拼接帧特征，没有显式时序建模。</p>
 </div>;
}
