import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { Canvas, C, arrow, label, card, photo, softmax, Feedback } from './clip-scenes';

function Direction() {
  const [theta, setTheta] = useState(60);
  const radians = theta * Math.PI / 180;
  const cosine = Math.cos(radians);
  const color = theta === 0 ? C.green : theta > 90 ? C.red : C.blue;
  return <>
    <Canvas ariaLabel={`两个单位向量夹角${theta}度，余弦${cosine.toFixed(3)}`} draw={ctx => {
      const ox=240, oy=160, r=96;
      label(ctx,'单位方向',140,33); label(ctx,'余弦分数',680,33);
      ctx.strokeStyle=C.border;ctx.lineWidth=2;ctx.beginPath();ctx.arc(ox,oy,r,0,Math.PI*2);ctx.stroke();
      ctx.beginPath();ctx.moveTo(ox-r-20,oy);ctx.lineTo(ox+r+20,oy);ctx.moveTo(ox,oy-r-12);ctx.lineTo(ox,oy+30);ctx.stroke();
      arrow(ctx,ox,oy,ox+r,oy,C.blue);
      arrow(ctx,ox,oy,ox+r*Math.cos(radians),oy-r*Math.sin(radians),C.orange);
      ctx.strokeStyle=C.purple;ctx.beginPath();ctx.arc(ox,oy,34,-radians,0);ctx.stroke();
      label(ctx,`${theta}°`,ox+45,oy-15,C.purple);
      const bx=650, by=165, bw=160;
      ctx.strokeStyle=C.border;ctx.beginPath();ctx.moveTo(bx-bw,by);ctx.lineTo(bx+bw,by);ctx.stroke();
      ctx.fillStyle=color;ctx.fillRect(cosine>=0?bx:bx+cosine*bw,by-24,Math.abs(cosine)*bw,48);
      label(ctx,'−1',bx-bw-15,by+65,C.muted);label(ctx,'0',bx-8,by+65,C.muted);label(ctx,'1',bx+bw-5,by+65,C.muted);
      label(ctx,`cos θ = ${cosine.toFixed(3)}`,835,160,color);
    }}/>
    <div className="ctrl"><label htmlFor="clip-angle">夹角 θ：<output>{theta}°</output></label><input id="clip-angle" aria-label="夹角 θ" type="range" min="0" max="180" step="1" value={theta} onChange={e=>setTheta(Number(e.target.value))} onKeyDown={e=>e.stopPropagation()}/><button className="chip" onClick={()=>setTheta(60)}>重置角度</button></div>
    <Feedback>几何关系：cos θ = {cosine.toFixed(3)}：{theta===0?'方向完全一致，分数为 1。':theta===90?'方向垂直，分数为 0。':theta===180?'方向相反，分数为 −1。':theta<90?'夹角小于 90°，方向有正向一致性。':'夹角大于 90°，分数为负。'} 归一化后的点积只看方向，分数本身不是“识别正确的概率”。</Feedback>
  </>;
}
function Temperature() {
  const [tau,setTau]=useState(.5);
  const scores=[.8,.5,.1];const weights=softmax(scores,1/tau);
  return <>
    <Canvas ariaLabel={`温度${tau.toFixed(2)}，第一候选权重${(weights[0]*100).toFixed(1)}%，排名不变`} draw={ctx=>{
      label(ctx,'匹配说明',70,32);label(ctx,'归一化权重',480,32);
      photo(ctx,55,70,150,'猫');
      weights.forEach((p,i)=>{const y=58+i*67;card(ctx,245,y,125+80*p,48,['猫','狗','车'][i],i===0?C.green:C.blue);ctx.fillStyle=i===0?C.green:C.blue;ctx.fillRect(490,y+10,p*370,30);label(ctx,`${(p*100).toFixed(1)}%`,880,y+33);});
    }}/>
    <div className="ctrl"><label htmlFor="clip-tau">温度 τ：<output>{tau.toFixed(2)}</output></label><input id="clip-tau" aria-label="温度 τ" type="range" min="0.05" max="1" step="0.01" value={tau} onChange={e=>setTau(Number(e.target.value))} onKeyDown={e=>e.stopPropagation()}/><button className="chip" onClick={()=>setTau(.5)}>重置温度</button></div>
    <table className="paper"><thead><tr><th>候选</th><th>固定余弦</th><th>缩放分数 s / τ</th><th>条件权重</th></tr></thead><tbody>{scores.map((s,i)=><tr key={i}><td>{['猫','狗','车'][i]}</td><td>{s.toFixed(2)}</td><td>{(s/tau).toFixed(2)}</td><td>{(weights[i]*100).toFixed(2)}%</td></tr>)}</tbody></table>
    <Feedback>固定分数算例：逆温度 1/τ = {(1/tau).toFixed(2)}，第一候选权重 {(weights[0]*100).toFixed(2)}%。降低正温度会使较高分数更占优势，但最高分始终对应“猫”：0.8 &gt; 0.5 &gt; 0.1。权重只是在这三个候选内归一化，不是经过校准的真实正确率。</Feedback>
  </>;
}
export const ClipCh4:React.FC<WidgetProps>=({moduleId})=>moduleId==='4.1'?<Direction/>:<Temperature/>;
