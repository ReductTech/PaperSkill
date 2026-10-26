import React, { useEffect, useRef, type DependencyList } from 'react';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';

export const C = { bg:'#f5f8f0',env:'#b8c9a7',leaf:'#76906a',brown:'#92400e',blue:'#27446e',green:'#228d5c',red:'#c43f52',orange:'#f07e47',purple:'#7c3aed',ink:'#21324a',muted:'#68778f',axis:'#d7deea' };
export function useCanvas(draw:(ctx:CanvasRenderingContext2D,w:number,h:number,time:number)=>void,deps:DependencyList=[],options:{width?:number;height?:number;animate?:boolean}={}) {
  const ref=useRef<HTMLCanvasElement>(null), drawRef=useRef(draw);drawRef.current=draw;
  const width=options.width??1080,height=options.height??280,animate=options.animate??false;
  useEffect(()=>{
    const canvas=ref.current;if(!canvas)return;
    let ctx=setupCanvas(canvas,width,height),frame=0,visible=false,disposed=false;
    canvas.style.width='100%';canvas.style.height='auto';
    const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
    const paint=(time:number)=>{ctx.clearRect(0,0,width,height);drawRef.current(ctx,width,height,time);canvas.classList.add('is-ready');};
    const loop=(time:number)=>{frame=0;if(disposed||!visible)return;paint(time);if(animate&&!motion.matches)frame=requestAnimationFrame(loop);};
    const stop=()=>{visible=false;cancelAnimationFrame(frame);frame=0;};
    const start=()=>{visible=true;paint(0);if(animate&&!motion.matches&&!frame)frame=requestAnimationFrame(loop);};
    const onResize=()=>{ctx=setupCanvas(canvas,width,height);canvas.style.width='100%';canvas.style.height='auto';paint(0);};
    const onMotion=()=>{cancelAnimationFrame(frame);frame=0;if(visible)start();};
    paint(0);const disconnect=observeCanvas(canvas,start,stop);
    window.addEventListener('resize',onResize);motion.addEventListener('change',onMotion);
    return()=>{disposed=true;stop();disconnect();window.removeEventListener('resize',onResize);motion.removeEventListener('change',onMotion);};
  },[width,height,animate,...deps]);
  return ref;
}
export function roundRect(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,r:number,fill:string,stroke?:string){
  ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke();}
}
export function drawCamera(ctx:CanvasRenderingContext2D,x:number,y:number,scale=1,angle=0){
  ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.scale(scale,scale);
  roundRect(ctx,-58,-30,116,68,11,C.env,C.ink);roundRect(ctx,-28,-43,45,15,4,C.leaf,C.ink);
  roundRect(ctx,28,-38,18,8,3,C.orange);roundRect(ctx,-47,-20,18,10,2,C.bg,C.ink);
  ctx.beginPath();ctx.arc(3,3,31,0,Math.PI*2);ctx.fillStyle=C.bg;ctx.fill();ctx.strokeStyle=C.ink;ctx.lineWidth=3;ctx.stroke();
  ctx.beginPath();ctx.arc(3,3,21,0,Math.PI*2);ctx.fillStyle=C.blue;ctx.fill();ctx.strokeStyle=C.leaf;ctx.lineWidth=3;ctx.stroke();
  ctx.beginPath();ctx.arc(-4,-5,7,0,Math.PI*2);ctx.fillStyle=C.bg;ctx.globalAlpha=.6;ctx.fill();ctx.globalAlpha=1;ctx.restore();
}
export function drawPhoto(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,tones:number[]=[.4,.7,.5],accent:string=C.blue){
  roundRect(ctx,x+3,y+4,w,h,4,C.axis);roundRect(ctx,x,y,w,h,4,C.bg,C.env);
  const pad=Math.min(w,h)*.12,iw=w-pad*2,ih=h-pad*2.5;
  ctx.fillStyle=C.env;ctx.fillRect(x+pad,y+pad,iw,ih);
  tones.forEach((t,i)=>{ctx.fillStyle=accent;ctx.globalAlpha=.18+.72*Math.max(0,Math.min(1,t));const sw=iw/tones.length;ctx.fillRect(x+pad+i*sw,y+pad,sw+.1,ih);});ctx.globalAlpha=1;
  ctx.beginPath();ctx.moveTo(x+pad,y+h-pad);ctx.lineTo(x+w*.48,y+h-pad);ctx.strokeStyle=C.leaf;ctx.lineWidth=2;ctx.stroke();
}
export function drawAlbum(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,items:number[],capacity:number){
  roundRect(ctx,x,y,w,h,10,C.env,C.leaf);const gap=12,sw=(w-gap*(capacity+1))/capacity;
  for(let i=0;i<capacity;i++){const sx=x+gap+i*(sw+gap);roundRect(ctx,sx,y+gap,sw,h-gap*2,5,C.bg,C.axis);if(i<items.length){const n=items[i];drawPhoto(ctx,sx+6,y+gap+6,sw-12,h-2*gap-12,[((n*3)%9+1)/10,((n*7)%9+1)/10,.6],C.blue);}}
}
export function arrow(ctx:CanvasRenderingContext2D,x1:number,y1:number,x2:number,y2:number,color:string=C.muted){
  ctx.save();ctx.strokeStyle=color;ctx.fillStyle=color;ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();
  const a=Math.atan2(y2-y1,x2-x1);ctx.beginPath();ctx.moveTo(x2,y2);ctx.lineTo(x2-10*Math.cos(a-.4),y2-10*Math.sin(a-.4));ctx.lineTo(x2-10*Math.cos(a+.4),y2-10*Math.sin(a+.4));ctx.closePath();ctx.fill();ctx.restore();
}
export function bars(ctx:CanvasRenderingContext2D,values:number[],x:number,y:number,w:number,h:number,color:string=C.blue,max=1){
  const signed=values.some(v=>v<0),base=signed?y+h/2:y+h,span=signed?h/2:h,bw=w/Math.max(1,values.length);
  ctx.strokeStyle=C.axis;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,base);ctx.lineTo(x+w,base);ctx.stroke();
  values.forEach((v,i)=>{const bh=Math.min(1,Math.abs(v)/Math.max(.000001,max))*span;roundRect(ctx,x+i*bw+bw*.15,v>=0?base-bh:base,bw*.7,Math.max(.5,bh),3,color);});
}
export function softmax(z:number[],temperature=1){const m=Math.max(...z);const e=z.map(v=>Math.exp((v-m)/temperature));const sum=e.reduce((a,b)=>a+b,0);return e.map(v=>v/sum);}
export function ce(z:number[],y:number){const m=Math.max(...z);return m+Math.log(z.reduce((a,v)=>a+Math.exp(v-m),0))-z[y];}
export function mse(a:number[],b:number[],mean=true){const s=a.reduce((v,x,i)=>v+(x-b[i])**2,0);return mean?s/a.length:s;}
export function normCenter(a:number[]){const m=a.reduce((x,y)=>x+y,0)/a.length;return a.map(x=>x-m);}
export function Feedback({children,tone='blue'}:{children:React.ReactNode;tone?:'blue'|'green'|'red'|'purple'}){return <div className={`der-feedback der-feedback-${tone}`} role="status" aria-live="polite">{children}</div>;}
export function Source({children,href='https://proceedings.neurips.cc/paper/2020/hash/b704ea2c39778f07c617f6b7ce480e9e-Abstract.html'}:{children:React.ReactNode;href?:string}){return <p className="der-source"><a href={href} target="_blank" rel="noopener noreferrer">{children} ↗</a></p>;}
export function MathBlock({children,title}:{children:React.ReactNode;title?:string}){return <div className="der-math">{title&&<strong>{title}</strong>}<div>{children}</div></div>;}
