import { useState } from 'react';
import type { PointerEvent } from 'react';
import { C, SceneCanvas, clearScene, drawSetting, drawHiker, drawCamp, drawTrail, drawLine, drawDot, drawText } from './cm-kit';
const EPS=.002,T=80;
const clamp=(v:number)=>Math.max(EPS,Math.min(T,v));
export function Noise(){
  const [t,setT]=useState(20);
  const update=(e:PointerEvent<HTMLCanvasElement>)=>{const rect=e.currentTarget.getBoundingClientRect();const x=(e.clientX-rect.left)*1080/rect.width;setT(clamp(EPS+(x-600)/410*(T-EPS)));};
  return <div>
    <SceneCanvas tabIndex={0} ariaLabel="噪声时间示意；拖动底部横轴，或按左右方向键改变噪声时间" style={{touchAction:'none'}} onPointerDown={e=>{e.currentTarget.focus();e.currentTarget.setPointerCapture(e.pointerId);update(e);}} onPointerMove={e=>{if(e.currentTarget.hasPointerCapture(e.pointerId))update(e);}} onPointerUp={e=>{if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);}} onKeyDown={e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();e.stopPropagation();setT(v=>clamp(v+(e.key==='ArrowRight'?2:-2)));}else if(e.key==='Home'){e.preventDefault();e.stopPropagation();setT(EPS);}else if(e.key==='End'){e.preventDefault();e.stopPropagation();setT(T);}}} draw={ctx=>{
      clearScene(ctx);drawSetting(ctx,520,280);const p=(t-EPS)/(T-EPS),trail:[number,number][]=Array.from({length:45},(_,i)=>{const f=i/44;return [100+350*f,195-100*f+25*Math.sin(f*7)];});drawTrail(ctx,trail,C.light,4);drawCamp(ctx,100,195,.8);const h=trail[Math.round(p*44)];drawHiker(ctx,h[0],h[1],C.blue,0,.8);
      drawText(ctx,'噪声位置',45,35);drawText(ctx,'二维扰动',575,35);
      drawLine(ctx,620,150,1010,150,C.border,2);drawLine(ctx,810,55,810,210,C.border,2);
      const noiseScale=t/T;
      ctx.strokeStyle=C.purple;ctx.lineWidth=3;ctx.beginPath();ctx.arc(810,143,78*noiseScale,0,Math.PI*2);ctx.stroke();drawDot(ctx,810,143,5,C.green);drawLine(ctx,810,143,810+95*noiseScale,143-48*noiseScale,C.blue,3);drawDot(ctx,810+95*noiseScale,143-48*noiseScale,8,C.blue);
      drawLine(ctx,600,245,1010,245,C.muted,3);drawDot(ctx,600+410*p,245,10,C.orange);
    }}/>
    <div className="controls" style={{display:'flex',flexWrap:'wrap',alignItems:'center',gap:8,marginTop:12}}><button className="chip" disabled={t<=EPS} onClick={()=>setT(v=>clamp(v-2))}>减小噪声</button><button className="chip" disabled={t>=T} onClick={()=>setT(v=>clamp(v+2))}>增大噪声</button><output>t = {t.toFixed(3)} · ε = 0.002 · T = 80</output></div>
    <div>圆半径和点的位移都正比于 t；接近 ε 时扰动小到难以分辨，标记大小仅为便于观察。固定教学噪声方向不代表严格的 PF ODE 轨迹。</div>
    <div className="feedback" role="status" style={{color:C.blue}}>{t<2?'接近 ε 时输入接近数据端，仍不把 ε 说成 0。':t>55?'较大 t 时噪声尺度更大；T=80 来自本文实验设置。':'t 控制高斯扰动标准差，不是扩散采样的第几次调用。'}</div>
  </div>;
}
