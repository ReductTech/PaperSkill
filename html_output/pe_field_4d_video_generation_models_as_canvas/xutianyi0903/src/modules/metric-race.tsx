import React, { useEffect, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { C, drawSceneLabel, startObservedLoop } from './stage-analogy';

type Metric='dyn'|'met3r'|'trans'|'rot';
const methods=['ReCamMaster','GEN3C','TrajectoryCrafter','ReDirector','Ours'];
const data:Record<Metric,{label:string;dir:'up'|'down';values:number[];digits:number;scaleMax:number}>={
  dyn:{label:'Dyn-MEt3R ↑',dir:'up',values:[.7721,.7426,.7315,.8041,.8235],digits:4,scaleMax:.9},
  met3r:{label:'MEt3R ↓',dir:'down',values:[.3585,.3462,.3328,.3186,.2968],digits:4,scaleMax:.4},
  trans:{label:'TransErr ↓',dir:'down',values:[.0301,.0548,.0684,.0189,.0142],digits:4,scaleMax:.08},
  rot:{label:'RotErr ↓',dir:'down',values:[2.412,6.728,8.943,2.107,1.887],digits:3,scaleMax:10}
};
export const MetricRace: React.FC<WidgetProps> = () => {
  const ref=useRef<HTMLCanvasElement>(null);const st=useRef({metric:'dyn' as Metric});const [metric,setMetric]=useState<Metric>('dyn');
  useEffect(()=>{const c=ref.current;if(!c)return;return startObservedLoop(c,760,330,(ctx)=>{const m=data[st.current.metric],vals=m.values,barStart=205,barMaxWidth=370,valueX=barStart+barMaxWidth+18;ctx.clearRect(0,0,760,330);ctx.fillStyle=C.white;ctx.fillRect(0,0,760,330);drawSceneLabel(ctx,m.label,28,28,C.ink);
    methods.forEach((name,i)=>{const raw=vals[i],barWidth=(raw/m.scaleMax)*barMaxWidth,y=80+i*45,barEnd=barStart+barWidth;drawSceneLabel(ctx,name,25,y+12,name==='Ours'?C.green:C.muted);ctx.fillStyle=C.line;ctx.fillRect(barStart,y,barMaxWidth,14);ctx.fillStyle=name==='Ours'?C.green:C.blue;ctx.fillRect(barStart,y,barWidth,14);ctx.beginPath();ctx.arc(barEnd,y+7,name==='Ours'?8:6,0,Math.PI*2);ctx.fill();if(name==='Ours'){ctx.fillStyle=C.orange;ctx.beginPath();ctx.moveTo(barEnd-10,y-4);ctx.lineTo(barEnd,y-17);ctx.lineTo(barEnd+10,y-4);ctx.closePath();ctx.fill();}drawSceneLabel(ctx,raw.toFixed(m.digits),valueX,y+12,name==='Ours'?C.green:C.ink);});
    drawSceneLabel(ctx,'90段DAVIS视频 · ReCamMaster目标轨迹 · 同一评测协议',380,312,C.blue,'center');});},[]);
  const choose=(m:Metric)=>{st.current={metric:m};setMetric(m);};
  return <div><div className="metric-race-chart"><canvas ref={ref} width={760} height={330}/><div className="metric-race-switches">{(Object.keys(data) as Metric[]).map(m=><button key={m} className={`chip ${metric===m?'active':''}`} onClick={()=>choose(m)}>{data[m].label}</button>)}</div></div><div className="feedback good">结论：本文提出的模型在评估指标上效果更好。</div></div>;
};
export default MetricRace;
