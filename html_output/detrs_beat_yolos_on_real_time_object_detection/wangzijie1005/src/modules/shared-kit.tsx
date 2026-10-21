import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';

export const C = { quiet:'#f5f8f0', light:'#b8c9a7', dark:'#76906a', support:'#92400e', blue:'#27446e', green:'#228d5c', red:'#c43f52', orange:'#f07e47', purple:'#7c3aed', ink:'#21324a', muted:'#68778f', line:'#d7deea', white:'#ffffff' };
export function clear(ctx:CanvasRenderingContext2D,w=560,h=240) { ctx.clearRect(0,0,w,h);ctx.fillStyle=C.quiet;ctx.fillRect(0,0,w,h);ctx.lineWidth=2;ctx.font='16px system-ui, sans-serif';ctx.textAlign='left';ctx.textBaseline='alphabetic'; }
export function frame(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,color:string=C.blue) {ctx.save();ctx.strokeStyle=color;ctx.lineWidth=3;ctx.strokeRect(x,y,w,h);ctx.restore();}
export function bar(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,color:string=C.blue) {ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(x,y,Math.max(0,w),h,Math.min(6,h/2));ctx.fill();}
export function text(ctx:CanvasRenderingContext2D,s:string,x:number,y:number,color:string=C.ink) {ctx.fillStyle=color;ctx.fillText(s,x,y);}
export function photo(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number) {
 ctx.save();ctx.translate(x,y);ctx.fillStyle=C.white;ctx.shadowColor='#21324a18';ctx.shadowBlur=12;ctx.fillRect(-6,-6,w+12,h+12);ctx.shadowBlur=0;
 ctx.fillStyle='#e2eadd';ctx.fillRect(0,0,w,h);ctx.fillStyle=C.light;ctx.beginPath();ctx.moveTo(0,h);ctx.lineTo(w*.25,h*.5);ctx.lineTo(w*.5,h*.82);ctx.lineTo(w*.8,h*.37);ctx.lineTo(w,h*.65);ctx.lineTo(w,h);ctx.fill();
 ctx.strokeStyle=C.support;ctx.lineWidth=Math.max(2,w*.018);ctx.beginPath();ctx.moveTo(w*.2,h*.81);ctx.lineTo(w*.87,h*.67);ctx.stroke();
 ctx.fillStyle=C.dark;ctx.beginPath();ctx.ellipse(w*.59,h*.53,w*.095,h*.145,-.35,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(w*.67,h*.38,Math.max(3,w*.052),0,Math.PI*2);ctx.fill();
 ctx.fillStyle=C.support;ctx.beginPath();ctx.moveTo(w*.705,h*.37);ctx.lineTo(w*.79,h*.42);ctx.lineTo(w*.705,h*.45);ctx.fill();ctx.fillStyle=C.white;ctx.beginPath();ctx.arc(w*.68,h*.36,Math.max(1.6,w*.009),0,Math.PI*2);ctx.fill();ctx.restore();
}
type SceneProps = {draw:(ctx:CanvasRenderingContext2D,t:number)=>void;height?:number;animate?:boolean;label?:string;onPointerDown?:React.PointerEventHandler<HTMLCanvasElement>;onPointerMove?:React.PointerEventHandler<HTMLCanvasElement>;onPointerUp?:React.PointerEventHandler<HTMLCanvasElement>;onPointerCancel?:React.PointerEventHandler<HTMLCanvasElement>};
export function Scene({draw,height=240,animate=false,label='交互教学示意',...handlers}:SceneProps) {
 const ref=useRef<HTMLCanvasElement>(null);const drawRef=useRef(draw);drawRef.current=draw;
 useEffect(()=>{const el=ref.current;if(!el)return;const ctx=setupCanvas(el,560,height);el.style.width='100%';el.style.maxWidth='560px';el.style.height='auto';const render=(t:number)=>{clear(ctx,560,height);drawRef.current(ctx,t);el.classList.add('is-ready');};render(0);let id=0,active=false,first=0;const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 const tick=(now:number)=>{if(!active)return;if(!first)first=now;render(reduced?0:(now-first)/1000);if(animate&&!reduced)id=requestAnimationFrame(tick);};const start=()=>{if(active)return;active=true;id=requestAnimationFrame(tick);};const stop=()=>{active=false;cancelAnimationFrame(id);};const disconnect=observeCanvas(el,start,stop);return()=>{stop();disconnect();};},[height,animate]);
 useEffect(()=>{const el=ref.current;if(!el)return;const ctx=el.getContext('2d');if(ctx){clear(ctx,560,height);draw(ctx,0);el.classList.add('is-ready');}},[draw,height]);
 return <canvas ref={ref} role="img" aria-label={label} {...handlers} style={{aspectRatio:`560/${height}`,width:'100%',maxWidth:560,height:'auto',touchAction:handlers.onPointerDown?'none':'auto'}}/>;
}
export function Feedback({children,tone='neutral'}:{children:React.ReactNode;tone?:'good'|'bad'|'neutral'}) {return <div className={`feedback ${tone==='good'?'good':tone==='bad'?'bad':''}`} role="status" aria-live="polite">{children}</div>;}
export const PAPER='https://openaccess.thecvf.com/content/CVPR2024/papers/Zhao_DETRs_Beat_YOLOs_on_Real-time_Object_Detection_CVPR_2024_paper.pdf';
export function Source({page,label}:{page:number;label:string}){return <a href={`${PAPER}#page=${page}`} target="_blank" rel="noreferrer">{label} ↗</a>;}
function lens(ctx:CanvasRenderingContext2D,x:number,y:number,turn:number){ctx.save();ctx.translate(x,y);ctx.fillStyle=C.blue;ctx.beginPath();ctx.roundRect(-48,-26,96,52,10);ctx.fill();ctx.fillStyle=C.ink;ctx.beginPath();ctx.arc(0,0,33,0,Math.PI*2);ctx.fill();ctx.strokeStyle=C.light;ctx.lineWidth=4;ctx.beginPath();ctx.arc(0,0,23,0,Math.PI*2);ctx.stroke();ctx.rotate(turn);ctx.strokeStyle=C.orange;ctx.beginPath();ctx.moveTo(0,-33);ctx.lineTo(0,-22);ctx.stroke();ctx.restore();}
function hand(ctx:CanvasRenderingContext2D,x:number,y:number,color:string=C.support){ctx.save();ctx.translate(x,y);ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(0,0,42,18,8);ctx.fill();ctx.fillRect(30,10,15,25);ctx.restore();}
export function CameraAnalogy({scene}:{scene:number}){return <Scene height={140} animate label={`摄影类比，第${scene}章`} draw={(ctx,t)=>{
 const phase=(t%3)/3;const a=(1-Math.cos(phase*Math.PI*2))/2;photo(ctx,224,22,130,91);ctx.fillStyle=C.light;ctx.fillRect(45,119,470,3);
 if(scene===1){ctx.save();ctx.translate(65+75*a,30);photo(ctx,0,0,85,58);hand(ctx,50,49);ctx.restore();}
 else if(scene===2){ctx.save();ctx.translate(115,68);ctx.scale(1+a*.3,1);lens(ctx,0,0,0);ctx.restore();}
 else if(scene===3){lens(ctx,126,68,a*Math.PI*1.5);}
 else if(scene===4){ctx.save();ctx.globalAlpha=.6;frame(ctx,190+34*a,10+12*a,130,91,C.blue);ctx.restore();}
 else if(scene===5){frame(ctx,195+75*a,38,65,56,C.orange);}
 else if(scene===6){lens(ctx,132,68,a*.7);ctx.strokeStyle=C.green;ctx.beginPath();ctx.arc(132,68,40,-Math.PI/2,-Math.PI/2+a*Math.PI*1.5);ctx.stroke();}
 else if(scene===7){frame(ctx,264,46,56,45,C.line);ctx.save();ctx.translate(262+60*a,48);ctx.rotate(-.4);ctx.fillStyle=C.orange;ctx.fillRect(-5,-50,10,58);ctx.fillStyle=C.support;ctx.beginPath();ctx.moveTo(-5,8);ctx.lineTo(0,18);ctx.lineTo(5,8);ctx.fill();ctx.restore();}
 else if(scene===8){ctx.fillStyle=C.dark;ctx.beginPath();ctx.roundRect(128,35,85,68,8);ctx.fill();lens(ctx,94+44*a,69,a*.3);}
 else if(scene===9){ctx.save();ctx.translate(256+45*a,58);ctx.strokeStyle=C.blue;ctx.lineWidth=5;ctx.beginPath();ctx.arc(0,0,27,0,Math.PI*2);ctx.moveTo(19,20);ctx.lineTo(44,45);ctx.stroke();ctx.restore();}
 else{ctx.save();ctx.translate(120,52-17*a);ctx.rotate(-.06*a);photo(ctx,0,0,85,58);hand(ctx,50,49);ctx.restore();}
 }}/>;}
export function SharedKit(){return null;}
