import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { C, Canvas, photo, card, arrow, label, Chips, Feedback } from './clip-scenes';

const scores=[[.8,.2,.1],[.1,.9,.3],[.2,.1,.85]];
const names=['猫','山景','飞机'];
function Matrix(){
 const [selected,setSelected]=useState(0);const row=Math.floor(selected/3),col=selected%3;const correct=row===col;
 const choose=(e:React.PointerEvent<HTMLCanvasElement>)=>{const r=e.currentTarget.getBoundingClientRect();const x=(e.clientX-r.left)*1080/r.width;const y=(e.clientY-r.top)*280/r.height;const i=Math.floor((y-52)/58),j=Math.floor((x-410)/58);if(i>=0&&i<3&&j>=0&&j<3)setSelected(i*3+j);};
 return <div><Canvas ariaLabel="三张图片对三段文字的相似度矩阵，点击一个格子查看配对" onPointerDown={choose} draw={ctx=>{
  photo(ctx,80,91,145,names[row]);label(ctx,'图片 i',86,61,C.blue);
  for(let i=0;i<3;i++)for(let j=0;j<3;j++){
   const x=410+j*58,y=52+i*58;ctx.fillStyle=i===j?'#d9eee2':'#f0e3e3';ctx.fillRect(x+2,y+2,54,54);ctx.strokeStyle=i*3+j===selected?C.orange:C.border;ctx.lineWidth=i*3+j===selected?4:1;ctx.strokeRect(x+2,y+2,54,54);
   ctx.fillStyle=i===j?C.green:C.red;ctx.font='20px "Microsoft YaHei",sans-serif';ctx.textAlign='center';ctx.fillText(scores[i][j].toFixed(2),x+29,y+36);ctx.textAlign='start';
  }
  arrow(ctx,251,147,378,147,C.blue);arrow(ctx,612,147,700,147,correct?C.green:C.red);label(ctx,'文字 j',747,61,C.purple);
  card(ctx,731,104,229,82,`${names[col]}的照片`,correct?C.green:C.red);
 }}/>
 <Chips options={names.flatMap(image=>names.map(text=>`${image}图 × ${text}文`))} value={selected} onChange={setSelected} label="相似度矩阵的九个格子，等效键盘按钮"/>
 <Feedback tone={correct?'good':'bad'}>预设分数：当前是第 {row+1} 张图片“{names[row]}”与第 {col+1} 段文字“{names[col]}的照片”，相似度为 {scores[row][col].toFixed(2)}。{correct?'这是数据原本提供的图文配对，属于训练的正例。':'这不是原始配对，在这个批次的训练目标中被当作负例。'}</Feedback>
 <p>每一行表示“这张图片该配哪段文字”，每一列表示“这段文字该配哪张图片”。按原始配对顺序排列时，正例位于对角线；训练希望对应格比同一行、同一列的其他候选更突出，而不是只学习一个固定类别编号。</p></div>;
}
function Batch(){
 const [choice,setChoice]=useState(0);const n=choice+2;const negatives=n*n-n;const countScale=27;
 return <div><Canvas ariaLabel="批大小决定相似度矩阵和正负配对数量" draw={ctx=>{
  const size=196/n;
  for(let i=0;i<n;i++)for(let j=0;j<n;j++){const x=170+j*size,y=39+i*size;ctx.fillStyle=i===j?C.green:C.passive;ctx.fillRect(x+3,y+3,size-6,size-6);if(i===j){ctx.fillStyle='#ffffff';ctx.textAlign='center';ctx.font='25px sans-serif';ctx.fillText('✓',x+size/2,y+size*.67);ctx.textAlign='start';}}
  label(ctx,'原始配对',450,80,C.green);label(ctx,'其他候选',450,155,C.dark);
  ctx.fillStyle=C.green;ctx.fillRect(608,60,n*countScale,24);ctx.fillStyle=C.passive;ctx.fillRect(608,134,negatives*countScale,24);
  ctx.fillStyle=C.text;ctx.font='25px "Microsoft YaHei",sans-serif';ctx.fillText(`${n}`,620+n*countScale,81);ctx.fillText(`${negatives}`,620+negatives*countScale,155);ctx.fillText(`${n} × ${n} = ${n*n}`,450,229);
 }}/><Chips options={['批大小 2','批大小 3','批大小 4']} value={choice} onChange={setChoice} label="一个训练批次的图文原始配对数"/>
 <Feedback>配对计数：N = {n}，含 {n} 张图片和 {n} 段对应文字。全部交叉比较得到 {n*n} 个格子，其中 {n} 个原始配对是正例，另外 {negatives} 个格子在训练目标中作为负例；每张图片面对 {n-1} 个其他文字候选。</Feedback>
 <p>两根柱子使用相同的比例尺，柱长可以直接比较：N=2时同长，N=4时负例柱长为正例的3倍。批次是一次训练计算同时处理的一组样本。扩大批次提供更多对照，也增加 N² 次配对打分的规模；“负例”指训练目标的角色，不能断言其他文字在语义上一定错误，同义描述可能成为假负例。</p></div>;
}
export const ClipCh3:React.FC<WidgetProps>=({moduleId})=>moduleId==='3.2'?<Batch/>:<Matrix/>;
