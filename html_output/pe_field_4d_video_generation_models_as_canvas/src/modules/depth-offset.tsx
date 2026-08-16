import React, { useEffect, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { C, clearStage, drawActor, drawFocusRing, drawSceneLabel, drawViewfinder, startObservedLoop } from './stage-analogy';

export const DepthOffset: React.FC<WidgetProps> = () => {
  const ref=useRef<HTMLCanvasElement>(null);const st=useRef({delta:0});const [delta,setDelta]=useState(0);
  useEffect(()=>{const c=ref.current;if(!c)return;return startObservedLoop(c,560,260,(ctx)=>{const d=st.current.delta,sep=d*560;clearStage(ctx,560,260);drawViewfinder(ctx,35,35,235,166,d>=.06?C.green:d>0?C.blue:C.red);drawActor(ctx,152-sep/2,126,C.green,.88);drawActor(ctx,152+sep/2,126,C.purple,.68);drawFocusRing(ctx,296,122,d*42,C.orange);drawSceneLabel(ctx,'同一二维位置',152,25,C.ink,'center');ctx.fillStyle=C.white;ctx.strokeStyle=C.line;ctx.fillRect(340,35,185,166);ctx.strokeRect(340,35,185,166);ctx.strokeStyle=C.line;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(365,165);ctx.lineTo(500,165);ctx.stroke();for(const v of [0,.1,1]){const x=365+v*125;ctx.beginPath();ctx.moveTo(x,158);ctx.lineTo(x,172);ctx.stroke();drawSceneLabel(ctx,v===1?'t+1':v===.1?'t+0.1':'t',x,190,C.muted,'center');}const x1=365,x2=365+d*1250;ctx.fillStyle=C.green;ctx.beginPath();ctx.arc(x1,140,8,0,Math.PI*2);ctx.fill();ctx.fillStyle=d===0?C.red:C.purple;ctx.beginPath();ctx.arc(x2,120,8,0,Math.PI*2);ctx.fill();drawSceneLabel(ctx,`t′ = t + ${d.toFixed(2)}`,432,67,d>=.06?C.green:d>0?C.blue:C.red,'center');drawSceneLabel(ctx,'下一帧边界',490,214,C.muted,'center');});},[]);
  const update=(v:number)=>{st.current.delta=v;setDelta(v);};const feedback=delta===0?{c:'bad',t:'Δ=0：二维位置相同，前后景地址冲突。'}:delta<.06?{c:'',t:'已有前后顺序，但间隔仍很小。'}:{c:'good',t:'深度层被区分，同时仍留在同一帧的0.1范围内。'};
  return <div><canvas ref={ref} width={560} height={260}/><div className="ctrl"><label>深度偏移 Δ(d) <span className="val">{delta.toFixed(2)}</span></label><input type="range" min="0" max="10" value={Math.round(delta*100)} onChange={e=>update(Number(e.target.value)/100)}/><button className="chip" onClick={()=>update(.1)}>论文上限 0.10</button></div><div className={`feedback ${feedback.c}`}>{feedback.t}</div></div>;
};
export default DepthOffset;
