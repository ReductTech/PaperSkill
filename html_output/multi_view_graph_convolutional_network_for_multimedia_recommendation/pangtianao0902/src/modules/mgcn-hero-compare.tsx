import React, { useEffect, useRef } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 300;
const H = 184;
const palette = { bg:'#f5f8f0', paper:'#b8c9a7', shadow:'#76906a', blue:'#27446e', green:'#228d5c', red:'#c43f52', orange:'#d97706', text:'#21324a', border:'#d7deea' };

function rounded(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,r:number){ctx.beginPath();ctx.roundRect(x,y,w,h,r);}
function drawCamera(ctx:CanvasRenderingContext2D,x:number,y:number){ctx.fillStyle=palette.text;rounded(ctx,x,y,60,34,7);ctx.fill();ctx.fillStyle=palette.paper;ctx.beginPath();ctx.arc(x+42,y+17,11,0,Math.PI*2);ctx.fill();ctx.strokeStyle=palette.blue;ctx.lineWidth=3;ctx.stroke();ctx.fillStyle=palette.text;rounded(ctx,x+8,y-8,20,10,3);ctx.fill();}

export const MgcnHeroCompare: React.FC<WidgetProps> = ({ moduleId }) => {
  const ref=useRef<HTMLCanvasElement>(null);
  useEffect(()=>{const canvas=ref.current;if(!canvas)return;let ctx:CanvasRenderingContext2D;try{ctx=setupCanvas(canvas,W,H);}catch{return;}let raf=0;const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;const start=performance.now();const draw=(now:number)=>{const t=reduced?1:((now-start)%2600)/2600;ctx.clearRect(0,0,W,H);ctx.fillStyle=palette.bg;ctx.fillRect(0,0,W,H);ctx.fillStyle='#fff';ctx.strokeStyle=palette.border;rounded(ctx,8,8,W-16,H-16,14);ctx.fill();ctx.stroke();drawCamera(ctx,28,65);ctx.fillStyle=palette.paper;rounded(ctx,174,42,92,88,8);ctx.fill();ctx.fillStyle='#e9b88c';rounded(ctx,191,56,44,54,6);ctx.fill();ctx.fillStyle=palette.text;ctx.font='600 13px "Segoe UI",sans-serif';ctx.fillText(moduleId==='old'?'直接混合':'行为引导',18,30);ctx.font='12px "Segoe UI",sans-serif';if(moduleId==='old'){ctx.fillStyle='rgba(196,63,82,.25)';ctx.beginPath();ctx.arc(102,82,25+8*Math.sin(t*Math.PI*2),0,Math.PI*2);ctx.fill();const fx=184+50*t;ctx.strokeStyle=palette.red;ctx.lineWidth=3;ctx.strokeRect(fx,50,42,42);ctx.fillStyle=palette.red;ctx.fillText('焦点漂向背景',174,151);}else{ctx.strokeStyle=palette.blue;ctx.lineWidth=3;ctx.setLineDash([6,5]);ctx.beginPath();ctx.moveTo(103,82);ctx.lineTo(194,82);ctx.stroke();ctx.setLineDash([]);ctx.strokeStyle=palette.green;ctx.lineWidth=3;ctx.strokeRect(188,52,54,62);ctx.fillStyle=palette.green;ctx.fillText('偏好目标被保留',174,151);}ctx.fillStyle=palette.orange;ctx.fillRect(18,160,5,5);ctx.fillStyle=palette.text;ctx.fillText('机制直觉 · 非实验指标',30,166);if(!reduced)raf=requestAnimationFrame(draw);};raf=requestAnimationFrame(draw);return()=>cancelAnimationFrame(raf);},[moduleId]);
  return <canvas ref={ref} width={W} height={H} aria-label={moduleId==='old'?'直接混合受模态噪声干扰的机制示意':'行为引导净化稳定偏好目标的机制示意'} />;
};

export default MgcnHeroCompare;
