import {C56Formula} from "./c56-formula";
import {c78FormulaSupport as formulaSupport} from "../data/tutorial";
import {useState} from 'react';
import {c78Ui} from '../data/tutorial';
import {c78Data as d,c78SftSamples} from '../data/tutorial';
import {useC78Motion} from './c78-motion';
import './c78.css';
export const sftSamples=c78SftSamples;
export function C7A(){
 const [index,setIndex]=useState(0),[probability,setProbability]=useState(.5),m=useC78Motion(1000),s=sftSamples[index];
 const phase=m.progress<.12?0:m.progress<.32?1:m.progress<.58?2:m.progress<.80?3:4,loss=-Math.log(probability);
 const choose=(i:number)=>{setIndex(i);m.start()};
 const points=Array.from({length:91},(_,i)=>{const p=.05+i*.01;return `${45+(p-.05)/.9*540},${185-(-Math.log(p))/3*160}`}).join(' ');
 return <div ref={m.ref} className="c78 c7a" onKeyDown={e=>{if(e.key.startsWith('Arrow'))e.stopPropagation()}}>
 <p>{d.sftIntro}</p><div className="c78-controls" role="group" aria-label="教师轨迹轮次">{sftSamples.map((x,i)=><button key={x.label} aria-pressed={index===i} onClick={()=>choose(i)}>{x.label}</button>)}</div>
 <div className="c78-track" aria-hidden="true"><span style={{width:m.progress*100+'%'}}/></div>
 <p className="c78-stage" aria-live="polite">第{index+1}/4轮 · {['选中当前轮','呈现已有信息','预测教师动作','工具产生返回','样本边界已展示'][phase]}</p>
 <div className="c78-grid"><section className={'c78-cell '+(phase===1?'active':'')}><strong>{d.sftTitles[0]}</strong>{s.input.map((v,i)=><div key={i} className="c78-message" style={{visibility:phase>=1?'visible':'hidden'}}>{v}</div>)}</section>
 <section className={'c78-cell '+(phase===2?'active':'')}><strong>{d.sftTitles[1]}</strong><p>预测工具名与参数</p><code>{s.tool}{'\n'}{s.params}</code><p className="c78-muted">此列是本轮监督目标。</p></section>
 <section className={'c78-cell '+(phase===3?'active':'')}><strong>{d.sftTitles[2]}</strong><p>执行后产生 · 供后续轮次使用</p><p style={{visibility:phase>=3?'visible':'hidden'}}>{s.future}</p>{phase<3&&<p>等待当前动作执行；尚未进入本轮输入。</p>}</section></div>
 <div className="c78-controls">{m.running&&<><button onClick={m.pause}>{m.paused?'继续':'暂停'}</button><button onClick={m.finish}>直接查看结果</button></>}<button onClick={()=>choose(index)}>重播本轮</button><button onClick={()=>{setIndex(0);setProbability(.5);m.finish()}}>重置</button></div>
 <p className="c78-feedback">{d.sftFeedback}</p>
 <section className="c78-evidence"><h4>从教师动作到监督信号</h4><p>{d.sftPrinciple}</p><p><a href="https://arxiv.org/html/2606.02373v1#S1.F2" target="_blank" rel="noreferrer">原文Figure 2：贯穿教师、训练与推理的状态接口</a> · <a href="https://arxiv.org/html/2606.02373v1#alg6" target="_blank" rel="noreferrer">Algorithm 6：轨迹重放与样本构建</a></p>
 <figure className="c78-figure"><a href={import.meta.env.BASE_URL+"images/method_figure.png"} target="_blank" rel="noreferrer"><img src={import.meta.env.BASE_URL+"images/method_figure.png"} alt="论文Figure 2完整总览原图：状态外置框架与训练推理接口"/></a><figcaption>{c78Ui.c7aText0}</figcaption></figure><C56Formula text={d.sftLoss} symbols={{...formulaSupport.sft, "aₜ,ⱼ":formulaSupport.sft["aₜ,ⱼ"]+s.tool+" · "+s.params, "RenderContextₜ":formulaSupport.sft["RenderContextₜ"]+s.input.join("\n")}}/><p>{d.sftSymbols}</p>
 <div className="c78-loss"><label htmlFor="c7a-probability">目标token概率（教学）：<strong>{probability.toFixed(2)}</strong></label><input id="c7a-probability" type="range" min=".05" max=".95" step=".01" value={probability} onChange={e=>setProbability(Number(e.target.value))}/>
 <svg className="c78-chart" viewBox="0 0 630 215" role="img" aria-label={`负对数概率曲线，当前概率${probability.toFixed(2)}，损失${loss.toFixed(4)}`}><path d="M45 20V185H590" fill="none" stroke="#8198a5"/><polyline points={points} fill="none" stroke="#27446e" strokeWidth="3"/><line x1={45+(probability-.05)/.9*540} x2={45+(probability-.05)/.9*540} y1={185-loss/3*160} y2="185" stroke="#f07e47" strokeDasharray="4 4"/><circle cx={45+(probability-.05)/.9*540} cy={185-loss/3*160} r="7" fill="#f07e47"/><text x="12" y="28" fontSize="16">3</text><text x="12" y="185" fontSize="16">0</text><text x="40" y="208" fontSize="16">0.05</text><text x="551" y="208" fontSize="16">0.95</text></svg>
 <p aria-live="polite">当前单个目标token：−ln({probability.toFixed(2)}) = <strong>{loss.toFixed(4)}</strong>。提高该目标的预测概率，会降低这一项损失。</p></div><p className="c78-muted">{d.sftBoundary}</p></section></div>
}
