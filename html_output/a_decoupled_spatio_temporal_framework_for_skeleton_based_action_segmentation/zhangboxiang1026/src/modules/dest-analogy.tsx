// Codex initial draft, 2026-10-21. See MODEL_HANDOFF.md; this is non-rendered source provenance.
import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

export const C = { bg:'#f5f8f0', light:'#b8c9a7', dark:'#76906a', route:'#92400e', blue:'#27446e', green:'#228d5c', red:'#c43f52', orange:'#f07e47', purple:'#7c3aed', ink:'#21324a', muted:'#68778f', line:'#d7deea', white:'#fff' };
export function usePaperCanvas<T>(ref: React.RefObject<HTMLCanvasElement | null>, w:number, h:number, state:T, draw:(ctx:CanvasRenderingContext2D,s:T,t:number)=>void, animated=false) {
  const stateRef=useRef(state); stateRef.current=state;
  const drawRef=useRef(draw); drawRef.current=draw;
  const paintRef=useRef<(()=>void)|null>(null);
  useEffect(()=>{
    const canvas=ref.current; if(!canvas) return;
    let ctx:CanvasRenderingContext2D;
    try { ctx=setupCanvas(canvas,w,h); canvas.style.width='100%'; canvas.style.height='auto'; canvas.style.maxWidth=w+'px'; } catch { return; }
    let raf:number|null=null;
    const paint=()=>{ drawRef.current(ctx,stateRef.current,performance.now()); canvas.classList.add('is-ready'); };
    const tick=()=>{ paint(); raf=requestAnimationFrame(tick); };
    const start=()=>{ if(animated && !window.matchMedia('(prefers-reduced-motion: reduce)').matches){ if(raf===null) raf=requestAnimationFrame(tick); } else paint(); };
    const stop=()=>{ if(raf!==null) cancelAnimationFrame(raf); raf=null; };
    paintRef.current=paint;
    const disconnect=observeCanvas(canvas,start,stop);
    return ()=>{ stop(); disconnect(); paintRef.current=null; };
  },[ref,w,h,animated]);
  useEffect(()=>{ if(!animated) paintRef.current?.(); },[state,animated]);
}
export function scene(ctx:CanvasRenderingContext2D,w:number,h:number){ ctx.clearRect(0,0,w,h); ctx.fillStyle=C.bg; ctx.fillRect(0,0,w,h); }
export function drawPerformer(ctx:CanvasRenderingContext2D,x:number,ground:number,phase=0,highlight=''){
  const reach=clamp(phase,0,1); const color=(part:string)=>highlight===part?C.orange:C.blue;
  ctx.lineCap='round'; ctx.lineJoin='round'; ctx.lineWidth=4;
  const headY=ground-67;
  ctx.strokeStyle=color('body'); ctx.fillStyle=C.bg; ctx.beginPath(); ctx.arc(x,headY,10,0,Math.PI*2); ctx.fill(); ctx.stroke();
  const sx=x, sy=ground-54, hipY=ground-26;
  ctx.beginPath(); ctx.moveTo(sx,sy); ctx.lineTo(sx,hipY); ctx.stroke();
  ctx.strokeStyle=color('leftArm'); ctx.beginPath(); ctx.moveTo(sx,sy+3); ctx.lineTo(x-18,ground-39); ctx.lineTo(x-24,ground-26); ctx.stroke();
  ctx.strokeStyle=color('rightArm'); const elbowX=x+16+18*reach, elbowY=ground-43-13*reach, wristX=x+26+44*reach, wristY=ground-44-36*reach;
  ctx.beginPath(); ctx.moveTo(sx,sy+3); ctx.lineTo(elbowX,elbowY); ctx.lineTo(wristX,wristY); ctx.stroke();
  ctx.strokeStyle=color('legs'); ctx.beginPath(); ctx.moveTo(sx,hipY); ctx.lineTo(x-12,ground-5); ctx.moveTo(sx,hipY); ctx.lineTo(x+14,ground-5); ctx.stroke();
}
export function drawMark(ctx:CanvasRenderingContext2D,x:number,y:number){ ctx.strokeStyle=C.orange; ctx.fillStyle='rgba(240,126,71,.18)'; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(x,y,10,0,Math.PI*2); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x-16,y+17); ctx.lineTo(x+16,y+17); ctx.stroke(); }
export function drawArrow(ctx:CanvasRenderingContext2D,x1:number,y1:number,x2:number,y2:number,color=C.blue){ const a=Math.atan2(y2-y1,x2-x1); ctx.strokeStyle=color; ctx.fillStyle=color; ctx.lineWidth=2.5; ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x2,y2); ctx.lineTo(x2-9*Math.cos(a-.5),y2-9*Math.sin(a-.5)); ctx.lineTo(x2-9*Math.cos(a+.5),y2-9*Math.sin(a+.5)); ctx.closePath(); ctx.fill(); }
export function drawNode(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,active:boolean,color=C.blue){ ctx.fillStyle=active?C.white:'#edf1e8'; ctx.strokeStyle=active?C.orange:color; ctx.lineWidth=active?4:2; ctx.beginPath(); ctx.roundRect(x,y,w,h,12); ctx.fill(); ctx.stroke(); }
export function drawBar(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,value:number,max:number,color=C.blue){ ctx.fillStyle=C.line; ctx.fillRect(x,y,w,h); ctx.fillStyle=color; ctx.fillRect(x,y,w*clamp(value/max,0,1),h); }
export const DestAnalogy:React.FC<WidgetProps>=({chapterId})=>{
 const ref=useRef<HTMLCanvasElement|null>(null); const state={chapterId};
 usePaperCanvas(ref,560,140,state,(ctx,_s,t)=>{ scene(ctx,560,140); ctx.strokeStyle=C.light; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(24,122); ctx.lineTo(536,122); ctx.stroke(); drawMark(ctx,275,40); const phase=(Math.sin(t/1100)+1)/2; drawPerformer(ctx,205,120,phase); ctx.fillStyle=C.muted; ctx.font='13px system-ui'; ctx.fillText('目标',262,19); },true);
 return <canvas ref={ref} width={560} height={140} aria-label="练习者抬臂靠近地面标记的示意动画"/>;
};
export const DestHero:React.FC<WidgetProps>=({moduleId})=>{
 const ref=useRef<HTMLCanvasElement|null>(null); const side=moduleId==='old'?'old':'new'; const state={side};
 usePaperCanvas(ref,560,140,state,(ctx,s,t)=>{ scene(ctx,560,140); const phase=(Math.sin(t/1300)+1)/2; drawPerformer(ctx,98,122,phase); drawMark(ctx,185,48); ctx.strokeStyle=C.line; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(240,18); ctx.lineTo(240,124); ctx.stroke();
  if(s.side==='old'){ for(let i=0;i<4;i++){const x=265+i*64; ctx.fillStyle=i%2?C.light:C.blue; ctx.globalAlpha=.9; ctx.fillRect(x,30,42,18); ctx.globalAlpha=.55; ctx.fillRect(x,66,42,18); if(i<3) drawArrow(ctx,x+44,57,x+59,57,C.red); } ctx.globalAlpha=1; ctx.strokeStyle=C.red; ctx.lineWidth=5; ctx.beginPath(); ctx.moveTo(260,112); ctx.lineTo(490,112); ctx.stroke(); ctx.fillStyle=C.ink; ctx.font='13px system-ui'; ctx.fillText('级联',270,22); ctx.fillText('平滑',460,104); }
  else { ctx.fillStyle=C.blue; ctx.fillRect(270,30,74,22); for(let i=0;i<3;i++){const y=68+i*17; ctx.fillStyle=i===1?C.purple:C.light; ctx.fillRect(276,y,18,10); drawArrow(ctx,300,y+5,380,y+5,i===1?C.green:C.blue); ctx.fillStyle=C.light; ctx.fillRect(389,y,58,10); } ctx.fillStyle=C.green; ctx.fillRect(461,56,72,46); ctx.fillStyle=C.ink; ctx.font='13px system-ui'; ctx.fillText('DeST',284,22); ctx.fillText('多层',482,83); }
 },true);
 return <canvas ref={ref} width={560} height={140} aria-label={side==='old'?'级联时空建模示意':'DeST解耦交互示意'}/>;
};
