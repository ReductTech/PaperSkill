import { useState } from 'react';
import { CanvasPlot, COLORS as C, clearScene, sketch, pencil, line, box, dot, text } from './vdsr-kit';
const rates=[0.1,0.01,0.001]; const theta=0.1;
const modes=[{id:'off',label:'不裁剪'},{id:'fixed',label:'固定阈值 1'},{id:'adjustable',label:'可调 θ/γ'}];
export function VdsrClipping(){
 const [g,setG]=useState(4); const [rate,setRate]=useState(0.1); const [mode,setMode]=useState('off');
 const limit=mode==='off'?Infinity:mode==='fixed'?1:theta/rate; const clipped=Math.max(-limit,Math.min(limit,g)); const delta=-rate*clipped; const tooLarge=Math.abs(delta)>theta+1e-10;
 return <div className="vdsr-widget" onKeyDown={e=>{if(["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Home","End"].includes(e.key))e.stopPropagation();}}>
 <div className="vdsr-controls"><label>单个梯度分量 g：{g.toFixed(1)} <input aria-label="单个梯度分量" type="range" min="-8" max="8" step="0.1" value={g} onChange={e=>setG(Number(e.target.value))}/></label></div>
 <div className="vdsr-controls" aria-label="学习率">{rates.map(r=><button key={r} aria-pressed={rate===r} className={rate===r?'is-active':''} onClick={()=>setRate(r)}>γ = {r}</button>)}</div>
 <div className="vdsr-controls" aria-label="裁剪模式">{modes.map(m=><button key={m.id} aria-pressed={mode===m.id} className={mode===m.id?'is-active':''} onClick={()=>setMode(m.id)}>{m.label}</button>)}</div>
 <div className="vdsr-metrics"><span>示意 θ = 0.10</span><span>阈值：{Number.isFinite(limit)?`±${limit.toFixed(2)}`:'无限制'}</span><span>裁后 g̃ = {clipped.toFixed(2)}</span><span>梯度项 Δ = {delta.toFixed(4)}</span></div>
 <CanvasPlot label={`梯度贡献示意：梯度项为${delta.toFixed(4)}；${tooLarge?'超过':'未超过'}示意界0.10。右侧轴范围负0.8至正0.8。`} draw={(ctx,w,h)=>{
 clearScene(ctx,w,h); sketch(ctx,65,40,340,185,.3,C.blue); const pressure=Math.min(Math.abs(delta)/.8,1); pencil(ctx,240,100+pressure*100,tooLarge?C.red:C.green,-.8);
 if(tooLarge){line(ctx,200,190,225,175,C.red,3);line(ctx,225,175,250,195,C.red,3);line(ctx,250,195,275,180,C.red,3);}
 const x0=w*.54,x1=w-60,cy=h*.5,mid=(x0+x1)/2,scale=(x1-x0)/1.6; box(ctx,mid-theta*scale,cy-32,2*theta*scale,64,'#e0f0e5');line(ctx,x0,cy,x1,cy,C.axis,3);line(ctx,mid,cy-45,mid,cy+45,C.axis,2);line(ctx,mid-theta*scale,cy-34,mid-theta*scale,cy+34,C.green,2);line(ctx,mid+theta*scale,cy-34,mid+theta*scale,cy+34,C.green,2);dot(ctx,mid+delta*scale,cy,12,tooLarge?C.red:C.green);text(ctx,'力度示意',130,28,C.muted,20);text(ctx,'梯度项',x0,28,C.muted,20);
 }}/>
 <div className="vdsr-metrics"><span>右轴 Δ 范围 −0.8 至 +0.8</span><span>绿色带：−0.10 至 +0.10</span></div>
 <p className="vdsr-feedback" aria-live="polite">{mode==='off'?`未裁剪：梯度项更新 ${delta.toFixed(4)}，${tooLarge?'超出':'未超出'}示意阈值 0.10。`:mode==='fixed'?`固定阈值 1：梯度先被限制到 ±1；降低学习率会进一步缩小梯度项更新，当前为 ${delta.toFixed(4)}。`:`可调阈值 θ/γ = ${limit.toFixed(2)}：当前梯度项更新 ${delta.toFixed(4)}，绝对值不超过示意 θ = 0.10。`}</p>
 <p className="vdsr-feedback">这里只演示一个梯度分量的贡献 −γg̃，未包含动量与权重衰减；它不是完整优化器参数步长的上界。θ = 0.10 和固定阈值 1 均为教学值，素描没有运行真实训练。</p>
 </div>;
}
