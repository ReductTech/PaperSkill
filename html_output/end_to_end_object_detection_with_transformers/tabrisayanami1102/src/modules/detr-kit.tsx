import React,{useEffect,useRef} from 'react';
import {setupCanvas,observeCanvas} from '../lib/canvasKit';
export const C={bg:'#f5f8f0',light:'#b8c9a7',dark:'#76906a',support:'#92400e',blue:'#27446e',green:'#228d5c',red:'#c43f52',orange:'#f07e47',purple:'#7c3aed',ink:'#21324a',muted:'#68778f',border:'#d7deea'};
type Props=Omit<React.CanvasHTMLAttributes<HTMLCanvasElement>,'width'|'height'> & {draw:(ctx:CanvasRenderingContext2D,time:number)=>void;width?:number;height?:number;animate?:boolean;ariaLabel?:string};
export function Canvas({draw,width=1080,height=300,animate=false,ariaLabel='交互示意图',style,...rest}:Props){
 const ref=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{const el=ref.current!;const ctx=setupCanvas(el,width,height);el.style.width='100%';el.style.height='auto';let raf=0,running=false;
 const paint=(t:number)=>{ctx.clearRect(0,0,width,height);draw(ctx,t);el.classList.add('is-ready');};
 const frame=(t:number)=>{paint(t);if(running)raf=requestAnimationFrame(frame);};
 const start=()=>{if(running)return;running=true;if(animate&&!matchMedia('(prefers-reduced-motion: reduce)').matches)raf=requestAnimationFrame(frame);else paint(performance.now());};
 const stop=()=>{running=false;cancelAnimationFrame(raf);};paint(performance.now());const off=observeCanvas(el,start,stop);return()=>{stop();off();};},[draw,width,height,animate]);
 return <canvas ref={ref} role="img" aria-label={ariaLabel} style={{display:'block',width:'100%',height:'auto',borderRadius:12,touchAction:'pan-y',...style}} {...rest}/>;
}
export function clear(ctx:CanvasRenderingContext2D,w=1080,h=300){ctx.fillStyle=C.bg;ctx.fillRect(0,0,w,h);}
export function rect(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,color:string,fill=false,dashed=false){ctx.save();ctx.strokeStyle=color;ctx.fillStyle=color;ctx.lineWidth=Math.max(2,ctx.lineWidth);ctx.setLineDash(dashed?[7,5]:[]);if(fill)ctx.fillRect(x,y,w,h);else ctx.strokeRect(x,y,w,h);ctx.restore();}
export function text(ctx:CanvasRenderingContext2D,value:string|number,x:number,y:number,size=18,color:string=C.ink){ctx.fillStyle=color;ctx.font=`600 ${size}px system-ui`;ctx.fillText(String(value),x,y);}
export function line(ctx:CanvasRenderingContext2D,x1:number,y1:number,x2:number,y2:number,color:string,width=2){ctx.beginPath();ctx.strokeStyle=color;ctx.lineWidth=width;ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();}
export function person(ctx:CanvasRenderingContext2D,x:number,y:number,s=1,color:string=C.dark){ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.fillStyle=color;ctx.beginPath();ctx.arc(0,-95,15,0,Math.PI*2);ctx.fill();ctx.fillRect(-18,-75,36,44);line(ctx,-11,-32,-16,0,color,10);line(ctx,11,-32,16,0,color,10);line(ctx,-15,-65,-32,-35,color,8);line(ctx,15,-65,32,-35,color,8);ctx.restore();}
export function car(ctx:CanvasRenderingContext2D,x:number,y:number,s=1,color:string=C.dark){ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(-68,-12);ctx.lineTo(-60,-44);ctx.lineTo(-27,-50);ctx.lineTo(-10,-72);ctx.lineTo(36,-72);ctx.lineTo(58,-48);ctx.lineTo(72,-40);ctx.lineTo(72,-12);ctx.closePath();ctx.fill();ctx.fillStyle=C.bg;ctx.fillRect(-7,-63,35,22);ctx.fillStyle=C.ink;for(const xx of[-42,43]){ctx.beginPath();ctx.arc(xx,-10,13,0,Math.PI*2);ctx.fill();}ctx.restore();}
export type Box=[number,number,number,number];
export function street(ctx:CanvasRenderingContext2D,x=20,y=20,w=680,h=240){ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();ctx.fillStyle='#e9efdf';ctx.fillRect(x,y,w,h);ctx.fillStyle=C.light;ctx.fillRect(x,y+h*.13,w*.13,h*.45);ctx.fillRect(x+w*.82,y+h*.05,w*.15,h*.53);ctx.fillStyle='#dfe5d8';ctx.fillRect(x,y+h*.84,w,h*.16);line(ctx,x,y+h*.85,x+w,y+h*.85,C.dark,2);const s=h*.58/110;person(ctx,x+w*.22,y+h*.86,s);person(ctx,x+w*.48,y+h*.86,s,C.blue);car(ctx,x+w*.74,y+h*.85,w*.22/144);ctx.restore();return {people:[[.22,.57,.16,.58],[.48,.57,.16,.58]] as Box[],car:[.74,.72,.22,.25] as Box};}
function corners(b:Box){return[b[0]-b[2]/2,b[1]-b[3]/2,b[0]+b[2]/2,b[1]+b[3]/2];}
export function iou(a:Box,b:Box){const A=corners(a),B=corners(b);const intersection=Math.max(0,Math.min(A[2],B[2])-Math.max(A[0],B[0]))*Math.max(0,Math.min(A[3],B[3])-Math.max(A[1],B[1]));const u=a[2]*a[3]+b[2]*b[3]-intersection;return u>0?Math.max(0,Math.min(1,intersection/u)):0;}
export function Album({mode,hero=false}:{mode:number;hero?:boolean}){return <Canvas width={560} height={hero?200:140} animate draw={(ctx,time)=>{
 const H=hero?200:140;clear(ctx,560,H);const t=(time%3200)/3200,phase=(1-Math.cos(t*2*Math.PI))/2;street(ctx,70,15,420,H-30);const px=162+phase*26,py=35+phase*18;ctx.save();ctx.lineWidth=3;
 if(mode===0||mode===11||mode===12){const centers=[162,272,381];centers.forEach((x,i)=>rect(ctx,x-25,i===2?H*.60:30,i===2?80:45,i===2?35:H*.58,mode===11?C.blue:C.green));if(mode===11)rect(ctx,146,33,48,H*.58,C.red);ctx.translate(px,py);ctx.rotate(-.5);rect(ctx,0,0,8,55,C.support,true);ctx.beginPath();ctx.fillStyle=C.ink;ctx.moveTo(0,55);ctx.lineTo(8,55);ctx.lineTo(4,67);ctx.fill();}
 else if(mode===1){ctx.strokeStyle=C.support;ctx.lineWidth=6;ctx.beginPath();ctx.arc(px+90,66,34,0,Math.PI*2);ctx.stroke();line(ctx,px+113,91,px+143,120,C.support,9);}
 else if(mode===2){ctx.translate(120+phase*120,26);ctx.rotate((phase-.5)*.08);rect(ctx,0,0,96,78,C.blue,true);rect(ctx,6,6,84,65,C.bg,true);person(ctx,48,65,.42,C.dark);}
 else if(mode===3){ctx.globalAlpha=.85;rect(ctx,140+phase*60,28,80,87,C.orange);}
 else if(mode===4){ctx.translate(210+phase*48,61);rect(ctx,-37,-23,74,47,C.blue,true);rect(ctx,-23,-35,24,13,C.blue,true);ctx.fillStyle=C.bg;ctx.beginPath();ctx.arc(5,0,17,0,Math.PI*2);ctx.fill();ctx.fillStyle=C.ink;ctx.beginPath();ctx.arc(5,0,11,0,Math.PI*2);ctx.fill();}
 else if(mode===5){rect(ctx,235,30+phase*31,44,20,C.support,true);rect(ctx,247,10+phase*31,20,25,C.support,true);rect(ctx,229,53+phase*31,56,10,C.blue,true);}
 else if(mode===6){ctx.translate(170+phase*65,55);ctx.rotate(-.2);rect(ctx,0,0,34,20,C.orange,true);rect(ctx,0,0,12,20,C.bg,true);}
 else if(mode===7){ctx.fillStyle='#fff';ctx.beginPath();ctx.moveTo(282,15);ctx.quadraticCurveTo(282-phase*120,70,282,125);ctx.lineTo(495,125);ctx.lineTo(495,15);ctx.closePath();ctx.fill();line(ctx,282,15,282,125,C.border,2);}
 else if(mode===8){rect(ctx,190+phase*95,22,95,100,C.support,true);}
 else {ctx.globalAlpha=.5;rect(ctx,145+phase*30,24,117,98,C.blue);ctx.globalAlpha=1;rect(ctx,175,24,117,98,C.green);}
 ctx.restore();}}/>;}
export function giou(a:Box,b:Box){const A=corners(a),B=corners(b),inter=Math.max(0,Math.min(A[2],B[2])-Math.max(A[0],B[0]))*Math.max(0,Math.min(A[3],B[3])-Math.max(A[1],B[1]));const u=a[2]*a[3]+b[2]*b[3]-inter;const enclosing=(Math.max(A[2],B[2])-Math.min(A[0],B[0]))*(Math.max(A[3],B[3])-Math.min(A[1],B[1]));return iou(a,b)-(enclosing>0?(enclosing-u)/enclosing:0);}
export function l1(a:Box,b:Box){return a.reduce((sum,v,i)=>sum+Math.abs(v-b[i]),0);}
export function softmax(z:number[]){const maximum=Math.max(...z),ex=z.map(v=>Math.exp(v-maximum)),sum=ex.reduce((a,b)=>a+b,0);return ex.map(v=>v/sum);}
export function Kit(){return <Canvas width={560} height={140} draw={ctx=>{clear(ctx,560,140);street(ctx,30,10,500,120);}}/>;}
