import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';

export const colors = { bg:'#f5f8f0', blue:'#27446e', green:'#228d5c', red:'#c43f52', orange:'#f07e47', purple:'#7c3aed', text:'#21324a', muted:'#68778f', axis:'#d7deea' };
export function frame(ctx:CanvasRenderingContext2D,w:number,h:number){
  ctx.clearRect(0,0,w,h); ctx.fillStyle=colors.bg; ctx.fillRect(0,0,w,h);
}
export function brush(ctx:CanvasRenderingContext2D,x:number,y:number,angle:number,color:string=colors.blue){
  ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.lineCap='round';
  ctx.strokeStyle='#92400e';ctx.lineWidth=11;ctx.beginPath();ctx.moveTo(0,-65);ctx.lineTo(0,-15);ctx.stroke();
  ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(-8,-16);ctx.quadraticCurveTo(-10,0,0,9);ctx.quadraticCurveTo(10,0,8,-16);ctx.closePath();ctx.fill();ctx.restore();
}
export function arrow(ctx:CanvasRenderingContext2D,x1:number,y1:number,x2:number,y2:number,color:string=colors.blue){
  const a=Math.atan2(y2-y1,x2-x1);ctx.save();ctx.strokeStyle=color;ctx.fillStyle=color;ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();
  ctx.beginPath();ctx.moveTo(x2,y2);ctx.lineTo(x2-12*Math.cos(a-.4),y2-12*Math.sin(a-.4));ctx.lineTo(x2-12*Math.cos(a+.4),y2-12*Math.sin(a+.4));ctx.closePath();ctx.fill();ctx.restore();
}
export const Scene:React.FC<{draw:(ctx:CanvasRenderingContext2D,w:number,h:number)=>void;height?:number}>=({draw,height=280})=>{
  const ref=useRef<HTMLCanvasElement>(null);
  useEffect(()=>{const canvas=ref.current;if(!canvas)return;const ctx=setupCanvas(canvas,1080,height);canvas.style.width='100%';canvas.style.height='auto';draw(ctx,1080,height);canvas.classList.add('is-ready');},[draw,height]);
  return <canvas ref={ref} width={1080} height={height} role="img" aria-label="随当前操作更新的教学图示" style={{width:'100%',height:'auto'}}/>;
};

export const Calligraphy:React.FC<{action?:number;good?:boolean;small?:boolean}>=({action=0,good=true,small=true})=>{
 const ref=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{
  const canvas=ref.current;if(!canvas)return;const w=560,h=140,ctx=setupCanvas(canvas,w,h);canvas.style.width='100%';canvas.style.height='auto';
  let raf=0;const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const draw=(now:number)=>{
   const phase=reduced?.6:(now%3000)/3000;const p=.5-.5*Math.cos(2*Math.PI*phase);frame(ctx,w,h);
   ctx.fillStyle='#fffef7';ctx.strokeStyle='#b8c9a7';ctx.lineWidth=2;ctx.fillRect(90,18,380,110);ctx.strokeRect(90,18,380,110);
   ctx.strokeStyle='#b8c9a7';ctx.setLineDash([6,6]);ctx.beginPath();ctx.moveTo(125,100);ctx.bezierCurveTo(230,30,340,120,425,55);ctx.stroke();ctx.setLineDash([]);
   const color=good?colors.green:colors.red;const q=1-p;
   let x=q*q*q*125+3*q*q*p*230+3*q*p*p*340+p*p*p*425;
   let y=q*q*q*100+3*q*q*p*30+3*q*p*p*120+p*p*p*55,a=.45;
   const mode=action%10;
   if(mode===1){x=130+260*p;y=110;a=-.3;}
   if(mode===2){x=310;y=85;a=-.7+1.4*p;}
   if(mode===3){x=270;y=70+20*p;a=.3;}
   if(mode===4){x=190+150*p;y=105-55*p;a=.4;}
   if(mode===5){x=200+150*p;y=70;a=Math.PI/2;}
   if(mode===6){x=280+45*Math.sin(p*Math.PI);y=85;a=-.8+.8*p;}
   if(mode===7){x=160+210*p;y=100-45*p*p;}
   if(mode===8){x=230+120*p;y=75;a=-.3;}
   if(mode===9){x=350;y=90-35*p;a=.3+p*.4;}
   if(!good){y+=25*p;}
   ctx.strokeStyle=color;ctx.lineWidth=mode===3?3+7*p:5;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(125,100);
   if(mode===0){for(let j=1;j<=50;j++){const t=p*j/50,u=1-t;ctx.lineTo(u*u*u*125+3*u*u*t*230+3*u*t*t*340+t*t*t*425,u*u*u*100+3*u*u*t*30+3*u*t*t*120+t*t*t*55+(good?0:25*t));}}
   else {ctx.quadraticCurveTo(230,40,x,y);}ctx.stroke();
   ctx.strokeStyle=colors.orange;ctx.lineWidth=2;ctx.beginPath();ctx.arc(420,60,7,0,2*Math.PI);ctx.stroke();brush(ctx,x,y,a,color);canvas.classList.add('is-ready');
  };
  const tick=(now:number)=>{draw(now);if(!reduced)raf=requestAnimationFrame(tick);};
  const stop=()=>{if(raf)cancelAnimationFrame(raf);raf=0;};const start=()=>{if(!raf)raf=requestAnimationFrame(tick);};draw(1800);
  const disconnect=observeCanvas(canvas,start,stop);return()=>{stop();disconnect();};
 },[action,good,small]);
 return <canvas ref={ref} width={560} height={140} aria-label="练字类比：一支毛笔完成一个动作" style={{width:'100%',height:'auto'}}/>;
};
