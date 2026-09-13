
import React,{useEffect,useRef} from 'react';
import {setupCanvas,observeCanvas} from '../lib/canvasKit';
export const C={bg:'#f5f8f0',light:'#b8c9a7',dark:'#76906a',support:'#92400e',blue:'#27446e',green:'#228d5c',red:'#c43f52',orange:'#f07e47',purple:'#7c3aed',text:'#21324a',muted:'#68778f',axis:'#d7deea'};
type SceneProps=Omit<React.CanvasHTMLAttributes<HTMLCanvasElement>,'width'|'height'> & {draw:(ctx:CanvasRenderingContext2D,w:number,h:number,time:number)=>void,width?:number,height?:number,animate?:boolean,label?:string};
export function Scene({draw,width=1080,height=280,animate=false,label='交互教学图',style,...props}:SceneProps){
 const ref=useRef<HTMLCanvasElement>(null),latest=useRef(draw);latest.current=draw;
 useEffect(()=>{const canvas=ref.current;if(!canvas)return;const ctx=setupCanvas(canvas,width,height);canvas.style.width='100%';canvas.style.height='auto';let raf=0,visible=false;const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const paint=(t:number)=>{ctx.clearRect(0,0,width,height);latest.current(ctx,width,height,t);canvas.classList.add('is-ready');};
 const loop=(t:number)=>{paint(t);if(visible&&animate&&!reduced)raf=requestAnimationFrame(loop)};
 const start=()=>{if(visible)return;visible=true;paint(performance.now());if(animate&&!reduced)raf=requestAnimationFrame(loop)};
 const stop=()=>{visible=false;cancelAnimationFrame(raf)};
 paint(performance.now());const off=observeCanvas(canvas,start,stop);return()=>{stop();off()};
 },[width,height,animate]);
 useEffect(()=>{const canvas=ref.current;if(!canvas)return;const ctx=canvas.getContext('2d');if(ctx){ctx.clearRect(0,0,width,height);draw(ctx,width,height,performance.now());canvas.classList.add('is-ready')}},[draw,width,height]);
 return <canvas ref={ref} role="img" aria-label={label} style={{width:'100%',height:'auto',...style}} {...props}/>;
}
export function Feedback({children,tone='neutral'}:{children:React.ReactNode,tone?:'neutral'|'good'|'bad'}){return <div className={'feedback '+(tone==='neutral'?'':tone)} aria-live="polite">{children}</div>}
export function PedagogicalLabel({detail}:{detail?:string}){return <div className="pedagogical-label"><b>教学示意 / Pedagogical illustration</b><span>非论文实测数据{detail?` · ${detail}`:''}</span></div>}
export function line(c:CanvasRenderingContext2D,x1:number,y1:number,x2:number,y2:number,color:string=C.axis,width=2){c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.strokeStyle=color;c.lineWidth=width;c.stroke()}
export function bar(c:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,color:string){c.fillStyle=color;c.fillRect(x,y,w,h)}
export function drawDesk(c:CanvasRenderingContext2D,w:number,h:number){bar(c,0,0,w,h,C.bg);bar(c,0,h*.83,w,h*.17,C.light);line(c,0,h*.83,w,h*.83,C.dark)}
export function drawPaper(c:CanvasRenderingContext2D,x:number,y:number,w:number,h:number){bar(c,x+4,y+4,w,h,C.light);bar(c,x,y,w,h,'#fff');c.strokeStyle=C.axis;c.lineWidth=2;c.strokeRect(x,y,w,h)}
export function drawPen(c:CanvasRenderingContext2D,x:number,y:number,angle=0,color:string=C.blue){c.save();c.translate(x,y);c.rotate(angle-.55);bar(c,-5,-54,10,44,color);bar(c,-5,-20,10,9,C.support);c.beginPath();c.moveTo(-5,-10);c.lineTo(0,2);c.lineTo(5,-10);c.closePath();c.fillStyle=C.support;c.fill();c.restore()}
export function drawGuide(c:CanvasRenderingContext2D,x:number,y:number,w:number){c.save();c.setLineDash([5,5]);line(c,x,y,x+w,y,C.dark);c.restore()}
export function drawTarget(c:CanvasRenderingContext2D,x:number,y:number,color:string=C.green){c.beginPath();c.arc(x,y,7,0,Math.PI*2);c.strokeStyle=color;c.lineWidth=2;c.stroke();line(c,x-10,y,x+10,y,color);line(c,x,y-10,x,y+10,color)}
export function drawLabel(c:CanvasRenderingContext2D,text:string,x:number,y:number,color:string=C.text){c.fillStyle=color;c.font='20px system-ui';c.fillText(text,x,y)}
export function IndexKit(){return null}
