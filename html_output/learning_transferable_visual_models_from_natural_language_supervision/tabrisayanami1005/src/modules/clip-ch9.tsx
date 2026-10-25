import { useState } from 'react';
import type { WidgetProps } from './registry';
import { C, Canvas, Chips, Feedback, card, photo, arrow, label } from './clip-scenes';
function Tasks(){
 const [task,setTask]=useState(0);
 const options=['相册检索','精确计数','输出物体框','写一段描述'];
 const messages=['可以把查询和照片编码，再按相似度排序，用于相册检索。检索结果仍应结合具体数据评估，不能把最高分自动视为真实正确答案。','“共有几棵树”要求精确数量理解，不能仅凭匹配接口保证正确。论文指出计数和距离等任务较弱；图中的圈只是提问位置，不是模型已经数对。','原始 CLIP 输出图文相似度，不直接输出检测框的坐标。可作为其他定位模型的部件，但那是新增方法，不能当作这篇论文已经实现的能力。','原始 CLIP 不生成连续文字。它能给预先准备的描述打分；真正自动写描述还需要生成式模型或其他系统，这个演示的空白文本区不会产出真实回答。'];
 return <><Canvas ariaLabel={`旅行照片用于${options[task]}`} draw={ctx=>{
  photo(ctx,70,38,250,'山景');
  if(task===0){arrow(ctx,339,138,515,138,C.green);card(ctx,540,101,420,74,'找到候选照片',C.green);}
  if(task===1){ctx.strokeStyle=C.red;ctx.lineWidth=3;[145,213,265].forEach((x,i)=>{ctx.beginPath();ctx.arc(x,139-i*19,25,0,Math.PI*2);ctx.stroke();});card(ctx,540,101,420,74,'精确数量？',C.red);}
  if(task===2){ctx.strokeStyle=C.red;ctx.lineWidth=3;ctx.setLineDash([9,8]);ctx.strokeRect(101,75,172,129);ctx.setLineDash([]);card(ctx,540,101,420,74,'框坐标？',C.red);}
  if(task===3){card(ctx,540,68,420,147,'',C.red);ctx.strokeStyle=C.border;[108,142,176].forEach(y=>{ctx.beginPath();ctx.moveTo(569,y);ctx.lineTo(918,y);ctx.stroke();});label(ctx,'待生成描述',650,48,C.red);}
 }}/><Chips options={options} value={task} onChange={setTask} label="选择实际任务"/><p>任务示意。圈、虚线框和空白描述区分别标出数量、位置与描述的输出要求。</p><Feedback>{messages[task]}</Feedback></>;
}
const questions=['零样本是否意味着训练时没见过任何相关概念？','正温度能否改变固定相似度分数的类别排名？','ResNet 与 ViT 是否意味着 CLIP 要使用两种不同的图文监督目标？'];
const explain=['“零样本”限定下游评测协议：不使用该任务的标注样本拟合分类器。预训练仍使用了海量图文，可能包含相关概念或重叠内容。','固定分数除以正温度再 softmax，只改变归一化权重的尖锐程度，argmax 顺序不变。若改变提示词或候选集合，那是另一个操作。','ResNet 和 ViT 是图像骨干架构的选择：前者以卷积和残差为核心，后者以图片块和注意力为核心。它们都可接图像投影与归一化，并使用相同的图文对比训练目标。'];
function Quiz(){
 const [q,setQ]=useState(0);const [answers,setAnswers]=useState<(boolean|null)[]>([null,null,null]);
 const score=answers.filter(x=>x===false).length;
 const answer=(value:boolean)=>setAnswers(old=>old.map((a,i)=>i===q?value:a));
 return <><Canvas ariaLabel={`三题判断练习，当前答对${score}题`} draw={ctx=>{
  card(ctx,135,29,730,218,'',C.dark);photo(ctx,161,52,178,'山');
  answers.forEach((a,i)=>{card(ctx,392+i*141,79,107,114,'',q===i?C.orange:C.border);ctx.fillStyle=a===null?C.muted:a===false?C.green:C.red;ctx.font='44px sans-serif';ctx.fillText(a===null?'?':a===false?'✓':'×',425+i*141,151);});
  label(ctx,`答对 ${score}/3`,590,234,C.green);
 }}/><Chips options={['第 1 题','第 2 题','第 3 题']} value={q} onChange={setQ} label="选择判断题"/><p><strong>{questions[q]}</strong></p><div className="chip-row" role="group" aria-label="判断答案"><button type="button" className={`chip ${answers[q]===true?'selected':''}`} aria-pressed={answers[q]===true} onClick={()=>answer(true)}>是</button><button type="button" className={`chip ${answers[q]===false?'selected':''}`} aria-pressed={answers[q]===false} onClick={()=>answer(false)}>否</button><button className="tiny ghost" type="button" onClick={()=>{setAnswers([null,null,null]);setQ(0);}}>重置练习</button></div><Feedback>{answers[q]===null?'先作判断，再看原文依据。可以重选答案，正确数量会同步变化。':`${answers[q]===false?'判断正确。':'需要修正：正确答案是“否”。'}${explain[q]}`}</Feedback><p>得分是学习练习结果，不是模型性能。每题的理由对应前面的定义和计算。</p></>;
}
export const ClipCh9=({moduleId}:WidgetProps)=>moduleId==='9.2'?<Quiz/>:<Tasks/>;
