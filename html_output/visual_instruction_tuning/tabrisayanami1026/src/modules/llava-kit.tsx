import React, {useEffect,useRef} from 'react';
import {setupCanvas,observeCanvas} from '../lib/canvasKit';

export const colors={bg:'#f5f8f0',light:'#b8c9a7',dark:'#76906a',blue:'#27446e',green:'#228d5c',red:'#c43f52',orange:'#f07e47',purple:'#7c3aed',ink:'#21324a',line:'#d7deea'};
type CanvasProps=Omit<React.CanvasHTMLAttributes<HTMLCanvasElement>,'width'|'height'> & {draw:(c:CanvasRenderingContext2D,t:number)=>void;width?:number;height?:number;label:string;animate?:boolean};
export function Canvas({draw,width=1080,height=280,label,animate=false,...props}:CanvasProps){
 const ref=useRef<HTMLCanvasElement>(null),drawing=useRef(draw),redraw=useRef<()=>void>(()=>{});drawing.current=draw;
 useEffect(()=>{const canvas=ref.current;if(!canvas)return;const ctx=setupCanvas(canvas,width,height);canvas.style.width='100%';canvas.style.height='auto';let raf=0,visible=false;const media=matchMedia('(prefers-reduced-motion: reduce)');
 const render=(t:number)=>{drawing.current(ctx,t);canvas.classList.add('is-ready');};
 const tick=(t:number)=>{raf=0;render(t);if(visible&&animate&&!media.matches)raf=requestAnimationFrame(tick);};
 const stop=()=>{visible=false;if(raf)cancelAnimationFrame(raf);raf=0;};
 const start=()=>{visible=true;render(media.matches?1500:performance.now());if(animate&&!media.matches&&!raf)raf=requestAnimationFrame(tick);};
 redraw.current=()=>render(media.matches?1500:performance.now());render(media.matches?1500:performance.now());
 const disconnect=observeCanvas(canvas,start,stop);const change=()=>{stop();start();};media.addEventListener('change',change);
 return()=>{stop();disconnect();media.removeEventListener('change',change);redraw.current=()=>{};};},[width,height,animate]);
 useEffect(()=>{redraw.current();});
 return <canvas {...props} ref={ref} aria-label={label} role={props.role??'img'} width={width} height={height} style={{width:'100%',height:'auto',display:'block',...props.style}}/>;
}
export function clearScene(c:CanvasRenderingContext2D,w=1080,h=280){c.clearRect(0,0,w,h);c.fillStyle=colors.bg;c.fillRect(0,0,w,h);c.lineWidth=2;c.font='22px "Microsoft YaHei",sans-serif';c.textAlign='left';c.textBaseline='alphabetic';}
export function drawCard(c:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,active=false){c.fillStyle='#fff';c.strokeStyle=active?colors.orange:colors.line;c.lineWidth=active?4:2;c.beginPath();c.roundRect(x,y,w,h,10);c.fill();c.stroke();}
export function drawPhoto(c:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,o:{background?:number;highlight?:'house'|'boat'|'all'|'none';covered?:boolean;grid?:boolean}={}){
 c.save();c.translate(x,y);c.scale(w/400,h/200);drawCard(c,0,0,400,200);c.fillStyle=(o.background??1)>0?'#dce9ec':'#eee4d8';c.fillRect(8,8,384,184);c.fillStyle=colors.light;c.fillRect(8,132,384,60);
 c.fillStyle='#e9dfc8';c.strokeStyle=colors.dark;c.lineWidth=2;c.fillRect(56,85,110,75);c.strokeRect(56,85,110,75);c.fillStyle=colors.blue;c.beginPath();c.moveTo(41,85);c.lineTo(111,30);c.lineTo(181,85);c.closePath();c.fill();
 c.fillStyle='#fff';c.fillRect(73,104,25,24);c.fillRect(127,104,24,24);c.strokeRect(73,104,25,24);c.strokeRect(127,104,24,24);c.fillStyle='#92400e';c.fillRect(105,127,16,33);
 c.fillStyle=colors.blue;c.beginPath();c.moveTo(242,151);c.lineTo(355,151);c.lineTo(335,178);c.lineTo(263,178);c.closePath();c.fill();c.strokeStyle='#92400e';c.lineWidth=4;c.beginPath();c.moveTo(296,53);c.lineTo(296,155);c.stroke();c.fillStyle='#fff';c.beginPath();c.moveTo(292,57);c.lineTo(250,139);c.lineTo(292,139);c.closePath();c.fill();c.strokeStyle=colors.dark;c.lineWidth=2;c.stroke();
 if(o.grid){c.strokeStyle=colors.dark;c.lineWidth=1;c.beginPath();c.moveTo(200,8);c.lineTo(200,192);c.moveTo(8,100);c.lineTo(392,100);c.stroke();}
 if(o.highlight&&o.highlight!=='none'){c.strokeStyle=colors.orange;c.lineWidth=5;c.setLineDash([8,4]);if(o.highlight==='house'||o.highlight==='all')c.strokeRect(32,22,158,146);if(o.highlight==='boat'||o.highlight==='all')c.strokeRect(232,44,131,140);c.setLineDash([]);}
 if(o.covered){c.fillStyle='#e8e9e5';c.fillRect(8,8,384,184);c.strokeStyle=colors.dark;c.beginPath();c.moveTo(40,30);c.lineTo(360,170);c.moveTo(360,30);c.lineTo(40,170);c.stroke();}c.restore();
}
export function drawPen(c:CanvasRenderingContext2D,x:number,y:number,angle=0,color:string=colors.blue){c.save();c.translate(x,y);c.rotate(angle);c.fillStyle=color;c.fillRect(0,-7,65,14);c.fillStyle='#dfc29b';c.beginPath();c.moveTo(-16,0);c.lineTo(0,-7);c.lineTo(0,7);c.closePath();c.fill();c.fillStyle=colors.ink;c.beginPath();c.moveTo(-16,0);c.lineTo(-10,-3);c.lineTo(-10,3);c.closePath();c.fill();c.restore();}
export function drawBars(c:CanvasRenderingContext2D,values:number[],o:{x?:number;y?:number;width?:number;height?:number;max?:number;colors?:string[]}={}){const{x=550,y=40,width=480,height=190}=o;const max=o.max??Math.max(1,...values.map(Math.abs));const negative=values.some(v=>v<0),zero=negative?y+height/2:y+height,scale=(negative?height/2:height)/max;const slot=width/Math.max(values.length,1);c.strokeStyle=colors.line;c.lineWidth=2;c.beginPath();c.moveTo(x,zero);c.lineTo(x+width,zero);c.stroke();values.forEach((v,i)=>{c.fillStyle=o.colors?.[i]??colors.blue;const bh=Math.abs(v)*scale;c.fillRect(x+i*slot+slot*.2,v>=0?zero-bh:zero,slot*.6,bh);});}
export function Chips({labels,value,onChange,label}:{labels:string[];value:number;onChange:(i:number)=>void;label?:string}){return <div className="ctrl" role="group" aria-label={label??'选择模式'} style={{flexWrap:'wrap'}}>{labels.map((s,i)=><button key={s} type="button" className={`chip ${i===value?'selected':''}`} aria-pressed={i===value} onClick={()=>onChange(i)}>{s}</button>)}</div>;}
export function Steps({value,max,onChange}:{value:number;max:number;onChange:(n:number)=>void}){return <div className="ctrl" style={{flexWrap:'wrap'}}><button type="button" className="tiny" onClick={()=>onChange(0)}>重置</button><button type="button" className="tiny" disabled={value===0} onClick={()=>onChange(value-1)}>上一步</button><span aria-live="polite">{value} / {max}</span><button type="button" className="tiny" disabled={value===max} onClick={()=>onChange(value+1)}>{value===max?'已完成':'下一步'}</button></div>;}
export function Feedback({children,tone=''}:{children:React.ReactNode;tone?:'good'|'bad'|''}){return <div className={`feedback ${tone}`} aria-live="polite">{children}</div>;}
export function Detail({children}:{children:React.ReactNode}){return <div style={{minHeight:68,margin:'16px 0',lineHeight:1.85,overflowWrap:'anywhere',overflowX:'auto'}}>{children}</div>;}
export function softmax(v:number[]){const m=Math.max(...v),e=v.map(x=>Math.exp(x-m)),sum=e.reduce((a,b)=>a+b,0);return e.map(x=>x/sum);}
export function projectionStep(w:number,eta:number){const p=1/(1+Math.exp(-2*w)),loss=-Math.log(p),gradient=2*(p-1);return{p,loss,gradient,next:w-eta*gradient};}
export function KitAnchor(){return null;}
