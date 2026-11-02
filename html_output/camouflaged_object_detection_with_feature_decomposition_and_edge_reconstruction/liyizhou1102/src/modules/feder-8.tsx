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
const stone=(c:Pen,x:number,y:number,size:number,filled:boolean)=>{c.save();c.translate(x,y);c.scale(size,size);c.beginPath();c.moveTo(-55,-37);c.bezierCurveTo(-10,-74,22,-26,58,-49);c.bezierCurveTo(84,-8,38,59,-5,44);c.bezierCurveTo(-36,24,-76,18,-55,-37);c.closePath();c.fillStyle=jade;c.strokeStyle=filled?ink:red;c.lineWidth=filled?2:5;if(filled)c.fill();c.stroke();c.restore();};
export function Feder8(){const [branch,setBranch]=useState(0),[level,setLevel]=useState(0);const limit=branch?4:5,weight=1/(2**level),name=branch?'边缘':'区域';
 const draw = (c: Pen) => {
   // Keep the object at the same relative position and size in both prediction maps.
   // The fifth (coarse) segmentation output and the deepest decoder output
   // use the same spatial resolution. These display sizes are schematic.
   const displayScale = [0.85, 0.72, 0.59, 0.46, 0.46][level];
   const drawMap = (centerX: number, scale: number) => {
     c.save();
     c.translate(centerX, 140);
     c.scale(scale, scale);
     c.strokeStyle = '#bdb29a';
     c.strokeRect(-135, -89, 270, 178);
     stone(c, 0, 0, 1, !branch);
     c.restore();
   };
   drawMap(285, displayScale);
   drawMap(795, 1);
   ln(c,460,140,620,140,ink,3);
   ln(c,605,125,620,140,ink,3);
   ln(c,605,155,620,140,ink,3);
   txt(c,'第 '+(level+1)+' 层预测',203,264);
   txt(c,'同一预测 · 已对齐标注尺寸',652,264);
 };
 return <div><Plot paint={draw} label={name+'第'+(level+1)+'级，对齐真值；该项权重'+weight}/><div className="ctrl"><label>输出分支 <select onKeyDown={e=>{if(e.key.startsWith("Arrow"))e.stopPropagation()}} value={branch} onChange={e=>{const v=Number(e.target.value);setBranch(v);if(v&&level===4)setLevel(3);}}><option value={0}>区域预测</option><option value={1}>边缘预测</option></select></label><label> 层级 <select onKeyDown={e=>{if(e.key.startsWith("Arrow"))e.stopPropagation()}} value={level} onChange={e=>setLevel(Number(e.target.value))}>{Array.from({length:limit},(_,i)=><option key={i} value={i}>第{i+1}级</option>)}</select></label></div><div className="feedback" aria-live="polite">第{level+1}级{name}输出上采样到对应真值尺寸，权重 = {weight}。{branch?'只与边缘真值算 Dice；边缘正样本远少于背景。':'与区域真值算加权 BCE + 加权 IoU；这项约束覆盖目标内部。'} <small>（式14；图案不是模型输出）</small></div></div>;}
