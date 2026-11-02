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
const labels=['去掉 DWD','去掉 OER','固定小波','去掉高频注意','去掉低频注意','上采样替代 GFA','固定门系数','去掉耦合','普通残差块','换成 RK4'];
const vals=[
 [[.035,.697,.861,.794],[.049,.776,.873,.817]],[[.034,.714,.871,.804],[.048,.780,.889,.834]],
 [[.032,.731,.895,.822],[.046,.811,.899,.844]],[[.033,.728,.895,.817],[.047,.805,.891,.840]],[[.033,.724,.887,.816],[.047,.803,.892,.841]],[[.033,.720,.894,.810],[.047,.804,.890,.838]],
 [[.032,.731,.899,.817],[.046,.814,.895,.842]],[[.032,.723,.885,.821],[.046,.798,.892,.840]],[[.033,.722,.881,.811],[.047,.802,.895,.843]],[[.031,.742,.905,.829],[.045,.816,.906,.848]]];
const full=[[.032,.740,.900,.823],[.045,.817,.905,.846]];
export function Feder10(){const [variant,sv]=useState(0),[set,ss]=useState(0);const row=vals[variant][set],ref=full[set],delta=row[1]-ref[1],signed=(delta>=0?'+':'')+delta.toFixed(3);
 return <div><Plot label={'变体减完整模型，自适应 Fβ 差值 '+signed} paint={c=>{for(let i=-5;i<=5;i++){let x=540+i*80;ln(c,x,62,x,204,i===0?ink:'#ddd5c6',i===0?3:1);}let end=540+delta*8000;c.fillStyle=delta>=0?jade:red;c.fillRect(Math.min(540,end),110,Math.max(2,Math.abs(end-540)),44);txt(c,'变体更低',112,238);txt(c,'变体更高',870,238);}}/><div className="ctrl"><label>消融设置 <select onKeyDown={e=>{if(e.key.startsWith("Arrow"))e.stopPropagation()}} value={variant} onChange={e=>sv(Number(e.target.value))}>{labels.map((l,i)=><option value={i} key={l}>{l}</option>)}</select></label> <label>测试集 <select onKeyDown={e=>{if(e.key.startsWith("Arrow"))e.stopPropagation()}} value={set} onChange={e=>ss(Number(e.target.value))}><option value={0}>COD10K</option><option value={1}>NC4K</option></select></label></div>
 <table style={{width:'100%',textAlign:'left',borderSpacing:'12px 6px'}}><caption>表2 · {set?'NC4K-Test':'COD10K-Test'} · 同条件消融</caption><thead><tr>{['设置','M ↓','自适应 Fβ ↑','平均 Eφ ↑','Sα ↑'].map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{[ref,row].map((r,i)=><tr key={i}><th>{i?labels[variant]:'完整 FEDER'}</th>{r.map((v,j)=><td key={j}>{v.toFixed(3)}</td>)}</tr>)}</tbody></table>
 <div className="feedback" aria-live="polite">{labels[variant]}相对完整 FEDER：Fβ 差值 {signed}（图轴 −0.05 至 +0.05）。{variant===9?'作者为性能和效率选择 RK2；表中没有 GPU 时延或 FLOPs，不能据此计算速度差。':'这一对照仅支持当前数据集、骨干和设置下的组件贡献，不能推出任意架构中的收益。'}</div></div>;}
