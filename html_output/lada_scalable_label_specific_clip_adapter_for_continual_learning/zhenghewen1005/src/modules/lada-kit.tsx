import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';

export const C = { bg:'#f5f8f0', light:'#b8c9a7', dark:'#76906a', brown:'#92400e',
  blue:'#27446e', green:'#228d5c', red:'#c43f52', orange:'#f07e47', purple:'#7c3aed',
  ink:'#21324a', muted:'#68778f', line:'#d7deea' };
type Draw = (ctx:CanvasRenderingContext2D,w:number,h:number,time:number)=>void;

export function Scene({draw,height=280,animate=false,label,onPoint,draggable=false}:{
  draw:Draw;height?:number;animate?:boolean;label:string;
  onPoint?:(x:number,y:number,w:number,h:number)=>void;draggable?:boolean;
}) {
  const ref=useRef<HTMLCanvasElement>(null);
  const drawRef=useRef(draw); drawRef.current=draw;
  const size=useRef({w:560,h:height});
  const redraw=useRef<()=>void>(()=>{});
  const [dragging,setDragging]=useState(false);
  useEffect(()=>{
    const canvas=ref.current!;
    let ctx:CanvasRenderingContext2D|null=null,raf=0,visible=false,disposed=false;
    const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
    let reduce=motion.matches;
    const paint=(time=performance.now())=>{
      if(!ctx || disposed)return;
      ctx.clearRect(0,0,size.current.w,size.current.h);
      ctx.fillStyle=C.bg;ctx.fillRect(0,0,size.current.w,size.current.h);
      ctx.save();drawRef.current(ctx,size.current.w,size.current.h,reduce?0:time/1000);ctx.restore();
      canvas.classList.add('is-ready');
    };
    const tick=(time:number)=>{
      paint(time);
      if(visible && animate && !reduce)raf=requestAnimationFrame(tick);
    };
    const stop=()=>{visible=false;cancelAnimationFrame(raf);};
    const start=()=>{visible=true;cancelAnimationFrame(raf);if(animate&&!reduce)raf=requestAnimationFrame(tick);else paint();};
    const motionChange=()=>{reduce=motion.matches;cancelAnimationFrame(raf);paint();if(visible&&animate&&!reduce)raf=requestAnimationFrame(tick);};
    motion.addEventListener('change',motionChange);
    const resize=()=>{
      const w=Math.max(240,Math.min(1080,canvas.parentElement?.clientWidth||560));
      size.current={w,h:height};
      ctx=setupCanvas(canvas,w,height);
      canvas.style.width='100%';canvas.style.height=height+'px';paint();
    };
    redraw.current=()=>paint();
    const ro=new ResizeObserver(resize);ro.observe(canvas.parentElement!);resize();
    const off=observeCanvas(canvas,start,stop);
    return()=>{disposed=true;stop();off();ro.disconnect();motion.removeEventListener('change',motionChange);redraw.current=()=>{};};
  },[height,animate]);
  useEffect(()=>redraw.current(),[draw]);
  const point=(event:React.PointerEvent<HTMLCanvasElement>)=>{
    const r=event.currentTarget.getBoundingClientRect(),s=size.current;
    onPoint?.(Math.max(0,Math.min(s.w,(event.clientX-r.left)*s.w/r.width)),
      Math.max(0,Math.min(s.h,(event.clientY-r.top)*s.h/r.height)),s.w,s.h);
  };
  return <div className="lada-scene-wrap">
    <canvas ref={ref} aria-label={label} role="img"
      style={{touchAction:draggable?'none':'auto',cursor:draggable?(dragging?'grabbing':'grab'):onPoint?'pointer':'default'}}
      onPointerDown={e=>{if(!onPoint)return; if(draggable){e.currentTarget.setPointerCapture(e.pointerId);setDragging(true);}point(e);}}
      onPointerMove={e=>{if(draggable&&e.currentTarget.hasPointerCapture(e.pointerId))point(e);}}
      onPointerUp={e=>{if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);setDragging(false);}}
      onPointerCancel={()=>setDragging(false)}
    />
  </div>;
}
export function Chips({label,options,value,onChange}:{
  label:string;options:{value:string,label:string}[];value:string;onChange:(v:string)=>void;
}) {
  return <div className="lada-chip-row" role="group" aria-label={label} onKeyDown={e=>e.stopPropagation()}>
    <span className="lada-control-label">{label}</span>
    <div className="lada-chip-options">{options.map(o=><button type="button" className={'chip'+(value===o.value?' selected':'')}
      key={o.value} aria-pressed={value===o.value} onClick={()=>onChange(o.value)}>{o.label}</button>)}</div>
  </div>;
}
export function Feedback({tone='neutral',children}:{tone?:'good'|'bad'|'neutral';children:React.ReactNode}){
  return <div className={'feedback lada-feedback '+(tone==='good'?'good':tone==='bad'?'bad':'neutral')} role="status" aria-live="polite">{children}</div>;
}
export function Readout({items}:{items:{label:string,value:string}[]}){
  return <div className="lada-readout">{items.map((it,i)=><div className="lada-readout-item" key={i}><span>{it.label}</span><strong>{it.value}</strong></div>)}</div>;
}
export function Source({page,label}:{page:number;label:string}){
  return <div className="lada-source"><a href={'https://arxiv.org/pdf/2505.23271v1#page='+page} target="_blank" rel="noreferrer">{label} · 原文第{page}页 ↗</a></div>;
}
export function roundRect(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,r:number,fill:string,stroke?:string){
  ctx.beginPath();ctx.roundRect(x,y,Math.max(0,w),Math.max(0,h),r);ctx.fillStyle=fill;ctx.fill();
  if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1.6;ctx.stroke();}
}
export function line(ctx:CanvasRenderingContext2D,x1:number,y1:number,x2:number,y2:number,color:string,width=2){
  ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.stroke();
}
export function arrow(ctx:CanvasRenderingContext2D,x1:number,y1:number,x2:number,y2:number,color:string,width=2){
  line(ctx,x1,y1,x2,y2,color,width);const a=Math.atan2(y2-y1,x2-x1),len=8;
  ctx.beginPath();ctx.moveTo(x2,y2);ctx.lineTo(x2-len*Math.cos(a-.4),y2-len*Math.sin(a-.4));
  ctx.lineTo(x2-len*Math.cos(a+.4),y2-len*Math.sin(a+.4));ctx.closePath();ctx.fillStyle=color;ctx.fill();
}
export function text(ctx:CanvasRenderingContext2D,value:string,x:number,y:number,size=16,color=C.ink,align:CanvasTextAlign='center'){
  ctx.font='600 '+size+'px system-ui, sans-serif';ctx.fillStyle=color;ctx.textAlign=align;ctx.textBaseline='middle';ctx.fillText(value,x,y);
}
export function drawAlbum(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number){
  roundRect(ctx,x-3,y+4,w+6,h+5,8,C.dark);
  roundRect(ctx,x,y,w,h,7,'#fffdf5',C.light);
  line(ctx,x+w/2,y+4,x+w/2,y+h-4,C.light,1.5);
  for(let i=0;i<3;i++){line(ctx,x+12,y+h-14-i*6,x+w*.4,y+h-14-i*6,'#e4e8da',2);
    line(ctx,x+w*.58,y+h-14-i*6,x+w-12,y+h-14-i*6,'#e4e8da',2);}
}
export function drawCard(ctx:CanvasRenderingContext2D,x:number,y:number,size:number,kind:number,color:string,rotation=0){
  ctx.save();ctx.translate(x,y);ctx.rotate(rotation);
  roundRect(ctx,-size*.52,-size*.61,size*1.04,size*1.23,4,'#fff',C.line);
  roundRect(ctx,-size*.43,-size*.50,size*.86,size*.78,3,C.bg);
  const s=size*.25;ctx.fillStyle=color;ctx.strokeStyle=color;ctx.lineWidth=Math.max(1.5,size*.025);
  if(kind===3){
    for(const sign of [-1,1]){ctx.beginPath();ctx.ellipse(sign*s*.6,-s*.7,s*.52,s*.8,sign*.3,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.ellipse(sign*s*.5,s*.2,s*.44,s*.5,-sign*.3,0,Math.PI*2);ctx.fill();}
    line(ctx,0,-s*.9,0,s*.6,C.brown,2);
  }else if(kind===4){
    for(let a=0;a<6;a++){const angle=a*Math.PI/3;ctx.beginPath();ctx.arc(Math.cos(angle)*s*.65,Math.sin(angle)*s*.65-s*.5,s*.42,0,Math.PI*2);ctx.fill();}
    ctx.beginPath();ctx.arc(0,-s*.5,s*.33,0,Math.PI*2);ctx.fillStyle=C.orange;ctx.fill();line(ctx,0,s*.4,0,s*.9,C.dark,2);
  }else if(kind===5){
    line(ctx,0,-s*.4,0,s*.9,C.brown,4);ctx.beginPath();ctx.moveTo(0,-s*1.5);ctx.lineTo(s,s*.45);ctx.lineTo(-s,s*.45);ctx.closePath();ctx.fill();
  }else if(kind%3===0){
    ctx.beginPath();ctx.moveTo(-s,-s*.65);ctx.lineTo(-s,-s*1.4);ctx.lineTo(-s*.3,-s*.8);
    ctx.lineTo(s*.3,-s*.8);ctx.lineTo(s,-s*1.4);ctx.lineTo(s,-s*.65);
    ctx.ellipse(0,-s*.30,s,s*.83,0,0,Math.PI);ctx.fill();
    ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(-s*.36,-s*.40,s*.095,0,Math.PI*2);ctx.arc(s*.36,-s*.40,s*.095,0,Math.PI*2);ctx.fill();
  }else if(kind%3===1){
    ctx.beginPath();ctx.ellipse(0,-s*.45,s*.82,s*.86,0,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.ellipse(-s*.83,-s*.56,s*.30,s*.69,-.3,0,Math.PI*2);ctx.ellipse(s*.83,-s*.56,s*.30,s*.69,.3,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(-s*.28,-s*.60,s*.09,0,Math.PI*2);ctx.arc(s*.28,-s*.60,s*.09,0,Math.PI*2);ctx.fill();
  }else{
    ctx.beginPath();ctx.ellipse(-s*.12,-s*.18,s*.85,s*.59,.2,0,Math.PI*2);ctx.arc(s*.54,-s*.75,s*.40,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.moveTo(s*.87,-s*.85);ctx.lineTo(s*1.26,-s*.66);ctx.lineTo(s*.89,-s*.51);ctx.closePath();ctx.fill();
    line(ctx,-s*.75,-s*.3,-s*1.18,-s*.62,color,Math.max(2,size*.05));
    ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(s*.62,-s*.82,s*.065,0,Math.PI*2);ctx.fill();
  }
  line(ctx,-size*.26,size*.43,size*.26,size*.43,C.light,2);
  ctx.restore();
}
export function drawLens(ctx:CanvasRenderingContext2D,x:number,y:number,r:number,color:string){
  ctx.save();ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle='#ffffff99';ctx.fill();ctx.strokeStyle=color;ctx.lineWidth=4;ctx.stroke();
  line(ctx,x+r*.7,y+r*.7,x+r*1.5,y+r*1.5,C.brown,7);ctx.restore();
}
export function LadaKeyGuard({children}:{children:React.ReactNode}){
  return <div onKeyDown={e=>{if((e.target as HTMLElement).closest('button,input,select,textarea,summary,[tabindex]'))e.stopPropagation();}}>{children}</div>;
}
