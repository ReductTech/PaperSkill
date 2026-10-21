import React,{useState} from 'react';
import {C,Stage,clearScene,drawPhoto,line,pill,Chips,Feedback,Metric} from './BirdKit';
import {recapForward,clsDifference} from './recapMath';
import {initialParams,learningRound,parameterKeys} from './learningMath';
const challenges=[
 {title:'换了位置，却读不出区别',problem:'把叶片和鸟嘴的图块交换位置，保留同一组内容。没有位置编码时，CLS 读出会怎样？',fix:'补回位置编码',cause:'位置绑定内容与格位；只交换内容会改变配对，CLS 因而能区分两种布局。'},
 {title:'鸟嘴消失，CLS 却毫无反应',problem:'把鸟嘴图块数值置零。如果各 token 只做自己的特征变换，CLS 能得到这条变化吗？',fix:'恢复跨 token 注意力',cause:'MLP、归一化和残差不跨行读取；恢复注意力后，图块变化才传入 CLS。'},
 {title:'有完整计算，却还没学会',problem:'同一个有标签样本只重复前向计算，参数不变，预测就不变。真正的学习改变了什么？',fix:'执行一次梯度更新',cause:'标签构造损失，梯度指导更新；参数改变，同一输入的概率与损失才改变。'}
];
const cell:React.CSSProperties={padding:'8px',borderBottom:`1px solid ${C.line}`,textAlign:'left'};
export function Recap(){
 const [task,setTask]=useState(0),[fixed,setFixed]=useState(false),[seen,setSeen]=useState<number[]>([]);
 const q=challenges[task],mode=task===0?'position':'mixing';
 const a=recapForward(mode,false,fixed),b=recapForward(mode,true,fixed),gap=clsDifference(mode,fixed),round=learningRound(initialParams);
 const repair=()=>{setFixed(true);setSeen(s=>s.includes(task)?s:[...s,task]);};
 return <>
  <Chips value={task} label="选择机制故障" onChange={v=>{setTask(v);setFixed(false);}} options={challenges.map((q,value)=>({value,label:q.title}))}/>
  <p><b>要解释的问题：</b>{q.problem}</p>
  <div className="ctrl"><button type="button" className="tiny" onClick={repair} disabled={fixed}>{fixed?'已修复，检查下方变化':q.fix}</button><button type="button" className="tiny ghost" disabled={!fixed} onClick={()=>setFixed(false)}>移除修复，再比较</button></div>
  <Stage height={430} label={task===2?'同一输入在参数更新前后的参数、预测概率与损失对照':`原图与${task===0?'图块换位':'鸟嘴置零'}输入的CLS向量对照，${fixed?'已恢复机制':'缺失机制'}`} render={(c,w,h)=>{
   clearScene(c,w,h);const text=(s:string,x:number,y:number,size=23,color:string=C.ink)=>{c.fillStyle=color;c.font=`${size}px sans-serif`;c.fillText(s,x,y);};
   if(task===2){
    text('输入始终相同：x = [1, 0.4]；真实类别 y = 1',25,35);
    parameterKeys.forEach((key,i)=>{const x=30+i*258;pill(c,x,65,235,115,'#fffefa');text(key,x+15,96,25,C.purple);text(initialParams[key].toFixed(3),x+15,131,24);text('→ '+(fixed?round.updated[key]:initialParams[key]).toFixed(3),x+101,131,24,fixed?C.green:C.muted);text('梯度 '+round.gradient[key].toFixed(3),x+15,163,18,C.muted);});
    const old=round.before.p,next=fixed?round.after.p:old;
    text('更新前',25,227);text(fixed?'更新后':'仅重复前向',25,297);
    [old,next].forEach((p,i)=>{pill(c,220,202+i*70,620,40,'#e0e7d9');pill(c,220,202+i*70,620*p,40,i===1&&fixed?C.green:C.blue);text((p*100).toFixed(1)+'%',870,230+i*70);});
    text(`损失：${round.before.loss.toFixed(3)} → ${(fixed?round.after.loss:round.before.loss).toFixed(3)}`,25,370,26,fixed?C.green:C.orange);
    text('θ新 = θ旧 − 0.5 × 梯度；这是四参数二分类演示',25,411,20,C.muted);
   }else{
    text('同一个小模型；只改变输入与当前机制',25,32,24);
    for(let k=0;k<2;k++){
     const x=30+k*235;c.save();c.beginPath();c.rect(x,65,135,135);c.clip();drawPhoto(c,x,65,135,2);
     if(k===1&&task===0){const n=67.5;for(let target=0;target<2;target++){c.save();c.beginPath();c.rect(x+target*n,65,n,n);c.clip();drawPhoto(c,x+(2*target-1)*n,65,135);c.restore();}c.strokeStyle=C.purple;c.lineWidth=2;c.strokeRect(x,65,135,n);}
     if(k===1&&task===1){c.fillStyle='#fffefa';c.fillRect(x+106,113,24,19);}
     c.restore();text(k===0?'原输入':task===0?'叶片 ↔ 鸟嘴':'鸟嘴数值置零',x,231,20);
    }
    text(fixed?'机制已恢复':'机制缺失',565,72,26,fixed?C.green:C.orange);
    if(task===0){text(fixed?'内容 + 固定格位':'只有内容，没有地址',565,112,23);text('上方照片仅指示操作；四图块数值见表',565,149,18,C.muted);}
    else {text('CLS 对四个图块的参考比例',565,112,20);b.weights.slice(1).forEach((v,i)=>{text(['叶片','鸟嘴','翅膀','树枝'][i],565+i*120,151,18);pill(c,565+i*120,167,95,12,'#e0e7d9');if(v>0)pill(c,565+i*120,167,95*v,12,C.blue);text(v.toFixed(3),565+i*120,202,18);});text('其余比例给 CLS 自身',565,231,18,C.muted);}
    text('全局 CLS',25,285,23);text('第1维',290,273,19,C.muted);text('第2维',470,273,19,C.muted);text('第3维',650,273,19,C.muted);text('第4维',830,273,19,C.muted);
    [a,b].forEach((r,k)=>{text(k===0?'原输入':'改变后',25,318+k*40,22);r.cls.forEach((v,j)=>{text(v.toFixed(4),290+j*180,318+k*40,24,k===1&&Math.abs(v-a.cls[j])>1e-6?C.green:C.blue);});});
    line(c,25,375,1040,375,C.line,2);text(`两次 CLS 的距离：${gap<1e-10?'0.000000':gap.toFixed(6)}`,25,413,26,gap<1e-10?C.orange:C.green);
   }
  }}/>
  <Feedback tone={fixed?"green":"orange"}>{fixed?q.cause:task===2?"只重复前向，参数不变就不会学习。执行一次更新再比较。":"输入变了，CLS 却没变；补回缺失机制，观察信息能否传入。"}</Feedback>
  {task<2?<>
   <details><summary>检查实际输入和类别概率</summary><table style={{width:'100%',fontSize:18,borderCollapse:'collapse'}}><thead><tr><th style={cell}>序列位置</th><th style={cell}>原输入（三维示意）</th><th style={cell}>改变后</th></tr></thead><tbody>{a.raw.map((r,i)=><tr key={i}><td style={cell}>图块 {i+1}</td><td style={cell}>[{r.join(', ')}]</td><td style={cell}>[{b.raw[i].join(', ')}]</td></tr>)}</tbody></table><p>类别甲 / 乙 / 丙概率：原输入 [{a.probabilities.map(p=>p.toFixed(4)).join(', ')}]；改变后 [{b.probabilities.map(p=>p.toFixed(4)).join(', ')}]。</p></details>
   <><p style={{fontSize:16,lineHeight:1.7,color:C.muted}}>读出改变 ≠ 分类正确；这里是固定权重演示。</p><details><summary>机制演示的边界</summary><p style={{fontSize:17,color:C.muted}}>读出变化说明该机制提供了区分这些输入的能力，不等于识别正确或准确率必然提高。四维固定权重演示包含共享投影、CLS、单头注意力、残差、逐 token 非线性和归一化；不是论文消融，也不是训练后的 ViT。位置置换仅交换内容，位置表保持不动。</p></details></>
  </>:<><p style={{fontSize:16,lineHeight:1.7,color:C.muted}}>一步降低训练损失，不保证泛化；沿用第 7 节的小模型。</p><details><summary>训练演示的计算与边界</summary><p style={{fontSize:17,color:C.muted}}>与第 7 节同一个可微小模型：h=tanh(a₁x₁+a₂x₂)，z=vh+b，p=sigmoid(z)，损失为 −log p。参数与梯度均实际计算；这个样本的一步改进不保证泛化，也不代表完整 ViT 训练。</p></details></>}
  <Metric><span>已检查 {seen.length} / 3 个机制问题</span></Metric>
  {seen.length===3&&<Feedback tone="green">内容靠位置区分，局部变化靠注意力进入 CLS，参数靠监督目标与优化学习。再用论文结果检验适用条件。</Feedback>}
 </>;
}
