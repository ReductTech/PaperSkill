import React,{useState} from 'react';
import {Canvas,Feedback,Stats,C,line,pencil,rect,label,target} from './notebook-scene';
export function Boundary(){const [correct,setCorrect]=useState(0);const change=(v:number)=>setCorrect(Math.max(0,Math.min(8,v)));const at=(e:React.PointerEvent<HTMLCanvasElement>)=>{const r=e.currentTarget.getBoundingClientRect();change(Math.round(((e.clientX-r.left)/r.width*840-65)/52));};return <>
 <Canvas label="拖动笔尖调整组中正确次数" tabIndex={0} style={{touchAction:'none',cursor:'grab'}} onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);at(e);}} onPointerMove={e=>{if(e.currentTarget.hasPointerCapture(e.pointerId))at(e);}} onPointerUp={e=>e.currentTarget.releasePointerCapture(e.pointerId)} onKeyDown={e=>{e.stopPropagation();if(e.key==='ArrowLeft'){e.preventDefault();change(correct-1);}if(e.key==='ArrowRight'){e.preventDefault();change(correct+1);}}} draw={c=>{rect(c,39,55,470,116,'#fff');rect(c,253,70,41,87,'#e1f1e8');line(c,[[65,139],[481,139]],C.wood,3);for(let i=0;i<9;i++){line(c,[[65+i*52,130],[65+i*52,149]],C.dark,2);label(c,String(i),60+i*52,184,18);}pencil(c,65+correct*52,114,Math.PI/2);for(let i=0;i<8;i++)target(c,590+(i%4)*53,89+Math.floor(i/4)*61,i<correct);label(c,(correct/8).toFixed(3),630,211,26,correct===4?C.green:C.blue);}}/>
 <div className="ctrl" style={{gap:12,flexWrap:'wrap'}}><button className="chip" disabled={!correct} onClick={()=>change(correct-1)}>− 一个正确</button><strong>{correct} / 8</strong><button className="chip" disabled={correct===8} onClick={()=>change(correct+1)}>+ 一个正确</button><button className="chip" onClick={()=>change(4)}>定位能力边界</button></div>
 <Stats items={[["p(q)",(correct/8).toFixed(3)],["题目状态",correct===0?'全错':correct===8?'全对':correct===4?'最接近0.5':'正确与错误共存']]}/>
 <Feedback tone={correct===0||correct===8?'bad':correct===4?'good':''}>{correct===0?'0/8：没有正奖励；本阶段起始检查点预筛会排除全错题。':correct===8?'8/8：反馈已饱和；预筛同样排除全对题。':correct===4?'4/8：处于最大不确定性点0.5，最符合MGPO关注的能力边界。':'这一组既有正确也有错误，可以比较解法；权重随偏离0.5的程度变化，但本报告未给D_ME展开与γ取值。'}</Feedback>
 <details style={{marginTop:18}}><summary style={{cursor:'pointer',fontWeight:650}}>深入：权重怎样进入策略更新？</summary>
 <p>对同一问题的第 i 条回答，Aᵢ 表示组相对优势，ρᵢ,ₜ 表示当前策略相对旧策略的 token 概率比。MGPO 将题目组权重 w(q) 乘到优势上，再使用裁剪目标限制过大的策略变化。</p>
 <p style={{overflowWrap:'anywhere'}}>J(θ) = E[ (1/G) Σᵢ (1/|yᵢ|) Σₜ min(ρᵢ,ₜ · w(q)Aᵢ, clip(ρᵢ,ₜ, 1−ε, 1+ε) · w(q)Aᵢ) ]</p>
 <p>先按每条轨迹的 token 数 |yᵢ| 归一，再按组大小 G 平均；ε 是裁剪系数。式3中的负优势仍是负的，乘上正权重不会把错误答案反向变成正奖励。此处保留原文目标形式，不模拟真实训练梯度。</p>
 </details>
 </>;}
