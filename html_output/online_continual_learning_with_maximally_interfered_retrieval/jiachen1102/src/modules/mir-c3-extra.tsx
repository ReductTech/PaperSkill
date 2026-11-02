import React, { useState } from 'react';
import { C,useCanvas,drawInstrument,drawNote,roundRect,Feedback,Source } from './mir-kit';
const pre=[2,.2,.8],post=[2.05,.7,.6],best=[.3,.2,.7];
const rules=[
 {name:'当前最难',values:pre,unit:'当前损失',reason:'当前损失最高，说明 A 现在最难，但不说明新更新对它伤害最大。'},
 {name:'虚拟后最难',values:post,unit:'虚拟后损失',reason:'只看虚拟后损失仍选 A，混合了原来的难度与新增加的损害。'},
 {name:'MI-1',values:post.map((v,i)=>v-pre[i]),unit:'当前参照增量',reason:'MI-1 选 B：它受这一步新更新影响最大，尽管当前损失很低。'},
 {name:'MI-2',values:post.map((v,i)=>v-Math.min(pre[i],best[i])),unit:'最好参照增量',reason:'MI-2 选 A：历史最低 0.30 提醒我们，它在这一步之前已明显退化。'},
];
export function MirC3Extra(){
 const [mode,setMode]=useState(0);const rule=rules[mode];
 const order=[0,1,2].sort((a,b)=>rule.values[b]-rule.values[a]);const winner=order[0];
 const ref=useCanvas(ctx=>{
   ctx.fillStyle=C.bg;ctx.fillRect(0,0,1080,280);drawInstrument(ctx,180,140,.8,winner===1?[.1,.8,.1]:[.8,.1,.1]);
   order.forEach((id,row)=>{const y=35+row*79;drawNote(ctx,420,y,72,55,id/3,C.blue);roundRect(ctx,535,y+10,470,29,4,C.axis);const v=rule.values[id];roundRect(ctx,535,y+10,Math.max(1,Math.abs(v)/2.2*470),29,4,row===0?C.green:v<0?C.leaf:C.blue);});
 },[mode]);
 return <div className="mir-widget"><canvas ref={ref} className="mir-canvas" aria-label={'按'+rule.name+'排序，依次为'+order.map(i=>['A','B','C'][i]).join('、')}/>
 <div className="mir-controls">{rules.map((r,i)=><button key={r.name} aria-pressed={mode===i} onClick={()=>setMode(i)}>{r.name}</button>)}</div>
 <Feedback tone={mode>=2?'green':'blue'}>{rule.reason} 当前排序：{order.map(i=>['A','B','C'][i]).join(' → ')}。</Feedback>
 <div className="mir-prose">
 <p>右图从上到下按当前规则排序；条长表示所选量的绝对值，正负符号以表格中的数值为准，量程统一为 2.2。绿色首行是规则选中的项，不表示该样本损失为负，也不是方法的准确率。切换规则时，原始样本与损失数据完全不变。</p>
 <div className="mir-table-wrap"><table><thead><tr><th>排序位置</th><th>样本</th><th>{rule.unit}</th><th>选择</th></tr></thead><tbody>{order.map((id,i)=><tr key={id}><td>{i+1}</td><td>{['A','B','C'][id]}</td><td>{rule.values[id].toFixed(2)}</td><td>{i===0?'预算 B=1 时取回':'本次不取回'}</td></tr>)}</tbody></table></div>
 <h3>Hard Example Mining（困难样本挖掘）与 MIR 可以在哪些情况下不同？</h3>
 <p>如果把当前损失写成“原有难度”，虚拟后损失可以拆成“原有难度 + 本次增量”。直接选虚拟后损失最高的样本，会把两部分混在一起。MI-1 则把原有损失减掉，试图隔离这一候选更新的影响；MI-2 再把参照扩大到已观察的历史最好表现。</p>
 <p>这四个排序不是四种完整学习系统的公平性能实验，只是同一组候选损失上的检索规则对照。数据噪声、错标签和过时旧知识都可能使高风险检索消耗预算。即使精确预测了新数据单独更新的风险，也不保证加入回放后的真实更新仍保持同样排序。</p>
 <p>MIR 预测的是“若只学习新数据”的反事实；正式训练会加上选中的旧样本，因此它改变了实际发生的更新。理解这点，下一章才能正确连接梯度冲突，而不是误以为真实模型必须先走到 θᵥ 再补救。</p>
 <Source>原文 §3.1 的损失差检索动机；困难度与风险排序的数值对照为教学解释。</Source>
 </div></div>;
}
