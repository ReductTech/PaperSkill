import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { Canvas, C, arrow, label, photo, card, Chips, Feedback, softmax } from './clip-scenes';

const names=['猫','狗','车','鸟'];const scores=[.82,.44,.08,.32];
function Steps() {
  const [step,setStep]=useState(0);
  const captions=['写出候选类别','编码并归一化文字','编码并归一化图片','计算图文余弦','选择最大分数'];
  const detail=[
    '先确定任务的答案范围：猫、狗、车。把类别放进描述模板，例如 a photo of a cat；类别列表由使用者提供。',
    '文字编码器把各条描述变成向量，投影后除以各自长度，形成可以与图像比较的单位方向。类别文本向量可以预先计算并缓存。',
    '图片经过图像编码器、投影和归一化，得到同一向量空间中的图片方向。此时权重保持固定，没有为这张猫照片训练新分类器。',
    '将图片向量分别与三个文字向量做点积。教学分数是猫 0.82、狗 0.44、车 0.08；它们不是实际 CLIP 的输出。',
    'argmax 的意思是“取最大分数所在的位置”。0.82 最大，因此输出猫；需要显示候选内权重时，可再缩放分数并使用 softmax。'
  ];
  return <>
    <Canvas ariaLabel={`零样本分类第${step+1}步：${captions[step]}`} draw={ctx=>{
      label(ctx,'固定模型',50,30);label(ctx,'当前步骤',570,30);
      photo(ctx,45,85,145,'猫');
      const x=[265,425,585,745,905];
      x.forEach((a,i)=>{if(i<4)arrow(ctx,a+55,132,x[i+1]-55,132,i<step?C.green:C.border);card(ctx,a-53,80,106,104,String(i+1),i===step?C.orange:i<step?C.green:C.border);});
      if(step===0){names.slice(0,3).forEach((n,i)=>label(ctx,n,245+i*28,220,C.blue));}
      if(step===1){label(ctx,'t₁  t₂  t₃',385,220,C.blue);}
      if(step===2){label(ctx,'u = f(图片)',515,220,C.blue);}
      if(step>=3){scores.slice(0,3).forEach((s,i)=>label(ctx,s.toFixed(2),640+i*90,220,step===4&&i===0?C.green:C.blue));}
      if(step===4){ctx.strokeStyle=C.green;ctx.lineWidth=4;ctx.beginPath();ctx.arc(963,212,30,0,Math.PI*2);ctx.stroke();label(ctx,'猫',951,221,C.green);}
    }}/>
    <div className="step-ctrl"><button className="chip" disabled={step===0} onClick={()=>setStep(s=>s-1)}>上一步</button><span>{step+1} / 5 · {captions[step]}</span><button className="chip" disabled={step===4} onClick={()=>setStep(s=>s+1)}>下一步</button><button className="chip" onClick={()=>setStep(0)}>重置流程</button></div>
    <Feedback>流程示意：{detail[step]}</Feedback>
    <p><strong>这里的“零样本”：</strong>没有用当前下游任务的带标签图片拟合分类器；预训练阶段已经学过大量图文配对，可能见过相关类别。换候选描述就能换分类任务，但不能保证它理解任何新概念。</p>
  </>;
}
function Candidates() {
  const [mode,setMode]=useState(0);
  const ids=mode===1?[1,2]:mode===2?[0,1,2,3]:[0,1,2];
  const weights=softmax(ids.map(i=>scores[i]),5);
  const winner=ids.reduce((best,id)=>scores[id]>scores[best]?id:best,ids[0]);
  const winIndex=ids.indexOf(winner);
  return <>
    <Canvas ariaLabel={`候选${ids.map(i=>names[i]).join('、')}，预测${names[winner]}，真实照片是猫`} draw={ctx=>{
      label(ctx,'真实照片',60,30);label(ctx,'候选内选择',455,30);
      photo(ctx,55,80,180,'猫');
      card(ctx,260,105,125,57,names[winner],winner===0?C.green:C.red);
      arrow(ctx,238,133,253,133,winner===0?C.green:C.red);
      ids.forEach((id,j)=>{const y=52+j*52;const color=id===winner?(winner===0?C.green:C.red):C.blue;label(ctx,names[id],453,y+28,color);ctx.fillStyle=C.border;ctx.fillRect(505,y+8,360,28);ctx.fillStyle=color;ctx.fillRect(505,y+8,360*weights[j],28);label(ctx,`${(weights[j]*100).toFixed(1)}%`,884,y+29,color);});
    }}/>
    <Chips options={['猫、狗、车','拿掉猫：狗、车','加入鸟：猫、狗、车、鸟']} value={mode} onChange={setMode} label="候选集合"/>
    <table className="paper"><thead><tr><th>候选类别</th><th>固定余弦</th><th>候选内权重（尺度 5）</th></tr></thead><tbody>{ids.map((id,j)=><tr key={id}><td>{names[id]}{winner===id?' ← 最大分数':''}</td><td>{scores[id].toFixed(2)}</td><td>{(weights[j]*100).toFixed(2)}%</td></tr>)}</tbody></table>
    <Feedback tone={mode===1?'bad':'good'}>固定分数算例：预测为“{names[winner]}”，候选内权重 {(weights[winIndex]*100).toFixed(2)}%。{mode===1?'真实类别“猫”不在答案列表中，模型仍从剩余候选中选狗；权重很高也无法把错误预测变成正确答案。':'最大分数仍属于猫；加入其他候选会改变归一化分母和权重，但不改变已有余弦分数。'} 原始这种 argmax 分类没有自动“以上都不是”的选项。</Feedback>
  </>;
}
export const ClipCh6:React.FC<WidgetProps>=({moduleId})=>moduleId==='6.1'?<Steps/>:<Candidates/>;
