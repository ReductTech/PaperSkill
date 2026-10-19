import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { StudyCanvas, palette, drawPaper, drawPencil, drawGuide, drawArrow, drawTarget, drawLabel } from './studio-kit';

const clamp = (n:number) => Math.max(-4, Math.min(4, n));
const fmt = (n:number) => Number(n.toFixed(2)).toString();

export function Ch4Main(){
  const [point,setPoint] = useState({u:3,v:4});
  const dragging = useRef(false);
  const {u,v}=point;
  const original=[u,2,v,1], projected=[0,0,v,1];
  const removed=u*u+4, remaining=v*v+1;
  const readPoint=(event:PointerEvent<HTMLCanvasElement>)=>{
    const box=event.currentTarget.getBoundingClientRect();
    return {x:(event.clientX-box.left)*1080/box.width,y:(event.clientY-box.top)*280/box.height};
  };
  const update=(event:PointerEvent<HTMLCanvasElement>)=>{const p=readPoint(event);setPoint({u:Math.round(clamp((p.x-260)/23)*100)/100,v:Math.round(clamp((140-p.y)/23)*100)/100});};
  const pointerDown=(event:PointerEvent<HTMLCanvasElement>)=>{
    const p=readPoint(event);
    if(Math.hypot(p.x-(260+u*23),p.y-(140-v*23))>30)return;
    event.preventDefault();event.currentTarget.focus({preventScroll:true});event.currentTarget.setPointerCapture(event.pointerId);dragging.current=true;update(event);
  };
  const pointerEnd=(event:PointerEvent<HTMLCanvasElement>)=>{dragging.current=false;if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);};
  const keyDown=(event:KeyboardEvent<HTMLCanvasElement>)=>{
    const delta:{[key:string]:[number,number]}={ArrowLeft:[-.25,0],ArrowRight:[.25,0],ArrowDown:[0,-.25],ArrowUp:[0,.25]};
    if(!delta[event.key])return;event.preventDefault();const [du,dv]=delta[event.key];setPoint(p=>({u:clamp(p.u+du),v:clamp(p.v+dv)}));
  };
  return <>
    <StudyCanvas ariaLabel={`可拖动梯度端点：u等于${fmt(u)}，v等于${fmt(v)}。聚焦后用左右键改变u、上下键改变v，每次0.25，范围负4到4。`} role="application" tabIndex={0} style={{touchAction:'none',cursor:'grab'}} onPointerDown={pointerDown} onPointerMove={event=>{if(dragging.current)update(event);}} onPointerUp={pointerEnd} onPointerCancel={pointerEnd} onLostPointerCapture={()=>{dragging.current=false;}} onKeyDown={keyDown} draw={(c)=>{
      drawPaper(c,24,20,480,240);drawPaper(c,536,20,520,240);
      c.strokeStyle=palette.border;c.lineWidth=1;
      for(let i=-4;i<=4;i++){c.beginPath();c.moveTo(168+i*23+92,48);c.lineTo(168+i*23+92,232);c.stroke();c.beginPath();c.moveTo(168,140+i*23);c.lineTo(352,140+i*23);c.stroke();}
      drawGuide(c,268,35,210,Math.PI/2);
      drawArrow(c,260,140,260+u*23,140-v*23,palette.orange,3);
      c.strokeStyle=palette.red;c.setLineDash([5,5]);c.beginPath();c.moveTo(260+u*23,140-v*23);c.lineTo(260,140-v*23);c.stroke();c.setLineDash([]);
      if(Math.abs(v)>.01)drawArrow(c,260,140,260,140-v*23,palette.green,5);
      drawTarget(c,260,140-v*23,8,palette.green);
      drawPencil(c,275,140-v*23,v>=0?.5:-.5,palette.green);
      c.fillStyle=palette.orange;c.beginPath();c.arc(260+u*23,140-v*23,11,0,Math.PI*2);c.fill();c.strokeStyle='#fff';c.lineWidth=3;c.stroke();
      drawLabel(c,'拖动端点',48,48);drawLabel(c,'分量变化',562,48);
      const base=156, scale=22;
      c.strokeStyle=palette.border;c.beginPath();c.moveTo(565,base);c.lineTo(1023,base);c.stroke();
      original.forEach((value,i)=>{const x=600+i*112;c.fillStyle=palette.orange;c.fillRect(x,Math.min(base,base-value*scale),22,Math.max(2,Math.abs(value*scale)));c.fillStyle=palette.green;c.fillRect(x+30,Math.min(base,base-projected[i]*scale),22,Math.max(2,Math.abs(projected[i]*scale)));});
    }}/>
    <div className="ctrl"><span>橙色：原梯度　绿色：投影后</span><button className="tiny ghost" onClick={()=>setPoint({u:3,v:4})}>恢复 u=3，v=4</button></div>
    <p>拖住左侧橙色端点移动。横向改变受保护的第 1 项 u，纵向改变可学习的第 3 项 v。按 Tab 聚焦画布后，方向键每次移动 0.25。</p>
    <table className="paper" style={{width:'100%'}}><caption>教学向量：第 1、2 项由 e₁、e₂ 保护</caption><thead><tr><th>向量</th>{['e₁ 方向','e₂ 方向','e₃ 方向','e₄ 方向'].map(s=><th key={s}>{s}</th>)}</tr></thead><tbody><tr><th>原梯度 g</th>{original.map((n,i)=><td key={i}>{fmt(n)}</td>)}</tr><tr><th>投影后 ĝ</th>{projected.map((n,i)=><td key={i}>{fmt(n)}</td>)}</tr></tbody></table>
    <div className="metrics"><div className="metric"><div className="l">移除能量 u²+4</div><div className="v">{fmt(removed)}</div></div><div className="metric"><div className="l">保留能量 v²+1</div><div className="v">{fmt(remaining)}</div></div><div className="metric"><div className="l">保护方向残留</div><div className="v">0</div></div></div>
    <div className="feedback good" aria-live="polite">g=({original.map(fmt).join(', ')}) → ĝ=({projected.map(fmt).join(', ')})。总能量 {fmt(removed+remaining)} = 移除 {fmt(removed)} + 保留 {fmt(remaining)}。</div>
  </>;
}
