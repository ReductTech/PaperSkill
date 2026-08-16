import React,{useEffect,useRef,useState} from 'react';
import {observeCanvas,setupCanvas} from '../lib/canvasKit';
import type {WidgetProps} from './registry';

const W=900,H=350,C={bg:'#f4fafc',ink:'#12233b',muted:'#5d7189',blue:'#176b92',green:'#20936f',red:'#d75d72',orange:'#f08b66',purple:'#7868d8',line:'#cbdce6'};
const notes=[
 {tag:'(a)',title:'四分区',body:'量化潜变量 ŷᵢ 按类似四叉树的空间—通道方式分成 ŷᵢ⁰、ŷᵢ¹、ŷᵢ²、ŷᵢ³。'},
 {tag:'(b)',title:'旧：四次交错',body:'每解出一个分区，才估计下一分区的 μ 与 σ；参数估计和算术解码交替发生，带来四次码流操作、内存 I/O 与 CPU—GPU 同步。'},
 {tag:'(c)',title:'新：码流一步',body:'一次预测全部 σ，仅用 σ 一次恢复四组残差；μ 仍逐步估计并加回，但变成纯 GPU 网络推理，不再触碰码流。'},
];
const figure4Focus=[
 [{x:1,y:1,w:98,h:24}],
 [{x:12,y:25,w:86,h:35}],
 [{x:12,y:61,w:86,h:38}],
];
export const EntropyFigure:React.FC<WidgetProps>=()=>{const [sel,setSel]=useState(0);return <div><div className="ctrl figure4-tabs">{notes.map((x,i)=><button type="button" key={x.tag} className={sel===i?'active':''} onClick={()=>setSel(i)}>{x.tag} {x.title}</button>)}</div><figure className="paper-fig4"><div className="figure4-image-stage"><img src="/images/figure-4.png" alt="论文 Figure 4：四分区、旧多步码流解码与本文单步码流解码的原始示意图"/>{figure4Focus[sel].map((b,i)=><span key={i} className="figure4-focus-box" style={{left:`${b.x}%`,top:`${b.y}%`,width:`${b.w}%`,height:`${b.h}%`}} aria-hidden="true"/>)}</div><figcaption>论文 Figure 4（原图）：点击上方 (a)(b)(c)，高亮对应分区与解码路径。</figcaption></figure><div className="entropy-figure-note"><strong>{notes[sel].title}：</strong>{notes[sel].body}</div></div>};

const label=(c:CanvasRenderingContext2D,s:string,x:number,y:number,size=13,color=C.ink,weight=400)=>{c.fillStyle=color;c.font=`${weight} ${size}px "Segoe UI",sans-serif`;c.textAlign='center';c.fillText(s,x,y)};
const box=(c:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,s:string,on:boolean,color:string)=>{c.beginPath();c.roundRect(x,y,w,h,8);c.fillStyle=on?color:'#fff';c.fill();c.strokeStyle=on?color:C.line;c.lineWidth=on?3:2;c.stroke();label(c,s,x+w/2,y+h/2+5,12,on?'#fff':C.ink,on?700:500)};
const arrow=(c:CanvasRenderingContext2D,x1:number,y1:number,x2:number,y2:number,on:boolean,color:string)=>{c.strokeStyle=on?color:C.line;c.lineWidth=on?4:2;c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();c.fillStyle=on?color:C.line;c.beginPath();c.moveTo(x2,y2);c.lineTo(x2-8,y2-5);c.lineTo(x2-8,y2+5);c.closePath();c.fill()};

export const EntropyLab:React.FC<WidgetProps>=()=>{const ref=useRef<HTMLCanvasElement>(null);const [mode,setMode]=useState<'old'|'new'>('new');const [step,setStep]=useState(0);
 useEffect(()=>{const canvas=ref.current;if(!canvas)return;let ctx:CanvasRenderingContext2D;try{ctx=setupCanvas(canvas,W,H)}catch{return};const draw=()=>{ctx.fillStyle=C.bg;ctx.fillRect(0,0,W,H);label(ctx,mode==='old'?'旧四步：网络推理 ↔ 算术解码反复切换':'本文：一次码流操作 + 四步纯 GPU 均值估计',450,27,16,mode==='old'?C.red:C.green,700);
  const colors=[C.orange,'#d6a623',C.green,C.purple];
  if(mode==='old'){for(let i=0;i<4;i++){const x=25+i*220,on=i===step;box(ctx,x,65,90,54,`估计 μ${sup(i)}, σ${sup(i)}`,on,colors[i]);arrow(ctx,x+90,92,x+112,92,on,C.red);box(ctx,x+112,65,82,54,'算术解码',on,C.red);if(i<3)arrow(ctx,x+194,92,x+220,92,on,C.red);label(ctx,`第 ${i+1} 次码流`,x+97,145,11,on?C.red:C.muted,on?700:400)}label(ctx,'× 4 次算术解码调用 · 4 次码流操作 · 网络与算术解码频繁同步',450,190,14,C.red,700)}
  else{box(ctx,25,65,210,62,'一次估计：μ⁰ + σ⁰σ¹σ²σ³',step===0,C.green);arrow(ctx,235,96,285,96,step<=1,C.green);box(ctx,285,65,170,62,'一次算术解码',step===1,C.green);arrow(ctx,455,96,505,96,step>=1,C.green);box(ctx,505,65,355,62,'同时恢复 r̂⁰、r̂¹、r̂²、r̂³',step===1,C.green);label(ctx,'✓ 所有码流操作在这里一次完成',450,158,14,C.green,700);
   for(let i=0;i<4;i++){const x=55+i*210,on=step===i+2;box(ctx,x,210,150,50,i===0?'已有 μ⁰':`逐步估计 μ${sup(i)}`,on,colors[i]);if(i<3)arrow(ctx,x+150,235,x+210,235,on,C.purple);label(ctx,`ŷ${sup(i)} = r̂${sup(i)} + μ${sup(i)}`,x+75,285,12,on?colors[i]:C.muted,on?700:400)}label(ctx,'均值仍逐步传播以保留空间—通道相关性，但全程只做 GPU 网络推理',450,325,13,C.purple,700)}canvas.classList.add('is-ready')};draw();return observeCanvas(canvas,draw,()=>{})},[mode,step]);
 const max=mode==='old'?3:5;return <div><div className="ctrl"><button type="button" className={mode==='old'?'active':''} onClick={()=>{setMode('old');setStep(0)}}>旧多步解码</button><button type="button" className={mode==='new'?'active':''} onClick={()=>{setMode('new');setStep(0)}}>本文单步码流解码</button><button type="button" onClick={()=>setStep(s=>Math.max(0,s-1))}>上一步</button><button type="button" onClick={()=>setStep(s=>Math.min(max,s+1))}>下一步</button><span className="val">步骤 {step+1}/{max+1}</span></div><canvas ref={ref} width={W} height={H}/><div className={`feedback ${mode==='new'?'good':'bad'}`}>{mode==='old'?`当前第 ${step+1} 个分区：先估计 μ、σ，再调用一次算术解码；这一循环共重复 4 次。`:step<2?'全部尺度 σ 一次得到，因此四个分区的残差可以在一次合并的码流操作中恢复。':'码流已经读完；后续只逐步估计 μ 并执行 ŷ = r̂ + μ，以保留相关性建模能力。'}</div><div className="entropy-summary"><strong>两层结构收益：</strong>精简熵模型把一次 latent 解码中的四次交错码流操作合并为一步；块编码又把熵处理的单位从逐帧 latent 改为 chunk latent。论文未把这种结构变化单独报告为精确的调用次数比例。</div></div>};
function sup(i:number){return ['⁰','¹','²','³'][i]}
