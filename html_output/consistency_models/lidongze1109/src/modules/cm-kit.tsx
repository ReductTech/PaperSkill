import React, {useEffect,useRef} from 'react';
import {setupCanvas,observeCanvas} from '../lib/canvasKit';

export const C={bg:'#f5f8f0',light:'#b8c9a7',dark:'#76906a',support:'#92400e',blue:'#27446e',green:'#228d5c',red:'#c43f52',orange:'#f07e47',purple:'#7c3aed',text:'#21324a',muted:'#68778f',border:'#d7deea'};
export function clearScene(ctx:CanvasRenderingContext2D,w=1080,h=280){ctx.clearRect(0,0,w,h);ctx.fillStyle=C.bg;ctx.fillRect(0,0,w,h);ctx.lineCap='round';ctx.lineJoin='round';}
export function drawLine(ctx:CanvasRenderingContext2D,x1:number,y1:number,x2:number,y2:number,color:string=C.border,lineWidth=3){ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.strokeStyle=color;ctx.lineWidth=lineWidth;ctx.stroke();}
export function drawDot(ctx:CanvasRenderingContext2D,x:number,y:number,r=6,color:string=C.blue){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();}
export function drawText(ctx:CanvasRenderingContext2D,text:string,x:number,y:number,color:string=C.text,size=20,align:CanvasTextAlign='left'){ctx.font=`500 ${size}px system-ui, sans-serif`;ctx.textAlign=align;ctx.textBaseline='middle';ctx.fillStyle=color;ctx.fillText(text,x,y);}
export function drawTrail(ctx:CanvasRenderingContext2D,points:[number,number][],color:string=C.support,width=5){if(!points.length)return;ctx.beginPath();ctx.moveTo(...points[0]);for(const p of points.slice(1))ctx.lineTo(...p);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();}
export function drawSetting(ctx:CanvasRenderingContext2D,w:number,h:number){ctx.fillStyle=C.light;ctx.beginPath();ctx.moveTo(0,h);ctx.lineTo(0,h*.72);ctx.bezierCurveTo(w*.24,h*.12,w*.4,h*.82,w*.65,h*.38);ctx.quadraticCurveTo(w*.85,h*.08,w,h*.6);ctx.lineTo(w,h);ctx.closePath();ctx.fill();ctx.strokeStyle=C.dark;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,h*.8);ctx.quadraticCurveTo(w*.5,h*.7,w,h*.82);ctx.stroke();}
export function drawHiker(ctx:CanvasRenderingContext2D,x:number,y:number,color:string=C.blue,phase=0,scale=1){ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);drawDot(ctx,0,-31,7,color);drawLine(ctx,0,-22,1,-3,color,6);drawLine(ctx,-1,-16,-11,-7,color,4);drawLine(ctx,1,-16,13,-13,color,4);drawLine(ctx,1,-3,-9-Math.sin(phase)*4,12,color,4);drawLine(ctx,1,-3,10+Math.sin(phase)*4,12,color,4);ctx.fillStyle=C.support;ctx.fillRect(-11,-23,7,15);ctx.restore();}
export function drawCamp(ctx:CanvasRenderingContext2D,x:number,y:number,scale=1){ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);ctx.beginPath();ctx.moveTo(-23,12);ctx.lineTo(0,-24);ctx.lineTo(25,12);ctx.closePath();ctx.fillStyle=C.green;ctx.fill();ctx.strokeStyle=C.support;ctx.lineWidth=3;ctx.stroke();ctx.beginPath();ctx.moveTo(-8,12);ctx.lineTo(0,-5);ctx.lineTo(8,12);ctx.fillStyle=C.bg;ctx.fill();ctx.restore();}
type SceneProps=Omit<React.CanvasHTMLAttributes<HTMLCanvasElement>,'width'|'height'> & {width?:number;height?:number;draw:(ctx:CanvasRenderingContext2D,timeSeconds:number)=>void;animated?:boolean;ariaLabel?:string};
export function SceneCanvas({width=1080,height=280,draw,animated=false,ariaLabel='交互概念示意',style,...props}:SceneProps){
 const ref=useRef<HTMLCanvasElement>(null), latest=useRef(draw);latest.current=draw;
 useEffect(()=>{const el=ref.current;if(!el)return;const ctx=setupCanvas(el,width,height);el.style.width='100%';el.style.height='auto';let frame=0,visible=false;const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const paint=(now:number)=>{latest.current(ctx,now/1000);el.classList.add('is-ready');};
  const tick=(now:number)=>{paint(now);if(visible&&animated&&!reduce)frame=requestAnimationFrame(tick);};
  const stop=()=>{visible=false;cancelAnimationFrame(frame);};const start=()=>{if(visible)return;visible=true;paint(performance.now());if(animated&&!reduce)frame=requestAnimationFrame(tick);};
  const disconnect=observeCanvas(el,start,stop);paint(performance.now());return()=>{stop();disconnect();};
 },[width,height,animated]);
 useEffect(()=>{const el=ref.current;if(el){const ctx=el.getContext('2d');if(ctx)draw(ctx,performance.now()/1000);}});
 return <canvas ref={ref} role="img" aria-label={ariaLabel} {...props} style={{display:'block',width:'100%',height:'auto',touchAction:'pan-y',...style}}/>;
}
export function Kit(){return null;}
