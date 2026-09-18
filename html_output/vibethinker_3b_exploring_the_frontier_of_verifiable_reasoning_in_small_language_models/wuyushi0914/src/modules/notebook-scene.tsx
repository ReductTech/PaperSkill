import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

export const C={bg:'#f5f8f0',light:'#b8c9a7',dark:'#76906a',wood:'#92400e',blue:'#27446e',green:'#228d5c',red:'#c43f52',orange:'#f07e47',purple:'#7c3aed',ink:'#21324a',muted:'#68778f',line:'#d7deea'};
type Ctx=CanvasRenderingContext2D;
export function rect(c:Ctx,x:number,y:number,w:number,h:number,color:string,r=7){c.fillStyle=color;c.beginPath();c.roundRect(x,y,w,h,r);c.fill();}
export function line(c:Ctx,points:number[][],color=C.blue,width=3){c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();}
export function circle(c:Ctx,x:number,y:number,r:number,color:string){c.fillStyle=color;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();}
export function label(c:Ctx,s:string,x:number,y:number,size=20,color=C.ink){c.fillStyle=color;c.font=`600 ${size}px "Segoe UI", "Microsoft YaHei", sans-serif`;c.fillText(s,x,y);}
export function target(c:Ctx,x:number,y:number,ok=true,scale=1){c.save();c.translate(x,y);c.scale(scale,scale);circle(c,0,0,16,ok?'#e1f1e8':'#f9e5e8');line(c,ok?[[-8,0],[-2,6],[9,-7]]:[[-6,-6],[6,6]],ok?C.green:C.red,3);if(!ok)line(c,[[-6,6],[6,-6]],C.red,3);c.restore();}
export function notebook(c:Ctx,x:number,y:number,w:number,h:number){rect(c,x+5,y+6,w,h,C.light);rect(c,x,y,w,h,'#fff');line(c,[[x+22,y+5],[x+22,y+h-5]],'#e9bec4',1);for(let yy=y+22;yy<y+h-6;yy+=17)line(c,[[x+30,yy],[x+w-12,yy]],C.line,1);for(let yy=y+12;yy<y+h-5;yy+=18){circle(c,x+7,yy,2,C.dark);}}
export function pencil(c:Ctx,x:number,y:number,angle=-.5,color=C.orange){c.save();c.translate(x,y);c.rotate(angle);rect(c,0,-6,52,12,color,2);rect(c,40,-6,12,12,C.blue,2);c.fillStyle='#dab58b';c.beginPath();c.moveTo(-12,0);c.lineTo(0,-6);c.lineTo(0,6);c.closePath();c.fill();circle(c,-11,0,1.7,C.ink);c.restore();}
export function paperView(c:Ctx,ok:boolean|null,progress=1){notebook(c,30,28,310,172);line(c,[[76,70],[125,64],[160,84],[210,66],[265,77]].slice(0,Math.max(2,Math.round(5*progress))),ok===false?C.red:C.blue,4);pencil(c,170+90*progress,102);if(ok!==null)target(c,293,163,ok,1.25);}
export function Canvas({draw,w=840,h=240,animate=false,label:alt='交互示意图',...events}:{draw:(c:Ctx,t:number)=>void;w?:number;h?:number;animate?:boolean;label?:string}&Omit<React.CanvasHTMLAttributes<HTMLCanvasElement>,'width'|'height'>){
 const el=useRef<HTMLCanvasElement>(null),fn=useRef(draw);fn.current=draw;
 useEffect(()=>{const canvas=el.current!;const c=setupCanvas(canvas,w,h);canvas.style.width='100%';canvas.style.height='auto';const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;let id=0,active=false,hover=false;
 const render=(t:number)=>{c.clearRect(0,0,w,h);rect(c,0,0,w,h,C.bg,0);fn.current(c,reduced?1500:t);canvas.classList.add('is-ready');};
 const tick=(t:number)=>{if(!hover)render(t);if(active&&animate&&!reduced)id=requestAnimationFrame(tick);};
 const start=()=>{if(active)return;active=true;render(performance.now());if(animate&&!reduced)id=requestAnimationFrame(tick);};const stop=()=>{active=false;cancelAnimationFrame(id);};
 const enter=()=>{hover=true;},leave=()=>{hover=false;};canvas.addEventListener('mouseenter',enter);canvas.addEventListener('mouseleave',leave);render(performance.now());const disconnect=observeCanvas(canvas,start,stop);return()=>{stop();disconnect();canvas.removeEventListener('mouseenter',enter);canvas.removeEventListener('mouseleave',leave);};},[w,h,animate]);
 useEffect(()=>{if(el.current&&!animate){const c=el.current.getContext('2d')!;c.clearRect(0,0,w,h);rect(c,0,0,w,h,C.bg,0);draw(c,performance.now());el.current.classList.add('is-ready');}});
 return <canvas ref={el} role="img" aria-label={alt} {...events}/>;
}
export function Chips({options,value,onChange}:{options:string[];value:number;onChange:(v:number)=>void}){return <div className="ctrl" style={{flexWrap:'wrap',gap:8}}>{options.map((o,i)=><button key={o} className={`chip ${value===i?'selected':''}`} aria-pressed={value===i} onClick={()=>onChange(i)}>{o}</button>)}</div>;}
export function Feedback({children,tone=''}:{children:React.ReactNode;tone?:string}){return <div className={`feedback ${tone}`} role="status" aria-live="polite">{children}</div>;}
export function Stats({items}:{items:[string,string][]}){return <div style={{display:'flex',flexWrap:'wrap',gap:'12px 32px',margin:'12px 0'}}>{items.map(([k,v])=><div key={k}><span style={{color:C.muted}}>{k} </span><strong style={{color:C.blue,fontVariantNumeric:'tabular-nums'}}>{v}</strong></div>)}</div>;}
export function Table({headers,rows}:{headers:string[];rows:(string|number)[][]}){return <div style={{overflowX:'auto',marginTop:18}}><table style={{borderCollapse:'collapse',width:'100%',textAlign:'left'}}><thead><tr>{headers.map(x=><th key={x} style={{padding:10,borderBottom:`2px solid ${C.line}`,whiteSpace:'nowrap'}}>{x}</th>)}</tr></thead><tbody>{rows.map((r,i)=><tr key={i}>{r.map((v,j)=><td key={j} style={{padding:10,borderBottom:`1px solid ${C.line}`,fontVariantNumeric:'tabular-nums'}}>{v}</td>)}</tr>)}</tbody></table></div>;}

export function NotebookScene({chapterId,moduleId}:WidgetProps){const n=Number(chapterId?.split('-')[1]||0);const old=moduleId==='old';return <Canvas w={560} h={140} animate label={`${n||'封面'}：解题练习本类比动画`} draw={(c,t)=>{
 const p=(Math.sin(t/1100)+1)/2;notebook(c,115,15,330,108);
 if(n===2||n===7){line(c,[[164,61],[385,61]],C.red,3);rect(c,164+150*p,49,58,25,'#e4bdd2');rect(c,171+150*p,49,31,25,'#f5dbe5');if(n===7)target(c,411,94);}
 else if(n===6){rect(c,160,42,232,10,C.light,2);circle(c,190+160*p,58,28,'rgba(255,255,255,.8)');c.strokeStyle=C.blue;c.lineWidth=5;c.beginPath();c.arc(190+160*p,58,28,0,Math.PI*2);c.stroke();line(c,[[210+160*p,79],[235+160*p,108]],C.wood,9);}
 else if(n===5){rect(c,151,26,80+220*p,84,'#fff');line(c,[[154,40],[224+200*p,40]],C.blue);rect(c,220+200*p,67,30,22,'#d8b391',9);}
 else if(n===8){rect(c,140+65*p,26,190,79,'#fff');line(c,[[159+65*p,52],[289+65*p,52]],C.blue);rect(c,294+65*p,51,37,27,'#d8b391',10);}
 else if(n===9){rect(c,162,51,230*p,14,'#fce8c0',2);pencil(c,176+230*p,60,0,C.orange);}
 else if(n===10){const yy=56+20*p;rect(c,276,yy-21,26,18,C.wood);rect(c,261,yy-5,55,21,C.blue);if(p>.65)target(c,291,105);}
 else if(n===4){line(c,[[166,85],[400,85]],C.wood,2);for(let i=0;i<9;i++)line(c,[[166+i*29,81],[166+i*29,90]],C.dark,1);pencil(c,177+225*p,78,Math.PI/3);}
 else {const yy=60+(n===3?17*Math.sin(t/700):0);if(!old){line(c,[[163,45],[230,38],[303,49],[391,44]],C.light,2);line(c,[[163,85],[236,94],[305,81],[390,88]],C.light,2);}line(c,[[164,yy],[221,yy-9],[275,yy+10],[385,yy]],old?C.red:C.blue,3);pencil(c,180+210*p,yy);target(c,414,93,!old);}
 }}/>;}
