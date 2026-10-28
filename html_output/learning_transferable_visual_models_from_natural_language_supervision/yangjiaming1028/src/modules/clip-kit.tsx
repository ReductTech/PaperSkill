import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';

export const C = { bg:'#f5f8f0', light:'#b8c9a7', dark:'#76906a', support:'#92400e', blue:'#27446e', green:'#228d5c', red:'#c43f52', orange:'#f07e47', purple:'#7c3aed', ink:'#21324a', muted:'#68778f', line:'#d7deea' };
type Draw = (ctx:CanvasRenderingContext2D,w:number,h:number,t:number)=>void;
type Props = Omit<React.CanvasHTMLAttributes<HTMLCanvasElement>,'width'|'height'> & {draw:Draw;label:string;width?:number;height?:number;animate?:boolean};

export function ClipCanvas({draw,label:description,width=1080,height=280,animate=false,style,...rest}:Props) {
  const ref=useRef<HTMLCanvasElement>(null);
  const painter=useRef(draw); painter.current=draw;
  const ctxRef=useRef<CanvasRenderingContext2D|null>(null);
  const reduced=useRef(false);
  const paintRef=useRef<()=>void>(()=>{});
  useEffect(()=>{
    const canvas=ref.current; if(!canvas)return;
    const ctx=setupCanvas(canvas,width,height); ctxRef.current=ctx;
    canvas.style.width='100%';canvas.style.height='auto';
    const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
    reduced.current=motion.matches;
    let raf:number|null=null;let visible=true;
    const paint=()=>{ctx.save();painter.current(ctx,width,height,reduced.current?1500:performance.now());ctx.restore();canvas.classList.add('is-ready');};
    paintRef.current=paint;
    const stop=()=>{if(raf!==null)cancelAnimationFrame(raf);raf=null;};
    const tick=()=>{paint();raf=requestAnimationFrame(tick);};
    const start=()=>{paint();if(animate&&!reduced.current&&raf===null)raf=requestAnimationFrame(tick);};
    const dispose=observeCanvas(canvas,()=>{visible=true;start();},()=>{visible=false;stop();});
    const change=()=>{reduced.current=motion.matches;stop();if(visible)start();};
    motion.addEventListener('change',change);paint();
    return()=>{stop();dispose();motion.removeEventListener('change',change);ctxRef.current=null;};
  },[width,height,animate]);
  useEffect(()=>{paintRef.current();});
  return <canvas {...rest} ref={ref} role="img" aria-label={description} width={width} height={height} style={{width:'100%',height:'auto',...style}}/>;
}

export function clearScene(ctx:CanvasRenderingContext2D,w:number,h:number){ctx.clearRect(0,0,w,h);ctx.fillStyle=C.bg;ctx.fillRect(0,0,w,h);}
export function roundRect(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,r:number,fill:string,stroke?:string,lineWidth=2){ctx.beginPath();ctx.roundRect(x,y,Math.max(.01,w),Math.max(.01,h),r);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lineWidth;ctx.stroke();}}
export function line(ctx:CanvasRenderingContext2D,x1:number,y1:number,x2:number,y2:number,color:string,width=2){ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.stroke();}
export function label(ctx:CanvasRenderingContext2D,text:string,x:number,y:number,color:string=C.ink,size=22,align:CanvasTextAlign='left'){ctx.fillStyle=color;ctx.font=`500 ${size}px "Microsoft YaHei", "Segoe UI", sans-serif`;ctx.textAlign=align;ctx.textBaseline='middle';ctx.fillText(text,x,y);}
export function arrow(ctx:CanvasRenderingContext2D,x1:number,y1:number,x2:number,y2:number,color:string,width=3){line(ctx,x1,y1,x2,y2,color,width);const a=Math.atan2(y2-y1,x2-x1);line(ctx,x2,y2,x2-12*Math.cos(a-.5),y2-12*Math.sin(a-.5),color,width);line(ctx,x2,y2,x2-12*Math.cos(a+.5),y2-12*Math.sin(a+.5),color,width);}
export function drawTarget(ctx:CanvasRenderingContext2D,x:number,y:number,good=true){ctx.save();ctx.strokeStyle=good?C.green:C.red;ctx.lineWidth=3;ctx.beginPath();ctx.arc(x,y,12,0,Math.PI*2);ctx.stroke();if(good){line(ctx,x-6,y,x-1,y+5,C.green,3);line(ctx,x-1,y+5,x+7,y-5,C.green,3);}else{line(ctx,x-4,y-4,x+4,y+4,C.red,3);line(ctx,x+4,y-4,x-4,y+4,C.red,3);}ctx.restore();}
export function drawCaption(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,accent:string=C.blue){roundRect(ctx,x+3,y+4,w,h,6,C.light+'55');roundRect(ctx,x,y,w,h,6,'#fff',C.line);line(ctx,x+12,y+h*.35,x+w*.75,y+h*.35,accent,3);line(ctx,x+12,y+h*.64,x+w*.52,y+h*.64,C.line,3);}
export function drawPhoto(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,kind:'cat'|'dog'|'car'|'chair'='cat',accent:string=C.blue){
  ctx.save();roundRect(ctx,x+4,y+6,w,h,8,C.light+'60');roundRect(ctx,x,y,w,h,8,'#fff',C.line,1.5);
  const pad=Math.min(w,h)*.09;const iw=w-pad*2,ih=h-pad*2-h*.1;
  ctx.translate(x+pad,y+pad);roundRect(ctx,0,0,iw,ih,4,'#e7eddf');
  ctx.save();ctx.beginPath();ctx.rect(0,0,iw,ih);ctx.clip();
  ctx.fillStyle=C.light;ctx.beginPath();ctx.ellipse(iw*.6,ih*1.06,iw*.74,ih*.42,0,0,Math.PI*2);ctx.fill();
  ctx.translate(iw*.5,ih*.55);const scale=Math.min(iw/120,ih/110);ctx.scale(scale,scale);
  ctx.strokeStyle=accent;ctx.fillStyle='#fafaf3';ctx.lineWidth=3;ctx.lineJoin='round';ctx.lineCap='round';
  if(kind==='cat'||kind==='dog'){
    ctx.beginPath();ctx.ellipse(0,26,25,32,0,0,Math.PI*2);ctx.fill();ctx.stroke();
    if(kind==='cat'){
      ctx.beginPath();ctx.moveTo(-26,-11);ctx.lineTo(-30,-42);ctx.lineTo(-11,-28);ctx.quadraticCurveTo(0,-34,12,-28);ctx.lineTo(30,-42);ctx.lineTo(26,-11);ctx.quadraticCurveTo(29,15,0,17);ctx.quadraticCurveTo(-29,15,-26,-11);ctx.fill();ctx.stroke();
      line(ctx,-18,3,-40,-1,accent,2);line(ctx,18,3,40,-1,accent,2);
    }else{
      ctx.beginPath();ctx.ellipse(0,-9,29,29,0,0,Math.PI*2);ctx.fill();ctx.stroke();
      roundRect(ctx,-39,-33,17,44,9,C.light,accent,3);roundRect(ctx,22,-33,17,44,9,C.light,accent,3);
    }
    ctx.fillStyle=accent;for(const ex of [-10,10]){ctx.beginPath();ctx.arc(ex,-10,2.6,0,Math.PI*2);ctx.fill();}
    ctx.beginPath();ctx.moveTo(-4,1);ctx.lineTo(4,1);ctx.lineTo(0,6);ctx.closePath();ctx.fill();
    line(ctx,-10,44,-10,55,accent,3);line(ctx,10,44,10,55,accent,3);
  }else if(kind==='car'){
    ctx.beginPath();ctx.moveTo(-44,22);ctx.lineTo(-44,0);ctx.lineTo(-27,-4);ctx.lineTo(-15,-26);ctx.lineTo(22,-26);ctx.lineTo(37,-5);ctx.lineTo(48,0);ctx.lineTo(48,22);ctx.closePath();ctx.fill();ctx.stroke();
    line(ctx,-20,-4,29,-4,accent,3);line(ctx,4,-24,4,-6,accent,3);
    for(const xx of [-27,30]){ctx.beginPath();ctx.arc(xx,23,10,0,Math.PI*2);ctx.fillStyle=accent;ctx.fill();ctx.beginPath();ctx.arc(xx,23,4,0,Math.PI*2);ctx.fillStyle='#fff';ctx.fill();}
  }else{
    roundRect(ctx,-29,-35,57,49,7,'#fff',accent,3);roundRect(ctx,-36,10,72,13,4,C.light,accent,3);
    line(ctx,-27,22,-31,53,accent,4);line(ctx,26,22,30,53,accent,4);line(ctx,-27,-24,26,-24,C.line,2);
  }
  ctx.restore();ctx.restore();
}
export function ClipKit(){return null;}
