import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

export const C = { bg:'#f5f7f8', light:'#e8edf0', dark:'#697787', support:'#94543d', blue:'#557b9f', green:'#4f8879', red:'#9b615e', orange:'#b87459', purple:'#756f8c', text:'#1f2d3d', muted:'#647184', border:'#dce2e8' };

export function useCanvas(draw:(ctx:CanvasRenderingContext2D,time:number)=>void, deps:React.DependencyList, w=560, h=260, animated=false) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawRef = useRef(draw); drawRef.current = draw;
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    let ctx:CanvasRenderingContext2D; try { ctx = setupCanvas(canvas,w,h); } catch { return; }
    let raf:number|null = null; let active = false;
    const frame = (time:number) => { drawRef.current(ctx,time); canvas.classList.add('is-ready'); if (animated && active) raf=requestAnimationFrame(frame); };
    const start = () => { active=true; if (animated) { if (raf===null) raf=requestAnimationFrame(frame); } else frame(performance.now()); };
    const stop = () => { active=false; if (raf!==null) cancelAnimationFrame(raf); raf=null; };
    const disconnect=observeCanvas(canvas,start,stop); return()=>{ stop(); disconnect(); };
  }, [w,h,animated,...deps]);
  return ref;
}

export function clearDarkroom(ctx:CanvasRenderingContext2D,w:number,h:number){ ctx.clearRect(0,0,w,h); ctx.fillStyle=C.bg; ctx.fillRect(0,0,w,h); ctx.fillStyle='#edf1e7'; ctx.fillRect(0,h*0.72,w,h*0.28); }
export function drawPrint(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,clarity=1,grain=0){
  ctx.save(); ctx.fillStyle='#fffdf6'; ctx.strokeStyle=C.border; ctx.lineWidth=2; ctx.fillRect(x,y,w,h); ctx.strokeRect(x,y,w,h);
  ctx.globalAlpha=clamp(clarity,0,1); ctx.strokeStyle=C.blue; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(x+w*.5,y+h*.38,Math.min(w,h)*.16,0,Math.PI*2); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x+w*.27,y+h*.78); ctx.quadraticCurveTo(x+w*.5,y+h*.54,x+w*.73,y+h*.78); ctx.stroke(); ctx.globalAlpha=1;
  const count=Math.round(6+grain*44); ctx.fillStyle=C.red; for(let i=0;i<count;i++){ const px=x+8+((i*37)%Math.max(12,w-16)); const py=y+8+((i*53)%Math.max(12,h-16)); ctx.globalAlpha=.18+grain*.42; ctx.fillRect(px,py,2,2); } ctx.globalAlpha=1; ctx.restore();
}
export function drawBeam(ctx:CanvasRenderingContext2D,x:number,y:number,targetX:number,targetY:number,color=C.blue,width=18){ ctx.save(); ctx.strokeStyle=color; ctx.globalAlpha=.34; ctx.lineWidth=width; ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(targetX,targetY); ctx.stroke(); ctx.globalAlpha=1; ctx.fillStyle=color; ctx.beginPath(); ctx.arc(x,y,6,0,Math.PI*2); ctx.fill(); ctx.restore(); }
export function drawBar(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,label:string,value:number,color:string){ ctx.fillStyle=C.text; ctx.font='13px Segoe UI, sans-serif'; ctx.fillText(label,x,y-7); ctx.fillStyle='#e8edf2'; ctx.fillRect(x,y,w,12); ctx.fillStyle=color; ctx.fillRect(x,y,w*clamp(value,0,1),12); ctx.strokeStyle=C.border; ctx.strokeRect(x,y,w,12); }
export function label(ctx:CanvasRenderingContext2D,text:string,x:number,y:number,color=C.text){ ctx.fillStyle=color; ctx.font='13px Segoe UI, sans-serif'; ctx.fillText(text,x,y); }
export const Feedback:React.FC<{text:string;kind?:'good'|'bad'|''}> = ({text,kind=''}) => <div className={`feedback ${kind}`} aria-live="polite">{text}</div>;
export const CanvasView = React.forwardRef<HTMLCanvasElement, React.CanvasHTMLAttributes<HTMLCanvasElement>>((props, ref) => <canvas ref={ref} {...props} style={{maxWidth:'100%',height:'auto',...(props.style||{})}} />);
CanvasView.displayName = 'CanvasView';
export const DarkroomCoreWidget:React.FC<WidgetProps> = () => null;
