
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

export function Feder1A(){

 const [s,setS]=useState(0);const labels=['内在相似 · IS','边缘破坏 · ED'];
 const ref=useDrawing(c=>{plate(c,65,35,407,210);plate(c,610,35,407,210);
 mark(c,269,144,s?ink:'#c5b89c',s===1);
 if(s===0){c.setLineDash([7,7]);c.strokeStyle=clay;c.strokeRect(734,95,152,93);c.setLineDash([]);mark(c,810,144,'#cbbda1');}
 else{mark(c,811,144,teal,true);c.strokeStyle=clay;c.lineWidth=3;c.beginPath();c.arc(880,155,25,0,2*Math.PI);c.stroke();}
 });
 return <><canvas ref={ref} role="img" aria-label={s?'左侧刻线中断，右侧标记轮廓缺口':'左侧刻线接近底色，右侧虚框只表示粗定位'}/>{choices(labels,s,setS)}{note(s?'边缘破坏：轮廓所在区域已知，但朱砂圈内的刻线断开；粗定位不能决定缺口处哪些像素属于目标。':'内在相似：浅刻与石纹接近，连候选区域也难确定。虚线框只表示粗定位，不能充当分割掩膜。')}</>;

}
