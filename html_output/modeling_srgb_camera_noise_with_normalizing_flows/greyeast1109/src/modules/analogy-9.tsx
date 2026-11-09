import React,{useState} from 'react';
import {Canvas,C,StampScene,line,text,clearScene} from './stamp-kit';
const feedback=['整数格点：连续密度可能只在离散点处变得极尖；高密度不等于学到了合理离散概率。','双图去量化：Ĩ 加 u₁，I 加 u₂；残差为 2+u₁−u₂，示意范围 (1,3)。'];
export function Analogy9(){return <StampScene action="slide"/>;}
export function Lab9(){const [mode,setMode]=useState(0);
 const draw=(ctx:CanvasRenderingContext2D,w:number,h:number)=>{clearScene(ctx,w,h);line(ctx,65,228,485,228,C.border);line(ctx,595,228,1015,228,C.border);text(ctx,'观测强度',65,34,C.muted,18);text(ctx,'残差分布',595,34,C.muted,18);
  const axis=(x:number,n:number)=>{line(ctx,x,224,x,233,C.border);ctx.fillStyle=C.muted;ctx.font='15px sans-serif';ctx.textAlign='center';ctx.fillText(String(n),x,253);};
  [119,120,121,122,123,124].forEach(n=>axis(65+(n-119)*84,n));[0,1,2,3,4].forEach(n=>axis(595+n*105,n));
  if(!mode){[120,122].forEach((n,i)=>{const x=65+(n-119)*84;line(ctx,x,228,x,75,i?C.blue:C.dark,4);ctx.fillStyle=i?C.blue:C.dark;ctx.beginPath();ctx.arc(x,75,6,0,Math.PI*2);ctx.fill();});line(ctx,805,228,805,65,C.red,4);ctx.fillStyle=C.red;ctx.beginPath();ctx.arc(805,65,6,0,Math.PI*2);ctx.fill();}
  else{[120,122].forEach((n,i)=>{const x=65+(n-119)*84;ctx.fillStyle=i?'#d8e4f1':'#dce7d5';ctx.fillRect(x,85,84,143);ctx.strokeStyle=i?C.blue:C.dark;ctx.lineWidth=3;ctx.strokeRect(x,85,84,143);});ctx.beginPath();ctx.moveTo(700,228);ctx.lineTo(805,65);ctx.lineTo(910,228);ctx.closePath();ctx.fillStyle='#dbeee0';ctx.fill();ctx.strokeStyle=C.green;ctx.lineWidth=4;ctx.stroke();}
 };
 return <><Canvas draw={draw} label="切换整数观测与双图去量化，观察残差从格点变成三角形连续分布"/><div className="chip-row" style={{flexWrap:'wrap'}}>{['整数格点','双图去量化'].map((s,i)=><button key={s} aria-pressed={mode===i} className={'chip '+(mode===i?'selected':'')} onClick={()=>setMode(i)}>{s}</button>)}</div><div className={'feedback '+(mode?'good':'bad')} aria-live="polite">{feedback[mode]}</div></>;
}
