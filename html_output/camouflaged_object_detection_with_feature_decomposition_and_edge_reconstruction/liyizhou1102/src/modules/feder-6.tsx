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
export function Feder06(){
 const [p,S]=useState(.2);const rev=1-p, response=.8*rev;
 const point=(ev:React.PointerEvent<HTMLDivElement>)=>{const r=ev.currentTarget.getBoundingClientRect();S(Math.round(Math.min(1,Math.max(0,(ev.clientX-r.left)/r.width))*100)/100)};
 return <div><div style={{touchAction:'pan-y',cursor:'crosshair'}} onPointerDown={ev=>{ev.currentTarget.setPointerCapture(ev.pointerId);point(ev)}} onPointerMove={ev=>{if(ev.currentTarget.hasPointerCapture(ev.pointerId))point(ev)}}><View alt={'粗预测前景概率 '+p.toFixed(2)+'，反向门控 '+rev.toFixed(2)+'，门控后的示例特征 '+response.toFixed(2)} paint={g=>{
 tablet(g,116,48,292,184);
 for(let i=0;i<8;i++){const x=150+i*29;line(g,[[x,90],[x+10,109],[x+3,132],[x+15,164]],ink,3);}
 g.fillStyle='#efe5cb';g.fillRect(230,113,68,47);
 g.globalAlpha=rev;for(let j=0;j<5;j++)line(g,[[233+j*12,118],[239+j*12,131],[235+j*12,152]],seal,3);g.globalAlpha=1;
 for(const [i,v] of [p,rev,response].entries()){let x=624+112*i;g.fillStyle='#e2d9c2';g.fillRect(x,58,76,165);g.fillStyle=[muted,seal,ink][i];g.fillRect(x,223-v*165,76,v*165);}
 label(g,'漏墨位置',133,34);label(g,'门控计算',642,34);
 }}/></div><p>横向拖动图面或下方滑块，观察漏墨位置的反向门控。</p><div className="ctrl"><label htmlFor="feder06-p">粗预测前景概率 <strong>{p.toFixed(2)}</strong></label><input id="feder06-p" type="range" onKeyDown={e=>{if(e.key.startsWith("Arrow"))e.stopPropagation()}} min={0} max={1} step={.01} value={p} onChange={e=>S(Number(e.target.value))}/></div>
 <div aria-live="polite" style={{color:ink,margin:'8px 0'}}>从左至右：粗预测 {p.toFixed(2)} ｜ 反向门控 {rev.toFixed(2)} ｜ 门控特征 0.8 × {rev.toFixed(2)} = {response.toFixed(3)}</div>
 <div className="feedback" aria-live="polite">{p<.35?'粗预测给出较低前景概率，这个位置保留较多特征供再判断。它也可能是真背景；反向门控本身不能判定漏检。':p>.65?'粗预测已强烈响应，这个位置被反向权重压低。解码器仍需融合边缘特征，门控结果并非最终掩膜。':'该位置部分保留。反向门控是 1−p，不是只在 p=0.5 最大的不确定度指标。'}</div></div>;
}
