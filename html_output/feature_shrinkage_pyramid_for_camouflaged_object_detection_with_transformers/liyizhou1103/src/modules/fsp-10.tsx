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
const outline=(c:C)=>{c.beginPath();c.moveTo(200,138);c.bezierCurveTo(257,76,320,102,347,153);c.bezierCurveTo(316,193,265,211,200,138);c.closePath();};
export function Fsp10(){const [mode,sm]=useState(0),[reveal,sr]=useState(false);return <div><Canvas label={['极低光照','外观近似'][mode]+(reveal?'，轮廓提示已显示':'，轮廓提示已隐藏')} draw={c=>{c.save();c.translate(35,-10);c.scale(1.7,1.08);c.fillStyle=mode?'#a3a795':'#25343a';c.fillRect(21,27,548,198);for(let i=0;i<85;i++){const y=28+i*2.3;line(c,22,y,568,y+Math.sin(i*.35)*5,mode?'#a9ad9d':'#29383c',1);}
 outline(c);c.fillStyle=mode?'#a6aa98':'#29373c';c.fill();c.save();c.clip();for(let i=0;i<30;i++)line(c,170,90+i*4,360,93+i*4,mode?'#a9ad9d':'#2a383e',1);c.restore();
 if(reveal){outline(c);c.setLineDash([5,4]);c.strokeStyle='#f4c787';c.lineWidth=2.3;c.stroke();c.setLineDash([]);}c.restore();}}/><div className="ctrl"><Select label="困难场景" options={['极低光照','目标与背景外观极近']} index={mode} change={v=>{sm(v);sr(false);}}/><button type="button" aria-pressed={reveal} onClick={()=>sr(!reveal)}>{reveal?'隐藏轮廓提示':'查看轮廓提示'}</button></div><div className="feedback" aria-live="polite">{mode?'布块与底布的外观几乎相同，即使有光也难确定分界。':'照度很低，目标与背景都暗，图像里可用的线索很弱。'} {reveal?'虚线是人为添加的教学标记，不是 FSPNet 的预测。':'先辨认轮廓，再打开提示核对。'} 补充§7.4、图10给出实例，未报告这两类场景的失败率。</div></div>;}
