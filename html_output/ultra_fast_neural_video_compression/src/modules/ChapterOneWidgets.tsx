import React,{useEffect,useRef,useState} from 'react';
import {observeCanvas,setupCanvas} from '../lib/canvasKit';
import type {WidgetProps} from './registry';

const W=560,H=240,C={bg:'#f4fafc',ink:'#12233b',muted:'#5d7189',blue:'#176b92',green:'#20936f',red:'#d75d72',orange:'#f08b66',line:'#cbdce6'};
const text=(ctx:CanvasRenderingContext2D,s:string,x:number,y:number,size=14,color=C.ink)=>{ctx.fillStyle=color;ctx.font=`${size}px "Segoe UI",sans-serif`;ctx.fillText(s,x,y)};

function useCanvas(draw:(ctx:CanvasRenderingContext2D,t:number)=>void,deps:React.DependencyList){
 const ref=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{const canvas=ref.current;if(!canvas)return;let ctx:CanvasRenderingContext2D;try{ctx=setupCanvas(canvas,W,H)}catch{return}let raf=0;
  const tick=(t:number)=>{draw(ctx,t);canvas.classList.add('is-ready');raf=requestAnimationFrame(tick)};
  const start=()=>{if(!raf)raf=requestAnimationFrame(tick)},stop=()=>{cancelAnimationFrame(raf);raf=0};const off=observeCanvas(canvas,start,stop);return()=>{stop();off()};
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },deps);return ref;
}

export const NeuralLearning:React.FC<WidgetProps>=()=>{
 const ref=useCanvas((ctx,t)=>{ctx.fillStyle=C.bg;ctx.fillRect(0,0,W,H);text(ctx,'从手工规则到神经网络学习',22,27,16);const phase=(t%3600)/3600;ctx.fillStyle='#fff';ctx.strokeStyle=C.line;ctx.lineWidth=2;ctx.fillRect(24,53,190,135);ctx.strokeRect(24,53,190,135);text(ctx,'H.265 / H.266',55,78,14,C.blue);['预测规则','变换与量化','熵编码规则'].forEach((s,i)=>{ctx.fillStyle='#eef2f7';ctx.fillRect(44,94+i*29,150,22);text(ctx,s,76,110+i*29,11,C.muted)});text(ctx,'专家逐条设计',70,178,12,C.red);ctx.strokeStyle=C.orange;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(228,120);ctx.lineTo(315,120);ctx.stroke();ctx.fillStyle=C.orange;ctx.beginPath();ctx.moveTo(315,120);ctx.lineTo(302,113);ctx.lineTo(302,127);ctx.closePath();ctx.fill();ctx.fillStyle='#fff';ctx.strokeStyle=C.line;ctx.fillRect(332,53,204,135);ctx.strokeRect(332,53,204,135);text(ctx,'NVC 神经网络',375,78,14,C.blue);for(let i=0;i<6;i++){const x=350+i*28;ctx.fillStyle=i%2?C.blue:C.orange;ctx.globalAlpha=.55+.45*Math.sin(phase*Math.PI*2+i);ctx.fillRect(x,96,20,20)}ctx.globalAlpha=1;ctx.fillStyle=C.green;ctx.fillRect(365,138,140,28);text(ctx,'学到压缩规则',391,157,12,'#fff');text(ctx,'海量视频数据驱动',374,181,12,C.green)},[]);
 return <canvas ref={ref} width={W} height={H}/>;
};

export const DcvcUfBlocks:React.FC<WidgetProps>=()=>{
 const ref=useCanvas((ctx,t)=>{ctx.fillStyle=C.bg;ctx.fillRect(0,0,W,H);text(ctx,'DCVC-UF：一块多帧，并行重建',22,27,16);const pulse=.5+.5*Math.sin(t/420);for(let i=0;i<8;i++){const x=20+i*52;ctx.fillStyle=C.blue;ctx.fillRect(x,55,39,30);text(ctx,`${i+1}`,x+15,75,11,'#fff')}ctx.strokeStyle=C.green;ctx.lineWidth=3;for(let i=0;i<8;i++){ctx.beginPath();ctx.moveTo(39+i*52,85);ctx.lineTo(280,125);ctx.stroke()}ctx.fillStyle=C.green;ctx.globalAlpha=.75+.25*pulse;ctx.fillRect(222,110,116,45);ctx.globalAlpha=1;text(ctx,'单一块潜变量',237,138,13,'#fff');for(let i=0;i<8;i++){const x=20+i*65;ctx.strokeStyle=C.green;ctx.beginPath();ctx.moveTo(280,155);ctx.lineTo(x+20,192);ctx.stroke();ctx.fillStyle=C.green;ctx.fillRect(x,192,40,28);text(ctx,`x̂${i+1}`,x+10,211,11,'#fff')}text(ctx,'8 帧联合编码',414,74,12,C.blue);text(ctx,'8 个帧特定解码器同时输出',337,143,12,C.green)},[]);
 return <canvas ref={ref} width={W} height={H}/>;
};

export const NvcRouteAnalogy:React.FC<WidgetProps>=()=>{
 const ref=useCanvas((ctx,t)=>{ctx.fillStyle=C.bg;ctx.fillRect(0,0,W,H);const route=Math.floor(t/2600)%3,phase=(t%2600)/2600;const names=['① 逐视频优化：INR / Gaussian','② 低延迟逐帧 NVC','③ 层次化 B 帧 NVC'];text(ctx,names[route],20,26,16,C.blue);ctx.fillStyle='#fff';ctx.strokeStyle=C.line;ctx.fillRect(18,42,524,150);ctx.strokeRect(18,42,524,150);
  if(route===0){for(let i=0;i<5;i++){ctx.fillStyle=C.blue;ctx.fillRect(35+i*55,66,40,28);text(ctx,`帧${i+1}`,43+i*55,85,10,'#fff')}ctx.strokeStyle=C.orange;ctx.lineWidth=4;ctx.beginPath();ctx.arc(395,112,48,-Math.PI*.3,Math.PI*1.5*phase);ctx.stroke();text(ctx,'为这一个视频反复优化参数',300,176,13,C.red);text(ctx,'视频',62,138,12,C.muted);text(ctx,'专用表示',363,116,13,C.orange)}
  if(route===1){const active=Math.floor(phase*5);for(let i=0;i<5;i++){const x=44+i*96;ctx.fillStyle=i<=active?C.blue:'#fff';ctx.strokeStyle=i<=active?C.blue:C.line;ctx.fillRect(x,92,52,38);ctx.strokeRect(x,92,52,38);text(ctx,`x${i+1}`,x+18,116,12,i<=active?'#fff':C.muted);if(i<4){ctx.beginPath();ctx.moveTo(x+52,111);ctx.lineTo(x+96,111);ctx.stroke()}}text(ctx,'只引用过去帧：低时延，但仍逐帧等待',120,174,13,C.red)}
  if(route===2){const xs=[55,150,245,340,435];xs.forEach((x,i)=>{ctx.fillStyle=i===2?C.orange:C.blue;ctx.fillRect(x,95,52,38);text(ctx,`x${i+1}`,x+18,119,12,'#fff')});ctx.strokeStyle=C.green;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(81,95);ctx.lineTo(271,58);ctx.lineTo(461,95);ctx.stroke();ctx.beginPath();ctx.moveTo(176,95);ctx.lineTo(271,58);ctx.lineTo(366,95);ctx.stroke();text(ctx,'双向参考提升压缩效率，但增加等待与运动处理',86,174,13,C.red)}
  text(ctx,'三条路线并列：各自优化不同目标',20,222,13,C.green)},[]);
 return <canvas ref={ref} width={W} height={H}/>;
};

type Route={name:string,examples:string,how:string,solves:string,cost:string,focus:string};
const routes:Route[]=[
 {name:'逐视频优化',examples:'INR、Gaussian Splatting',how:'为每个视频单独优化隐式网络或显式高斯表示，解码时查询或渲染。',solves:'解码复杂度较低，表示灵活。',cost:'每个视频都要在线优化，编码极慢；论文举例部分 INR 约为 10⁻³ FPS。',focus:'优先解决解码成本'},
 {name:'低延迟逐帧',examples:'残差 NVC、条件 NVC、DCVC 系列',how:'当前帧只依赖已经解码的过去帧，通常逐帧预测与熵编码。',solves:'控制帧等待，适合实时通信。',cost:'多数方法仍有逐帧依赖；运动处理、内存 I/O 与同步限制实际吞吐。',focus:'优先解决通信时延'},
 {name:'层次化 B 帧',examples:'Hierarchical-B 类 NVC',how:'同时参考过去帧与未来帧，通过双向预测提升压缩效率。',solves:'通常比低延迟结构获得更高压缩效率。',cost:'增加帧等待；仍逐帧运行，并依赖成对运动向量和预定义编码层级。',focus:'优先解决压缩效率'},
];
export const NvcRouteCompare:React.FC<WidgetProps>=()=>{
 const [selected,setSelected]=useState(0);const [reveal,setReveal]=useState(false);const r=routes[selected];
 const ref=useCanvas((ctx,t)=>{ctx.fillStyle=C.bg;ctx.fillRect(0,0,W,H);text(ctx,`${selected+1}. ${r.name} · ${r.examples}`,20,27,16,C.blue);ctx.fillStyle='#fff';ctx.strokeStyle=C.line;ctx.lineWidth=2;ctx.fillRect(18,42,524,150);ctx.strokeRect(18,42,524,150);const phase=(t%2600)/2600;
  if(selected===0){for(let i=0;i<5;i++){ctx.fillStyle=C.blue;ctx.fillRect(35+i*55,66,40,28);text(ctx,`帧${i+1}`,43+i*55,85,10,'#fff')}ctx.strokeStyle=C.orange;ctx.lineWidth=4;ctx.beginPath();ctx.arc(395,112,48,-Math.PI*.3,Math.PI*1.5*phase);ctx.stroke();text(ctx,'视频',62,138,12,C.muted);text(ctx,'专用表示',363,116,13,C.orange);text(ctx,'为这一个视频反复优化参数',300,176,13,C.red)}
  if(selected===1){const active=Math.floor(phase*5);for(let i=0;i<5;i++){const x=44+i*96;ctx.fillStyle=i<=active?C.blue:'#fff';ctx.strokeStyle=i<=active?C.blue:C.line;ctx.fillRect(x,92,52,38);ctx.strokeRect(x,92,52,38);text(ctx,`x${i+1}`,x+18,116,12,i<=active?'#fff':C.muted);if(i<4){ctx.beginPath();ctx.moveTo(x+52,111);ctx.lineTo(x+96,111);ctx.stroke()}}text(ctx,'只引用过去帧：低时延，但仍逐帧等待',120,174,13,C.red)}
  if(selected===2){const xs=[55,150,245,340,435];xs.forEach((x,i)=>{ctx.fillStyle=i===2?C.orange:C.blue;ctx.fillRect(x,95,52,38);text(ctx,`x${i+1}`,x+18,119,12,'#fff')});ctx.strokeStyle=C.green;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(81,95);ctx.lineTo(271,58);ctx.lineTo(461,95);ctx.stroke();ctx.beginPath();ctx.moveTo(176,95);ctx.lineTo(271,58);ctx.lineTo(366,95);ctx.stroke();text(ctx,'双向参考提升压缩效率，但增加等待与运动处理',86,174,13,C.red)}
  if(reveal){ctx.fillStyle='rgba(255,255,255,.94)';ctx.fillRect(18,42,524,150);ctx.fillStyle=C.green;ctx.fillRect(125,82,310,48);text(ctx,'DCVC-UF：块编码 + 并行重建',158,112,15,'#fff');text(ctx,'共同缺口：压缩效率与实际吞吐难以同时兼得',111,160,13,C.red)}},[selected,reveal]);
 return <div><div className="ctrl">{routes.map((x,i)=><button type="button" key={x.name} className={selected===i?'active':''} onClick={()=>{setSelected(i);setReveal(false)}}>{x.name}</button>)}<button type="button" onClick={()=>setReveal(true)}>共同缺口 → DCVC-UF</button></div><canvas ref={ref} width={W} height={H}/><div style={{display:'grid',gap:8,marginTop:10}}><div><strong>优化目标：</strong>{r.focus}</div><div><strong>代表工作：</strong>{r.examples}</div><div><strong>核心方式：</strong>{r.how}</div><div className="feedback good">✓ {r.solves}</div><div className="feedback bad">✕ {r.cost}</div></div></div>;
};
