import {useEffect,useRef,useState} from 'react';
import {setupCanvas,observeCanvas} from '../lib/canvasKit';
type C=CanvasRenderingContext2D;
const teal='#327267',navy='#294858',red='#ac5444',sand='#f5f0e3',grid='#d9cfb8';
function Canvas({draw,label}:{draw:(c:C)=>void;label:string}){const ref=useRef<HTMLCanvasElement>(null);useEffect(()=>{const el=ref.current;if(!el)return;const c=setupCanvas(el,1080,280);el.style.maxWidth='100%';el.style.height='auto';const paint=()=>{c.fillStyle=sand;c.fillRect(0,0,1080,280);draw(c);el.classList.add('is-ready');};return observeCanvas(el,paint,()=>{});},[draw]);return <canvas width={1080} height={280} role="img" aria-label={label} ref={ref}/>;}
function line(c:C,x:number,y:number,u:number,v:number,color:string,w=2){c.lineWidth=w;c.strokeStyle=color;c.beginPath();c.moveTo(x,y);c.lineTo(u,v);c.stroke();}
function text(c:C,s:string,x:number,y:number,color=navy){c.font='600 24px system-ui';c.fillStyle=color;c.fillText(s,x,y);}
function Select({label,options,index,change}:{label:string;options:string[];index:number;change:(v:number)=>void}){return <label>{label} <select value={index} onChange={e=>change(Number(e.target.value))}>{options.map((s,i)=><option value={i} key={s}>{s}</option>)}</select></label>;}
const sets=['CAMO · 250 张','COD10K · 2026 张','NC4K · 4121 张'];
const ms=['结构 Sₘ ↑','加权 Fβ ↑','平均 Fβ ↑','平均 Eφ ↑','最大 Eφ ↑','平均绝对误差 M ↓'];
const rows=[[0.82,0.752,0.794,0.878,0.892,0.066,0.838,0.729,0.766,0.888,0.911,0.029,0.853,0.784,0.818,0.896,0.912,0.043],[0.856,0.799,0.83,0.899,0.928,0.05,0.851,0.735,0.769,0.895,0.93,0.026,0.879,0.816,0.843,0.915,0.937,0.035]];
export function Fsp8(){const [s,ss]=useState(1),[m,sm]=useState(1);const a=rows[0][s*6+m],b=rows[1][s*6+m],max=m===5?.1:1;return <div><Canvas label={'ZoomNet '+a+'；FSPNet '+b} draw={c=>{for(let i=0;i<=10;i++)line(c,200+i*80,44,200+i*80,221,grid,1);[a,b].forEach((v,i)=>{c.fillStyle=i?teal:navy;c.fillRect(200,75+i*86,800*v/max,40);text(c,i?'FSPNet':'ZoomNet',56,103+i*86);});}}/><div className="ctrl"><Select label="测试集" options={sets} index={s} change={ss}/><Select label="指标" options={ms} index={m} change={sm}/></div><div className="feedback" aria-live="polite">{sets[s]} · {ms[m]}：ZoomNet {a.toFixed(3)}，FSPNet {b.toFixed(3)}，原始差值（后者减前者）{b>a?'+':''}{(b-a).toFixed(3)}。双柱同轴 0–{max}，{m===5?'越低越好':'越高越好'}。</div></div>;}
