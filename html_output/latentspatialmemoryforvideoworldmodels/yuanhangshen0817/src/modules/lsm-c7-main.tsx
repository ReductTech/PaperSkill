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
  single:{title:'单阶段消融：侧分支与 LoRA 从头联合训练',lr:'同一消融 split',score:'Average 63.18',color:C.red}
};
export const LsmC7Main:React.FC<WidgetProps>=()=>{
  const [stage,setStage]=useState<Stage>('branch');
  const d=stageInfo[stage];
  const ref=useCanvas(ctx=>{
    base(ctx,760,300);
    text(ctx,d.title,28,30,d.color,true);
    text(ctx,'灰色 = 原始权重冻结；彩色 = 本阶段实际更新的参数',28,56,C.muted);
    const blocks=[
      {key:'vae',name:'VAE',status:'原始权重冻结',x:35},
      {key:'branch',name:'记忆侧分支',status:'参数更新',x:200},
      {key:'wan',name:'Wan2.2',status:'原始权重冻结',x:390},
      {key:'lora',name:'LoRA ΔW',status:'q/k/v/o 更新',x:565},
    ];
    blocks.forEach(b=>{
      const active=b.key==='branch'||(b.key==='lora'&&(stage==='lora'||stage==='single'));
      ctx.fillStyle=active?d.color:'#e8edf1';
      ctx.strokeStyle=active?d.color:C.line;
      ctx.lineWidth=active?3:1;
      ctx.fillRect(b.x,92,135,92);
      ctx.strokeRect(b.x,92,135,92);
      text(ctx,b.name,b.x+14,126,active?C.white:C.ink,true);
      text(ctx,b.status,b.x+14,160,active?C.white:C.muted,true);
    });
    ctx.strokeStyle=d.color;
    ctx.lineWidth=4;
    ctx.beginPath();
    ctx.moveTo(170,138);ctx.lineTo(200,138);
    ctx.moveTo(335,138);ctx.lineTo(390,138);
    ctx.moveTo(525,138);ctx.lineTo(565,138);
    ctx.stroke();
    text(ctx,d.lr,40,232,C.orange,true);
    text(ctx,d.score,40,266,d.color,true);
  },[stage,d]);
  return <div><div className="chip-row"><button className={`chip ${stage==='branch'?'selected':''}`} onClick={()=>setStage('branch')}>阶段一</button><button className={`chip ${stage==='lora'?'selected':''}`} onClick={()=>setStage('lora')}>阶段二</button><button className={`chip ${stage==='single'?'selected':''}`} onClick={()=>setStage('single')}>单阶段消融</button></div><canvas ref={ref} width={760} height={300} aria-label="VAE、Wan2.2 原始权重与 LoRA 参数在不同训练阶段的更新状态"/><div className={`feedback ${stage==='single'?'bad':stage==='lora'?'good':''}`}>{stage==='branch'?'阶段一只更新记忆侧分支；VAE 与 Wan2.2 的原始权重全部冻结，LoRA 尚未参与训练。':stage==='lora'?'阶段二仍冻结 VAE 和 Wan2.2 原始权重，只联合更新记忆侧分支与注意力 q/k/v/o 上的 rank-64 LoRA 增量参数。':'单阶段消融的可训练参数仍是“记忆侧分支 + LoRA”；区别是取消阶段一预对齐，从训练开始便同时优化二者，并非全参数微调 Wan。'}</div></div>;
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
