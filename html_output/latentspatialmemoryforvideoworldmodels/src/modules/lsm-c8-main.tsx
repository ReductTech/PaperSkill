import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const C={bg:'#f5f8f0',blue:'#27446e',green:'#228d5c',red:'#c43f52',orange:'#d97706',purple:'#7c3aed',ink:'#21324a',muted:'#68778f',line:'#d7deea',white:'#fff'};
function base(ctx:CanvasRenderingContext2D,w:number,h:number){ctx.clearRect(0,0,w,h);ctx.fillStyle=C.bg;ctx.fillRect(0,0,w,h);ctx.strokeStyle=C.line;ctx.strokeRect(.5,.5,w-1,h-1);}
function text(ctx:CanvasRenderingContext2D,s:string,x:number,y:number,color=C.ink,bold=false){ctx.fillStyle=color;ctx.font=`${bold?'700':'400'} 14px "Segoe UI",sans-serif`;ctx.fillText(s,x,y);}
function useCanvas(draw:(ctx:CanvasRenderingContext2D)=>void,deps:React.DependencyList,w=760,h=300){const ref=useRef<HTMLCanvasElement>(null);useEffect(()=>{if(!ref.current)return;const ctx=setupCanvas(ref.current,w,h);draw(ctx);ref.current.classList.add('is-ready');},deps);return ref;}

type Stage='branch'|'lora'|'single';
const stageInfo={
  branch:{title:'阶段一：只训练侧分支',lr:'学习率 10⁻⁵',score:'先建立可用条件信号',color:C.blue},
  lora:{title:'阶段二：侧分支 + rank-64 LoRA',lr:'学习率 10⁻⁴',score:'完整方法 Average 70.36',color:C.green},
  single:{title:'错误对照：单阶段联合训练',lr:'同一消融 split',score:'Average 63.18',color:C.red}
};
export const LsmC7Main:React.FC<WidgetProps>=()=>{
  const [stage,setStage]=useState<Stage>('branch');const d=stageInfo[stage];const ref=useCanvas(ctx=>{base(ctx,760,300);text(ctx,d.title,28,30,d.color,true);const blocks=[{name:'VAE',x:35},{name:'记忆侧分支',x:200},{name:'Wan 骨干',x:390},{name:'LoRA q/k/v/o',x:565}];blocks.forEach(b=>{let active=false;if(b.name==='记忆侧分支')active=true;if(b.name.includes('LoRA'))active=stage==='lora'||stage==='single';if(b.name==='Wan 骨干')active=stage==='single';ctx.fillStyle=active?d.color:'#e8edf1';ctx.strokeStyle=active?d.color:C.line;ctx.lineWidth=active?3:1;ctx.fillRect(b.x,92,135,92);ctx.strokeRect(b.x,92,135,92);text(ctx,b.name,b.x+14,126,active?C.white:C.ink,true);text(ctx,active?'更新':'冻结',b.x+14,160,active?C.white:C.muted,true);});ctx.strokeStyle=d.color;ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(170,138);ctx.lineTo(200,138);ctx.moveTo(335,138);ctx.lineTo(390,138);ctx.stroke();text(ctx,d.lr,40,232,C.orange,true);text(ctx,d.score,40,266,d.color,true);},[stage,d]);
  return <div><div className="chip-row"><button className={`chip ${stage==='branch'?'selected':''}`} onClick={()=>setStage('branch')}>阶段一</button><button className={`chip ${stage==='lora'?'selected':''}`} onClick={()=>setStage('lora')}>阶段二</button><button className={`chip ${stage==='single'?'selected':''}`} onClick={()=>setStage('single')}>单阶段消融</button></div><canvas ref={ref} width={760} height={300}/><div className={`feedback ${stage==='single'?'bad':stage==='lora'?'good':''}`}>{stage==='branch'?'先让新侧分支学会把投影缓存翻译成骨干可用的条件提示；VAE 与骨干保持冻结。':stage==='lora'?'条件分支成熟后，再用 rank-64 LoRA 轻量适配自注意力；VAE 始终冻结。':'同一消融 split 上，单阶段训练从完整方法 70.36 降到 63.18；这是受控证据，不等于所有联合训练都必然失败。'}</div></div>;
};

const nodes=[
  {id:'cache',label:'latent 缓存',detail:'带 48 通道 Token 的三维点集 M。',color:C.green},
  {id:'read',label:'投影 + 掩码',detail:'目标视角读出 ẑₜ，并用 mₜ 标记未见区域。',color:C.blue},
  {id:'branch',label:'条件侧分支',detail:'VACE 风格块，共享主网络 patch embedding，无需桥接编码器。',color:C.purple},
  {id:'rope',label:'分段 RoPE',detail:'在一次前向中区分 noisy target、clean preceding 与 clean reference。',color:C.orange},
  {id:'backbone',label:'Wan2.2 骨干',detail:'5B 视频扩散 Transformer；记忆分支注入关键层。',color:C.blue},
  {id:'output',label:'去噪 chunk',detail:'输出 9 个 latent 帧，再解码为 33 个 RGB 帧。',color:C.green}
];
export const LsmC8Main:React.FC<WidgetProps>=()=>{
  const [active,setActive]=useState('cache');const idx=nodes.findIndex(n=>n.id===active);const ref=useCanvas(ctx=>{base(ctx,800,330);text(ctx,'点击节点，追踪有效条件路径',24,28,C.ink,true);nodes.forEach((n,i)=>{const x=30+i*125;const on=i===idx;const passed=i<=idx;ctx.fillStyle=on?n.color:passed?'#e5f3ec':C.white;ctx.strokeStyle=on?n.color:passed?C.green:C.line;ctx.lineWidth=on?4:2;ctx.fillRect(x,105,100,76);ctx.strokeRect(x,105,100,76);text(ctx,n.label,x+10,137,on?C.white:C.ink,true);text(ctx,String(i+1),x+10,164,on?C.white:C.muted,true);if(i<nodes.length-1){ctx.strokeStyle=i<idx?C.green:C.line;ctx.lineWidth=i<idx?4:2;ctx.beginPath();ctx.moveTo(x+100,143);ctx.lineTo(x+125,143);ctx.stroke();}});ctx.fillStyle=C.white;ctx.strokeStyle=C.line;ctx.fillRect(95,220,610,78);ctx.strokeRect(95,220,610,78);text(ctx,nodes[idx].label,115,248,nodes[idx].color,true);text(ctx,nodes[idx].detail,115,278,C.ink);if(active==='backbone')text(ctx,'注入层：{0,4,8,12,16,20,24,28}',465,248,C.purple,true);},[active,idx],800,330);
  return <div><div className="chip-row">{nodes.map(n=><button key={n.id} className={`chip ${active===n.id?'selected':''}`} onClick={()=>setActive(n.id)}>{n.label}</button>)}</div><canvas ref={ref} width={800} height={330}/><div className={`feedback ${active==='output'?'good':''}`}>{nodes[idx].detail}{active==='rope'?' “参考帧”标签与持久缓存不是同一个概念。':''}</div></div>;
};
