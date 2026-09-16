import { useEffect, useRef, type CanvasHTMLAttributes, type ReactNode } from 'react';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';

export const C = { bg:'#f5f8f0',paper:'#ffffff',light:'#b8c9a7',neutral:'#b8c9a7',dark:'#76906a',support:'#92400e',blue:'#27446e',green:'#228d5c',red:'#c43f52',orange:'#f07e47',purple:'#7c3aed',ink:'#21324a',text:'#21324a',muted:'#68778f',line:'#d7deea',axis:'#d7deea' };
type Draw = (ctx:CanvasRenderingContext2D,time:number)=>void;
type SceneProps = Omit<CanvasHTMLAttributes<HTMLCanvasElement>,'height'|'width'|'children'> & {draw:Draw;width?:number;height?:number;animate?:boolean;label?:string};
export function Scene({draw,width=1080,height=280,animate=false,label:ariaLabel='交互图示',style,...props}:SceneProps){
  const ref=useRef<HTMLCanvasElement>(null); const render=useRef(draw); render.current=draw;
  useEffect(()=>{
    const canvas=ref.current;if(!canvas)return;
    const ctx=setupCanvas(canvas,width,height);canvas.style.width='100%';canvas.style.height='auto';let frame=0,active=false;
    const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const paint=(t:number)=>{ctx.clearRect(0,0,width,height);ctx.fillStyle=C.bg;ctx.fillRect(0,0,width,height);ctx.save();render.current(ctx,reduced?1500:t);ctx.restore();canvas.classList.add('is-ready');};
    const loop=(t:number)=>{if(!active)return;paint(t);frame=requestAnimationFrame(loop);};
    paint(performance.now());
    const stop=()=>{active=false;cancelAnimationFrame(frame);};
    const unobserve=observeCanvas(canvas,()=>{if(active)return;active=true;paint(performance.now());if(animate&&!reduced)frame=requestAnimationFrame(loop);},stop);
    return()=>{stop();unobserve();};
  },[width,height,animate]);
  useEffect(()=>{const canvas=ref.current;if(!canvas)return;const ctx=canvas.getContext('2d');if(!ctx)return;const dpr=window.devicePixelRatio||1;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,width,height);ctx.fillStyle=C.bg;ctx.fillRect(0,0,width,height);ctx.save();draw(ctx,performance.now());ctx.restore();canvas.classList.add('is-ready');},[draw,width,height]);
  return <canvas ref={ref} role="img" aria-label={ariaLabel} {...props} onKeyDown={e=>{props.onKeyDown?.(e);if(e.key.startsWith('Arrow'))e.stopPropagation();}} style={{display:'block',maxWidth:'100%',height:'auto',borderRadius:8,margin:'0 auto 16px',touchAction:props.onPointerMove?'none':undefined,...style}}/>;
}
export function rounded(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,fill:string,stroke?:string){ctx.beginPath();ctx.roundRect(x,y,w,h,Math.min(8,Math.max(0,w/2),Math.max(0,h/2)));ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke();}}
export function label(ctx:CanvasRenderingContext2D,text:string,x:number,y:number,color:string=C.ink){ctx.fillStyle=color;ctx.font='20px "Microsoft YaHei",sans-serif';ctx.textAlign='left';ctx.fillText(text,x,y);}
export function book(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,accent:string=C.blue){
  rounded(ctx,x-5,y+5,w+10,h+9,C.light);rounded(ctx,x,y,w,h,C.paper,C.line);
  ctx.strokeStyle=C.support;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+w/2,y+5);ctx.lineTo(x+w/2,y+h-5);ctx.stroke();
  for(let side=0;side<2;side++){for(let i=0;i<5;i++){ctx.strokeStyle=i===2?accent:C.line;ctx.lineWidth=i===2?4:2;ctx.beginPath();ctx.moveTo(x+14+side*w/2,y+20+i*(h-34)/5);ctx.lineTo(x+w/2-14+side*w/2-(i%2)*12,y+20+i*(h-34)/5);ctx.stroke();}}
}
export function pen(ctx:CanvasRenderingContext2D,x:number,y:number,angle:number,color:string=C.blue){ctx.save();ctx.translate(x,y);ctx.rotate(angle);rounded(ctx,-4,-55,8,47,color);ctx.beginPath();ctx.moveTo(-4,-8);ctx.lineTo(4,-8);ctx.lineTo(0,3);ctx.closePath();ctx.fillStyle=C.support;ctx.fill();ctx.restore();}
export function Feedback({children,tone='blue'}:{children:ReactNode;tone?:string}){return <div role="status" aria-live="polite" className={`feedback ${tone==='green'?'good':tone==='red'?'bad':''}`} style={tone==='orange'?{borderColor:C.orange}:undefined}>{children}</div>;}
export function Chips({items,value,onChange}:{items:string[];value:number;onChange:(value:number)=>void}){return <div className="chip-row">{items.map((item,i)=><button type="button" key={item} className={`chip ${value===i?'selected':''}`} aria-pressed={value===i} onClick={()=>onChange(i)}>{item}</button>)}</div>;}
export function Stat({label:txt,value}:{label:string;value:ReactNode}){return <div className="metric"><div className="l">{txt}</div><div className="v" style={{overflowWrap:'anywhere'}}>{value}</div></div>;}
function magnifier(ctx:CanvasRenderingContext2D,x:number,y:number,color:string){ctx.strokeStyle=C.support;ctx.lineWidth=9;ctx.beginPath();ctx.moveTo(x+17,y+17);ctx.lineTo(x+40,y+40);ctx.stroke();ctx.fillStyle='#ffffff88';ctx.strokeStyle=color;ctx.lineWidth=5;ctx.beginPath();ctx.arc(x,y,24,0,Math.PI*2);ctx.fill();ctx.stroke();}
function ArchiveAnimation({mode}:{mode:number}){
  const draw:Draw=(ctx,t)=>{
    const p=(Math.sin(t/3000*Math.PI*2)+1)/2;
    book(ctx,135,18,290,100,mode===0?C.red:C.green);
    if(mode===0||mode===1){magnifier(ctx,165+220*p,55,C.blue);}
    if(mode===11||mode===6){magnifier(ctx,342+8*Math.sin(t/900),65,C.green);}
    if(mode===2){const x=155+240*p;ctx.fillStyle=C.orange;ctx.beginPath();ctx.moveTo(x,14);ctx.lineTo(x+17,14);ctx.lineTo(x+17,61);ctx.lineTo(x+8.5,53);ctx.lineTo(x,61);ctx.closePath();ctx.fill();}
    if(mode===3){ctx.strokeStyle=C.green;ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(346,66,54,14,0,-Math.PI/2,-Math.PI/2+Math.PI*2*Math.min(1,p*1.5));ctx.stroke();pen(ctx,346+54*Math.cos(p*Math.PI*2),66+14*Math.sin(p*Math.PI*2),.5,C.green);}
    if(mode===4){ctx.save();ctx.translate(180+150*p,62);ctx.rotate(-.1);rounded(ctx,-45,-12,95,24,C.light,C.dark);for(let j=0;j<9;j++){ctx.strokeStyle=C.dark;ctx.beginPath();ctx.moveTo(-35+j*9,-12);ctx.lineTo(-35+j*9,j%2===0?1:-4);ctx.stroke();}ctx.restore();}
    if(mode===5){ctx.save();ctx.translate(280,20);const fold=Math.cos(p*Math.PI);ctx.fillStyle=C.paper;ctx.strokeStyle=C.line;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(125*fold,9);ctx.lineTo(125*fold,97);ctx.lineTo(0,97);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();}
    if(mode===7){ctx.strokeStyle=C.light;ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(301,67);ctx.quadraticCurveTo(340,43,397,69);ctx.stroke();ctx.strokeStyle=C.green;ctx.beginPath();ctx.moveTo(301,67);ctx.quadraticCurveTo(301+39*p,67-24*p,301+96*p,67+2*p);ctx.stroke();pen(ctx,301+96*p,67+2*p,.5,C.green);}
    if(mode===8){ctx.strokeStyle=C.purple;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(397,36);ctx.lineTo(397,36+60*p);ctx.stroke();pen(ctx,397,36+60*p,.5,C.purple);}
    if(mode===9){ctx.save();ctx.translate(394,20+8*p);ctx.strokeStyle=C.support;ctx.lineWidth=5;ctx.beginPath();ctx.roundRect(-13,-9,26,45,10);ctx.stroke();ctx.restore();}
    if(mode===10){ctx.strokeStyle=C.green;ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(325,65);ctx.lineTo(338,78);ctx.lineTo(338+38*p,78-34*p);ctx.stroke();pen(ctx,338+38*p,78-34*p,.4,C.green);}
  };
  return <Scene draw={draw} width={560} height={140} animate label="资料册查证的生活类比动画"/>;
}
export function HeroOld(){return <ArchiveAnimation mode={0}/>;} export function HeroNew(){return <ArchiveAnimation mode={11}/>;}
export function Analogy1(){return <ArchiveAnimation mode={1}/>;} export function Analogy2(){return <ArchiveAnimation mode={2}/>;}
export function Analogy3(){return <ArchiveAnimation mode={3}/>;} export function Analogy4(){return <ArchiveAnimation mode={4}/>;}
export function Analogy5(){return <ArchiveAnimation mode={5}/>;} export function Analogy6(){return <ArchiveAnimation mode={6}/>;}
export function Analogy7(){return <ArchiveAnimation mode={7}/>;} export function Analogy8(){return <ArchiveAnimation mode={8}/>;}
export function Analogy9(){return <ArchiveAnimation mode={9}/>;} export function Analogy10(){return <ArchiveAnimation mode={10}/>;}
