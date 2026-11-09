import { useState } from 'react';
import { useTween } from './blip-kit';
import { C,Pair,SvgText as T } from './blip-revision-kit';
export function BlipBootstrap(){
 const [phase,setPhase]=useState(0);
 const move=useTween(phase>0?1:0,1000);
 const learned=useTween(phase===2?1:0,1600);
 const complete=phase===2&&learned>.999;
 const sources=[{kind:'bird' as const,label:'人标图文',text:'湖面上飞过一群鸟'},{kind:'travel' as const,label:'清洗原文',text:'山湖边的小屋'},{kind:'cake' as const,label:'清洗合成描述',text:'奶油巧克力蛋糕'}];
 return <div className="blip-page rev-page">
  <svg className="rev-scene" viewBox="0 0 1472 490" role="img" aria-label={phase===0?'清洗后的三类图文对等待交接':complete?'新模型使用接收的图文对完成预训练流程演示':'图文数据移入独立的新模型'}>
   <T x={72} y={47} size={34} weight={750}>清洗结果</T><T x={72} y={87} color={C.muted}>Captioner / Filter 已完成</T>
   <rect x={1036} y={7} width={428} height={472} rx={24} fill="#edf2f7" stroke={phase?C.green:C.blue} strokeWidth={4}/>
   <T x={1250} y={52} size={34} anchor="middle" weight={750}>新 MED 模型</T>
   <T x={1250} y={94} anchor="middle" color={C.muted}>ViT / BERT 初始化</T>
   {sources.map((s,i)=><g key={s.label}>
    <rect x={58} y={110+i*122} width={574} height={110} rx={14} fill="none" stroke={C.line} strokeWidth={3} strokeDasharray="10 8"/>
    <g transform={`translate(${58+move*1005} ${110+i*122+move*(14-i*35)}) scale(${1-move*.355})`}>
     <Pair width={574} height={110} kind={s.kind} text={s.text} label={s.label} tone={phase?C.green:C.line}/>
    </g>
   </g>)}
   <path d="M682 270 H960 L935 249 M960 270 L935 291" stroke={phase?C.green:C.blue} strokeWidth={7} fill="none"/>
   <T x={822} y={236} anchor="middle" weight={700} color={C.blue}>{phase===0?'交接图文数据':'数据已接收'}</T>
   <T x={1250} y={395} anchor="middle" color={C.blue} weight={700}>{phase===0?'等待清洗结果':phase===1?'已装入三类图文对':complete?'✓ 预训练演示完成':'用图文对学习中…'}</T>
   <rect x={1072} y={420} width={356} height={22} rx={11} fill="#dce2e9"/><rect x={1072} y={420} width={Math.max(0,356*learned)} height={22} rx={11} fill={C.green}/>
  </svg>
  <div className="rev-action"><button type="button" className="blip-control rev-primary" disabled={(phase===1&&move<.999)||(phase===2&&!complete)} onClick={()=>setPhase(complete?0:phase+1)}>{phase===0?'把清洗结果交给新模型 →':phase===1?'用收到的数据开始预训练':complete?'再看一次':'正在预训练…'}</button></div>
  <p className="rev-foot" aria-live="polite">{phase===0?'Captioner / Filter 准备数据，新模型用数据学习。':phase===1?'交接完成。下一步，开始新模型的预训练。':'这里只演示训练流程，不运行真实模型训练。'}</p>
 </div>;
}
