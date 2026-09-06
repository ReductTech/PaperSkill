import React, { useEffect, useRef } from 'react';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

export const C = { bg:'#f5f8f0', light:'#b8c9a7', dark:'#76906a', support:'#92400e', blue:'#27446e', green:'#228d5c', red:'#c43f52', orange:'#d97706', purple:'#7c3aed', text:'#21324a', muted:'#68778f', border:'#d7deea' };
export const font = (ctx: CanvasRenderingContext2D, size=13, weight=400) => { ctx.font = `${weight} ${size}px "Segoe UI", sans-serif`; ctx.textBaseline='middle'; };
export const clear = (ctx:CanvasRenderingContext2D,w:number,h:number) => { ctx.clearRect(0,0,w,h); ctx.fillStyle=C.bg; ctx.fillRect(0,0,w,h); ctx.strokeStyle=C.light; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(0,h*.74); ctx.lineTo(w,h*.74); ctx.stroke(); };
export const rounded = (ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,r=8) => { ctx.beginPath(); ctx.roundRect(x,y,w,h,r); };
export const label = (ctx:CanvasRenderingContext2D,text:string,x:number,y:number,color=C.text,size=13,weight=500) => { font(ctx,size,weight); ctx.fillStyle=color; ctx.fillText(text,x,y); };
export const box = (ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,color:string=C.blue,dash=false) => { ctx.save(); ctx.strokeStyle=color; ctx.lineWidth=2.5; ctx.setLineDash(dash?[6,4]:[]); ctx.strokeRect(x,y,w,h); ctx.restore(); };
export const dot = (ctx:CanvasRenderingContext2D,x:number,y:number,color=C.blue,r=4) => { ctx.fillStyle=color; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill(); ctx.strokeStyle='#fff'; ctx.lineWidth=1.5; ctx.stroke(); };
export const bar = (ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,value:number,max:number,color:string) => { ctx.fillStyle='#eef2f6'; ctx.fillRect(x,y,w,h); ctx.fillStyle=color; ctx.fillRect(x,y,w*Math.max(0,Math.min(1,value/max)),h); };
export const metric = (ctx:CanvasRenderingContext2D,x:number,y:number,w:number,title:string,value:string,color=C.blue) => { ctx.fillStyle='#fff'; rounded(ctx,x,y,w,52,7); ctx.fill(); ctx.strokeStyle=C.border; ctx.stroke(); label(ctx,title,x+10,y+16,C.muted,11,500); label(ctx,value,x+10,y+37,color,17,700); };
export const scalePoint = (e:React.PointerEvent<HTMLCanvasElement>,canvas:HTMLCanvasElement,w:number,h:number) => { const r=canvas.getBoundingClientRect(); return {x:(e.clientX-r.left)*w/r.width,y:(e.clientY-r.top)*h/r.height}; };

function drawGuard(ctx:CanvasRenderingContext2D,x:number,y:number,scale=1,active=false){
 ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);ctx.lineCap='round';
 if(active){ctx.strokeStyle=C.orange;ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,-16,18,0,Math.PI*2);ctx.stroke();}
 ctx.fillStyle='#f2c9a5';ctx.beginPath();ctx.arc(0,-20,7,0,Math.PI*2);ctx.fill();
 ctx.fillStyle=C.blue;ctx.fillRect(-9,-29,18,5);ctx.fillRect(-6,-33,12,4);
 ctx.fillStyle=C.blue;rounded(ctx,-10,-13,20,24,4);ctx.fill();
 ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(0,-4,3,0,Math.PI*2);ctx.fill();
 ctx.strokeStyle=C.text;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-6,11);ctx.lineTo(-10,25);ctx.moveTo(6,11);ctx.lineTo(10,25);ctx.stroke();
 ctx.restore();
}
function drawSuspect(ctx:CanvasRenderingContext2D,x:number,y:number,scale=1){
 ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);
 ctx.fillStyle='#d5a47a';ctx.beginPath();ctx.arc(0,-18,7,0,Math.PI*2);ctx.fill();
 ctx.fillStyle=C.text;ctx.fillRect(-9,-28,18,5);ctx.fillRect(-6,-32,12,4);
 ctx.fillStyle=C.red;rounded(ctx,-10,-11,20,25,4);ctx.fill();
 ctx.strokeStyle='#fff';ctx.lineWidth=2;for(let yy=-6;yy<10;yy+=6){ctx.beginPath();ctx.moveTo(-8,yy);ctx.lineTo(8,yy);ctx.stroke();}
 ctx.strokeStyle=C.text;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-6,14);ctx.lineTo(-9,27);ctx.moveTo(6,14);ctx.lineTo(9,27);ctx.stroke();
 ctx.restore();
}
function drawArrow(ctx:CanvasRenderingContext2D,x1:number,y1:number,x2:number,y2:number,color:string){
 ctx.strokeStyle=color;ctx.fillStyle=color;ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();const a=Math.atan2(y2-y1,x2-x1);ctx.beginPath();ctx.moveTo(x2,y2);ctx.lineTo(x2-7*Math.cos(a-.5),y2-7*Math.sin(a-.5));ctx.lineTo(x2-7*Math.cos(a+.5),y2-7*Math.sin(a+.5));ctx.closePath();ctx.fill();
}
function drawHQ(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number){
 ctx.fillStyle='#fff';rounded(ctx,x,y,w,h,7);ctx.fill();ctx.strokeStyle=C.blue;ctx.lineWidth=2;ctx.stroke();label(ctx,'指挥中心',x+10,y+16,C.blue,11,700);
}

type GuardScene='watch'|'report'|'distance'|'search'|'coordinate'|'shift'|'specialize'|'dispatch';
export const AnalogyScene:React.FC<{action:GuardScene;label:string}> = ({action,label:caption}) => {
 const ref=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{const canvas=ref.current;if(!canvas)return;const ctx=setupCanvas(canvas,244,130);let raf=0,start=performance.now(),live=true;
 const draw=(now:number)=>{const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;const p=reduced?.65:((now-start)%2800)/2800;const q=.5-.5*Math.cos(p*Math.PI*2);clear(ctx,244,130);
 if(action==='watch'){
  [[28,26],[72,26],[28,67],[72,67]].forEach(([x,y],i)=>drawGuard(ctx,x,y,.58,i===3));drawSuspect(ctx,183,61,.85);box(ctx,163-q*4,28,42+q*8,59,C.green);drawArrow(ctx,92,63,151,57,C.orange);label(ctx,'报告区域',154,20,C.green,10,700);
 }
 if(action==='report'){
  [31,69,107].forEach((x,i)=>drawGuard(ctx,x,70,.58,i===2));drawSuspect(ctx,190,62,.82);for(let i=0;i<3;i++)box(ctx,164+i*4,31+i*2,45,55,i===2?C.green:C.red);label(ctx,q>.5?'主报告':'重复报告',157,18,q>.5?C.green:C.red,10,700);
 }
 if(action==='distance'){
  drawGuard(ctx,31,65,.7,true);drawSuspect(ctx,204,60,.72);ctx.strokeStyle=C.border;ctx.beginPath();ctx.moveTo(67,76);ctx.lineTo(190,76);ctx.stroke();for(let i=0;i<16;i++){const x=68+i*8;ctx.fillStyle=i===5||i===6?C.blue:C.border;const h=i===5?16:i===6?29:3;ctx.fillRect(x,76-h,5,h);}label(ctx,'0',66,88,C.muted,9);label(ctx,'15',183,88,C.muted,9);label(ctx,'加权距离 5.7',91,35,C.orange,10,700);box(ctx,174,28,46,58,C.green);
 }
 if(action==='search'){
  [[45,37],[101,37],[45,82],[101,82]].forEach(([x,y])=>drawGuard(ctx,x,y,.48));drawSuspect(ctx,157,58,.38);box(ctx,150,45,14,22,C.green);box(ctx,139-q*5,35-q*4,36+q*10,42+q*8,C.purple,true);label(ctx,'候选搜索区',174,47,C.purple,10,700);
 }
 if(action==='coordinate'){
  drawHQ(ctx,12,24,82,68);const raw=[68,37,18];raw.forEach((length,i)=>{const balanced=length+(42-length)*q;drawArrow(ctx,101,39+i*20,101+balanced,39+i*20,i===0?C.red:i===1?C.orange:C.blue);});drawGuard(ctx,210,66,.72,true);label(ctx,'校准方向',139,22,C.green,10,700);
 }
 if(action==='shift'){
  ctx.strokeStyle=C.border;ctx.beginPath();ctx.moveTo(122,18);ctx.lineTo(122,94);ctx.stroke();label(ctx,'训练演习',12,18,C.blue,10,700);[25,57,89].forEach(x=>drawGuard(ctx,x,65,.48));drawHQ(ctx,91,33,27,48);label(ctx,'正式执勤',134,18,C.green,10,700);drawGuard(ctx,154,66,.62,true);drawSuspect(ctx,219,60,.55);box(ctx,207,36,25,43,C.green);
 }
 if(action==='specialize'){
  drawGuard(ctx,111,68,.72,true);const cards=[['轮廓',13,25],['关键点',160,25],['旋转框',13,67],['通缉令',160,67]];cards.forEach(([text,x,y],i)=>{ctx.fillStyle=i===Math.floor(q*4)%4?C.purple:'#fff';rounded(ctx,Number(x),Number(y),70,25,5);ctx.fill();ctx.strokeStyle=C.purple;ctx.stroke();label(ctx,String(text),Number(x)+11,Number(y)+13,i===Math.floor(q*4)%4?'#fff':C.purple,10,700);});
 }
 if(action==='dispatch'){
  drawHQ(ctx,12,22,112,73);[['最快响应','n'],['最高精度','x'],['无 NMS','E2E']].forEach(([t,v],i)=>{const active=i===Math.floor(q*3)%3;ctx.fillStyle=active?C.green:C.border;ctx.fillRect(24,47+i*14,7,7);label(ctx,t,37,51+i*14,active?C.green:C.muted,9,600);label(ctx,v,102,51+i*14,active?C.green:C.muted,9,700);});[153,190,224].forEach((x,i)=>drawGuard(ctx,x,70,.48+i*.09,i===Math.floor(q*3)%3));
 }
 label(ctx,caption,12,116,C.muted,11,600);if(!canvas.classList.contains('is-ready'))canvas.classList.add('is-ready');if(live)raf=requestAnimationFrame(draw);};
 const begin=()=>{if(!raf){live=true;raf=requestAnimationFrame(draw)}};const stop=()=>{live=false;if(raf)cancelAnimationFrame(raf);raf=0};const off=observeCanvas(canvas,begin,stop);return()=>{stop();off()};},[action,caption]);
 return <canvas ref={ref} width={244} height={130} aria-label={caption}/>;
};

export const HeroMap:React.FC<{mode:'old'|'new'}> = ({mode}) => { const ref=useRef<HTMLCanvasElement>(null); useEffect(()=>{const c=ref.current;if(!c)return;const ctx=setupCanvas(c,520,250);clear(ctx,520,250);const old=['重复预测 / NMS','DFL 检测头 + 有限回归范围','极小标注框缺少候选','较长训练周期'];const newer=['One to many / one to one 双分支','直接回归边界距离','STAL 小目标候选辅助','MuSGD 优化器'];(mode==='old'?old:newer).forEach((t,i)=>{const y=24+i*54;ctx.fillStyle='#fff';rounded(ctx,24,y,472,40,8);ctx.fill();ctx.strokeStyle=mode==='old'?C.red:C.green;ctx.lineWidth=2;ctx.stroke();label(ctx,t,43,y+20,mode==='old'?C.red:C.green,14,700)});c.classList.add('is-ready')},[mode]); return <canvas ref={ref} width={520} height={250} aria-label={mode==='old'?'传统方法问题地图':'YOLO26 方法地图'}/>; };

export const YoloShared:React.FC<WidgetProps> = () => <div aria-hidden="true" />;
