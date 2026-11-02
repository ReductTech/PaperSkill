import React, { useState } from 'react';
import { C, useCanvas, drawInstrument, roundRect, Feedback, Source, MathBlock } from './mir-kit';

export function MirC1() {
 const [theta,setTheta]=useState(0);
 const targets=[-1,0,.5];
 const old=targets.map(a=>.5*(theta-a)**2);
 const increments=old.map((v,i)=>v-.5*targets[i]**2);
 const current=.5*(theta-1)**2;
 const ref=useCanvas(ctx=>{
   ctx.fillStyle=C.bg;ctx.fillRect(0,0,1080,280);
   drawInstrument(ctx,180,140,.8,[theta,.5*theta,.25*theta]);
   ctx.strokeStyle=C.axis;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(420,65);ctx.lineTo(1000,65);ctx.stroke();
   roundRect(ctx,420+theta*580-13,47,26,36,8,C.orange,C.brown);
   old.forEach((v,i)=>{const y=117+i*47;roundRect(ctx,420,y,580,20,4,C.axis);roundRect(ctx,420,y,Math.max(1,580*v/2),20,4,increments[i]>0?C.red:C.blue);});
 },[theta]);
 function move(e:React.PointerEvent<HTMLCanvasElement>){const b=e.currentTarget.getBoundingClientRect();const x=(e.clientX-b.left)*1080/b.width;setTheta(Math.max(0,Math.min(1,(x-420)/580)));}
 const change=(d:number)=>setTheta(v=>Math.max(0,Math.min(1,v+d)));
 return <div className="mir-widget">
 <canvas ref={ref} className="mir-canvas" role="slider" tabIndex={0} aria-label="左右拖动橙色调音旋钮；方向键可调节" aria-valuemin={0} aria-valuemax={1} aria-valuenow={Number(theta.toFixed(2))} aria-valuetext={'参数 '+theta.toFixed(2)+'，新损失 '+current.toFixed(3)}
 style={{touchAction:'pan-y',cursor:'grab'}}
 onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);move(e);}}
 onPointerMove={e=>{if(e.currentTarget.hasPointerCapture(e.pointerId))move(e);}}
 onPointerUp={e=>{if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);}}
 onKeyDown={e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();change(e.key==='ArrowRight'?.05:-.05);}if(e.key==='Home'){e.preventDefault();setTheta(0);}if(e.key==='End'){e.preventDefault();setTheta(1);}}}/>
 <div className="mir-controls"><button onClick={()=>change(-.1)}>向左调弦</button><button onClick={()=>change(.1)}>向右调弦</button><button onClick={()=>setTheta(0)}>重置调音</button><output>θ={theta.toFixed(2)} · 新损失={current.toFixed(3)}</output></div>
 <Feedback tone={theta>.7?'red':'blue'}>{theta===0?'从当前参数出发，向右调弦，尝试降低新目标损失。':'新目标损失下降，并不意味着每个旧目标也改善。'} 旧样本 A/B/C 的损失增量分别为 {increments.map(x=>x.toFixed(3)).join(' / ')}。</Feedback>
 <div className="mir-prose">
 <p>右侧从上到下是旧样本 A、B、C 的当前损失，条长上限为 2；上方橙色旋钮表示同一个参数 θ。乐器张力仅是共享参数的教学类比，条形数值来自下面的二次函数，不是论文实验。</p>
 <h3>Title、Abstract、Introduction：问题为什么不是“多存一点数据”就结束？</h3>
 <p><em>Online Continual Learning with Maximally Interfered Retrieval</em>，中文可译为“使用最大干扰检索的在线持续学习”，发表于 NeurIPS 2019。论文 PDF 标题使用 Maximally，会议元数据与 BibTeX 使用 Maximal，二者指同一篇论文。作者为 Rahaf Aljundi、Lucas Caccia、Eugene Belilovsky、Massimo Caccia、Min Lin、Laurent Charlin、Tinne Tuytelaars，来自 KU Leuven 与 Mila。</p>
 <p>Continual Learning（持续学习）要求模型接收新经验的同时保留旧能力；Catastrophic Forgetting（灾难性遗忘）指新学习可能破坏已有知识。作者研究 Online Continual Learning（在线持续学习）：数据非独立同分布地持续到来，外部训练流只遍历一次，不能无限保存或反复读取完整历史。</p>
 <p>Experience Replay（经验回放，ER）通过有限缓存重放旧样本；Generative Replay（生成式回放）则从生成器产生旧经验的近似。两者都受每次训练可回放多少样本的预算限制。即使已有不错的缓存或生成器，也仍有一个独立问题：<strong>这一刻应该取回谁？</strong></p>
 <p>随机回放可能花力气复习本来不受当前更新影响、甚至会顺便改善的样本。作者提出 Maximally Interfered Retrieval（最大干扰检索，MIR）：先在虚拟参数副本上试学新批次，再优先重放预测损失上升最多的旧样本。它把“有多难”换成“这一步会损害多少”。</p>
 <MathBlock title="先体验共享参数竞争：教学二次目标">
 <p>取 θ∈[0,1]，新目标 L新(θ)=½(θ−1)²；三个旧样本目标为 ℓᵢ(θ)=½(θ−aᵢ)²，a=[−1,0,0.5]。每项损失都是同一个 θ 的函数，横向移动旋钮会同时改变四个损失。</p>
 <p>从 θ=0 移到 θ=1，新损失从 0.5 变成 0。旧 A 损失从 0.5 升至 2，增量 1.5；旧 B 从 0 升至 0.5，增量 0.5；旧 C 从 0.125 变为 0.125，净增量为 0。并非所有旧样本都同样需要保护。</p>
 <p>对新目标求导得到 ∂L新/∂θ=θ−1；梯度下降 θ下一步=θ−η(θ−1)。对于不投影的二次目标，θ下一步−1=(1−η)(θ−1)，当 0&lt;η&lt;2 时误差收缩。上图是直接操作有界 θ，尚未实现 MIR 更新，也不把每个中途下降或上升都叫最终遗忘。</p>
 </MathBlock>
 <h3>四遍阅读，逐步达到什么程度</h3>
 <div className="mir-table-wrap"><table><thead><tr><th>遍次</th><th>重点章节</th><th>应能完成的任务</th></tr></thead><tbody>
 <tr><td>第一遍：整体理解</td><td>1–3</td><td>解释为什么需要选择回放样本，以及 MIR 与困难样本挖掘的区别。</td></tr>
 <tr><td>第二遍：数学精读</td><td>3–5、7</td><td>推导损失增量、梯度干扰近似、候选检索与生成式目标，并说明条件。</td></tr>
 <tr><td>第三遍：算法实现</td><td>5–8</td><td>写出虚拟更新、排序、丢弃副本、真实更新与缓存维护的正确顺序。</td></tr>
 <tr><td>第四遍：研究视角</td><td>8–10</td><td>区分变体的协议和成本，评价反例，并设计能证伪的改进实验。</td></tr>
 </tbody></table></div>
 <p>论文逻辑映射：标题／摘要／引言在第 1 章，问题设定与相关工作在第 2 章，方法在第 3–8 章，数学条件在第 3–5、7 章，实验与结论在第 9–10 章。局部教学推导会与论文原文的实证主张明确区分。</p>
 <Source>论文 Abstract、Introduction 与 §3：有限回放预算下的样本选择；上方二次函数为教学构造。</Source>
 </div></div>;
}
