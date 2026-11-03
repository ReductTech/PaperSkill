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
export function Fsp7(){const [k,change]=useState(3);const ws=[1/16,1/8,1/4,1],w=ws[k];return <div><Canvas label={'当前侧输出 P'+k+' 的权重为 '+w} draw={c=>{for(let i=0;i<4;i++){let x=104+i*230,y=208;const height=160*ws[i];c.fillStyle=grid;c.fillRect(x,48,150,160);c.fillStyle=i===k?teal:'#b2c7b7';c.fillRect(x,y-height,150,height);if(i===k){c.lineWidth=4;c.strokeStyle=navy;c.strokeRect(x-5,42,160,172);}}text(c,'逐层权重',103,250);text(c,'最终输出',793,250);}}/><div className="ctrl"><Select label="检查哪一层" options={['P₀ · 第一层','P₁ · 第二层','P₂ · 第三层','P₃ · 最终输出']} index={k} change={change}/></div><div className="feedback" aria-live="polite">P{k} 对照同一掩膜 G，权重为 {w}。若单项 BCE = 0.8，则它对总损失的贡献为 {(0.8*w).toFixed(2)}。{k===3?'最终输出的权重直接取 1，不套用前三层的指数公式。':'柱高表示损失权重，不表示预测精度。'}</div></div>;}
