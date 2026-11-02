import { useEffect, useRef, useState } from 'react';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';

const W=1080,H=280, ink='#204b49',jade='#29816b',red='#ac493e',paper='#f8f3e7';
type Pen=CanvasRenderingContext2D;
function Plot({paint,label}:{paint:(c:Pen)=>void;label:string}){
 const ref=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{const el=ref.current;if(!el)return;const c=setupCanvas(el,W,H);el.style.maxWidth="100%";el.style.height="auto";
 const render=()=>{c.fillStyle=paper;c.fillRect(0,0,W,H);c.lineWidth=2;c.lineCap='round';c.lineJoin='round';paint(c);el.classList.add('is-ready');};
 const disconnect=observeCanvas(el,render,()=>{});return disconnect;
 },[paint]);return <canvas ref={ref} width={W} height={H} role="img" aria-label={label} style={{maxWidth:'100%',height:'auto'}}/>;
}
function ln(c:Pen,x:number,y:number,x2:number,y2:number,color:string,width=2){c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(x,y);c.lineTo(x2,y2);c.stroke();}
function txt(c:Pen,t:string,x:number,y:number,color=ink){c.font='600 24px system-ui';c.fillStyle=color;c.fillText(t,x,y);}
const sets=['CHAMELEON · 76张','CAMO · 250张','COD10K · 2026张','NC4K · 4121张'];const metrics=['M ↓','自适应 Fβ ↑','平均 Eφ ↑','结构 Sα ↑'];
const base=[[.024,.858,.943,.902],[.066,.792,.877,.820],[.029,.740,.888,.838],[.043,.814,.896,.853]];
const newer=[[.023,.869,.959,.906],[.064,.801,.893,.827],[.028,.756,.913,.837],[.041,.832,.915,.859]];
export function Feder9(){const [s,ss]=useState(2),[m,sm]=useState(1);const a=base[s][m],b=newer[s][m],max=m?1:.1,ok=m?b>a:b<a;
 return <div><Plot label={'ZoomNet '+a+'，FEDER-MIS '+b} paint={c=>{for(let i=0;i<=10;i++){let x=225+77*i;ln(c,x,46,x,220,'#ded6c7',1);}[a,b].forEach((v,i)=>{c.fillStyle=i?jade:ink;c.fillRect(225,70+i*85,770*v/max,38);txt(c,i?'FEDER-MIS':'ZoomNet',45,99+i*85);});}}/><div className="ctrl"><label>测试集 <select onKeyDown={e=>{if(e.key.startsWith("Arrow"))e.stopPropagation()}} value={s} onChange={e=>ss(Number(e.target.value))}>{sets.map((name,i)=><option value={i} key={name}>{name}</option>)}</select></label> <label>指标 <select onKeyDown={e=>{if(e.key.startsWith("Arrow"))e.stopPropagation()}} value={m} onChange={e=>sm(Number(e.target.value))}>{metrics.map((name,i)=><option value={i} key={name}>{name}</option>)}</select></label></div><div className={'feedback '+(ok?'good':'')} aria-live="polite">{sets[s]}，{metrics[m]}：ZoomNet {a.toFixed(3)}，FEDER-MIS {b.toFixed(3)}。{m?'越高':'越低'}越好；该格 FEDER-MIS {ok?'占优':'略低于 ZoomNet'}。图轴 0–{max}，两行均采用 ResNet50、多输入尺度。<small>（表1）</small></div></div>;}
