import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';

export const C = {bg:'#f5f8f0',light:'#b8c9a7',dark:'#76906a',support:'#92400e',blue:'#27446e',green:'#228d5c',red:'#c43f52',orange:'#f07e47',purple:'#7c3aed',text:'#21324a',muted:'#68778f',border:'#d7deea'};
type SceneProps = Omit<React.CanvasHTMLAttributes<HTMLCanvasElement>,'width'|'height'> & {draw:(ctx:CanvasRenderingContext2D,time:number)=>void;width?:number;height?:number;animate?:boolean};
export function SceneCanvas({draw,width=1080,height=280,animate=false,style,...props}:SceneProps){
 const canvas=useRef<HTMLCanvasElement>(null), latest=useRef(draw), redraw=useRef<(()=>void)|null>(null);
 latest.current=draw;
 useEffect(()=>{
  const el=canvas.current;if(!el)return;
  const ctx=setupCanvas(el,width,height);el.style.width='100%';el.style.height='auto';
  let frame:number|null=null,visible=true,alive=true;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  const render=(time:number)=>{ctx.save();ctx.clearRect(0,0,width,height);latest.current(ctx,time);ctx.restore();el.classList.add('is-ready');};
  const stop=()=>{visible=false;if(frame!==null)cancelAnimationFrame(frame);frame=null;};
  const tick=(time:number)=>{frame=null;if(!alive||!visible)return;render(time);if(animate&&!reduced.matches)frame=requestAnimationFrame(tick);};
  const start=()=>{visible=true;if(frame===null)frame=requestAnimationFrame(tick);};
  redraw.current=()=>{if(visible)render(performance.now());};
  render(performance.now());
  const disconnect=observeCanvas(el,start,stop);
  const changed=()=>{stop();start();};reduced.addEventListener('change',changed);
  return()=>{alive=false;stop();disconnect();reduced.removeEventListener('change',changed);redraw.current=null;};
 },[width,height,animate]);
 useEffect(()=>{redraw.current?.();},[draw]);
 return <canvas {...props} ref={canvas} width={width} height={height} role={props.role??'img'} style={{maxWidth:'100%',aspectRatio:`${width}/${height}`,touchAction:props.onPointerDown?'none':undefined,...style}}/>;
}
export function clearScene(ctx:CanvasRenderingContext2D,w:number,h:number){ctx.fillStyle=C.bg;ctx.fillRect(0,0,w,h);ctx.lineWidth=2;ctx.lineJoin='round';ctx.lineCap='round';}
export function drawSetting(ctx:CanvasRenderingContext2D,w:number,h:number){clearScene(ctx,w,h);ctx.strokeStyle=C.light;ctx.beginPath();ctx.moveTo(w*.06,h*.84);ctx.lineTo(w*.94,h*.84);ctx.stroke();}
export function drawLeaf(ctx:CanvasRenderingContext2D,x:number,y:number,scale=1,outline=false){
 ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);
 ctx.fillStyle=C.light;ctx.strokeStyle=C.dark;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-112,5);ctx.bezierCurveTo(-70,-88,55,-77,117,-13);ctx.bezierCurveTo(80,80,-54,85,-112,5);ctx.fill();ctx.stroke();
 ctx.beginPath();ctx.moveTo(-126,13);ctx.quadraticCurveTo(-5,-13,105,-12);ctx.stroke();
 for(let j=-2;j<=2;j++){const q=j*32;ctx.beginPath();ctx.moveTo(q,-3);ctx.lineTo(q+26,-42+Math.abs(j)*7);ctx.moveTo(q,-3);ctx.lineTo(q+23,38-Math.abs(j)*5);ctx.stroke();}
 ctx.fillStyle=outline?C.green:C.dark;ctx.globalAlpha=outline?.85:.55;
 ctx.beginPath();ctx.ellipse(-13,-10,26,14,-.7,0,Math.PI*2);ctx.ellipse(16,-10,26,14,.7,0,Math.PI*2);ctx.ellipse(-10,11,18,11,.65,0,Math.PI*2);ctx.ellipse(12,11,18,11,-.65,0,Math.PI*2);ctx.fill();
 ctx.globalAlpha=1;ctx.strokeStyle=outline?C.green:C.dark;ctx.lineWidth=outline?3:2;ctx.beginPath();ctx.moveTo(1,-23);ctx.lineTo(1,27);ctx.moveTo(1,-23);ctx.lineTo(-7,-31);ctx.moveTo(1,-23);ctx.lineTo(9,-31);ctx.stroke();ctx.restore();
}
export function drawLens(ctx:CanvasRenderingContext2D,x:number,y:number,r:number,color:string=C.blue){ctx.save();ctx.strokeStyle=C.support;ctx.lineWidth=9;ctx.beginPath();ctx.moveTo(x+r*.68,y+r*.68);ctx.lineTo(x+r*1.45,y+r*1.45);ctx.stroke();ctx.fillStyle='#ffffff80';ctx.strokeStyle=color;ctx.lineWidth=4;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.strokeStyle='#ffffff';ctx.lineWidth=3;ctx.beginPath();ctx.arc(x,y,r*.75,3.6,4.6);ctx.stroke();ctx.restore();}
export function drawTarget(ctx:CanvasRenderingContext2D,x:number,y:number,r:number,color:string=C.green){ctx.save();ctx.strokeStyle=color;ctx.lineWidth=3;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.stroke();ctx.restore();}
export function drawTrace(ctx:CanvasRenderingContext2D,points:[number,number][],color:string=C.blue){if(!points.length)return;ctx.save();ctx.strokeStyle=color;ctx.lineWidth=3;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();ctx.restore();}
export function drawSceneLabel(ctx:CanvasRenderingContext2D,text:string,x:number,y:number,color:string=C.text){ctx.save();ctx.fillStyle=color;ctx.font='22px "Microsoft YaHei", "Segoe UI", sans-serif';ctx.fillText(text,x,y);ctx.restore();}
export function drawLegend(ctx:CanvasRenderingContext2D,entries:{label:string;color:string}[]){ctx.save();ctx.font='17px "Microsoft YaHei", sans-serif';entries.slice(0,3).forEach((e,i)=>{ctx.fillStyle=e.color;ctx.fillRect(36+i*150,18,12,12);ctx.fillStyle=C.muted;ctx.fillText(e.label,55+i*150,30);});ctx.restore();}
export function Feedback({tone='neutral',children}:{tone?:'good'|'bad'|'neutral';children:React.ReactNode}){return <div className={`feedback ${tone==='neutral'?'':tone}`} aria-live="polite">{children}</div>;}
export function Chips({options,value,onChange}:{options:string[];value:number;onChange:(index:number)=>void}){return <div className="ctrl">{options.map((o,i)=><button type="button" className={`chip ${i===value?'selected':''}`} aria-pressed={i===value} onClick={()=>onChange(i)} key={o}>{o}</button>)}</div>;}
export const KitAnchor:React.FC=()=>null;
