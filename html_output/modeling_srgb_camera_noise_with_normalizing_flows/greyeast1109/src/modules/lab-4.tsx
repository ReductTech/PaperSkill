import React,{useState} from 'react';
import {Canvas,C,paper,stamp,line,text} from './stamp-kit';
export function Lab4(){
 const [a,setA]=useState(1);
 const peak=1/(a*Math.sqrt(2*Math.PI));
 return <>
 <Canvas label="缩放参数控制橡胶宽度和高斯密度" draw={(ctx)=>{
  paper(ctx,55,170,400,65);line(ctx,55,225,455,225,C.support,3);
  ctx.save();ctx.translate(255,130);ctx.scale(a,1);stamp(ctx,0,0,1,0,C.blue);ctx.restore();
  for(let i=-2;i<=2;i++){ctx.fillStyle=C.orange;ctx.fillRect(255+i*18*a-2,178,4,28);}
  text(ctx,'橡胶尺度',55,40);text(ctx,'残差密度',565,40);
  const x=(n:number)=>800+n*25, y=(p:number)=>235-p*135;
  line(ctx,565,235,1035,235);line(ctx,800,55,800,235,C.border,1);
  const pdf=(n:number)=>Math.exp(-n*n/(2*a*a))/(a*Math.sqrt(2*Math.PI));
  ctx.fillStyle='rgba(39,68,110,.16)';ctx.beginPath();ctx.moveTo(x(-a),235);
  for(let j=0;j<=120;j++){const n=-a+2*a*j/120;ctx.lineTo(x(n),y(pdf(n)));}
  ctx.lineTo(x(a),235);ctx.closePath();ctx.fill();
  ctx.strokeStyle=C.blue;ctx.lineWidth=3;ctx.beginPath();
  for(let j=0;j<=360;j++){const n=-9+18*j/360;if(j===0)ctx.moveTo(x(n),y(pdf(n)));else ctx.lineTo(x(n),y(pdf(n)));}ctx.stroke();
  line(ctx,x(-a),235,x(-a),y(pdf(-a)),C.orange,3);line(ctx,x(a),235,x(a),y(pdf(a)),C.orange,3);
 }}/>
 <div className="ctrl"><label htmlFor="density-scale">缩放 a <output className="val">{a.toFixed(1)}</output></label><input id="density-scale" type="range" min="0.3" max="3" step="0.1" value={a} onKeyDown={e=>e.stopPropagation()} onChange={e=>setA(Number(e.currentTarget.value))} onInput={e=>setA(Number(e.currentTarget.value))}/></div>
 <div style={{display:'flex',justifyContent:'center',gap:'12px 28px',flexWrap:'wrap',margin:'12px 0',fontVariantNumeric:'tabular-nums'}} aria-live="polite"><span>密度峰值：<b>{peak.toFixed(3)}</b></span><span>对应区间：<b>[−{a.toFixed(1)}, {a.toFixed(1)}]</b></span><span>区间概率：<b>68.27%</b></span><span>雅可比绝对值：<b>{(1/a).toFixed(3)}</b></span></div>
 <div className="feedback" aria-live="polite">{a<1?'a 较小：同一概率集中到更窄的残差区间，峰值升高。':'a 较大：分布更宽，峰值降低；乘上雅可比后，区间质量仍相同。'}</div>
 </>;
}
