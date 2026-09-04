import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const C={bg:'#f5f8f0',env:'#b8c9a7',env2:'#76906a',brown:'#92400e',blue:'#27446e',green:'#228d5c',red:'#c43f52',orange:'#d97706',purple:'#7c3aed',ink:'#21324a',muted:'#68778f',line:'#d7deea',white:'#fff'};
function base(ctx:CanvasRenderingContext2D,w:number,h:number){ctx.clearRect(0,0,w,h);ctx.fillStyle=C.bg;ctx.fillRect(0,0,w,h);ctx.strokeStyle=C.line;ctx.strokeRect(.5,.5,w-1,h-1);}
function text(ctx:CanvasRenderingContext2D,s:string,x:number,y:number,color=C.ink,bold=false){ctx.fillStyle=color;ctx.font=`${bold?'700':'400'} 14px "Segoe UI",sans-serif`;ctx.fillText(s,x,y);}
function camera(ctx:CanvasRenderingContext2D,x:number,y:number,color=C.blue){ctx.fillStyle=color;ctx.fillRect(x-18,y-10,36,20);ctx.fillStyle=C.white;ctx.beginPath();ctx.arc(x,y,6,0,Math.PI*2);ctx.fill();}
function useCanvas(draw:(ctx:CanvasRenderingContext2D)=>void,deps:React.DependencyList,w=760,h=300){const ref=useRef<HTMLCanvasElement>(null);useEffect(()=>{if(!ref.current)return;const ctx=setupCanvas(ref.current,w,h);draw(ctx);ref.current.classList.add('is-ready');},deps);return ref;}

export const LsmC4Main:React.FC<WidgetProps>=()=>{
  const [x,setX]=useState(45);const dragging=useRef(false);const candidates=x<28?0:x<63?2:3;const selected=x<52?'近墙 A':'近墙 B';
  const ref=useCanvas(ctx=>{base(ctx,760,310);text(ctx,'俯视投影',22,28,C.ink,true);ctx.fillStyle=C.env;ctx.fillRect(30,55,300,210);const cx=65+x*2.25;camera(ctx,cx,245,C.blue);const pts=[{x:150,y:100,d:1,c:C.green},{x:230,y:130,d:2,c:C.orange},{x:280,y:85,d:3,c:C.purple}];pts.forEach((p,i)=>{ctx.fillStyle=candidates&&((x<52&&i===0)||(x>=52&&i===1))?C.green:C.env2;ctx.beginPath();ctx.arc(p.x,p.y,10,0,Math.PI*2);ctx.fill();ctx.strokeStyle=C.line;ctx.beginPath();ctx.moveTo(cx,235);ctx.lineTo(p.x,p.y);ctx.stroke();});ctx.strokeStyle=C.line;ctx.beginPath();ctx.moveTo(350,35);ctx.lineTo(350,280);ctx.stroke();text(ctx,'目标 latent 单元 (u,v)',385,28,C.ink,true);ctx.fillStyle=C.white;ctx.strokeStyle=candidates?C.green:C.line;ctx.lineWidth=3;ctx.fillRect(390,55,145,125);ctx.strokeRect(390,55,145,125);if(candidates){text(ctx,selected,420,95,C.green,true);text(ctx,'z-buffer：最小正深度',402,128,C.blue);text(ctx,'mₜ=1',438,160,C.green,true);}else{text(ctx,'空单元',433,105,C.muted,true);text(ctx,'ẑₜ=0，mₜ=0',405,145,C.muted);}ctx.fillStyle=C.white;ctx.strokeStyle=C.line;ctx.fillRect(570,55,160,125);ctx.strokeRect(570,55,160,125);text(ctx,'可见性掩码',595,85,C.ink,true);for(let r=0;r<3;r++)for(let c=0;c<4;c++){ctx.fillStyle=candidates&&r===1&&c===2?C.green:'#edf1f5';ctx.fillRect(595+c*26,105+r*20,18,14);}text(ctx,`相机横向位置 ${x}%`,385,235,C.orange,true);text(ctx,candidates?'同格冲突由最近正深度点解决':'没有候选点：显式标记“未见”',385,268,candidates?C.green:C.blue,true);},[x,candidates,selected],760,310);
  const move=(e:React.PointerEvent<HTMLCanvasElement>)=>{if(!dragging.current)return;const r=e.currentTarget.getBoundingClientRect();setX(Math.round(clamp((e.clientX-r.left)/r.width*100,0,100)));};
  return <div><canvas ref={ref} width={760} height={310} onPointerDown={e=>{dragging.current=true;e.currentTarget.setPointerCapture(e.pointerId);move(e);}} onPointerMove={move} onPointerUp={()=>dragging.current=false}/><div className="ctrl"><label>目标相机位置 <span className="val">{x}%</span></label><input type="range" min="0" max="100" value={x} onChange={e=>setX(+e.target.value)}/></div><div className={`feedback ${candidates?'good':''}`}>{candidates?`当前单元由${selected}提供 Token ；颜色与粗描边共同标出前景。`:'当前单元没有正深度候选，ẑ=0 之外还必须给出 m=0。'}</div></div>;
};

const cycle=[
  {name:'初始化',desc:'I₀ → VAE latent + 深度 → 反投影，播下第一批缓存点。',color:C.blue},
  {name:'latent 读出',desc:'按每个目标位姿投影缓存，得到 ẑₜ 与 mₜ。',color:C.green},
  {name:'骨干去噪',desc:'侧分支把记忆提示注入视频扩散骨干。',color:C.purple},
  {name:'按块解码',desc:'完成一个 chunk 后，才把 latent 解码成输出帧。',color:C.orange},
  {name:'估深与分割',desc:'估计深度，并标出动态物体与天空。',color:C.orange},
  {name:'缓存更新',desc:'重新编码干净帧，只把 Λₜ 内的静态单元并入 M。',color:C.green}
];
export const LsmC5Main:React.FC<WidgetProps>=()=>{
  const [step,setStep]=useState(0);const ref=useCanvas(ctx=>{base(ctx,760,300);const y=135;cycle.forEach((s,i)=>{const x=45+i*116;ctx.fillStyle=i===step?s.color:C.white;ctx.strokeStyle=i===step?s.color:C.line;ctx.lineWidth=i===step?3:1;ctx.fillRect(x,y-38,92,76);ctx.strokeRect(x,y-38,92,76);text(ctx,String(i+1),x+10,y-8,i===step?C.white:C.muted,true);text(ctx,s.name,x+10,y+18,i===step?C.white:C.ink,true);if(i<cycle.length-1){ctx.strokeStyle=i<step?C.green:C.line;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x+92,y);ctx.lineTo(x+114,y);ctx.stroke();}});text(ctx,cycle[step].desc,46,235,cycle[step].color,true);text(ctx,step===1?'关键路径：不经过 RGB':step>=3&&step<=5?'像素操作：只在 chunk 更新阶段出现':'记忆循环保持跨块空间锚点',46,267,step===1?C.green:step>=3&&step<=5?C.orange:C.blue);},[step]);
  return <div><canvas ref={ref} width={760} height={300}/><div className="step-ctrl"><button className="tiny" disabled={step===0} onClick={()=>setStep(s=>Math.max(0,s-1))}>上一步</button><span className="step-label"><b>{step+1}</b> / {cycle.length} · {cycle[step].name}</span><button className="tiny" disabled={step===cycle.length-1} onClick={()=>setStep(s=>Math.min(cycle.length-1,s+1))}>下一步</button></div><div className={`feedback ${step===1||step===5?'good':''}`}>{cycle[step].desc}</div></div>;
};

const phases=[
  {name:'按目标位姿读出',detail:'每个目标帧得到 ẑₜ 与 mₜ，来自同一个持久缓存。'},
  {name:'扩散骨干去噪',detail:'前一 chunk 的去噪 latent 作为短期前序帧。'},
  {name:'解码输出帧',detail:'9 个 latent 帧解码为 33 个 704×1280 RGB 帧。'},
  {name:'更新长期缓存',detail:'估深、分割、重编码并反投影'}
];
export const LsmC6Main:React.FC<WidgetProps>=()=>{
  const [phase,setPhase]=useState(0);const [chunk,setChunk]=useState(1);const ref=useCanvas(ctx=>{base(ctx,760,300);text(ctx,`Chunk ${chunk}`,28,30,C.ink,true);for(let c=1;c<=3;c++){const x=40+(c-1)*225;ctx.fillStyle=c===chunk?'#eef7f2':C.white;ctx.strokeStyle=c===chunk?C.green:C.line;ctx.lineWidth=c===chunk?3:1;ctx.fillRect(x,55,190,175);ctx.strokeRect(x,55,190,175);text(ctx,`块 ${c}`,x+14,82,c===chunk?C.green:C.muted,true);for(let i=0;i<9;i++){ctx.fillStyle=c===chunk&&i<=phase*2?C.blue:'#e7ebf1';ctx.fillRect(x+14+i*17,105,11,44);}text(ctx,'9 × 44 × 80 latent',x+14,170,C.ink);text(ctx,c===chunk?phases[phase].name:'等待',x+14,204,c===chunk?C.orange:C.muted,true);}ctx.strokeStyle=C.green;ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(40,250);ctx.lineTo(680,250);ctx.stroke();text(ctx,'持久缓存 M：跨 chunk 保存空间锚点',210,278,C.green,true);},[phase,chunk]);
  const next=()=>{if(phase<3)setPhase(phase+1);else if(chunk<3){setChunk(chunk+1);setPhase(0);}};const done=phase===3&&chunk===3;
  return <div><canvas ref={ref} width={760} height={300}/><div className="step-ctrl"><button className="tiny" onClick={()=>{setChunk(1);setPhase(0);}}>重置</button><span className="step-label">Chunk <b>{chunk}</b> · {phases[phase].name}</span><button className="tiny" disabled={done} onClick={next}>推进</button></div><div className={`feedback ${done?'good':''}`}>{phases[phase].detail}{done?' 长期缓存已经跨越三个示意 chunk；短期重叠与长期记忆分工明确。':''}</div></div>;
};
