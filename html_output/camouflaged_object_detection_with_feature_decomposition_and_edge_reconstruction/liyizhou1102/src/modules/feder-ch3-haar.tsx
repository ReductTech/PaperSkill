
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
function note(txt:string){return <div role="status" style={{borderLeft:'3px solid '+teal,background:'#f1f5ee',padding:'8px 13px',color:ink}}>{txt}</div>}

export function Feder3A(){

 const [s,setS]=useState(0);const names=['平坦底色','左右明暗','上下明暗','交错刻纹'];
 const values=[[1,1,1,1],[1,0,1,0],[1,1,0,0],[1,0,0,1]][s], [a,b,c0,d]=values;
 const bands=[(a+b+c0+d)/2,(a-b+c0-d)/2,(a+b-c0-d)/2,(a-b-c0+d)/2];
 const ref=useDrawing(c=>{plate(c,55,22,340,236);values.forEach((v,i)=>{c.fillStyle=v?'#eee5ce':ink;c.strokeStyle='#b6a98c';const x=132+i%2*77,y=64+Math.floor(i/2)*76;c.fillRect(x,y,73,72);c.strokeRect(x,y,73,72);});
 const zero=154;c.strokeStyle='#b9b399';c.beginPath();c.moveTo(480,zero);c.lineTo(1010,zero);c.stroke();bands.forEach((v,i)=>{const x=540+120*i;c.fillStyle=i===0?teal:clay;c.fillRect(x-22,Math.min(zero,zero-v*56),44,Math.max(2,Math.abs(v)*56));});});
 return <><canvas ref={ref} role="img" aria-label={'左为拓纹采样，右为四个系数；当前 '+names[s]}/>{choices(names,s,setS)}<div className="ctrl"><b>采样矩阵</b><span>[{a}, {b}; {c0}, {d}]</span><b>四个系数</b><span>{['LL','LH','HL','HH'].map((n,i)=>n+' '+bands[i].toFixed(1)).join('　')}</span></div>{note(['四个值不变，只有 LL 响应。正交归一化下 LL 是四项之和除以2，不是四项的平均值。','这里第一字母代表行轴、第二字母代表列轴；左右相减留下 LH 响应，表示列方向变化。','上下相减留下 HL 响应，表示行方向变化；方向命名需随滤波轴约定一起读。','对角两格与另外两格不同，因此 HH 有响应。这个固定 Haar 算例只解释分解，不冒充已训练滤波响应。'][s])}</>;

}
