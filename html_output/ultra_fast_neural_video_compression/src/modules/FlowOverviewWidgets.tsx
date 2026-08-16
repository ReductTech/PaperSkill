import React,{useEffect,useRef,useState} from 'react';
import {observeCanvas,setupCanvas} from '../lib/canvasKit';
import type {WidgetProps} from './registry';

const W=900,H=410,C={bg:'#f4fafc',ink:'#12233b',muted:'#5d7189',blue:'#176b92',green:'#20936f',red:'#d75d72',orange:'#f08b66',purple:'#7868d8',line:'#cbdce6'};
const label=(ctx:CanvasRenderingContext2D,s:string,x:number,y:number,size=13,color=C.ink)=>{ctx.fillStyle=color;ctx.font=`${size}px "Segoe UI",sans-serif`;ctx.fillText(s,x,y)};
const box=(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,s:string,on:boolean,color=C.blue)=>{ctx.fillStyle=on?color:'#fff';ctx.strokeStyle=on?color:C.line;ctx.lineWidth=on?3:2;ctx.fillRect(x,y,w,h);ctx.strokeRect(x,y,w,h);label(ctx,s,x+10,y+h/2+5,12,on?'#fff':C.ink)};
const arrow=(ctx:CanvasRenderingContext2D,x1:number,y1:number,x2:number,y2:number,on:boolean)=>{ctx.strokeStyle=on?C.orange:C.line;ctx.lineWidth=on?4:2;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();ctx.fillStyle=on?C.orange:C.line;ctx.beginPath();ctx.moveTo(x2,y2);ctx.lineTo(x2-9,y2-5);ctx.lineTo(x2-9,y2+5);ctx.closePath();ctx.fill()};

export const PipelineOverview:React.FC<WidgetProps>=()=>{
 const ref=useRef<HTMLCanvasElement>(null);const [stage,setStage]=useState(0);const [n,setN]=useState(8);
 useEffect(()=>{const canvas=ref.current;if(!canvas)return;let ctx:CanvasRenderingContext2D;try{ctx=setupCanvas(canvas,W,H)}catch{return}
  const draw=()=>{ctx.fillStyle=C.bg;ctx.fillRect(0,0,W,H);label(ctx,'编码：N 帧 → 单个量化块潜变量 → 码流',20,27,16,C.blue);
   const top=[{x:20,w:90,s:`${n} 帧 Xᵢ`},{x:140,w:145,s:'Patchify + Cᵢ'},{x:315,w:120,s:'Chunk 编码器'},{x:465,w:75,s:'yᵢ'},{x:570,w:75,s:'量化'},{x:675,w:105,s:'码流'}];top.forEach((b,i)=>{box(ctx,b.x,55,b.w,46,b.s,stage===i);if(i<top.length-1)arrow(ctx,b.x+b.w,78,top[i+1].x,78,stage===i||stage===i+1)});
   label(ctx,'解码：码流 → ŷᵢ → 公共特征 Fᵢ',20,142,16,C.blue);const bot=[{x:20,w:105,s:'读取码流'},{x:155,w:90,s:'ŷᵢ'},{x:275,w:135,s:'Chunk 解码器'},{x:440,w:100,s:'公共 Fᵢ'}];bot.forEach((b,i)=>{const k=i+6;box(ctx,b.x,170,b.w,46,b.s,stage===k,C.green);if(i<bot.length-1)arrow(ctx,b.x+b.w,193,bot[i+1].x,193,stage===k||stage===k+1)});
   arrow(ctx,540,193,610,260,stage>=9);arrow(ctx,540,193,610,335,stage>=9);box(ctx,610,238,250,56,`分支 1：${n} 个帧专属解码器`,stage===10,C.green);box(ctx,610,313,250,56,'分支 2：生成 Cᵢ₊₁',stage===11,C.purple);label(ctx,`→ 并行重建 ${n} 帧图像`,650,305,12,C.green);label(ctx,'→ 条件下一视频块',680,385,12,C.purple);
   ctx.strokeStyle=C.line;ctx.setLineDash([5,5]);ctx.strokeRect(15,45,775,70);ctx.strokeRect(15,160,540,70);ctx.setLineDash([]);label(ctx,'完整流程始终保留；橙色路径表示当前观察位置',20,397,12,C.orange);canvas.classList.add('is-ready')};draw();return observeCanvas(canvas,draw,()=>{})},[stage,n]);
 const steps=['N 帧','Patchify+上下文','Chunk 编码','yᵢ','量化','码流','读取码流','ŷᵢ','Chunk 解码','Fᵢ','并行重建','下一块上下文'];
 return <div><div className="ctrl"><label>块大小 N <span className="val">{n}</span></label><input aria-label="块大小 N" type="range" min="1" max="8" value={n} onChange={e=>setN(Number(e.target.value))}/></div><canvas ref={ref} width={W} height={H}/><div className="ctrl">{steps.map((s,i)=><button type="button" key={s} className={stage===i?'active':''} onClick={()=>setStage(i)}>{i+1}. {s}</button>)}</div><div className="feedback good">{stage<6?'编码端把整块压成一个可写入码流的量化潜变量。':stage<10?'解码端把 ŷᵢ 还原成所有帧共享的特征 Fᵢ。':stage===10?'Fᵢ 进入多个并行帧专属解码器，同时重建 N 帧。':'Fᵢ 同时生成 Cᵢ₊₁，为下一块提供长时序条件。'}</div></div>;
};

const issues=[
 {key:'吞吐量',pain:'逐帧处理与显式运动操作形成串行链。',method:'继承 DCVC-RT 的无显式运动设计，再用帧块编码并行处理 N 帧。',where:'总体框架 / Section 3.1',result:'高吞吐量编码与解码'},
 {key:'压缩率',pain:'块内统一解码器难以适配不同时间位置；短训练序列难学长时相关性。',method:'帧专属解码器 + 高效长时序相关性学习。',where:'Sections 3.2 与 3.3',result:'恢复块编码质量，并利用跨块上下文'},
 {key:'解码速度',pain:'四分区反复进行参数估计与比特流交互，系统开销显著。',method:'精简熵模型：尺度一次估计并合并比特流交互，均值仍逐步估计。',where:'Section 3.4',result:'减少同步、内存 I/O 与算术解码调用'},
];
export const PainpointMap:React.FC<WidgetProps>=()=>{
 const [sel,setSel]=useState(0);const ref=useRef<HTMLCanvasElement>(null);const x=issues[sel];
 useEffect(()=>{const canvas=ref.current;if(!canvas)return;let ctx:CanvasRenderingContext2D;try{ctx=setupCanvas(canvas,W,330)}catch{return}const draw=()=>{ctx.fillStyle=C.bg;ctx.fillRect(0,0,W,330);label(ctx,'DCVC-RT 基础',25,31,15,C.blue);box(ctx,25,50,190,54,'已移除显式运动操作',true,C.blue);arrow(ctx,215,77,285,77,true);label(ctx,'DCVC-UF 进一步放大优势',285,82,14,C.orange);
  const ys=[128,202,276];issues.forEach((it,i)=>{const on=i===sel;box(ctx,25,ys[i],150,44,`目标：${it.key}`,on,C.blue);arrow(ctx,175,ys[i]+22,250,ys[i]+22,on);box(ctx,250,ys[i]-7,390,58,it.method,on,on?C.green:C.blue);arrow(ctx,640,ys[i]+22,705,ys[i]+22,on);box(ctx,705,ys[i],170,44,it.result,on,C.purple)});canvas.classList.add('is-ready')};draw();return observeCanvas(canvas,draw,()=>{})},[sel]);
 return <div><div className="ctrl">{issues.map((it,i)=><button type="button" key={it.key} className={sel===i?'active':''} onClick={()=>setSel(i)}>{it.key}</button>)}</div><canvas ref={ref} width={W} height={330}/><div style={{display:'grid',gap:8,marginTop:10}}><div><strong>性能约束：</strong>{x.pain}</div><div><strong>对应设计：</strong>{x.method}</div><div><strong>论文位置：</strong>{x.where}</div><div className="feedback good">✓ {x.result}</div></div></div>;
};
