
import { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
const teal='#266e6a', ink='#343d38', clay='#b95137', paper='#f6f0df';
function useDrawing(draw:(c:CanvasRenderingContext2D)=>void){
  const ref=useRef<HTMLCanvasElement>(null);
  useEffect(()=>{ const el=ref.current; if(!el)return; const c=setupCanvas(el,1080,280);
    el.style.width='100%';el.style.height='auto';
    const render=()=>{c.fillStyle=paper;c.fillRect(0,0,1080,280);c.lineWidth=2;c.lineCap='round';c.lineJoin='round';draw(c);el.classList.add('is-ready');};render();
    return observeCanvas(el,render,()=>{});},[draw]);return ref;
}
function choices(names:string[],value:number,select:(s:number)=>void){
  return <div className="ctrl">{names.map((name,i)=><button key={name} type="button" className={'chip'+(i===value?' active':'')} aria-pressed={i===value} onClick={()=>select(i)}>{name}</button>)}</div>;
}
function plate(c:CanvasRenderingContext2D,x:number,y:number,w:number,h:number){
  c.fillStyle='#ebe2ca';c.strokeStyle='#c8bba0';c.lineWidth=2;c.beginPath();c.roundRect(x,y,w,h,12);c.fill();c.stroke();
  c.save();c.beginPath();c.rect(x+3,y+3,w-6,h-6);c.clip();
  for(let i=0;i<48;i++){const a=x+(37*i%Math.floor(w)),b=y+(67*i%Math.floor(h));c.strokeStyle=i%3?'#d5cbb2':'#cdbfa3';c.beginPath();c.moveTo(a,b);c.bezierCurveTo(a+28,b-10,a+42,b+5,a+61,b-5);c.stroke();}c.restore();
}
function mark(c:CanvasRenderingContext2D,x:number,y:number,color:string,gap=false){
 c.save();c.translate(x,y);c.strokeStyle=color;c.lineWidth=4;c.beginPath();c.moveTo(-78,12);c.bezierCurveTo(-48,-58,42,-69,83,-4);if(gap)c.moveTo(57,20);c.bezierCurveTo(26,52,-45,65,-78,12);c.stroke();c.restore();
}
function note(txt:string){return <div role="status" style={{borderLeft:'3px solid '+teal,background:'#f1f5ee',padding:'8px 13px',color:ink}}>{txt}</div>}

export function Feder2A(){

 const [s,setS]=useState(0);const names=['CFE · 编码','DWD · 频率分解','SED · 边缘辅助'];
 const ref=useDrawing(c=>{plate(c,25,37,287,204);mark(c,165,139,s===2?teal:ink,s<2);
 if(s===1){c.save();c.strokeStyle=clay;c.lineWidth=3;for(let i=0;i<6;i++){c.beginPath();c.moveTo(115+14*i,169);c.lineTo(145+14*i,114);c.stroke();}c.restore();}
 const centers=[465,700,935];centers.forEach((x,i)=>{c.lineWidth=3;if(i<2){c.strokeStyle=i===s?teal:'#b7ac92';c.beginPath();c.moveTo(x+62,140);c.lineTo(x+160,140);c.lineTo(x+150,134);c.moveTo(x+160,140);c.lineTo(x+150,146);c.stroke();}
 c.fillStyle=i===s?'#e1f0e7':'#fffcf2';c.strokeStyle=i===s?clay:'#b7ac92';c.beginPath();c.roundRect(x-57,81,114,118,15);c.fill();c.stroke();
 c.strokeStyle=teal;c.lineWidth=3;
 if(i===0){for(let n=0;n<3;n++)c.strokeRect(x-36+n*9,111+n*8,45,35);}
 if(i===1){for(let n=0;n<4;n++){c.beginPath();c.moveTo(x-38,140);c.lineTo(x+36,111+19*n);c.stroke();}}
 if(i===2){c.beginPath();c.ellipse(x,140,34,20,-.3,0,Math.PI*2);c.fillStyle='#99beb1';c.fill();c.stroke();}
 });});
 return <><canvas ref={ref} role="img" aria-label={'拓片和网络流程图，已选 '+names[s]} onClick={e=>{const r=e.currentTarget.getBoundingClientRect(),x=(e.clientX-r.left)*1080/r.width,y=(e.clientY-r.top)*280/r.height;if(y>=81&&y<=199){[465,700,935].forEach((cx,i)=>{if(Math.abs(cx-x)<=57)setS(i)});}}}/>{choices(names,s,setS)}{note(['编码：由骨干提取多层特征，R-Net 输出四层压缩表示；最深层经 e-ASPP 生成粗分割，作为解码起点。','分解：对编码特征学习高、低频滤波，频率注意力与 GFA 选择并聚合线索；式9定义四层解码输入。','解码：RRS 利用粗分割的反向注意力修正区域，OER 提供边缘特征；系统输出分割图与辅助边缘图。'][s])}</>;

}
