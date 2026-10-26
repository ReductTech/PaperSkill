import React, { useState } from 'react';
import { C, useCanvas, drawCamera, drawPhoto, drawAlbum, roundRect, arrow, Feedback, Source } from './der-kit';

const methods=[
  {name:'ER',full:'Experience Replay（经验回放）',state:'旧输入 x 与真实标签 y',signal:'旧样本交叉熵',boundary:'水库版本无需任务结束操作',cost:'原始样本与标签',feedback:'ER 回放真实标签，是检验 logits 额外价值的直接基线。',route:'label'},
  {name:'LwF',full:'Learning without Forgetting（无遗忘学习）',state:'旧教师响应；不回放历史原始样本',signal:'在当前任务输入上蒸馏旧输出',boundary:'论文比较实现按任务指定教师',cost:'教师模型或预存教师响应',feedback:'LwF 在新输入上对齐旧响应；DER 在缓存的旧输入上匹配历史 logits。',route:'teacher'},
  {name:'iCaRL',full:'Incremental Classifier and Representation Learning（增量分类器与表征学习）',state:'类别代表样本与任务末旧模型',signal:'样本、标签、蒸馏与原型分类',boundary:'论文比较实现按任务更新教师和样本集',cost:'样本集、教师及类别统计',feedback:'iCaRL 也利用旧样本和蒸馏；DER 的目标来自训练轨迹中的不同时间，而非统一任务末教师。',route:'teacher'},
  {name:'FDR',full:'Function Distance Regularization（函数距离正则化）',state:'旧输入和对应网络响应',signal:'约束当前与历史输出的距离',boundary:'论文比较实现于任务边界记录收敛响应',cost:'样本与响应向量',feedback:'FDR 与 DER 都匹配历史函数响应；这里的关键区别是何时记录响应，以及是否需要任务末事件。',route:'logits'},
  {name:'GEM',full:'Gradient Episodic Memory（梯度情景记忆）',state:'按任务分组的旧样本',signal:'由各旧任务梯度形成更新约束',boundary:'原方法需要旧样本的任务身份',cost:'样本、多个梯度与约束优化',feedback:'GEM 约束参数更新方向；DER 直接正则化旧输入上的输出。两者都使用记忆，但作用位置不同。',route:'gradient'},
  {name:'A-GEM',full:'Averaged Gradient Episodic Memory（平均梯度情景记忆）',state:'旧样本与一个参考梯度',signal:'相对于平均旧梯度的一条约束',boundary:'原文另评估水库改造 A-GEM-R',cost:'样本与一个参考梯度',feedback:'A-GEM 使用平均旧梯度减少约束开销；水库改造可避免按任务维护缓存。',route:'gradient'},
  {name:'DER',full:'Dark Experience Replay（暗经验回放）',state:'旧原始输入 x 与历史 logits z',signal:'当前监督 + 旧 logits 平方距离',boundary:'沿训练轨迹记录，无需任务结束事件',cost:'样本与 C 维输出向量',feedback:'DER 保留同一学习器在不同历史时刻的输出；没有额外保留整套旧教师网络。',route:'logits'},
  {name:'DER++',full:'Dark Experience Replay++（暗经验回放增强版）',state:'旧原始输入 x、历史 logits z、真实标签 y',signal:'DER 损失 + 旧真实标签交叉熵',boundary:'沿训练轨迹记录，无需任务结束事件',cost:'DER 的状态加标签',feedback:'DER++ 再用真实标签纠偏；它并非在每个协议和预算下都优于 DER。',route:'both'},
];
export function DerC3Extra(){
 const [selected,setSelected]=useState(0);const m=methods[selected];
 const canvas=useCanvas(ctx=>{
   drawAlbum(ctx,50,78,245,130,[0,1,2],3);drawPhoto(ctx,350,87,113,100,[.3,.65,.4],C.blue);drawCamera(ctx,605,144,.8);
   const color=m.route==='gradient'?C.purple:m.route==='teacher'?C.blue:C.green;
   arrow(ctx,300,144,340,144,C.muted);arrow(ctx,468,144,550,144,C.muted);arrow(ctx,660,144,770,144,color);
   roundRect(ctx,790,80,220,130,15,C.bg,color);
   if(m.route==='gradient') {
     arrow(ctx,835,175,875,113,C.blue);arrow(ctx,835,175,951,142,C.purple);
   } else if(m.route==='label') {
     ctx.fillStyle=color;ctx.beginPath();ctx.arc(895,145,23,0,Math.PI*2);ctx.fill();
   } else {
     [.8,.55,.25].forEach((v,i)=>roundRect(ctx,825+i*54,183-v*95,30,v*95,4,color));
     if(m.route==='both'){ctx.fillStyle=C.orange;ctx.beginPath();ctx.arc(988,98,10,0,Math.PI*2);ctx.fill();}
   }
   ctx.fillStyle=C.muted;ctx.font='18px sans-serif';ctx.fillText('保留的状态',55,48);ctx.fillText('学习信号',835,48);
 },[selected]);
 return <div className="der-widget"><canvas ref={canvas} className="der-canvas" aria-label={`${m.name}：保留${m.state}，学习信号是${m.signal}。`} />
   <div className="der-controls">{methods.map((item,i)=><button key={item.name} onClick={()=>setSelected(i)} aria-pressed={selected===i}>{item.name}</button>)}</div>
   <Feedback tone={m.name.startsWith('DER')?'green':'blue'}>{m.feedback}</Feedback>
   <div className="der-prose">
     <h3>{m.full}</h3><dl><dt>保留什么</dt><dd>{m.state}</dd><dt>学习信号</dt><dd>{m.signal}</dd><dt>任务结束依赖</dt><dd>{m.boundary}</dd><dt>主要附加开销</dt><dd>{m.cost}</dd></dl>
     <div className="der-table-wrap"><table><caption>相关工作的功能对照；表述限定于论文讨论或比较的实现。</caption><thead><tr><th>方法</th><th>保留状态</th><th>约束位置</th><th>边界或任务身份</th></tr></thead><tbody>{methods.map(item=><tr key={item.name}><th>{item.name}</th><td>{item.state}</td><td>{item.signal}</td><td>{item.boundary}</td></tr>)}</tbody></table></div>
     <p>Replay（回放）决定用哪些旧输入再次计算；Distillation（蒸馏）决定旧输出如何作为目标；Regularization（正则化）决定在优化中怎样惩罚变化。DER 将这三个环节组合起来，不需要新的专用网络结构。历史目标由同一学习器在多个时刻产生，可以类比多个时间切片的教师，但训练时并不同时运行一个教师集成。</p>
     <p>另外，oEWC 与 SI 用参数重要性惩罚权重改变；PNN 等结构方法通过保留或增加网络容量减少干扰。它们的额外参数、教师快照或掩码同样应计入记忆开销，不能把“没有原始样本缓存”直接理解成“没有存储成本”。</p>
     <p>Table 1 的边界分类不是某一思想永远不能用于 GCL 的不可能性结论。例如本文就给 A-GEM 加上水库缓存得到 A-GEM-R。对 FDR、LwF 或 GEM 的边界讨论，也应区分原始／被比较实现与后续可能的算法改造。</p>
     <Source>原文 pp. 2–4 §§2、3.1；补充材料 §A 对任务身份、边界和内存条件的说明。</Source>
   </div>
 </div>;
}
