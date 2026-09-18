import React, {useEffect,useRef} from 'react';
import {setupCanvas,observeCanvas} from '../lib/canvasKit';
export const colors={bg:'#f5f8f0',light:'#b8c9a7',dark:'#76906a',support:'#92400e',blue:'#27446e',green:'#228d5c',red:'#c43f52',orange:'#f07e47',purple:'#7c3aed',text:'#21324a',muted:'#68778f',border:'#d7deea'};
export function clearScene(c:CanvasRenderingContext2D,w:number,h:number){c.clearRect(0,0,w,h);c.fillStyle=colors.bg;c.fillRect(0,0,w,h);}
export function drawLine(c:CanvasRenderingContext2D,points:[number,number][],color:string=colors.blue,width=3){if(!points.length)return;c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();}
export function drawLabel(c:CanvasRenderingContext2D,text:string,x:number,y:number,color:string=colors.text){c.fillStyle=color;c.font='500 20px "Microsoft YaHei", sans-serif';c.fillText(text,x,y);}
export function drawBoard(c:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,step:number=0,color:string=colors.blue){
 c.save();c.fillStyle=colors.light;c.fillRect(x+6,y+6,w,h);c.fillStyle='#fff';c.strokeStyle=colors.border;c.lineWidth=2;c.fillRect(x,y,w,h);c.strokeRect(x,y,w,h);
 const px=(v:number)=>x+v*w,py=(v:number)=>y+v*h;
 const paths:[[number,number],[number,number]][]=[[[.16,.15],[.16,.8]],[[.38,.15],[.38,.8]],[[.64,.15],[.64,.8]],[[.12,.3],[.85,.3]],[[.12,.58],[.85,.58]],[[.12,.8],[.85,.8]]];
 paths.forEach(p=>drawLine(c,p.map(([a,b])=>[px(a),py(b)]) as [number,number][],colors.light,2));
 c.fillStyle=colors.dark;[[.25,.43],[.5,.18],[.75,.7]].forEach(([a,b])=>{c.fillRect(px(a),py(b),w*.065,h*.1)});
 const route:[number,number][]=[[.16,.8],[.38,.8],[.38,.58],[.64,.58],[.64,.3]];
 const bounded=Math.max(0,Math.min(4,step));const full=Math.floor(bounded);const part=bounded-full;
 const p=route.slice(0,full+1).map(([a,b])=>[px(a),py(b)] as [number,number]);
 if(full<4&&part>0){const a=route[full],b=route[full+1];p.push([px(a[0]+(b[0]-a[0])*part),py(a[1]+(b[1]-a[1])*part)])}
 if(p.length>1)drawLine(c,p,color,5);
 c.fillStyle=colors.blue;c.beginPath();c.arc(px(.16),py(.8),5,0,Math.PI*2);c.fill();
 c.strokeStyle=colors.green;c.lineWidth=2;c.strokeRect(px(.64)-6,py(.3)-6,12,12);c.restore();
}
export function drawPencil(c:CanvasRenderingContext2D,x:number,y:number,angle=0,color:string=colors.support){c.save();c.translate(x,y);c.rotate(angle);c.fillStyle=color;c.fillRect(-5,-47,10,37);c.fillStyle='#e7c49a';c.beginPath();c.moveTo(-5,-10);c.lineTo(5,-10);c.lineTo(0,0);c.closePath();c.fill();c.fillStyle=colors.text;c.beginPath();c.arc(0,-2,2,0,Math.PI*2);c.fill();c.fillStyle=colors.orange;c.fillRect(-5,-52,10,7);c.restore();}
type SceneProps={draw:(c:CanvasRenderingContext2D,w:number,h:number,time:number)=>void;width?:number;height?:number;animate?:boolean;ariaLabel:string;onPointerDown?:React.PointerEventHandler<HTMLCanvasElement>;onPointerMove?:React.PointerEventHandler<HTMLCanvasElement>;onPointerUp?:React.PointerEventHandler<HTMLCanvasElement>};
export function Scene({draw,width=1080,height=280,animate=false,ariaLabel,...pointer}:SceneProps){
 const ref=useRef<HTMLCanvasElement>(null),latest=useRef(draw);latest.current=draw;
 useEffect(()=>{const canvas=ref.current;if(!canvas)return;const ctx=setupCanvas(canvas,width,height);canvas.style.width='100%';canvas.style.height='auto';let frame=0,visible=false,stopped=false;const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 const render=(t:number)=>{latest.current(ctx,width,height,reduced?1800:t);canvas.classList.add('is-ready');if(animate&&!reduced&&visible&&!stopped)frame=requestAnimationFrame(render)};
 const start=()=>{visible=true;cancelAnimationFrame(frame);render(performance.now())};const stop=()=>{visible=false;cancelAnimationFrame(frame)};render(performance.now());const disconnect=observeCanvas(canvas,start,stop);return()=>{stopped=true;stop();disconnect()};
 },[width,height,animate]);
 useEffect(()=>{const canvas=ref.current;if(!canvas||animate)return;const ctx=canvas.getContext('2d');if(ctx){draw(ctx,width,height,performance.now());canvas.classList.add('is-ready')}},[draw,width,height,animate]);
 return <canvas {...pointer} ref={ref} role="img" aria-label={ariaLabel} onKeyDown={e=>e.stopPropagation()} style={{display:'block',maxWidth:'100%',width:'100%',height:'auto',borderRadius:8,touchAction:pointer.onPointerDown?'none':'auto',cursor:pointer.onPointerDown?'grab':'default'}}/>;
}
export function CoreSupport(){return null;}
