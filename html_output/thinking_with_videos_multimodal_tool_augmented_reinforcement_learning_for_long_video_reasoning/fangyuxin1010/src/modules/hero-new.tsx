import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';

export const C = { bg:'#f5f8f0', light:'#b8c9a7', dark:'#76906a', support:'#92400e', blue:'#27446e', green:'#228d5c', red:'#c43f52', orange:'#f07e47', purple:'#7c3aed', ink:'#21324a', border:'#d7deea' };
type CanvasProps = Omit<React.CanvasHTMLAttributes<HTMLCanvasElement>, 'width'|'height'> & { draw:(ctx:CanvasRenderingContext2D,t:number)=>void; width?:number;height?:number;animate?:boolean;label?:string };
export function CanvasView({draw,width=1080,height=280,animate=false,label:ariaLabel='交互示意图',style,...props}:CanvasProps){
 const ref=useRef<HTMLCanvasElement>(null),ctxRef=useRef<CanvasRenderingContext2D|null>(null),drawRef=useRef(draw);
 drawRef.current=draw;
 useEffect(()=>{
  const canvas=ref.current;if(!canvas)return;
  const ctx=setupCanvas(canvas,width,height);ctxRef.current=ctx;canvas.style.width='100%';canvas.style.height='auto';
  let frame=0,active=false;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const paint=(time:number)=>{ctx.save();drawRef.current(ctx,time);ctx.restore();canvas.classList.add('is-ready');};
  const tick=(time:number)=>{paint(time);if(active)frame=requestAnimationFrame(tick);};
  const start=()=>{if(active||!animate||reduced)return;active=true;frame=requestAnimationFrame(tick);};
  const stop=()=>{active=false;cancelAnimationFrame(frame);};
  paint(reduced?1800:performance.now());
  const disconnect=observeCanvas(canvas,start,stop);
  return()=>{stop();disconnect();ctxRef.current=null;};
 },[width,height,animate]);
 useEffect(()=>{const ctx=ctxRef.current;if(ctx){ctx.save();draw(ctx,performance.now());ctx.restore();}},[draw]);
 return <canvas ref={ref} role="img" aria-label={ariaLabel} {...props} style={{display:'block',width:'100%',height:'auto',aspectRatio:`${width}/${height}`,borderRadius:12,touchAction:'pan-y',...style}}/>;
}
export function clearScene(ctx:CanvasRenderingContext2D,w=1080,h=280){ctx.clearRect(0,0,w,h);ctx.fillStyle=C.bg;ctx.fillRect(0,0,w,h);ctx.lineWidth=2;ctx.lineCap='round';ctx.lineJoin='round';}
function box(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,r:number,fill:string,stroke?:string){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.stroke();}}
export function label(ctx:CanvasRenderingContext2D,text:string,x:number,y:number,color:string=C.ink,size=18){ctx.fillStyle=color;ctx.font=`600 ${size}px system-ui, sans-serif`;ctx.textAlign='left';ctx.fillText(text,x,y);}
export function drawDesk(ctx:CanvasRenderingContext2D,w:number,h:number){clearScene(ctx,w,h);ctx.fillStyle=C.light;ctx.fillRect(0,h*.84,w,h*.16);ctx.strokeStyle=C.dark;ctx.beginPath();ctx.moveTo(0,h*.84);ctx.lineTo(w,h*.84);ctx.stroke();}
export function drawKey(ctx:CanvasRenderingContext2D,x:number,y:number,size=1,color:string=C.support){ctx.save();ctx.translate(x,y);ctx.scale(size,size);ctx.strokeStyle=color;ctx.lineWidth=5;ctx.beginPath();ctx.arc(0,0,11,0,Math.PI*2);ctx.moveTo(11,0);ctx.lineTo(42,0);ctx.moveTo(29,0);ctx.lineTo(29,9);ctx.moveTo(39,0);ctx.lineTo(39,7);ctx.stroke();ctx.restore();}
export function drawPlayer(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,keyVisible:boolean,activeColor:string=C.blue){
 box(ctx,x,y,w,h,12,'#fff',C.border);box(ctx,x+10,y+10,w-20,h-35,7,C.light);
 ctx.fillStyle=C.dark;ctx.fillRect(x+10,y+h*.62,w-20,Math.max(5,h*.12));
 if(keyVisible)drawKey(ctx,x+w*.45,y+h*.56,Math.min(w/260,h/110),activeColor);
 ctx.fillStyle=activeColor;ctx.beginPath();ctx.moveTo(x+17,y+h-18);ctx.lineTo(x+17,y+h-8);ctx.lineTo(x+26,y+h-13);ctx.closePath();ctx.fill();
 ctx.strokeStyle=C.border;ctx.beginPath();ctx.moveTo(x+38,y+h-13);ctx.lineTo(x+w-16,y+h-13);ctx.stroke();
}
export function drawRemote(ctx:CanvasRenderingContext2D,x:number,y:number,angle=0,activeColor:string=C.blue){ctx.save();ctx.translate(x,y);ctx.rotate(angle);box(ctx,-25,-44,50,88,11,'#fff',C.dark);ctx.fillStyle=activeColor;ctx.beginPath();ctx.arc(0,-18,10,0,Math.PI*2);ctx.fill();for(let i=0;i<3;i++)box(ctx,-13+i*10,7,6,15,2,C.light);ctx.restore();}
export function drawRuler(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,color:string=C.orange){box(ctx,x,y,w,27,4,'#fff',color);ctx.strokeStyle=color;for(let i=0;i<=10;i++){ctx.beginPath();ctx.moveTo(x+8+(w-16)*i/10,y+2);ctx.lineTo(x+8+(w-16)*i/10,y+(i%5===0?18:10));ctx.stroke();}}
export function drawTarget(ctx:CanvasRenderingContext2D,x:number,y:number,color:string=C.green){ctx.strokeStyle=color;ctx.lineWidth=3;ctx.beginPath();ctx.arc(x,y,12,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(x-5,y);ctx.lineTo(x-1,y+5);ctx.lineTo(x+6,y-5);ctx.stroke();}
export function Feedback({children,tone='blue'}:{children:React.ReactNode;tone?:string}){const color=C[tone as keyof typeof C]||tone;return <div className="feedback" aria-live="polite" style={{minHeight:56,borderLeft:`4px solid ${color}`,color:C.ink,background:`${color}0c`,padding:'12px 16px',marginTop:14,borderRadius:8,fontSize:16,lineHeight:1.6}}>{children}</div>;}
export function Controls({children}:{children:React.ReactNode}){return <div onKeyDown={e=>{if(e.key.startsWith('Arrow'))e.stopPropagation();}} style={{display:'flex',alignItems:'center',justifyContent:'center',gap:10,flexWrap:'wrap',marginTop:14,minHeight:42}}>{children}</div>;}
function finger(ctx:CanvasRenderingContext2D,x:number,y:number){ctx.save();ctx.translate(x,y);box(ctx,-10,-23,20,50,9,'#e8c6a6',C.support);box(ctx,-10,0,43,26,10,'#e8c6a6');ctx.restore();}
function drawAnalogy(ctx:CanvasRenderingContext2D,index:number,time:number){
 drawDesk(ctx,560,140);const reduced=typeof window!=='undefined'&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 const phase=reduced?.65:(time%3000)/3000, wave=Math.sin(phase*Math.PI*2),swing=(1-Math.cos(phase*Math.PI*2))/2;
 if(index===1){drawPlayer(ctx,70,21,210,95,true);drawRemote(ctx,373,74,Math.PI/2);finger(ctx,390,38+swing*14);}
 if(index===2){drawPlayer(ctx,92,15,376,108,true);ctx.fillStyle=C.orange;ctx.beginPath();ctx.arc(130+phase*290,110,7,0,Math.PI*2);ctx.fill();}
 if(index===3){drawPlayer(ctx,95,13,350,106,true);const x=258+wave*33,y=62;ctx.save();ctx.translate(x,y);ctx.strokeStyle=C.blue;ctx.lineWidth=5;ctx.beginPath();ctx.arc(0,0,26,0,Math.PI*2);ctx.moveTo(18,20);ctx.lineTo(43,47);ctx.stroke();ctx.restore();}
 if(index===4){drawPlayer(ctx,95,10,350,86,true);drawRuler(ctx,200+wave*36,98,140);}
 if(index===5){drawRemote(ctx,290,75,Math.PI/2,C.green);finger(ctx,272+swing*20,36);}
 if(index===6){drawPlayer(ctx,60,16,230,100,true);drawRemote(ctx,400,74,Math.PI/2,C.red);finger(ctx,397,42+swing*8);}
 if(index===7){box(ctx,180,76,200,44,5,'#fff',C.border);ctx.strokeStyle=C.green;ctx.strokeRect(269,90,45,18);const y=45+swing*32;box(ctx,269,y,45,18,4,C.green);box(ctx,282,y-29,20,34,5,C.support);}
 if(index===8){drawRemote(ctx,280,73,wave*.32);}
 if(index===9){box(ctx,157,18,244,99,7,'#fff',C.border);ctx.strokeStyle=C.green;for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(185,45+i*23);ctx.lineTo(345,45+i*23);ctx.stroke();}drawRuler(ctx,210+wave*35,73,147);}
 if(index===10){ctx.save();ctx.translate(280,80-swing*26);ctx.rotate(wave*.025);box(ctx,-95,-36,190,75,8,'#fff',C.dark);ctx.fillStyle=C.green;ctx.fillRect(-66,-17,110,12);ctx.fillStyle=C.blue;ctx.fillRect(-66,7,86,12);drawTarget(ctx,65,0);ctx.restore();}
}
export function Analogy({index}:{index:number}){return <CanvasView width={560} height={140} animate label={`录像回看类比，第${index}章`} draw={(ctx,t)=>drawAnalogy(ctx,index,t)}/>;}
function HeroScene({modern}:{modern:boolean}){return <CanvasView width={560} height={200} animate label={modern?'按需回看补充关键画面':'稀疏观察遗漏关键动作'} draw={(ctx,t)=>{drawDesk(ctx,560,200);drawPlayer(ctx,65,12,430,160,modern,modern?C.green:C.red);const p=(t%3000)/3000;ctx.strokeStyle=C.border;ctx.beginPath();ctx.moveTo(98,151);ctx.lineTo(465,151);ctx.stroke();if(modern){ctx.fillStyle='#228d5c22';ctx.fillRect(230,137,74,28);}ctx.fillStyle=modern?C.green:C.red;ctx.beginPath();ctx.arc(modern?230+74*p:98+367*p,151,6,0,Math.PI*2);ctx.fill();}}/>;}
export function HeroOld(){return <HeroScene modern={false}/>;}
export function HeroNew(){return <HeroScene modern/>;}
