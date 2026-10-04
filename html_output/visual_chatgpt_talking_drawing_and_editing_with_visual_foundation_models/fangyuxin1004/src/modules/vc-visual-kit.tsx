import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';

export const colors = { bg:'#f5f8f0',light:'#b8c9a7',dark:'#76906a',support:'#92400e',blue:'#27446e',green:'#228d5c',red:'#c43f52',orange:'#f07e47',purple:'#7c3aed',ink:'#21324a',muted:'#68778f',border:'#d7deea' };
type C = CanvasRenderingContext2D;
export function line(c:C,x1:number,y1:number,x2:number,y2:number,color:string=colors.border,width=2){ c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.strokeStyle=color;c.lineWidth=width;c.stroke(); }
export function dot(c:C,x:number,y:number,r:number,color:string){ c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fillStyle=color;c.fill(); }
export function label(c:C,text:string,x:number,y:number,color:string=colors.ink,size=18){c.fillStyle=color;c.font=`${size}px "Microsoft YaHei", sans-serif`;c.fillText(text,x,y);}
export function panel(c:C,x:number,y:number,w:number,h:number,color='#ffffff',stroke:string=colors.border){c.beginPath();c.roundRect(x,y,w,h,8);c.fillStyle=color;c.fill();c.strokeStyle=stroke;c.lineWidth=2;c.stroke();}
export function photo(c:C,x:number,y:number,w:number,h:number,variant='yellow',highlight=false){
 c.save();c.translate(x,y);panel(c,0,0,w,h,'#fff',highlight?colors.blue:colors.border);
 c.save();c.beginPath();c.rect(8,8,w-16,h-21);c.clip();
 c.fillStyle=variant==='depth'?'#e1e6e3':'#e9efe0';c.fillRect(8,8,w-16,h-21);
 c.fillStyle=variant==='depth'?'#b3bab4':'#c4d4b7';c.beginPath();c.ellipse(w*.45,h*.83,w*.63,h*.26,0,0,Math.PI*2);c.fill();
 if(variant!=='blank'){
 const cx=w*.5,cy=h*.42,r=Math.min(w,h)*.16;
 line(c,cx,cy,cx,h*.88,variant==='depth'?'#6b776e':colors.dark,variant==='cartoon'?5:3);
 c.fillStyle=variant==='depth'?'#929d95':colors.dark;c.beginPath();c.ellipse(cx+w*.09,h*.66,w*.11,h*.04,-.55,0,Math.PI*2);c.fill();
 for(let i=0;i<7;i++){const a=i*Math.PI*2/7;const px=cx+Math.cos(a)*r*.75,py=cy+Math.sin(a)*r*.75;c.beginPath();c.ellipse(px,py,r*.58,r*.38,a,0,Math.PI*2);c.fillStyle=variant==='depth'?'#61736a':variant==='yellow'?'#e6bb59':'#c85863';c.fill();if(variant==='cartoon'){c.strokeStyle=colors.ink;c.lineWidth=2;c.stroke();}}
 dot(c,cx,cy,r*.37,variant==='depth'?'#354e43':'#956639');
 }
 c.restore();c.restore();
}
export function brush(c:C,x:number,y:number,angle=0,color:string=colors.blue){c.save();c.translate(x,y);c.rotate(angle);c.lineCap='round';line(c,0,-44,0,-3,colors.support,9);c.fillStyle='#c4cbd0';c.fillRect(-5,-8,10,12);c.beginPath();c.moveTo(-6,4);c.quadraticCurveTo(-7,18,0,25);c.quadraticCurveTo(7,18,6,4);c.closePath();c.fillStyle=color;c.fill();c.restore();}
export function tag(c:C,x:number,y:number,w=80,color:string=colors.blue){panel(c,x,y,w,27,'#fff',color);dot(c,x+10,y+13,3,color);line(c,x+21,y+10,x+w-8,y+10,color,2);line(c,x+21,y+18,x+w-20,y+18,colors.border,2);}
export function magnifier(c:C,x:number,y:number,r=28){c.save();c.fillStyle='rgba(255,255,255,.6)';c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();c.strokeStyle=colors.blue;c.lineWidth=5;c.stroke();line(c,x+r*.7,y+r*.7,x+r*1.5,y+r*1.5,colors.support,9);c.restore();}
export function album(c:C,x:number,y:number,w=240,h=150){panel(c,x,y,w,h,colors.light,colors.dark);panel(c,x+8,y+7,w/2-10,h-14,'#fff',colors.border);panel(c,x+w/2+2,y+7,w/2-10,h-14,'#fff',colors.border);line(c,x+w/2,y+6,x+w/2,y+h-6,colors.support,3);}

type SceneProps={width?:number;height?:number;draw:(ctx:C,time:number)=>void;label:string;animate?:boolean;onPointerDown?:React.PointerEventHandler<HTMLCanvasElement>;onPointerMove?:React.PointerEventHandler<HTMLCanvasElement>;onPointerUp?:React.PointerEventHandler<HTMLCanvasElement>;onPointerCancel?:React.PointerEventHandler<HTMLCanvasElement>;onKeyDown?:React.KeyboardEventHandler<HTMLCanvasElement>;tabIndex?:number;style?:React.CSSProperties};
export function Scene({width=1080,height=280,draw,label:description,animate=false,style,...events}:SceneProps){
 const ref=useRef<HTMLCanvasElement>(null), drawRef=useRef(draw),ctxRef=useRef<C|null>(null);drawRef.current=draw;
 const paint=(time:number)=>{const c=ctxRef.current;if(!c)return;c.clearRect(0,0,width,height);c.fillStyle=colors.bg;c.fillRect(0,0,width,height);drawRef.current(c,time);ref.current?.classList.add('is-ready');};
 useEffect(()=>{const cv=ref.current;if(!cv)return;ctxRef.current=setupCanvas(cv,width,height);cv.style.width='100%';cv.style.height='auto';let raf:number|undefined;const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
 const tick=(t:number)=>{paint(t/1000);raf=requestAnimationFrame(tick);};const stop=()=>{if(raf!==undefined)cancelAnimationFrame(raf);raf=undefined;};const start=()=>{if(animate&&!reduced.matches&&raf===undefined)raf=requestAnimationFrame(tick);else paint(1.5);};
 paint(reduced.matches?1.5:performance.now()/1000);const disconnect=observeCanvas(cv,start,stop);return()=>{stop();disconnect();ctxRef.current=null;};},[width,height,animate]);
 useEffect(()=>{paint(window.matchMedia('(prefers-reduced-motion: reduce)').matches?1.5:performance.now()/1000);});
 return <canvas ref={ref} width={width} height={height} role="img" aria-label={description} {...events} style={{display:'block',width:'100%',height:'auto',borderRadius:8,touchAction:events.onPointerMove?'none':undefined,...style}}/>;
}
