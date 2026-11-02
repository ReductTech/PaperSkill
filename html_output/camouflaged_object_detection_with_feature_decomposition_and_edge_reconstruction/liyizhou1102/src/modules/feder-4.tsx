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
export function Feder04(){
 const [mode,S]=useState(0);const hf=mode===0;
 const names=['高频 HFA','低频 LFA'];
 return <div><View alt={hf?'拓片细密刀纹，对应局部纹理响应示意':'拓片大片深浅变化，对应低频全局响应示意'} paint={g=>{
 tablet(g,120,48,288,186);
 const cols=12,rows=6;
 for(let i=0;i<cols;i++)for(let j=0;j<rows;j++){
 const central=Math.abs(j-2.5+Math.sin(i*.5)*1.2)<1.3;
 const strength=hf?(central?(.35+.6*Math.abs(Math.sin(i*3.7+j*5.1))):.1):.1+.8*Math.exp(-((i-6)**2/18+(j-2)**2/7));
 g.globalAlpha=.2+strength*.68;
 if(hf){line(g,[[140+i*21,73+j*24],[149+i*21,63+j*24]],ink,central?3:1);}
 else{g.fillStyle=ink;g.fillRect(137+i*21,64+j*24,21,24);}
 g.globalAlpha=1;g.fillStyle='rgba(39,93,85,'+strength+')';g.fillRect(630+i*25,62+j*25,23,23);
 }
 line(g,[[465,144],[556,144],[541,133]],seal,3);line(g,[[556,144],[541,155]],seal,3);
 label(g,'拓片取纹',135,35);label(g,'注意响应',632,35);
 }}/><div className="ctrl">{names.map((v,i)=><button key={v} type="button" className={'chip'+(mode===i?' active':'')} aria-pressed={mode===i} onClick={()=>S(i)}>{v}</button>)}</div>
 <div style={{color:ink,margin:'8px 0'}}>{hf?'高频特征 → 带 BN 的残差块 → 空间与通道联合注意':'低频特征 → 带 IN 的残差块 → 位置归一化 PN → 空间与通道联合注意'}</div>
 <div className="feedback" aria-live="polite">{hf?'这一视图突出局部刻纹。HFA 保留纹理后，判断哪些位置、哪些通道值得关注；高频里也可能有背景纹理。':'这一视图保留大片深浅关系。LFA 通过两种归一化抑制冗余与扰动，再计算注意力；低频并不等于背景。'}</div></div>;
}
