import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';

export const C = { bg:'#f5f8f0', light:'#b8c9a7', dark:'#76906a', support:'#92400e', blue:'#27446e', green:'#228d5c', red:'#c43f52', orange:'#f07e47', purple:'#7c3aed', ink:'#21324a', muted:'#68778f', line:'#d7deea' };
export function clearScene(c:CanvasRenderingContext2D,w:number,h:number){c.clearRect(0,0,w,h);c.fillStyle=C.bg;c.fillRect(0,0,w,h);}
export function line(c:CanvasRenderingContext2D,x1:number,y1:number,x2:number,y2:number,color:string=C.line,width=2){c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();}
export function pill(c:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,color:string=C.blue){c.fillStyle=color;c.beginPath();c.roundRect(x,y,w,h,Math.min(h/3,12));c.fill();}
export function drawTarget(c:CanvasRenderingContext2D,x:number,y:number,r=14,color:string=C.green){c.strokeStyle=color;c.lineWidth=3;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.stroke();c.beginPath();c.moveTo(x-r/2,y);c.lineTo(x-1,y+r/3);c.lineTo(x+r/2,y-r/3);c.stroke();}
export function drawBird(c:CanvasRenderingContext2D,x:number,y:number,size:number){
 c.save();c.translate(x,y);c.scale(size/224,size/224);
 c.fillStyle='#e6eddd';c.fillRect(0,0,224,224);
 c.fillStyle='#d2deca';c.beginPath();c.ellipse(194,45,63,35,-.8,0,Math.PI*2);c.fill();c.beginPath();c.ellipse(25,90,55,26,-.4,0,Math.PI*2);c.fill();
 line(c,5,196,225,157,C.support,8);line(c,130,170,120,182,C.support,3);line(c,147,169,145,178,C.support,3);
 c.fillStyle=C.dark;c.beginPath();c.ellipse(45,192,24,10,-.5,0,Math.PI*2);c.fill();
 c.fillStyle=C.blue;c.beginPath();c.moveTo(72,142);c.lineTo(24,172);c.lineTo(45,123);c.closePath();c.fill();
 c.fillStyle='#567c96';c.beginPath();c.ellipse(117,129,55,43,-.2,0,Math.PI*2);c.fill();
 c.fillStyle='#9a7855';c.beginPath();c.ellipse(100,133,34,21,-.43,0,Math.PI*2);c.fill();
 for(let k=0;k<4;k++)line(c,78+k*10,136,99+k*10,150,'#c4aa80',2);
 c.fillStyle=C.blue;c.beginPath();c.arc(157,88,29,0,Math.PI*2);c.fill();
 c.fillStyle='#f2efe2';c.beginPath();c.ellipse(164,105,15,10,-.5,0,Math.PI*2);c.fill();
 c.fillStyle=C.orange;c.beginPath();c.moveTo(182,88);c.lineTo(207,94);c.lineTo(181,101);c.closePath();c.fill();
 c.fillStyle='white';c.beginPath();c.arc(168,82,6,0,Math.PI*2);c.fill();c.fillStyle=C.ink;c.beginPath();c.arc(169,82,3,0,Math.PI*2);c.fill();c.restore();
}
export function drawPhoto(c:CanvasRenderingContext2D,x:number,y:number,size:number,grid=0){
 c.fillStyle='white';c.fillRect(x-8,y-8,size+16,size+16);drawBird(c,x,y,size);
 if(grid>0){const n=Math.min(grid,56);c.save();c.strokeStyle='rgba(39,68,110,.38)';c.lineWidth=1;for(let i=0;i<=n;i++){const p=size*i/n;c.beginPath();c.moveTo(x+p,y);c.lineTo(x+p,y+size);c.moveTo(x,y+p);c.lineTo(x+size,y+p);c.stroke();}c.restore();}
}
export function drawAlbum(c:CanvasRenderingContext2D,x:number,y:number,w:number,h:number){pill(c,x,y,w,h,'#e0e8d8');pill(c,x+7,y+5,w-14,h-12,'#fffefa');line(c,x+w/2,y+8,x+w/2,y+h-8,C.line,2);}
export function drawPointer(c:CanvasRenderingContext2D,x:number,y:number,color:string=C.orange){c.fillStyle=color;c.beginPath();c.moveTo(x,y);c.lineTo(x+24,y+13);c.lineTo(x+13,y+17);c.lineTo(x+9,y+30);c.closePath();c.fill();}
export interface StageProps {render:(c:CanvasRenderingContext2D,w:number,h:number,time:number)=>void;width?:number;height?:number;animate?:boolean;label?:string;onPointerDown?:React.PointerEventHandler<HTMLCanvasElement>;onPointerMove?:React.PointerEventHandler<HTMLCanvasElement>;onPointerUp?:React.PointerEventHandler<HTMLCanvasElement>;onClick?:React.MouseEventHandler<HTMLCanvasElement>;style?:React.CSSProperties;}
export function Stage({render,width=1080,height=280,animate=false,label='交互概念图',style,...events}:StageProps){
 const ref=useRef<HTMLCanvasElement>(null), fn=useRef(render);fn.current=render;
 useEffect(()=>{const el=ref.current;if(!el)return;const c=setupCanvas(el,width,height);el.style.width='100%';el.style.maxWidth=width+'px';el.style.height='auto';let raf=0;let alive=true;const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 const draw=(time:number)=>{if(!alive)return;fn.current(c,width,height,time/1000);el.classList.add('is-ready');if(animate&&!reduced)raf=requestAnimationFrame(draw);};
 const stop=()=>{cancelAnimationFrame(raf);raf=0;};const start=()=>{stop();draw(performance.now());};start();const disconnect=observeCanvas(el,start,stop);return()=>{alive=false;stop();disconnect();};},[width,height,animate]);
 useEffect(()=>{const el=ref.current;if(!el)return;const c=el.getContext('2d');if(c){fn.current(c,width,height,performance.now()/1000);el.classList.add('is-ready');}},[render,width,height]);
 return <canvas ref={ref} width={width} height={height} role="img" aria-label={label} {...events} style={{display:'block',width:'100%',maxWidth:width,height:'auto',touchAction:events.onPointerDown?'none':'auto',...style}}/>;
}
export function Chips<T extends string|number>({options,value,onChange,label}:{options:readonly {value:T,label:string}[];value:T;onChange:(v:T)=>void;label?:string}){return <div className="ctrl" role="group" aria-label={label||'选择模式'} style={{flexWrap:'wrap'}}>{options.map(o=><button type="button" key={o.value} aria-pressed={value===o.value} className={value===o.value?'tiny':'tiny ghost'} onClick={()=>onChange(o.value)}>{o.label}</button>)}</div>;}
export function Steps({step,max,onChange}:{step:number;max:number;onChange:(n:number)=>void}){return <div className="ctrl"><button className="tiny ghost" onClick={()=>onChange(step-1)} disabled={step===0}>上一步</button><strong className="val">{step+1} / {max+1}</strong><button className="tiny" onClick={()=>onChange(step+1)} disabled={step===max}>下一步</button><button className="tiny ghost" onClick={()=>onChange(0)}>重置</button></div>;}
export function Feedback({children,tone='blue'}:{children:React.ReactNode;tone?:'blue'|'green'|'red'|'orange'}){return <div className={`feedback ${tone==='green'?'good':tone==='red'?'bad':''}`} style={tone==='orange'?{borderLeftColor:C.orange}:undefined}>{children}</div>;}
export function Metric({children}:{children:React.ReactNode}){return <div style={{display:'flex',gap:24,flexWrap:'wrap',alignItems:'center',padding:'16px 0',color:C.ink,fontSize:20,fontWeight:650}}>{children}</div>;}
