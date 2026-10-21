import { useEffect, useRef, type CanvasHTMLAttributes } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';

export const palette = {bg:'#f5f8f0',light:'#b8c9a7',dark:'#76906a',wood:'#92400e',blue:'#27446e',green:'#228d5c',red:'#c43f52',orange:'#f07e47',purple:'#7c3aed',ink:'#21324a',muted:'#68778f',border:'#d7deea'};
type Draw = (ctx:CanvasRenderingContext2D,w:number,h:number,time:number)=>void;
type Props = Omit<CanvasHTMLAttributes<HTMLCanvasElement>,'width'|'height'> & { draw:Draw;width?:number;height?:number;animate?:boolean;ariaLabel:string };
export function StudyCanvas({draw,width=1080,height=280,animate=false,ariaLabel,style,...props}:Props){
 const ref=useRef<HTMLCanvasElement>(null),drawRef=useRef(draw),paintRef=useRef<()=>void>(()=>{});
 drawRef.current=draw;
 useEffect(()=>{const canvas=ref.current;if(!canvas)return;const ctx=setupCanvas(canvas,width,height);canvas.style.width='100%';canvas.style.height='auto';let frame=0,active=false;const startTime=performance.now();const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const paint=()=>{ctx.clearRect(0,0,width,height);drawRef.current(ctx,width,height,reduced?0:(performance.now()-startTime)/1000);};paintRef.current=paint;
 const loop=()=>{paint();if(active)frame=requestAnimationFrame(loop);};const stop=()=>{active=false;cancelAnimationFrame(frame);};const start=()=>{if(active)return;paint();if(animate&&!reduced){active=true;frame=requestAnimationFrame(loop);}};
 paint();const unobserve=observeCanvas(canvas,start,stop);return()=>{stop();unobserve();};},[width,height,animate]);
 useEffect(()=>{paintRef.current();});
 return <canvas {...props} className={`is-ready ${props.className||''}`} ref={ref} aria-label={ariaLabel} role={props.role||'img'} style={{display:'block',maxWidth:'100%',borderRadius:14,background:palette.bg,...style}}/>;
}
export function drawPaper(c:CanvasRenderingContext2D,x:number,y:number,w:number,h:number){c.save();c.shadowColor='#21324a15';c.shadowBlur=12;c.shadowOffsetY=5;c.fillStyle='#fffef9';c.beginPath();c.roundRect(x,y,w,h,8);c.fill();c.shadowColor='transparent';c.strokeStyle=palette.border;c.lineWidth=1;c.stroke();c.restore();}
export function drawPencil(c:CanvasRenderingContext2D,x:number,y:number,angle=0,color=palette.blue){c.save();c.translate(x,y);c.rotate(angle);c.fillStyle=color;c.fillRect(0,-6,53,12);c.fillStyle='#d5b082';c.beginPath();c.moveTo(-15,0);c.lineTo(0,-6);c.lineTo(0,6);c.closePath();c.fill();c.fillStyle=palette.ink;c.beginPath();c.moveTo(-15,0);c.lineTo(-9,-2.4);c.lineTo(-9,2.4);c.fill();c.fillStyle='#e8b6ae';c.fillRect(53,-6,9,12);c.restore();}
export function drawMask(c:CanvasRenderingContext2D,x:number,y:number,w:number,h:number){c.save();c.fillStyle='#b8c9a777';c.strokeStyle=palette.dark;c.setLineDash([5,4]);c.lineWidth=1.5;c.fillRect(x,y,w,h);c.strokeRect(x,y,w,h);c.restore();}
export function drawGuide(c:CanvasRenderingContext2D,x:number,y:number,w:number,angle=0){c.save();c.translate(x,y);c.rotate(angle);c.fillStyle='#e6c69b';c.fillRect(0,0,w,16);c.strokeStyle=palette.wood;c.lineWidth=1;for(let i=8;i<w;i+=12){c.beginPath();c.moveTo(i,0);c.lineTo(i,6);c.stroke();}c.restore();}
export function drawTarget(c:CanvasRenderingContext2D,x:number,y:number,r=9,color=palette.green){c.save();c.strokeStyle=color;c.lineWidth=2;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.stroke();c.beginPath();c.arc(x,y,2.5,0,Math.PI*2);c.fillStyle=color;c.fill();c.restore();}
export function drawArrow(c:CanvasRenderingContext2D,x1:number,y1:number,x2:number,y2:number,color=palette.blue,width=3){c.save();c.strokeStyle=color;c.fillStyle=color;c.lineWidth=width;c.lineCap='round';c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();const a=Math.atan2(y2-y1,x2-x1);c.translate(x2,y2);c.rotate(a);c.beginPath();c.moveTo(0,0);c.lineTo(-10,-5);c.lineTo(-10,5);c.closePath();c.fill();c.restore();}
export function drawLabel(c:CanvasRenderingContext2D,text:string,x:number,y:number,color=palette.ink,size=18){c.save();c.fillStyle=color;c.font=`600 ${size}px system-ui, sans-serif`;c.fillText(text,x,y);c.restore();}
export function SketchAnalogy({variant}:{variant:number}){return <StudyCanvas width={560} height={140} animate ariaLabel={`素描补绘生活动画，第${variant}种动作`} draw={(c,w,h,t)=>{const p=(Math.sin(t*2.2-Math.PI/2)+1)/2;drawPaper(c,24,14,512,112);c.lineCap='round';c.lineWidth=2;c.strokeStyle='#b6c0cb';c.beginPath();c.moveTo(68,106);c.lineTo(129,41);c.lineTo(181,106);c.moveTo(94,80);c.lineTo(151,80);c.stroke();
 if(variant===3||variant===9){const x=220+p*80;drawMask(c,x,32,variant===3?150:80+p*100,74);c.strokeStyle=palette.dark;c.beginPath();c.moveTo(x+20,90);c.lineTo(x+60,48);c.stroke();}
 else if(variant===6){c.strokeStyle='#c43f5240';c.lineWidth=4;c.beginPath();c.moveTo(245,72);c.lineTo(450,72);c.stroke();c.strokeStyle=palette.green;c.beginPath();c.moveTo(245,91);c.lineTo(450,91);c.stroke();const x=255+p*180;c.fillStyle='#f0c3b5';c.beginPath();c.roundRect(x,57,36,24,5);c.fill();}
 else {const x=250+p*180;const y=variant===1?100-p*50:variant===2?102-p*44:variant===8?76:88; if([4,5,7].includes(variant))drawGuide(c,230,105,245,variant===5?-.12:0);c.strokeStyle=palette.green;c.lineWidth=3;c.beginPath();c.moveTo(240,variant===1?103:88);c.lineTo(x,y);c.stroke();if(variant===10)drawTarget(c,445,88);drawPencil(c,x+15,y,-.55);}
 }}/>;}
export function StudioKit(){return null;}
