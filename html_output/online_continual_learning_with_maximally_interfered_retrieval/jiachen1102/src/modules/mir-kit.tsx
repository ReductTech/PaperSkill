import React,{useEffect,useRef,type DependencyList} from 'react';
import {setupCanvas,observeCanvas} from '../lib/canvasKit';
export const C={bg:'#f5f8f0',env:'#b8c9a7',leaf:'#76906a',brown:'#92400e',blue:'#27446e',green:'#228d5c',red:'#c43f52',orange:'#f07e47',purple:'#7c3aed',ink:'#21324a',muted:'#68778f',axis:'#d7deea'};
export function useCanvas(draw:(ctx:CanvasRenderingContext2D,w:number,h:number,time:number)=>void,deps:DependencyList=[],options:{width?:number;height?:number;animate?:boolean}={}){
 const ref=useRef<HTMLCanvasElement>(null), fn=useRef(draw);fn.current=draw;const w=options.width??1080,h=options.height??280,animate=options.animate??false;
 useEffect(()=>{const c=ref.current;if(!c)return;let ctx=setupCanvas(c,w,h),frame=0,on=false,dead=false;const motion=matchMedia('(prefers-reduced-motion: reduce)');
 const paint=(t:number)=>{ctx.clearRect(0,0,w,h);ctx.fillStyle=C.bg;ctx.fillRect(0,0,w,h);fn.current(ctx,w,h,t);c.classList.add('is-ready');};c.style.width='100%';c.style.height='auto';
 const loop=(t:number)=>{frame=0;if(!on||dead)return;paint(t);if(animate&&!motion.matches)frame=requestAnimationFrame(loop);};
 const stop=()=>{on=false;cancelAnimationFrame(frame);frame=0;};const start=()=>{on=true;paint(0);if(animate&&!motion.matches&&!frame)frame=requestAnimationFrame(loop);};
 const resize=()=>{ctx=setupCanvas(c,w,h);c.style.width='100%';c.style.height='auto';paint(0);};const changed=()=>{stop();start();};
 paint(0);const disconnect=observeCanvas(c,start,stop);window.addEventListener('resize',resize);motion.addEventListener('change',changed);
 return()=>{dead=true;stop();disconnect();window.removeEventListener('resize',resize);motion.removeEventListener('change',changed);};
 },[w,h,animate,...deps]);return ref;
}
export function roundRect(c:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,r:number,fill:string,stroke?:string){c.beginPath();c.roundRect(x,y,w,h,r);c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=2;c.stroke();}}
export function arrow(c:CanvasRenderingContext2D,x:number,y:number,xx:number,yy:number,color:string=C.muted){const a=Math.atan2(yy-y,xx-x);c.beginPath();c.moveTo(x,y);c.lineTo(xx,yy);c.lineWidth=2.5;c.strokeStyle=color;c.stroke();c.beginPath();c.moveTo(xx,yy);c.lineTo(xx-10*Math.cos(a-.4),yy-10*Math.sin(a-.4));c.lineTo(xx-10*Math.cos(a+.4),yy-10*Math.sin(a+.4));c.closePath();c.fillStyle=color;c.fill();}
export function bars(c:CanvasRenderingContext2D,v:number[],x:number,y:number,w:number,h:number,color:string=C.blue,max=1){const neg=v.some(x=>x<0),base=neg?y+h/2:y+h,span=neg?h/2:h,bw=w/Math.max(1,v.length);c.strokeStyle=C.axis;c.beginPath();c.moveTo(x,base);c.lineTo(x+w,base);c.stroke();v.forEach((a,i)=>{const bh=Math.min(1,Math.abs(a)/Math.max(1e-9,max))*span;roundRect(c,x+bw*(i+.15),a>=0?base-bh:base,bw*.7,Math.max(.5,bh),3,color);});}
export function softmax(a:number[],temperature=1){const m=Math.max(...a),e=a.map(x=>Math.exp((x-m)/temperature)),s=e.reduce((a,b)=>a+b,0);return e.map(x=>x/s);}
export function ce(a:number[],y:number){const m=Math.max(...a);return m+Math.log(a.reduce((s,x)=>s+Math.exp(x-m),0))-a[y];}
export function mse(a:number[],b:number[],mean=true){const s=a.reduce((s,x,i)=>s+(x-b[i])**2,0);return mean?s/a.length:s;}
export function normCenter(a:number[]){const m=a.reduce((s,x)=>s+x,0)/a.length;return a.map(x=>x-m);}
export function drawInstrument(c:CanvasRenderingContext2D,x:number,y:number,scale=1,tensions:number[]=[0,0,0]){
 c.save();c.translate(x,y);c.scale(scale,scale);c.beginPath();c.ellipse(-72,0,66,43,0,0,2*Math.PI);c.fillStyle=C.env;c.fill();c.strokeStyle=C.brown;c.lineWidth=2;c.stroke();roundRect(c,-55,-14,180,28,5,C.env,C.brown);roundRect(c,120,-27,53,54,7,C.env,C.brown);c.beginPath();c.arc(-72,0,21,0,2*Math.PI);c.fillStyle=C.brown;c.fill();roundRect(c,-113,-25,8,50,2,C.leaf);
 for(let i=0;i<3;i++){const yy=(i-1)*10,t=tensions[i]??0;c.beginPath();c.moveTo(-110,yy);c.quadraticCurveTo(0,yy+t*24,146,yy);c.strokeStyle=t>.6?C.red:C.blue;c.lineWidth=2;c.stroke();c.beginPath();c.arc(147,yy,4,0,2*Math.PI);c.fillStyle=C.orange;c.fill();}c.restore();
}
export function drawNote(c:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,value=0,color:string=C.blue){roundRect(c,x,y,w,h,5,C.bg,C.env);c.strokeStyle=C.env;c.lineWidth=1;for(let i=0;i<5;i++){c.beginPath();c.moveTo(x+w*.12,y+h*(.25+i*.1));c.lineTo(x+w*.88,y+h*(.25+i*.1));c.stroke();}const nx=x+w*.42,ny=y+h*(.6-Math.max(-1,Math.min(1,value))*.15);c.beginPath();c.ellipse(nx,ny,w*.1,h*.07,-.25,0,2*Math.PI);c.fillStyle=color;c.fill();c.beginPath();c.moveTo(nx+w*.085,ny);c.lineTo(nx+w*.085,ny-h*.34);c.strokeStyle=color;c.lineWidth=2;c.stroke();}
export function Feedback({children,tone='blue'}:{children:React.ReactNode;tone?:'blue'|'green'|'red'|'purple'}){return <div role="status" aria-live="polite" className={'mir-feedback mir-feedback-'+tone}>{children}</div>;}
export function Source({children,href='https://proceedings.neurips.cc/paper/2019/hash/15825aee15eb335cc13f9b559f166ee8-Abstract.html'}:{children:React.ReactNode;href?:string}){return <p className="mir-source"><a href={href} target="_blank" rel="noopener noreferrer">{children} ↗</a></p>;}
export function MathBlock({title,children}:{title?:string;children:React.ReactNode}){return <div className="mir-math">{title&&<strong>{title}</strong>}<div>{children}</div></div>;}
