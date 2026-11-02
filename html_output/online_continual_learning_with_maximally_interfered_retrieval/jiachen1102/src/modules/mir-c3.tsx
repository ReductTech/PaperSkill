import React, { useState } from 'react';
import { C,useCanvas,drawInstrument,drawNote,roundRect,Feedback,Source,MathBlock } from './mir-kit';
const before=[2,.2,.8],after=[2.05,.7,.6],best=[.3,.2,.7];
export function MirC3(){
 const [virtual,setVirtual]=useState(false),[criterion,setCriterion]=useState<'MI1'|'MI2'>('MI1');
 const scores=after.map((v,i)=>v-(criterion==='MI1'?before[i]:Math.min(before[i],best[i])));
 const winner=scores.indexOf(Math.max(...scores));const displayed=virtual?after:before;
 const ref=useCanvas(ctx=>{
  ctx.fillStyle=C.bg;ctx.fillRect(0,0,1080,280);
  drawInstrument(ctx,180,140,.8,virtual?[.15,.8,-.2]:[.05,.15,.05]);
  displayed.forEach((v,i)=>{const x=425+i*195;drawNote(ctx,x,42,130,66,i*.2+.2,C.blue);roundRect(ctx,x,230-v/2.2*107,130,Math.max(1,v/2.2*107),4,C.blue);
   if(virtual){const val=scores[i],y=val>=0?140-val/2*75:140;roundRect(ctx,x+132,y,17,Math.max(1,Math.abs(val)/2*75),3,val>0?C.red:C.leaf);if(i===winner){ctx.strokeStyle=C.green;ctx.lineWidth=3;ctx.strokeRect(x-5,35,158,207);}}});
 },[virtual,criterion]);
 return <div className="mir-widget">
 <canvas ref={ref} className="mir-canvas" aria-label={'旧样本 A、B、C 的'+(virtual?'虚拟更新后':'更新前')+'损失与'+criterion+'分数对照'}/>
 <div className="mir-controls"><button onClick={()=>setVirtual(v=>!v)}>{virtual?'回到更新前':'试算虚拟更新'}</button><button aria-pressed={criterion==='MI1'} onClick={()=>setCriterion('MI1')}>MI-1：比较当前</button><button aria-pressed={criterion==='MI2'} onClick={()=>setCriterion('MI2')}>MI-2：兼顾历史最好</button></div>
 <Feedback tone={virtual?'green':'blue'}>{virtual?criterion+' 分数 A/B/C = '+scores.map(x=>x.toFixed(2)).join(' / ')+'，优先检索 '+['A','B','C'][winner]+'。':'先查看当前损失，再试算一次只用新数据的更新。当前最难的 A，不一定是这次受损最多的样本。'}</Feedback>
 <div className="mir-prose">
 <p>从左到右为 A、B、C。蓝条是所显示模型的单样本损失，统一以 2.2 为量程；虚拟更新后的细条表示分数，红色为正增量，绿色边框标出当前检索规则优先选中的样本。左侧弦偏移只用来类比扰动。所有数字为教学构造，不是论文观测值。</p>
 <div className="mir-table-wrap"><table><thead><tr><th>旧样本</th><th>当前损失 ℓᵢ(θ)</th><th>虚拟后损失 ℓᵢ(θᵥ)</th><th>历史观察最低 rᵢ</th><th>{criterion} 分数</th></tr></thead><tbody>{before.map((v,i)=><tr key={i}><th>{['A','B','C'][i]}</th><td>{v.toFixed(2)}</td><td>{virtual?after[i].toFixed(2):'尚未显示'}</td><td>{best[i].toFixed(2)}</td><td>{virtual?scores[i].toFixed(2):'尚未显示'}</td></tr>)}</tbody></table></div>
 <h3>原文定义一：用“这一步造成的增量”评分</h3>
 <p>先在参数副本上仅学习当前批次，得到 Virtual Update（虚拟更新）θᵥ=θ−ηg新，其中 g新=∇θL新(θ)，η&gt;0。θᵥ 只用于预测风险，真实模型尚未执行这次更新。对旧样本 (xᵢ,yᵢ)，把 ℓ(fθ(xᵢ),yᵢ) 简写为 ℓᵢ(θ)。</p>
 <MathBlock title="原文 §3.1 的 sMI-1">
 <p>sMI-1(i)=ℓᵢ(θᵥ)−ℓᵢ(θ)。先计算同一个样本在两个模型下的损失，再作差。标签 yᵢ 保持相同，不能拿更新前后不同样本或不同标签的损失相减。</p>
 <p>s&gt;0 表示预测受损；s&lt;0 表示新更新可能顺便帮助它；s=0 表示该步没有净变化。按分数降序取前 B 个候选，B 是本次回放预算，而非类别数。</p>
 </MathBlock>
 <p>教学例中，A 的当前损失最高，但它只从 2.00 升至 2.05，增量 0.05；B 从 0.20 升至 0.70，增量 0.50；C 从 0.80 降至 0.60，增量 −0.20。若 B=1，MI-1 选择 B。MIR 关注局部更新带来的风险，不是把过去每个错分样本都优先选一遍。</p>
 <h3>原文定义二：为什么还要记住历史最好表现？</h3>
 <p>如果一个样本在更早的训练中已经退化，当前损失可能已经很高，仅看这一步增量会忽略累计损害。作者考虑存储该样本至今观察到的最低损失 rᵢ。原文用 θ* 表示对应参数；不同样本的最好时刻可以不同，它不是已知的全局最优模型，更不意味着缓存完整的历史网络。</p>
 <MathBlock title="原文 §3.1 的 sMI-2">
 <p>sMI-2(i)=ℓᵢ(θᵥ)−min(ℓᵢ(θ),rᵢ)。先选当前与历史记录中较低的参照损失，再衡量虚拟后表现偏离它多少。</p>
 <p>把 ℓᵢ(θ) 加上再减掉：sMI-2=sMI-1+[ℓᵢ(θ)−min(ℓᵢ(θ),rᵢ)]。利用 a−min(a,b)=max(0,a−b)，得到 sMI-2=sMI-1+max(0,ℓᵢ(θ)−rᵢ)。因此它为已经观察到的退化增加一个非负项。</p>
 </MathBlock>
 <p>本例 A 的 r=0.30，MI-2=2.05−0.30=1.75；B 的参照仍是 0.20，分数 0.50；C 的参照为 min(0.80,0.70)=0.70，分数 −0.10。于是 MI-2 改选 A。这不是两种公式谁永远更正确，而是它们回答的风险时间尺度不同。</p>
 <p>实际历史记录只有在样本被评估时才可能刷新：rᵢ←min(rᵢ,ℓᵢ(θ))。它不保证包含每个时刻的真实最小损失；还要核对是在评分前用旧记录作比较、何时更新记录。没有观察到的改善不能事后假装已经知道。</p>
 <p>Top-B（前 B 项）是相对排名。当候选的所有分数都为负时，原规则仍选择最大的、即负得最少的那些项；“只回放正分数”是另一个算法改动，需要单独说明与验证。</p>
 <Source>原文第 3–4 页 §3.1 的 sMI-1、sMI-2 定义及 Algorithm 1；数值例和等价展开为教程补充。</Source>
 </div></div>;
}
