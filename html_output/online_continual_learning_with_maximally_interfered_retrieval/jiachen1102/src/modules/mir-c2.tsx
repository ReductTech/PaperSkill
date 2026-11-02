import React, { useState } from 'react';
import { C,useCanvas,drawInstrument,drawNote,roundRect,arrow,Feedback,Source,MathBlock } from './mir-kit';
const methods=[
 {name:'ER',signal:'真实旧标签',action:'随机取旧样本，和新批次一起训练',state:'输入 x、标签 y 与固定容量缓存',boundary:'水库 ER 不需要按任务划分存储',route:0},
 {name:'GEM',signal:'旧任务梯度约束',action:'投影更新方向，限制旧任务损失的一阶增量',state:'按任务组织的记忆与多个参考梯度',boundary:'原始方法需要任务身份来形成分组约束',route:1},
 {name:'DER',signal:'历史 logits 匹配',action:'回放历史输入，约束当前输出接近存储输出',state:'旧输入 x 与历史 logits z；DER++ 还存 y',boundary:'轨迹式目标与水库可避免任务结束时更新教师',route:2},
 {name:'MIR',signal:'虚拟更新后的损失增量',action:'先计算候选旧样本风险，再按分数取回放批次',state:'ER 缓存及用于评分的虚拟参数副本',boundary:'ER-MIR 不以任务末刷新教师为必要步骤；其他变体另论',route:3},
];
export function MirC2(){
 const [chosen,setChosen]=useState(0);const m=methods[chosen];
 const ref=useCanvas(ctx=>{
  ctx.fillStyle=C.bg;ctx.fillRect(0,0,1080,280);drawInstrument(ctx,180,140,.8,[.25,.1,.4]);
  [0,1,2].forEach(i=>drawNote(ctx,400+i*90,95,64,100,i/3,i===m.route%3?C.orange:C.blue));
  arrow(ctx,365,145,390,145,C.muted);arrow(ctx,690,145,760,145,m.route===1?C.purple:C.green);
  roundRect(ctx,780,70,250,145,10,C.bg,m.route===1?C.purple:C.green);
  if(m.route===1){arrow(ctx,830,180,870,100,C.blue);arrow(ctx,830,180,980,145,C.purple);}
  else if(m.route===2){[.8,.5,.25].forEach((v,i)=>roundRect(ctx,820+i*58,188-v*100,35,v*100,3,C.green));}
  else{[0,1,2].forEach(i=>{ctx.beginPath();ctx.arc(835+i*65,140,16,0,2*Math.PI);ctx.fillStyle=i===(m.route===3?2:0)?C.green:C.env;ctx.fill();});}
 },[chosen]);
 return <div className="mir-widget"><canvas ref={ref} className="mir-canvas" aria-label={m.name+' 的记忆与学习机制示意'}/>
 <div className="mir-controls">{methods.map((v,i)=><button key={v.name} aria-pressed={chosen===i} onClick={()=>setChosen(i)}>{v.name}</button>)}</div>
 <Feedback tone={m.name==='MIR'?'green':'blue'}>{m.name}：{m.action}。图中路径对应“{m.signal}”，这些图形比较作用位置，不表示性能排名。</Feedback>
 <div className="mir-prose">
 <h3>Problem Definition（问题定义）：一个不断变化的监督数据流</h3>
 <p>在时刻 t，收到批次 Bₙ=(Xₜ,Yₜ)，数据由当前分布 Dₜ 产生。Non-i.i.d.（非独立同分布）意味着数据顺序有结构，Dₜ 可能突然改变，也可能随时间变化。分类器 fθ 的参数 θ∈ℝᵖ 由新数据与选出的旧数据共同更新。监督训练仍有标签；“在线”并不等于无标签。</p>
 <MathBlock title="从目标到资源约束">
 <p>当前批次目标 L新(θ)=(1/|Bₙ|)Σ₍ₓ,ᵧ₎∈Bₙ ℓ(fθ(x),y)。输入 x∈ℝᵈ，类别索引 y∈{'{0,…,Q−1}'}，Q 是输出类别数。模型希望降低当前风险，同时缓解在不可完整保留的旧分布上的损失恶化。</p>
 <p>记忆集合记作 𝓜，全局容量记为 K；随机预选候选个数为 C，最终回放个数为 B，通常 B&lt;C≤|𝓜|。论文实验表中的 M 则指“每类记忆数”，不能和集合 𝓜 或全局容量 K 混淆。Q 类、每类 M 个名额的总预算尺度是 QM，但水库采样不强制每类恰好同样多。</p>
 </MathBlock>
 <h3>Online（在线）与任务信息是不同约束</h3>
 <p>Single-pass（单遍）指外部训练数据流只遍历一次，已经存入缓存的样本仍会回放。它也不强制每个到达批次只能做一次优化：论文后来专门测试多次更新。主 ER 对照通常每批一次更新；MiniImageNet 对照允许三次，额外计算必须计入比较。</p>
 <p>Shared Classifier（共享分类器）在推断时从全类别输出中作判断，不靠任务编号选择独立分类头。它与训练过程中是否使用任务信息不是一回事。GEN-MIR 的参考模型按任务末保存，AE-MIR 有逐任务离线训练阶段；源码中也有排除当前任务等分支。不能把所有变体统称为完全不依赖任务边界的通用学习器。</p>
 <h3>Related Work（相关工作）：MIR 在哪一层改变回放？</h3>
 <div className="mir-table-wrap"><table><thead><tr><th>方法</th><th>保留什么</th><th>更新或选择机制</th><th>任务信息边界</th></tr></thead><tbody>{methods.map(v=><tr key={v.name}><th>{v.name}</th><td>{v.state}</td><td>{v.action}</td><td>{v.boundary}</td></tr>)}</tbody></table></div>
 <p>Gradient Episodic Memory（梯度情景记忆，GEM）约束更新方向；MIR 改变取回哪些旧样本。它们都看重历史信息，但并不使用同一种优化操作。困难样本挖掘关注当前高损失，而 MIR 关注更新引起的损失增量，第 3 章会构造二者选择不同样本的例子。</p>
 <p>Dark Experience Replay（暗经验回放，DER）发表于 2020 年，在这里作为你已学知识的后续联系，<strong>不是 MIR 2019 论文的实验基线</strong>。DER 改变旧监督信号，MIR 改变检索规则，组合两者是另一个需要检验的设计。</p>
 <p>论文还讨论参数正则化方法，将旧知识写入参数重要性或先验；动态结构方法则保留或扩展网络组件。回放家族可直接保存图像，也可训练生成模型近似旧数据。MIR 分别实例化为 ER-MIR、GEN-MIR 和 AE-MIR，不以一种新的分类器架构作为主要贡献。</p>
 <p>本图左侧乐器表示同一个被持续调整的学习器，中间参考卡表示历史经验，右侧变化对应所选机制：GEM 是方向约束、DER 是输出一致性、MIR 是候选筛选。类比不把调音操作当作真实网络训练。</p>
 <Source>原文 §2 Related Work、§3 Methods、§4 Shared Classifier；DER 仅为 2020 后续知识联系。</Source>
 </div></div>;
}
