
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

export function Feder3B(){

 const [s,setS]=useState(0);const names=['高频 · HFA','低频 · LFA'];
 const ref=useDrawing(c=>{plate(c,65,28,340,224);mark(c,230,144,ink);
 c.save();if(s===0){c.strokeStyle=clay;c.lineWidth=4;for(let i=0;i<7;i++){c.beginPath();c.moveTo(146+20*i,169);c.lineTo(162+20*i,128);c.stroke();}}
 else{const g=c.createRadialGradient(220,138,10,220,138,108);g.addColorStop(0,'#266e6a80');g.addColorStop(1,'#266e6a00');c.fillStyle=g;c.fillRect(100,32,255,212);}c.restore();
 const points=s?[485,646,810,967]:[485,722,967];points.forEach((x,i)=>{if(i){c.strokeStyle='#acaa98';c.beginPath();c.moveTo(points[i-1]+36,140);c.lineTo(x-36,140);c.stroke();}
 c.fillStyle=i===points.length-1?'#e3f1e9':'#fff9e9';c.strokeStyle=s?teal:clay;c.lineWidth=3;c.beginPath();c.roundRect(x-37,103,74,74,10);c.fill();c.stroke();
 for(let n=0;n<3;n++){c.beginPath();c.moveTo(x-20,125+n*12);c.lineTo(x+20,125+n*12-(s?0:(n%2)*8));c.stroke();}
 });});
 return <><canvas ref={ref} role="img" aria-label={s?'底色示意与低频归一化路径':'纹理示意与高频残差注意力路径'}/>{choices(names,s,setS)}<div className="ctrl"><b>处理路径</b><span>{s?'低频特征 → ResIN → PN → JA':'高频特征 → ResB → JA'}</span></div>{note(s?'式3：低频侧先用含实例归一化的残差块，再做位置归一化，最后用联合注意力选择有用的整体线索。':'式2：高频侧先用含批归一化的残差块保留纹理，再用空间与通道联合注意力筛选响应；强边缘本身不等于目标。')}</>;

}
