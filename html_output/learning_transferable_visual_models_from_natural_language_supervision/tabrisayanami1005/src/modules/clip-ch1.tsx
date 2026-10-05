import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { C, Canvas, photo, card, arrow, label, Chips, Feedback } from './clip-scenes';

const subjects=['猫','山景','飞机'];
function LabelComparison(){
 const [subject,setSubject]=useState(0);
 const supported=subject===0;
 return <div>
  <Canvas ariaLabel="同步比较固定标签与文字候选标签" draw={ctx=>{
   label(ctx,'固定类别',130,40);label(ctx,'文字类别',675,40);
   photo(ctx,115,65,145,subjects[subject]);photo(ctx,650,65,145,subjects[subject]);
   arrow(ctx,280,126,350,126,supported?C.green:C.red);arrow(ctx,815,126,885,126,C.green);
   card(ctx,365,95,140,70,supported?'✓':'?',supported?C.green:C.red);
   card(ctx,900,95,140,70,'✓',C.green);
   ctx.fillStyle=C.border;ctx.fillRect(548,55,2,170);
  }}/>
  <Chips options={subjects.map(x=>`${x}照片`)} value={subject} onChange={setSubject} label="切换同一张输入照片"/>
  <Feedback tone={supported?'good':'bad'}>预设示例：当前图片为{subjects[subject]}。固定类别只有“猫、狗、车”，{supported?'能够表达“猫”':'没有对应标签，不能直接输出正确类别'}；文字候选为“猫、山景、飞机”，此处预设匹配到“{subjects[subject]}”。</Feedback>
  <p>观察两侧的同一张照片：新增文字候选让我们可以提出新的分类问题，但不保证模型一定识别正确。真实 CLIP 的判断需要由图文相似度计算，开放的类别接口也受训练数据与候选设计约束。</p>
 </div>;
}
const tasks=['分类','检索','生成'];
const explanations=[
 '分类：给一张图片，准备多个类别文字，选择相似度最高的一类。例如在“猫、山景、飞机”中挑出“猫”。输出是候选类别，不是一篇描述。',
 '检索：给一句文字，比较多张图片，找出更匹配的图片。例如输入“一张猫的照片”，在相册中挑出猫照片。图找文也可以利用同一套相似度。',
 '生成：根据图片逐字写出新句子，需要产生文字的模型。原始 CLIP 的直接输出是特征与匹配分数，没有逐字生成照片描述的接口。'
];
function TaskComparison(){
 const [task,setTask]=useState(0);
 return <div><Canvas ariaLabel="分类检索和生成的任务区别" draw={ctx=>{
  photo(ctx,95,78,160,'猫');
  if(task===0){arrow(ctx,275,140,415,140,C.blue);card(ctx,445,107,155,65,'猫',C.green);card(ctx,650,107,155,65,'',C.border);card(ctx,855,107,155,65,'',C.border);}
  else if(task===1){card(ctx,320,103,175,65,'找猫照片',C.blue);arrow(ctx,515,138,580,138,C.blue);['猫','山景','飞机'].forEach((kind,i)=>{photo(ctx,615+i*150,85,115,kind);if(i===0){ctx.strokeStyle=C.green;ctx.lineWidth=5;ctx.strokeRect(610,80,125,102);}});}
  else{arrow(ctx,280,140,435,140,C.red);card(ctx,465,62,470,157,'',C.red);ctx.setLineDash([8,8]);ctx.strokeStyle=C.border;ctx.lineWidth=2;[107,141,175].forEach(y=>{ctx.beginPath();ctx.moveTo(490,y);ctx.lineTo(906,y);ctx.stroke();});ctx.setLineDash([]);label(ctx,'没有生成接口',495,43,C.red);}
 }}/><Chips options={tasks} value={task} onChange={setTask} label="比较三个视觉任务"/>
 <Feedback tone={task===2?'bad':'good'}>任务示意：{explanations[task]}</Feedback>
 <p>“多模态”指同时涉及图片、文字等不同形式的信息，并不自动意味着能聊天。CLIP 将图像与语言对齐，是后来许多多模态方法的重要前置知识。</p></div>;
}
export const ClipCh1:React.FC<WidgetProps>=({moduleId})=>moduleId==='1.3'?<TaskComparison/>:<LabelComparison/>;
