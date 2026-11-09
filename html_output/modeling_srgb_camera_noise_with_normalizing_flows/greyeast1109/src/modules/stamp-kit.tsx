import React,{useEffect,useRef} from 'react';
import {setupCanvas,observeCanvas} from '../lib/canvasKit';
export const C={bg:'#f5f8f0',light:'#b8c9a7',dark:'#76906a',support:'#92400e',blue:'#27446e',green:'#228d5c',red:'#c43f52',orange:'#f07e47',purple:'#7c3aed',text:'#21324a',muted:'#68778f',border:'#d7deea'};
type Props=Omit<React.CanvasHTMLAttributes<HTMLCanvasElement>,'width'|'height'> & {draw:(ctx:CanvasRenderingContext2D,w:number,h:number,t:number)=>void,width?:number,height?:number,label:string,animate?:boolean};
export function Canvas({draw,width=1080,height=280,label,animate=false,...rest}:Props){
 const ref=useRef<HTMLCanvasElement>(null),fn=useRef(draw);fn.current=draw;
 useEffect(()=>{const canvas=ref.current!;const ctx=setupCanvas(canvas,width,height);canvas.style.width='100%';canvas.style.maxWidth=width+'px';canvas.style.height='auto';let id=0,live=false;const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const render=(t:number)=>{clearScene(ctx,width,height);fn.current(ctx,width,height,reduce?750:t);canvas.classList.add('is-ready');};
 const tick=(t:number)=>{if(!live)return;render(t);if(animate&&!reduce)id=requestAnimationFrame(tick);};
 const stop=()=>{live=false;cancelAnimationFrame(id);};const start=()=>{if(live)return;live=true;tick(performance.now());};
 render(performance.now());const disconnect=observeCanvas(canvas,start,stop);return()=>{stop();disconnect();};},[width,height,animate]);
 useEffect(()=>{const canvas=ref.current;if(canvas){const ctx=canvas.getContext('2d');if(ctx){clearScene(ctx,width,height);draw(ctx,width,height,performance.now());}}},[draw,width,height]);
 return <canvas {...rest} ref={ref} aria-label={label} role={rest.tabIndex===undefined?'img':'slider'} style={{width:'100%',height:'auto',...rest.style}}/>;
}
export function clearScene(ctx:CanvasRenderingContext2D,w:number,h:number){ctx.clearRect(0,0,w,h);ctx.fillStyle=C.bg;ctx.fillRect(0,0,w,h);}
export function line(ctx:CanvasRenderingContext2D,x1:number,y1:number,x2:number,y2:number,color:string=C.border,width=2){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();}
export function text(ctx:CanvasRenderingContext2D,s:string,x:number,y:number,color:string=C.text,size=20){ctx.fillStyle=color;ctx.font=size+'px system-ui, Microsoft YaHei, sans-serif';ctx.fillText(s,x,y);}
export function paper(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number){ctx.fillStyle=C.light;ctx.fillRect(x+5,y+5,w,h);ctx.fillStyle='#fffefa';ctx.fillRect(x,y,w,h);ctx.strokeStyle=C.border;ctx.lineWidth=2;ctx.strokeRect(x,y,w,h);}
export function stamp(ctx:CanvasRenderingContext2D,x:number,y:number,scale=1,angle=0,color:string=C.blue){ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.scale(scale,scale);ctx.fillStyle=C.support;ctx.beginPath();ctx.roundRect(-12,-48,24,45,7);ctx.fill();ctx.fillStyle=C.light;ctx.beginPath();ctx.roundRect(-42,-12,84,22,4);ctx.fill();ctx.strokeStyle=C.dark;ctx.lineWidth=2;ctx.stroke();ctx.fillStyle=color;ctx.fillRect(-40,10,80,8);ctx.restore();}
export function imprint(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,color:string=C.green){ctx.save();ctx.strokeStyle=color;ctx.globalAlpha=.6;ctx.lineWidth=2;for(let i=0;i<6;i++){ctx.beginPath();ctx.ellipse(x+w/2,y+h/2,Math.max(1,w/2-i*5),Math.max(1,h/2-i*3),0,0,Math.PI*2);ctx.stroke();}ctx.restore();}
export function StampScene({action,color=C.blue}:{action:string,color?:string}){return <Canvas width={560} height={140} label="弹力印章拓印类比" animate draw={(ctx,w,h,t)=>{const s=Math.sin(t/3000*2*Math.PI);line(ctx,28,117,532,117,C.light,3);paper(ctx,170,78,220,34);imprint(ctx,247,84,66,19,color);
 if(action==='inspect'){ctx.save();ctx.translate(270+58*s,65);ctx.strokeStyle=C.support;ctx.lineWidth=7;ctx.beginPath();ctx.arc(0,0,25,0,Math.PI*2);ctx.stroke();line(ctx,17,19,40,41,C.support,10);ctx.fillStyle='rgba(184,201,167,.15)';ctx.beginPath();ctx.arc(0,0,22,0,Math.PI*2);ctx.fill();ctx.restore();}
 else if(action==='slide'){ctx.save();ctx.translate(215+45*s,65);ctx.fillStyle=C.light;ctx.fillRect(0,0,140,18);for(let i=0;i<14;i++)line(ctx,i*10,0,i*10,i%5===0?11:6,C.dark,1);ctx.restore();}
 else if(action==='finish'){paper(ctx,235+35*s,48,94,55);imprint(ctx,248+35*s,60,65,30,C.green);}
 else {ctx.save();if(action==='stretch'){ctx.translate(280,65);ctx.scale(1+.25*s,1);stamp(ctx,0,0,.9,0,color);}else{const y=action==='press'||action==='stamp'?63+12*s:66;const x=action==='align'?280+30*s:280;const angle=action==='turn'||action==='rotate'?.4*s:action==='choose'?.15*s:0;stamp(ctx,x,y,.85,angle,color);}ctx.restore();}
 }}/>;}
export function texture(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,conditional:boolean,seed=1){let k=seed>>>0;const rand=()=>{k=(Math.imul(k,1664525)+1013904223)>>>0;return(k+1)/4294967297;};
 for(let yy=0;yy<h;yy+=4)for(let xx=0;xx<w;xx+=4){const z=Math.sqrt(-2*Math.log(rand()))*Math.cos(6.2831853*rand());const base=150+45*Math.sin(xx/w*3);const amp=conditional?5+18*(.5+.5*Math.sin(xx/w*6)):12;const v=Math.max(0,Math.min(255,base+amp*z));ctx.fillStyle='rgb('+v+','+(v+2)+','+(v-3)+')';ctx.fillRect(x+xx,y+yy,4,4);}}
export function normalCurve(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,sigma:number,color:string=C.blue){line(ctx,x,y+h,x+w,y+h);ctx.strokeStyle=color;ctx.lineWidth=3;ctx.beginPath();for(let i=0;i<=200;i++){const v=(i/200-.5)*8;const p=Math.exp(-v*v/(2*sigma*sigma))/(sigma*Math.sqrt(2*Math.PI));const px=x+i/200*w,py=y+h-p*h*.4;if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);}ctx.stroke();}
