/* Refined 2026-10-22. Internal provenance; not rendered. */
import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { Tag, Feedback, SHAPE, stopRangeNav } from './ts-shared';
export const TsShape: React.FC<WidgetProps> = () => {
 const [step,setStep]=useState(0), [reward,setReward]=useState(0.45);
 const shaped=SHAPE(reward);
 const x=(r:number)=>48+r*544, y=(r:number)=>216-r*180;
 const path=Array.from({length:201},(_,i)=>`${i?'L':'M'}${x(i/200).toFixed(2)},${y(SHAPE(i/200)).toFixed(2)}`).join(' ');
 return <div className="ts-widget"><Tag kind="demo">曲线严格按论文 Eq. 4 计算</Tag><div className="ts-step-head"><span>公式揭示：{['直觉','高奖励分支','低奖励分支','完整函数'][step]}</span><button className="ts-button" onClick={()=>setStep(Math.min(3,step+1))}>{step<3?'显示下一步':'已展开'}</button></div>
 <div className="ts-function-plot"><svg viewBox="0 0 640 264" role="img" aria-label={`原始奖励 ${reward.toFixed(2)} 变换为 ${shaped.toFixed(3)}；实线为非线性变换，虚线为不变换`}><path d="M48 26 V216 H610" fill="none" stroke="#aab6c8"/>{[0,.5,1].map(v=><g key={v}><line x1={48} y1={y(v)} x2={592} y2={y(v)} stroke="#e8edf2"/><text x={36} y={y(v)+5} textAnchor="end">{v}</text><text x={x(v)} y="237" textAnchor="middle">{v}</text></g>)}<line x1={x(.8)} y1="26" x2={x(.8)} y2="216" stroke="#d18445" strokeDasharray="4 5"/><path d="M48 216 L592 36" stroke="#aab6c8" strokeDasharray="6 5" fill="none"/><path d={path} stroke="#4b639d" strokeWidth="3" fill="none"/><line x1={x(reward)} y1={y(shaped)} x2={x(reward)} y2="216" stroke="#4b639d" strokeDasharray="3 4"/><circle cx={x(reward)} cy={y(shaped)} r="7" fill="#d18445" stroke="#fff" strokeWidth="2"/><text x="48" y="16">整形后奖励</text><text x="592" y="257" textAnchor="end">原始奖励</text><text x={x(.8)+7} y="48">τ=0.8</text></svg><div className="ts-plot-legend"><span>实线：论文变换</span><span>虚线：保持原奖励</span></div></div>
 {step>=1&&<div className="ts-equation">r̃ᵢ = τ + α₁ ln(1 + rᵢ − τ), <b>rᵢ ≥ τ</b></div>}{step>=2&&<div className="ts-equation">r̃ᵢ = τ − [exp(α₂(τ − rᵢ)) − 1] / [exp(α₂) − 1], <b>rᵢ &lt; τ</b></div>}
 <label className="ts-range-label" htmlFor="ts-raw-reward">原始奖励 rᵢ<b>{reward.toFixed(2)}</b></label><input id="ts-raw-reward" aria-label="原始奖励 r" className="ts-range" type="range" min="0" max="1" step="0.01" value={reward} onChange={e=>setReward(Number(e.target.value))} onKeyDown={stopRangeNav}/><div className="ts-output"><span>整形后 r̃ᵢ</span><strong>{shaped.toFixed(3)}</strong><small>τ=0.8 · α₁=0.01 · α₂=1</small></div><div className="ts-note">这是<strong>奖励的重新分配</strong>：先逐个变换奖励，再计算组均值、标准差和优势。高奖励区域很平坦；阈值以下保留更强的相对分辨率。它没有改变答案的起止时刻，也没有重算原始 IoU。</div><Feedback>{reward>=0.8?'橙点进入高分区域：0.80 到 1.00 的原始差距，被压缩到约 0.800 到 0.802。真值不再凭巨大的奖励间距独占标尺。':'橙点位于阈值下方：这里使用指数分支。不要把“整形后数值更高”误当成模型定位更准确；它只是用于更新的学习信号。'}</Feedback></div>;
};
