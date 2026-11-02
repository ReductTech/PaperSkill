/* Codex initial draft, 2026-10-21. Non-rendered handoff marker; see sibling MODEL_HANDOFF.md. */
import React,{useState} from 'react';
import type { WidgetProps } from './registry';
import { VtimeFrame } from './vtime-scene';
const labels=['原始帧','绘制时间尺','叠加到帧','视觉读取位置'];
export const VtimeProgress: React.FC<WidgetProps> = () => {
 const [step,setStep]=useState(0); const next=()=>setStep(s=>Math.min(3,s+1)); const prev=()=>setStep(s=>Math.max(0,s-1));
 return <div className="vt-widget"><div className="vt-card-head"><span>始终观察同一帧</span><span className="vt-pill">教学示例 · 24 秒 / 60 秒</span></div><div className="vt-stage"><div className="vt-grid2"><div><div className="vt-kicker">原始画面 Vₜ</div><VtimeFrame seconds={24}/></div><div className="vt-card"><div className="vt-card-head"><span>{labels[step]}</span><span className="vt-pill">第 {step+1} 步</span></div>{step<2?<><VtimeFrame seconds={24}/>{step===1&&<div className="vt-callout">生成 Tₜ：0s ━━━ ● 24s ━━━━━ 60s<br/><strong>24 ÷ 60 = 40%</strong> 的视频进度。</div>}</>:<VtimeFrame seconds={24} annotated/>}</div></div></div><div className="vt-step"><button className="vt-chip" onClick={prev} disabled={step===0}>上一步</button><button className="vt-button" onClick={next} disabled={step===3}>{step===3?'已到末步':'下一步'}</button><span className="vt-step-count">{step+1} / 4</span></div><div className="vt-feedback" aria-live="polite">{['画面能显示正在开门，却不一定让模型读出这是整段视频的第几秒。','工具根据这一帧的真实时间生成时间尺；当前仍是第24秒，并没有播放到另一帧。','按论文 Eq.1，将进度条图像与原帧上下拼接：V′ₜ = Vₜ ⊕ Tₜ。这里的 ⊕ 是图像拼接，不是数值相加。','现在模型可将开门画面与 24s / 60s 对应。进度条补充可读时间线索，不替代动作识别，也不保证边界永远准确。'][step]}</div></div>;
};
