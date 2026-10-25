import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
export const C={bg:'#f5f8f0',light:'#b8c9a7',dark:'#76906a',support:'#92400e',blue:'#27446e',green:'#228d5c',red:'#c43f52',orange:'#f07e47',purple:'#7c3aed',text:'#21324a',muted:'#68778f',axis:'#d7deea'};
type CanvasEvents=Pick<React.CanvasHTMLAttributes<HTMLCanvasElement>,'onPointerDown'|'onPointerMove'|'onPointerUp'|'onPointerCancel'|'onPointerLeave'|'onKeyDown'|'tabIndex'>;
type SceneProps=CanvasEvents & {draw:(ctx:CanvasRenderingContext2D,w:number,h:number,time:number)=>void;height?:number;width?:number;animate?:boolean;label:string};
export function Scene({draw,height=280,width=1080,animate=false,label,...events}:SceneProps){
 const ref=useRef<HTMLCanvasElement>(null), latest=useRef(draw), redraw=useRef<()=>void>(()=>{}); latest.current=draw;
 useEffect(()=>{const canvas=ref.current;if(!canvas)return;const ctx=setupCanvas(canvas,width,height);canvas.style.width='100%';canvas.style.height='auto';
 let frame=0,visible=true;const reduce=window.matchMedia('(prefers-reduced-motion: reduce)');
 const render=(t:number)=>{ctx.clearRect(0,0,width,height);ctx.fillStyle=C.bg;ctx.fillRect(0,0,width,height);ctx.save();latest.current(ctx,width,height,t);ctx.restore();canvas.classList.add('is-ready');};
 const stop=()=>{if(frame)cancelAnimationFrame(frame);frame=0;};
 const tick=(t:number)=>{render(t);frame=animate&&visible&&!reduce.matches?requestAnimationFrame(tick):0;};
 const start=()=>{visible=true;render(reduce.matches?2400:performance.now());if(animate&&!reduce.matches&&!frame)frame=requestAnimationFrame(tick);};
 const off=observeCanvas(canvas,start,()=>{visible=false;stop();});redraw.current=()=>render(reduce.matches?2400:performance.now());
 const change=()=>{stop();if(visible)start();};reduce.addEventListener('change',change);render(reduce.matches?2400:performance.now());
 return()=>{stop();off();reduce.removeEventListener('change',change);redraw.current=()=>{};};},[height,width,animate]);
 useEffect(()=>{redraw.current();},[draw]);
 return <canvas ref={ref} width={width} height={height} aria-label={label} role="img" style={{touchAction:events.onPointerDown?'none':'auto',height:'auto'}} {...events}/>;
}
export function point(e:React.PointerEvent<HTMLCanvasElement>,w=1080,h=280){const r=e.currentTarget.getBoundingClientRect();return {x:(e.clientX-r.left)*w/r.width,y:(e.clientY-r.top)*h/r.height};}
export function line(c:CanvasRenderingContext2D,x1:number,y1:number,x2:number,y2:number,color:string=C.axis,width=2){c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();}
export function dot(c:CanvasRenderingContext2D,x:number,y:number,r:number,color:string){c.fillStyle=color;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();}
export function text(c:CanvasRenderingContext2D,s:string,x:number,y:number,size=18,color:string=C.text){c.fillStyle=color;c.font=`${size}px "Segoe UI", "Microsoft Yahei", sans-serif`;c.fillText(s,x,y);}
export function arrow(c:CanvasRenderingContext2D,x1:number,y1:number,x2:number,y2:number,color:string=C.blue){line(c,x1,y1,x2,y2,color,3);const a=Math.atan2(y2-y1,x2-x1);c.fillStyle=color;c.beginPath();c.moveTo(x2,y2);c.lineTo(x2-11*Math.cos(a-.45),y2-11*Math.sin(a-.45));c.lineTo(x2-11*Math.cos(a+.45),y2-11*Math.sin(a+.45));c.closePath();c.fill();}
export function bar(c:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,value:number,max:number,color:string=C.blue){c.fillStyle=C.axis;c.fillRect(x,y,w,h);c.fillStyle=color;c.fillRect(x,y,w*Math.max(0,Math.min(1,value/max)),h);}
export function paint(c:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,fill=0,mask=0){
 c.fillStyle=C.light;c.fillRect(x+5,y+7,w,h);c.fillStyle='#fff';c.fillRect(x,y,w,h);c.strokeStyle=C.support;c.lineWidth=3;c.strokeRect(x,y,w,h);
 c.strokeStyle=C.blue;c.lineWidth=3;c.beginPath();c.moveTo(x+w*.08,y+h*.73);c.bezierCurveTo(x+w*.27,y-h*.15,x+w*.49,y+h*1.1,x+w*.69,y+h*.25);c.bezierCurveTo(x+w*.8,y+h*.2,x+w*.88,y+h*.58,x+w*.94,y+h*.7);c.stroke();
 c.fillStyle=C.light;c.beginPath();c.ellipse(x+w*.7,y+h*.75,w*.14,h*.07,0,0,Math.PI*2);c.fill();
 if(mask>0){c.fillStyle='rgba(184,201,167,.60)';c.fillRect(x+3,y+3,(w-6)*Math.min(1,mask),h-6);c.strokeStyle=C.dark;c.setLineDash([4,4]);c.strokeRect(x+3,y+3,(w-6)*Math.min(1,mask),h-6);c.setLineDash([]);}
 if(fill>0){c.strokeStyle=C.green;c.lineWidth=4;c.lineCap='round';c.beginPath();c.moveTo(x+w*.68,y+h*.85);c.quadraticCurveTo(x+w*.74,y+h*(.85-.17*fill),x+w*(.68+.24*fill),y+h*(.85-.09*fill));c.stroke();c.lineCap='butt';}
}
export function brush(c:CanvasRenderingContext2D,x:number,y:number,angle=0,color:string=C.green){c.save();c.translate(x,y);c.rotate(angle);c.fillStyle=C.support;c.beginPath();c.roundRect(-5,-68,10,51,4);c.fill();c.fillStyle=C.axis;c.fillRect(-6,-22,12,12);c.fillStyle=color;c.beginPath();c.moveTo(-6,-10);c.quadraticCurveTo(-8,-2,0,6);c.quadraticCurveTo(8,-2,6,-10);c.closePath();c.fill();c.restore();}
export function Panel({children}:React.PropsWithChildren){return <div style={{display:'flex',gap:20,flexWrap:'wrap',padding:'10px 14px',background:'#f7f9fb',border:'1px solid '+C.axis,borderRadius:10,lineHeight:1.8}}>{children}</div>;}
export function Chips({label,value,options,onChange}:{label:string;value:string;options:{value:string,label:string}[];onChange:(value:string)=>void}){return <div className="ctrl" role="group" aria-label={label}><strong style={{color:C.text,marginRight:4}}>{label}</strong>{options.map(o=><button type="button" key={o.value} className={'chip'+(value===o.value?' selected':'')} aria-pressed={value===o.value} onClick={()=>onChange(o.value)} style={{minHeight:44}}>{o.label}</button>)}</div>;}
export function Feedback({children,tone=''}:React.PropsWithChildren<{tone?:'good'|'bad'|''}>){return <div className={'feedback '+tone} aria-live="polite">{children}</div>;}
export function DataTable({headers,rows,caption}:{headers:string[];rows:(string|number)[][];caption?:string}){return <div style={{overflowX:'auto',marginTop:14}}><table style={{borderCollapse:'collapse',width:'100%',fontSize:15,lineHeight:1.65}}>{caption&&<caption style={{textAlign:'left',padding:'6px 0',color:C.muted}}>{caption}</caption>}<thead><tr>{headers.map((h,i)=><th key={i} style={{padding:'8px 10px',textAlign:'left',whiteSpace:'nowrap',borderBottom:'2px solid '+C.axis,color:C.text}}>{h}</th>)}</tr></thead><tbody>{rows.map((r,i)=><tr key={i}>{r.map((v,j)=><td key={j} style={{padding:'8px 10px',borderBottom:'1px solid '+C.axis,background:i%2?'#f7f9fb':'#fff',whiteSpace:'nowrap'}}>{v}</td>)}</tr>)}</tbody></table></div>;}
export function NusaKit(){return null;}
