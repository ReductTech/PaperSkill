import { useState } from 'react';
import type { WidgetProps } from './registry';
import { C, Canvas, Chips, Feedback, card, photo, arrow, label, softmax } from './clip-scenes';

const logits=[[2,1,0],[0,2,1],[1,0,2]];
const stages=['取出图文批次','编码并归一化','生成匹配分数','计算行损失','计算列损失','平均两个方向'];
const p=softmax(logits[0])[0];
const loss=-Math.log(p);
function Training(){
 const [step,setStep]=useState(0);
 const explanations=[
  '取出 N=3 个原始配对：猫照片—猫说明、山景—山说明、飞机—飞机说明。对角线是数据提供的配对目标，并非模型已经预测正确。',
  '两个编码器先输出特征，再经线性投影和 L2 归一化得到单位向量。归一化使后续点积比较方向；网页中的三组数字是教学设定。',
  '每张图片都与每条文字比较，得到 3×3 个缩放后的匹配分数（logits）。logit 不是概率；这里已把温度缩放包含在分数中。',
  `图找文：对每一行做 softmax，正确列的权重都是 ${p.toFixed(5)}。负对数 −ln(${p.toFixed(5)})=${loss.toFixed(5)}；三行取平均得到 Lᵢ=${loss.toFixed(5)}。`,
  `文找图：对每一列做 softmax，正确行的权重也是 ${p.toFixed(5)}。三列平均 Lₜ=${loss.toFixed(5)}；本例各行、各列的分数只是2、1、0的不同排列，且正确位置都是2，所以两方向损失相同。矩阵本身不对称，真实批次的两方向损失也可以不同。`,
  `最终 L=(Lᵢ+Lₜ)/2=${loss.toFixed(5)}。真实训练会计算损失对模型参数的梯度，再由优化器更新参数；此演示仅展开前向计算，没有训练模型。`
 ];
 return <><Canvas ariaLabel={`训练步骤${step+1}，三乘三匹配矩阵`} draw={ctx=>{
  label(ctx,step<3?'图文配对':'双向目标',35,37);
  ['猫','山','飞机'].forEach((kind,i)=>photo(ctx,35+i*125,75,105,kind));
  const x=505,y=52,w=83,h=61;
  for(let i=0;i<3;i++)for(let j=0;j<3;j++){
   const selected=step===3?i===0:step===4?j===0:step===5?i===j:false;
   card(ctx,x+j*w,y+i*h,w-7,h-7,'',selected?C.orange:i===j?C.green:C.border);
   ctx.font='22px "Microsoft YaHei",sans-serif';ctx.fillStyle=i===j?C.green:C.muted;
   ctx.fillText(step<2?(i===j?'✓':'·'):step<3?String(logits[i][j]):softmax(step===4?logits.map(row=>row[j]):logits[i])[step===4?i:j].toFixed(3),x+j*w+12,y+i*h+34);
  }
  if(step===1)arrow(ctx,396,131,487,131,C.blue);
  if(step>=3){label(ctx,step===3?'按行归一':'按列／平均',817,61);ctx.font='26px sans-serif';ctx.fillStyle=C.blue;ctx.fillText(step===5?`L=${loss.toFixed(5)}`:`−ln p=${loss.toFixed(5)}`,807,144);}
 }}/><div className="step-ctrl"><button className="tiny" type="button" disabled={step===0} onClick={()=>setStep(step-1)}>上一步</button><button className="tiny" type="button" disabled={step===5} onClick={()=>setStep(step+1)}>下一步</button><button className="tiny ghost" type="button" onClick={()=>setStep(0)}>重置训练演示</button></div><p>第 {step+1}/6 步：{stages[step]}。匹配分数为教学预设值。</p><Feedback>{explanations[step]}</Feedback></>;
}
function Negatives(){
 const [selected,setSelected]=useState(0);
 const options=['奔跑的狗','一只狗在跑','停着的车'];
 const colors=[C.green,C.orange,C.red];
 const feedback=['这是原始图文配对中的说明，训练目标把它当正例。正例意味着“数据中配在一起”，不意味着该描述是照片唯一合理的描述。','这句话也可能正确描述照片，但如果它来自批次的另一个样本，标准配对目标仍把它当负例。这是语义上的假负例：数据索引与真实语义不是完全同一件事。','这句描述与狗照片不匹配，可以作为明显负例。对比学习希望正例比分数更高，但不要求每一个负例在语义上都绝对错误。'];
 return <><Canvas ariaLabel="点击三条说明，比较原配对、语义相近说明和不匹配说明" onPointerDown={e=>{const r=e.currentTarget.getBoundingClientRect();const x=(e.clientX-r.left)*1080/r.width;const y=(e.clientY-r.top)*280/r.height;if(y>=61&&y<=229&&x>=465&&x<=990)setSelected(Math.min(2,Math.floor((y-61)/56)));}} draw={ctx=>{
   photo(ctx,81,60,210,'狗');arrow(ctx,325,135,427,89+selected*56,colors[selected]);
   options.forEach((text,i)=>card(ctx,465,61+i*56,525,46,text,selected===i?colors[i]:C.border));
 }}/><Chips options={options} value={selected} onChange={setSelected} label="选择说明（与图上热点等效）"/><p>配对示例。绿色：原配对；橙色：语义相近的批次负例；红色：不匹配。</p><Feedback>{feedback[selected]}</Feedback></>;
}
export const ClipCh7=({moduleId}:WidgetProps)=>moduleId==='7.2'?<Negatives/>:<Training/>;
