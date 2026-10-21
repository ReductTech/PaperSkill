import { useState } from 'react';
import { StudyCanvas,palette,drawLabel,drawTarget } from './studio-kit';

const values=[68.4,69.1,87.6,87.5,87.0,86.9,86.2,85.8,85.7,85.7,85.7];
const metricNames=['未见迁移','全程平均','最终表现'];
const tasks=['Aircraft','Caltech101','CIFAR100','DTD','EuroSAT','Flowers','Food','MNIST','OxfordPet','StanfordCars','SUN397'];
export function Ch10Second(){
  const [stage,setStage]=useState(0),[metric,setMetric]=useState(0);
  const included=(i:number)=>metric===0?i<2:metric===1?true:i===10;
  const selectedValues=values.filter((_,i)=>included(i));
  const result=selectedValues.reduce((a,b)=>a+b,0)/selectedValues.length;
  const terms=metric===0?'(68.4 + 69.1) ÷ 2':metric===1?`${values.reduce((a,b)=>a+b,0).toFixed(1)} ÷ 11`:'第 11 阶段';
  return <div>
    <div className="ctrl">{metricNames.map((m,i)=><button className={`chip ${metric===i?'selected':''}`} aria-pressed={metric===i} key={m} onClick={()=>setMetric(i)}>{m}</button>)}<button className="tiny ghost" onClick={()=>{setStage(0);setMetric(0);}}>重置</button></div>
    <div className="chip-row" aria-label="查看训练阶段">{values.map((_,i)=><button key={i} className={`chip ${stage===i?'selected':''}`} aria-pressed={stage===i} onClick={()=>setStage(i)}>阶段 {i+1}</button>)}</div>
    <StudyCanvas ariaLabel={`CIFAR100 在十一个训练阶段的准确率，当前选择阶段 ${stage+1}，绿色为${metricNames[metric]}参与计算的阶段`} draw={c=>{
      drawLabel(c,'CIFAR100',43,40);drawLabel(c,'参与计算',878,40,palette.green);
      c.strokeStyle=palette.border;c.lineWidth=1;[0,25,50,75,100].forEach(v=>{c.beginPath();c.moveTo(54,239-v*1.7);c.lineTo(1030,239-v*1.7);c.stroke();});
      values.forEach((v,i)=>{const x=64+i*87;c.fillStyle=included(i)?palette.green:palette.light;c.fillRect(x,239-v*1.7,55,v*1.7);if(stage===i){c.strokeStyle=palette.orange;c.lineWidth=4;c.strokeRect(x-3,239-v*1.7-3,61,v*1.7+6);drawTarget(c,x+27.5,239-v*1.7-13,6,palette.orange);}});
    }}/>
    <div style={{display:'grid',gridTemplateColumns:'repeat(11,1fr)',gap:4,margin:'12px 0'}}>{values.map((v,i)=><div key={i} style={{padding:'9px 2px',textAlign:'center',border:`2px solid ${stage===i?palette.orange:included(i)?palette.green:palette.border}`,borderRadius:8,background:included(i)?'#edf7ed':'#f5f8fa'}}><div style={{fontSize:12,color:palette.muted}}>阶段 {i+1}</div><strong>{v.toFixed(1)}</strong></div>)}</div>
    <div className="feedback good" role="status">阶段 {stage+1}：刚学完 {tasks[stage]}，CIFAR100 准确率为 {values[stage].toFixed(1)}%。{stage<2?'此时还未学习 CIFAR100。':stage===2?'此时刚完成 CIFAR100 学习。':'此时已继续学习后续任务。'}{included(stage)?'该数值参与当前指标计算。':'该数值不在当前指标的取值范围内。'}</div>
    <div className="metrics"><div className="metric"><div className="l">取值阶段数</div><div className="v">{selectedValues.length}</div></div><div className="metric"><div className="l">显示值计算（%）</div><div className="v">{result.toFixed(2)}</div></div><div className="metric"><div className="l">论文汇总（%）</div><div className="v">{[68.7,83.2,85.7][metric].toFixed(1)}</div></div></div>
    <p>{metricNames[metric]}：{terms} = {result.toFixed(2)}%。{metric===0?'表 7 每格保留一位小数，按显示值计算为 68.75%，论文汇总为 68.7%。':metric===1?'全程平均包含学习 CIFAR100 前、刚学完和学习后续任务的全部 11 个阶段。':'最终表现取全部任务结束后的准确率。'}</p>
    <details><summary>三个指标各在回答什么问题？</summary><p>未见迁移衡量还没学到当前任务时的表现，首个任务没有这一项；全程平均覆盖全部训练阶段；最终表现取最后一个阶段。总体指标再对相应任务求平均。来源：附录 B.2，公式 14–16；表 7。</p><p>可以继续追踪两个问题：任务序列变长时，保护基还剩多少可更新方向；用于估计初始平均梯度的样本覆盖不同类别时，选出的低秩方向有多大变化。作者实现通过多个批次估计平均梯度。</p></details>
  </div>;
}
