import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

export const C = { bg:'#f5f8f0', passive:'#b8c9a7', dark:'#76906a', support:'#92400e', blue:'#27446e', green:'#228d5c', red:'#c43f52', orange:'#f07e47', purple:'#7c3aed', text:'#21324a', muted:'#68778f', border:'#d7deea' };
type Painter = (ctx: CanvasRenderingContext2D, time: number) => void;
interface CanvasProps {
  draw: Painter; width?: number; height?: number; ariaLabel: string; animate?: boolean; tabIndex?: number;
  onPointerDown?: React.PointerEventHandler<HTMLCanvasElement>; onPointerMove?: React.PointerEventHandler<HTMLCanvasElement>;
  onPointerUp?: React.PointerEventHandler<HTMLCanvasElement>; onKeyDown?: React.KeyboardEventHandler<HTMLCanvasElement>;
}
export function Canvas({draw,width=1080,height=280,ariaLabel,animate=false,...events}:CanvasProps) {
  const ref=useRef<HTMLCanvasElement>(null); const latest=useRef(draw); latest.current=draw;
  const [narrow,setNarrow]=useState(()=>window.matchMedia('(max-width: 720px)').matches);
  const [expanded,setExpanded]=useState(false);
  useEffect(()=>{const media=window.matchMedia('(max-width: 720px)');const update=()=>setNarrow(media.matches);media.addEventListener('change',update);return()=>media.removeEventListener('change',update);},[]);
  useEffect(()=> {
    const el=ref.current;if(!el)return;
    const ctx=setupCanvas(el,width,height);
    // setupCanvas sets pixel CSS height; release it so max-width preserves shape.
    el.style.height='auto';
    let raf=0;let visible=false;
    const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const render=(ms:number)=> { ctx.clearRect(0,0,width,height);ctx.fillStyle=C.bg;ctx.fillRect(0,0,width,height);latest.current(ctx,reduced?1400:ms);el.classList.add('is-ready'); };
    const tick=(ms:number)=> {render(ms);if(visible&&animate&&!reduced)raf=requestAnimationFrame(tick);};
    const start=()=>{visible=true;render(performance.now());if(animate&&!reduced&&!raf)raf=requestAnimationFrame(tick);};
    const stop=()=>{visible=false;cancelAnimationFrame(raf);raf=0;};
    render(performance.now());const disconnect=observeCanvas(el,start,stop);
    return()=>{stop();disconnect();};
  },[width,height,animate]);
  useEffect(()=>{const el=ref.current;if(!el)return;const ctx=el.getContext('2d');if(!ctx)return;ctx.clearRect(0,0,width,height);ctx.fillStyle=C.bg;ctx.fillRect(0,0,width,height);draw(ctx,performance.now());el.classList.add('is-ready');},[draw,width,height]);
  const canZoom=narrow&&width>560;
  return <div style={{maxWidth:'100%'}}>
    <div style={{maxWidth:'100%',overflowX:canZoom&&expanded?'auto':undefined}}>
      <canvas ref={ref} role="img" aria-label={ariaLabel} width={width} height={height} style={{maxWidth:canZoom&&expanded?'none':'100%',height:'auto',touchAction:events.onPointerDown?'none':undefined}} {...events}/>
    </div>
    {canZoom?<div className="chip-row"><button type="button" className="chip" aria-expanded={expanded} onClick={()=>setExpanded(x=>!x)}>{expanded?'收起图示':'放大图示'}</button>{expanded?<span>左右滑动查看细节</span>:null}</div>:null}
  </div>;
}
export function label(ctx:CanvasRenderingContext2D,text:string,x:number,y:number,color:string=C.text) {ctx.fillStyle=color;ctx.font='22px "Microsoft YaHei", sans-serif';ctx.fillText(text,x,y);}
export function card(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,text:string,color:string=C.blue) {
  ctx.fillStyle='#ffffff';ctx.strokeStyle=color;ctx.lineWidth=3;ctx.beginPath();ctx.roundRect(x,y,w,h,12);ctx.fill();ctx.stroke();
  if(text){ctx.fillStyle=color;ctx.font='22px "Microsoft YaHei", sans-serif';ctx.textAlign='center';ctx.fillText(text,x+w/2,y+h/2+8);ctx.textAlign='start';}
}
export function arrow(ctx:CanvasRenderingContext2D,x1:number,y1:number,x2:number,y2:number,color:string=C.blue) {
  const a=Math.atan2(y2-y1,x2-x1);ctx.strokeStyle=color;ctx.fillStyle=color;ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();ctx.beginPath();ctx.moveTo(x2,y2);ctx.lineTo(x2-14*Math.cos(a-.4),y2-14*Math.sin(a-.4));ctx.lineTo(x2-14*Math.cos(a+.4),y2-14*Math.sin(a+.4));ctx.closePath();ctx.fill();
}
export function photo(ctx:CanvasRenderingContext2D,x:number,y:number,size:number,kind:string='猫') {
  ctx.save();ctx.translate(x,y);ctx.fillStyle='#fff';ctx.strokeStyle=C.border;ctx.lineWidth=3;ctx.beginPath();ctx.roundRect(0,0,size,size*.8,8);ctx.fill();ctx.stroke();
  ctx.fillStyle='#e6efe2';ctx.fillRect(8,8,size-16,size*.8-16);
  const s=size/100;ctx.scale(s,s);
  if(kind.includes('山')||kind.includes('景')||kind.includes('树')){ctx.fillStyle=C.passive;ctx.beginPath();ctx.moveTo(8,70);ctx.lineTo(39,17);ctx.lineTo(62,70);ctx.fill();ctx.fillStyle=C.dark;ctx.beginPath();ctx.moveTo(39,70);ctx.lineTo(65,25);ctx.lineTo(92,70);ctx.fill();ctx.fillStyle=C.orange;ctx.beginPath();ctx.arc(77,20,7,0,Math.PI*2);ctx.fill();}
  else if(kind.includes('机')){ctx.strokeStyle=C.blue;ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(18,42);ctx.lineTo(83,42);ctx.moveTo(53,42);ctx.lineTo(40,17);ctx.moveTo(53,42);ctx.lineTo(40,64);ctx.moveTo(21,42);ctx.lineTo(15,28);ctx.stroke();}
  else if(kind.includes('车')){ctx.fillStyle=C.blue;ctx.fillRect(20,35,60,20);ctx.beginPath();ctx.moveTo(32,35);ctx.lineTo(41,22);ctx.lineTo(62,22);ctx.lineTo(74,35);ctx.fill();ctx.fillStyle=C.support;[34,68].forEach(a=>{ctx.beginPath();ctx.arc(a,58,8,0,Math.PI*2);ctx.fill();});}
  else if(kind.includes('鸟')||kind.includes('鹤')){ctx.strokeStyle=C.blue;ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(55,56);ctx.lineTo(65,70);ctx.moveTo(48,54);ctx.lineTo(40,70);ctx.moveTo(63,44);ctx.lineTo(70,22);ctx.stroke();ctx.fillStyle=C.passive;ctx.beginPath();ctx.ellipse(47,45,25,12,-.2,0,Math.PI*2);ctx.fill();ctx.fillStyle=C.blue;ctx.beginPath();ctx.arc(71,20,7,0,Math.PI*2);ctx.fill();}
  else {ctx.fillStyle=kind.includes('狗')?C.support:C.orange;ctx.beginPath();ctx.ellipse(50,51,26,18,0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.moveTo(27,40);ctx.lineTo(26,19);ctx.lineTo(43,32);ctx.moveTo(57,32);ctx.lineTo(74,19);ctx.lineTo(73,43);ctx.fill();ctx.fillStyle=C.text;[40,60].forEach(a=>{ctx.beginPath();ctx.arc(a,47,3,0,Math.PI*2);ctx.fill();});ctx.strokeStyle=C.text;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(45,58);ctx.lineTo(50,61);ctx.lineTo(55,58);ctx.stroke();}
  ctx.restore();
}
export function Chips({options,value,onChange,label:groupLabel='选择模式'}:{options:string[];value:number;onChange:(n:number)=>void;label?:string}) {return <div className="chip-row" role="group" aria-label={groupLabel}>{options.map((x,i)=><button type="button" className={`chip ${value===i?'selected':''}`} key={x} aria-pressed={value===i} onClick={()=>onChange(i)}>{x}</button>)}</div>;}
export function Feedback({children,tone=''}:{children:React.ReactNode;tone?:string}) {return <div className={`feedback ${tone}`} role="status" aria-live="polite">{children}</div>;}
export function softmax(scores:number[],scale=1){const m=Math.max(...scores)*scale;const e=scores.map(s=>Math.exp(s*scale-m));const sum=e.reduce((a,b)=>a+b,0);return e.map(x=>x/sum);}
function hand(ctx:CanvasRenderingContext2D,x:number,y:number){ctx.fillStyle='#e8b58d';ctx.strokeStyle=C.support;ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(x,y,35,18,9);ctx.fill();ctx.stroke();ctx.beginPath();ctx.roundRect(x+19,y-19,13,26,6);ctx.fill();ctx.stroke();}
export const ClipScenes:React.FC<WidgetProps>=({chapterId,moduleId})=>{
 const n=chapterId==='hero'?(moduleId==='old'?0:11):Number(chapterId.split('-')[1]);
 return <Canvas width={560} height={140} ariaLabel="旅行相册的生活类比动画" animate draw={(ctx,time)=>{
  const q=(Math.sin(time/1200)+1)/2;
  card(ctx,125,12,305,116,'',C.dark);photo(ctx,151,28,105,n===0||n===11?'山':'猫');
  card(ctx,279,52,120,42,n===0?'猫狗车':n===11?'山景':'照片说明',n===0?C.red:C.green);
  ctx.fillStyle=C.passive;ctx.fillRect(261,19,3,101);
  if(n===2||n===5){ctx.save();ctx.translate(270+q*80,38+q*12);ctx.rotate(-.65);ctx.fillStyle=C.orange;ctx.fillRect(0,0,7,42);ctx.fillStyle=C.support;ctx.beginPath();ctx.moveTo(0,42);ctx.lineTo(7,42);ctx.lineTo(3.5,51);ctx.fill();ctx.restore();}
  else if(n===4||n===6){ctx.save();ctx.translate(267,17);ctx.scale(.25+.75*q,1);ctx.fillStyle='#faf7ef';ctx.strokeStyle=C.dark;ctx.lineWidth=2;ctx.fillRect(0,0,146,102);ctx.strokeRect(0,0,146,102);ctx.restore();}
  else if(n===7){ctx.fillStyle=C.red;ctx.fillRect(290,83,68*(1-q),3);ctx.fillStyle=C.orange;ctx.beginPath();ctx.roundRect(286+q*68,72,24,17,4);ctx.fill();}
  else if(n===8){ctx.strokeStyle=C.support;ctx.lineWidth=5;ctx.beginPath();ctx.arc(173+q*30,67,22,0,Math.PI*2);ctx.stroke();ctx.fillStyle=C.blue;ctx.fillRect(166,59,12,15);}
  else if(n===9){ctx.strokeStyle=C.support;ctx.lineWidth=5;ctx.beginPath();ctx.arc(183+q*80,58,22,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(196+q*80,75);ctx.lineTo(212+q*80,95);ctx.stroke();}
  else if(n===10){ctx.fillStyle=C.support;ctx.fillRect(322,19+q*23,18,20);ctx.fillStyle=C.green;ctx.fillRect(303,37+q*23,56,11);if(q>.8){ctx.strokeStyle=C.green;ctx.lineWidth=3;ctx.strokeRect(307,85,48,11);}}
  else {hand(ctx,93+q*53,45+q*38);}
 }}/>
};
