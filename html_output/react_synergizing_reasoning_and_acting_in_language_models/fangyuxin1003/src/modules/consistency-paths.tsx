import { useState } from 'react';
import { C, CanvasScene, Chip, Controls, Feedback, circle, line, label, drawBook } from './scene-kit';
import { panel, flow } from './original-visuals';
const lerp=(a:number,b:number,p:number)=>a+(b-a)*p;
function curve(ctx:CanvasRenderingContext2D,x1:number,y1:number,cx:number,cy:number,x2:number,y2:number,p:number,color:string){
 ctx.strokeStyle=C.border;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x1,y1);ctx.quadraticCurveTo(cx,cy,x2,y2);ctx.stroke();
 const t=Math.max(0,Math.min(1,p)),u=1-t;circle(ctx,u*u*x1+2*u*t*cx+t*t*x2,u*u*y1+2*u*t*cy+t*t*y2,5,color);
}
export function ConsistencyPaths(){const[bias,setBias]=useState(false);return <div>
 <CanvasScene key={String(bias)} label={bias?'五条推理共享错误前提，可能一致地给出错误答案。':'五条不同推理按最终答案汇总：三条 A、两条 B；多数选择 A。'} draw={(ctx,_w,_h,time)=>{
  const t=(time%8000)/8000;
  label(ctx,'同一个问题',42,34,C.text,19);label(ctx,'多条推理路径',361,34,C.text,19);label(ctx,'按最终答案汇总',794,34,C.text,19);
  circle(ctx,95,145,34,C.blue);label(ctx,'?',86,154,'#fff',29);
  const ys=[64,105,146,187,228];
  ys.forEach((y,i)=>{
   const a=bias||i<3;const color=a?C.blue:C.orange;
   curve(ctx,130,145,224,y,315,y,Math.min(1,t/.28),C.purple);
   line(ctx,328,y,594,y,C.border,2);
   [365+i%2*19,463-i%3*12,560].forEach((x,j)=>{circle(ctx,x,y,7,t>(.28+j*.1)?color:C.light)});
   if(t>=.28&&t<.64)circle(ctx,lerp(328,594,(t-.28)/.36),y,5,color);
   label(ctx,String(i+1),288,y+5,C.muted,12);
   const outY=a?98:213;
   curve(ctx,603,y,719,y,840,outY,Math.max(0,(t-.64)/.24),color);
  });
  panel(ctx,846,69,171,62,C.blue);label(ctx,'A',864,108,C.blue,27);label(ctx,t<.89?'…':bias?'5 票':'3 票',923,106,C.blue,19);
  panel(ctx,846,184,171,62,C.orange);label(ctx,'B',864,222,C.orange,27);label(ctx,t<.89?'…':bias?'0 票':'2 票',923,222,C.orange,19);
  if(t>=.89)label(ctx,'多数',1026,107,C.blue,14);
  if(bias){label(ctx,'共享同一错误前提',161,263,C.red,17);}
 }}/>
 <Controls><Chip active={!bias} onClick={()=>setBias(false)}>不同路径，汇总答案</Chip><Chip active={bias} onClick={()=>setBias(true)}>一致，也可能一起错</Chip></Controls>
 <Feedback>{bias?'如果共同前提就是错的，多条路径仍可能汇总到同一个错误答案。自一致性衡量的是内部一致，不能替代外部事实核查。':'先采样不同的推理过程，再聚合最终答案；不是把同一段推理复制多次，也不是让多个答案轮流投票。这里的五条路径只用于演示。'}</Feedback>
 </div>;}
const values={HotpotQA:{single:[29.4,33.4,27.4],forward:34.2,reverse:35.1,metric:'EM（%）'},FEVER:{single:[56.3,60.4,60.9],forward:64.6,reverse:62.0,metric:'准确率（%）'}};
export function HybridResults(){const[task,setTask]=useState<'HotpotQA'|'FEVER'>('HotpotQA');const[forward,setForward]=useState(true);const d=values[task],combined=forward?d.forward:d.reverse;
 return <div>
 <Controls><Chip active={forward} onClick={()=>setForward(true)}>CoT-SC → ReAct</Chip><Chip active={!forward} onClick={()=>setForward(false)}>ReAct → CoT-SC</Chip><Chip active={task==='HotpotQA'} onClick={()=>setTask('HotpotQA')}>HotpotQA</Chip><Chip active={task==='FEVER'} onClick={()=>setTask('FEVER')}>FEVER</Chip></Controls>
 <CanvasScene key={`${task}-${forward}`} height={330} label={`${task} ${d.metric}：CoT ${d.single[0]}，CoT-SC ${d.single[1]}，ReAct ${d.single[2]}，所选组合 ${combined}。`} draw={(ctx,_w,_h,time)=>{
  const progress=Math.min(1,time/1600),packet=(time%5000)/5000;
  label(ctx,'信息从哪里来',37,35,C.text,20);label(ctx,`${task} · ${d.metric}`,533,35,C.text,20);
  const internal=forward?108:360,external=forward?360:108;
  circle(ctx,internal,138,39,C.light);for(let i=0;i<3;i++){const y=118+i*20;line(ctx,internal-22,138,internal+17,y,C.purple,2);circle(ctx,internal+20,y,4,C.purple);}label(ctx,'内部推理',internal-37,208,C.purple,18);
  drawBook(ctx,external-46,103,.53,C.contour);label(ctx,'外部查证',external-37,208,C.blue,18);
  flow(ctx,166,137,297,137,packet,C.blue);label(ctx,forward?'答案分散':'仍未作答',184,106,C.orange,16);
  label(ctx,forward?'补充事实':'换一种推理方式',forward?325:302,251,C.green,18);
  line(ctx,489,51,489,283,C.border,2);
  const names=['CoT','CoT-SC','ReAct','所选组合'];const ns=[...d.single,combined];
  names.forEach((n,i)=>{const y=70+i*53;label(ctx,n,533,y+18,i===3?C.green:C.blue,18);ctx.fillStyle='#e7eddc';ctx.fillRect(635,y,333,24);ctx.fillStyle=i===3?C.green:i===1?C.purple:C.blue;ctx.fillRect(635,y,ns[i]/100*333*progress,24);label(ctx,ns[i].toFixed(1),987,y+19,i===3?C.green:C.text,18);});
  label(ctx,'0',635,305,C.muted,15);label(ctx,'100',940,305,C.muted,15);
 }}/>
 <div className="hybrid-summary"><div><strong>切换条件</strong><br/>{forward?'21 条采样中，最多票答案不足 11 票时，转向 ReAct。':`${task} 中，ReAct 在 ${task==='HotpotQA'?7:5} 步内仍未回答时，转向 CoT-SC。`}</div><div><strong>{task} · {d.metric}</strong><br/>CoT {d.single[0].toFixed(1)} · CoT-SC {d.single[1].toFixed(1)} · ReAct {d.single[2].toFixed(1)}<br/>所选组合 <strong>{combined.toFixed(1)}</strong></div></div>
 <Feedback>{task==='HotpotQA'?'HotpotQA 中，先检索再回退到内部推理的结果更高；这不表示外部检索本身总比 CoT 更强。':'FEVER 中，先汇总内部答案、分散时再查证的结果更高。回退方向的效果依赖任务，不能脱离协议比较。'}</Feedback>
 </div>;}