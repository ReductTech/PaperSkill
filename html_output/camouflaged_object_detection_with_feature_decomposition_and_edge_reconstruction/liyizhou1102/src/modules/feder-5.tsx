import { useRef, useEffect, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';

const ink = '#275d55', seal = '#a54635', paper = '#faf6e9', muted = '#736951';
type G = CanvasRenderingContext2D;
function line(g:G, points:number[][], color:string, width:number) {
  g.strokeStyle=color; g.lineWidth=width; g.beginPath();
  points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y)); g.stroke();
}
function tablet(g:G,x:number,y:number,w:number,h:number){
  g.fillStyle='#e9dcc0'; g.strokeStyle='#ac9670'; g.lineWidth=2;
  g.beginPath();g.roundRect(x,y,w,h,[24,24,5,5]);g.fill();g.stroke();
  g.strokeRect(x+9,y+10,w-18,h-20);
}
function label(g:G,s:string,x:number,y:number){g.font='bold 19px sans-serif';g.fillStyle=muted;g.fillText(s,x,y);}
function View({paint,alt}:{paint:(g:G)=>void;alt:string}){
 const ref=useRef<HTMLCanvasElement>(null),latest=useRef(paint);latest.current=paint;
 useEffect(()=>{const el=ref.current;if(!el)return;const g=setupCanvas(el,1080,280);el.style.width='100%';el.style.height='auto';
 const render=()=>{g.save();g.fillStyle=paper;g.fillRect(0,0,1080,280);g.lineJoin='round';g.lineCap='round';latest.current(g);g.restore();el.classList.add('is-ready')};
 return observeCanvas(el,render,()=>{});},[paint]);
 return <canvas ref={ref} role="img" aria-label={alt} width={1080} height={280} />;
}
const routes=['D₁ · 浅层','D₂','D₃','D₄ · 深层'];
export function Feder05(){
 const [n,S]=useState(0);
 return <div><View alt={'高亮目标层：'+routes[n]+'；青绿色为跳接底版，朱砂为频率叠纸。'} paint={g=>{
 tablet(g,115,46,290,184);
 for(let i=0;i<5;i++)line(g,[[148,81+i*24],[224,74+i*24],[278,89+i*23],[364,79+i*24]],ink,2);
 if(n===0||n===3){g.globalAlpha=.22;g.fillStyle=seal;g.fillRect(141,66,235,137);g.globalAlpha=1;
 if(n===0)for(let i=0;i<10;i++)line(g,[[150+i*22,100],[158+i*22,94],[155+i*22,87]],seal,3);
 else{g.globalAlpha=.32;g.fillStyle=seal;g.beginPath();g.ellipse(262,134,80,43,-.2,0,Math.PI*2);g.fill();g.globalAlpha=1;}}
 for(let i=0;i<4;i++){const x=610+i*88,y=175-i*39;
 g.strokeStyle=n===i?seal:'#b7b099';g.lineWidth=n===i?4:2;g.fillStyle=n===i?'#f4dcca':'#f2ebda';g.fillRect(x,y,66,28);g.strokeRect(x,y,66,28);
 g.fillStyle=muted;g.font='16px sans-serif';g.fillText(String(i+1),x+29,y+20);}
 label(g,'套合拓纸',132,34);label(g,'解码输入',643,34);
 }}/><div className="ctrl">{routes.map((v,i)=><button key={v} type="button" aria-pressed={n===i} className={'chip'+(n===i?' active':'')} onClick={()=>S(i)}>{v}</button>)}</div>
 <div aria-live="polite" style={{color:ink,margin:'8px 0'}}>{['D₁：fᵣ₁ 与上采样后的高频聚合特征 fʰ₁ 拼接，经 1×1 卷积整合。','D₂：直接使用 fᵣ₂，没有额外的频带拼接。','D₃：直接使用 fᵣ₃，没有额外的频带拼接。','D₄：fᵣ₄ 与低频聚合特征 fˡ₃ 拼接，经 1×1 卷积整合。'][n]}</div>
 <div className="feedback" aria-live="polite">{n===0?'浅层接入高频，如同在底版对齐细刻痕；GFA 先在同一频带内逐级聚合，再接入解码器。':n===3?'深层接入低频，如同在底版对齐墨色的大轮廓。这里使用 fˡ₃，而不是所有尺度的低频相加。':'这一层保留原编码特征。论文式（9）并没有给每一层都拼接高频和低频。'}</div></div>;
}
