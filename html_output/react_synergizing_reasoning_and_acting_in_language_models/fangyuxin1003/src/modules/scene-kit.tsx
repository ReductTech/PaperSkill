import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';

export const C = {bg:'#f5f8f0',light:'#b8c9a7',contour:'#76906a',support:'#92400e',blue:'#27446e',green:'#228d5c',red:'#c43f52',orange:'#f07e47',purple:'#7c3aed',text:'#21324a',muted:'#68778f',border:'#d7deea',ink:'#21324a',line:'#d7deea',paper:'#ffffff'};
type SceneProps = Omit<React.CanvasHTMLAttributes<HTMLCanvasElement>,'width'|'height'> & {draw:(ctx:CanvasRenderingContext2D,w:number,h:number,time:number)=>void;width?:number;height?:number;label:string;clock?:"visible"|"wall"};
export function CanvasScene({draw,width=1080,height=280,label:accessibleLabel,style,clock="visible",...props}:SceneProps){
 const ref=useRef<HTMLCanvasElement>(null); const drawRef=useRef(draw); drawRef.current=draw;
 const paintRef=useRef<()=>void>(()=>{});
 useEffect(()=>{
  const canvas=ref.current;if(!canvas)return;
  const ctx=setupCanvas(canvas,width,height);canvas.style.width='100%';canvas.style.height='auto';
  let raf:number|null=null, visible=false, disposed=false, elapsed=0, lastTime=performance.now();
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const paint=()=>{const now=performance.now(); if(visible)elapsed+=Math.max(0,now-lastTime);lastTime=now;ctx.save();ctx.clearRect(0,0,width,height);ctx.fillStyle=C.bg;ctx.fillRect(0,0,width,height);drawRef.current(ctx,width,height,reduced?1500:clock==="wall"?now:elapsed);ctx.restore();canvas.classList.add('is-ready');};
  paintRef.current=paint;
  const tick=()=>{if(disposed)return;paint();raf=visible&&!reduced?requestAnimationFrame(tick):null;};
  const stop=()=>{visible=false;if(raf!==null)cancelAnimationFrame(raf);raf=null;};
  const start=()=>{lastTime=performance.now();visible=true;if(raf===null)tick();};
  paint();const disconnect=observeCanvas(canvas,start,stop);
  return()=>{disposed=true;stop();disconnect();paintRef.current=()=>{};};
 },[width,height,clock]);
 useEffect(()=>{paintRef.current();},[draw]);
 return <canvas {...props} onKeyDown={event=>{if(props.onKeyDown){event.stopPropagation();props.onKeyDown(event);}}} ref={ref} width={width} height={height} aria-label={accessibleLabel} role={props.role || (props.onPointerDown||props.onClick?'img':undefined)} style={{display:'block',maxWidth:'100%',width:'100%',height:'auto',borderRadius:8,...style}}/>;
}
export function Feedback({tone='neutral',children}:{tone?:'good'|'bad'|'neutral';children:React.ReactNode}){return <div className={`feedback ${tone==='neutral'?'':tone}`} role="status" aria-live="polite">{children}</div>;}
export function Controls({children}:{children:React.ReactNode}){return <div className="ctrl" onKeyDown={event=>{if(event.key.startsWith('Arrow'))event.stopPropagation();}} style={{display:'flex',flexWrap:'wrap',gap:10,alignItems:'center'}}>{children}</div>;}
export function Chip({active=false,onClick,children,disabled=false}:{active?:boolean;onClick:()=>void;children:React.ReactNode;disabled?:boolean}){return <button type="button" className={`chip${active?' active':''}`} aria-pressed={active} disabled={disabled} onClick={onClick}>{children}</button>;}
export function line(ctx:CanvasRenderingContext2D,x1:number,y1:number,x2:number,y2:number,color:string=C.border,width=3){ctx.beginPath();ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();}
export function circle(ctx:CanvasRenderingContext2D,x:number,y:number,r:number,color:string){ctx.beginPath();ctx.fillStyle=color;ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();}
export function label(ctx:CanvasRenderingContext2D,text:string,x:number,y:number,color:string=C.text,size=22){ctx.fillStyle=color;ctx.font=`600 ${size}px "Microsoft YaHei",sans-serif`;ctx.fillText(text,x,y);}
export function drawBook(ctx:CanvasRenderingContext2D,x:number,y:number,scale=1,color:string=C.blue){
 ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);
 ctx.fillStyle=C.light;ctx.fillRect(-4,6,188,99);ctx.fillStyle='#fff';ctx.fillRect(0,0,87,98);ctx.fillRect(93,0,87,98);
 ctx.strokeStyle=color;ctx.lineWidth=3;ctx.strokeRect(0,0,180,98);line(ctx,90,1,90,99,color,3);
 ctx.restore();
}
export function drawCard(ctx:CanvasRenderingContext2D,x:number,y:number,w=180,h=100,color:string=C.blue){
 ctx.save();ctx.fillStyle='#fff';ctx.strokeStyle=color;ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(x,y,w,h,7);ctx.fill();ctx.stroke();
 ctx.restore();
}
export function drawHand(ctx:CanvasRenderingContext2D,x:number,y:number,scale=1,color:string=C.blue){
 ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(0,30,28,30,5);ctx.fill();
 ctx.fillStyle='#f1d5ba';ctx.strokeStyle=C.support;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(24,34);ctx.lineTo(53,16);ctx.quadraticCurveTo(64,10,70,18);ctx.lineTo(91,18);ctx.quadraticCurveTo(101,20,91,28);ctx.lineTo(69,29);ctx.lineTo(88,32);ctx.quadraticCurveTo(94,37,86,41);ctx.lineTo(84,49);ctx.quadraticCurveTo(77,61,60,58);ctx.lineTo(26,57);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
}
export const SceneKit:React.FC=()=>null;
