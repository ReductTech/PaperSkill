import React, { useState } from 'react';
import { Canvas, Chips, Steps, Feedback, Detail, clearScene, drawPhoto, drawCard, drawBars, drawPen, colors, softmax, projectionStep } from './llava-kit';
const stages=['视觉图块特征','投影后的视觉向量','问题文字向量','组合输入序列','预测下一个标记'];
const info=[
 ['Z：dᵥ×N','N列对应N个视觉位置，每列有dᵥ个数，就像N张各写着dᵥ个数的记录卡。'],
 ['H=WZ：dₗ×N','W大小为dₗ×dᵥ。图块数量N不变，每列变为语言模型接受的长度dₗ。'],
 ['E：dₗ×M','把问题和对话格式拆成M个文字标记，查嵌入表得到M列文字向量。'],
 ['输入：dₗ×(N+M)','示意排列为图像在前、问题在后；每列长度一致，位置与对话格式仍要保留。'],
 ['输出：词表中各标记的分数','语言模型结合图像与文字上下文，为词表中的候选标记打分，再选出下一项。']
];
export function M8B(){const [step,setStep]=useState(0);return <>
 <Canvas label="从视觉与文字向量到同一序列的结构步骤" draw={ctx=>{clearScene(ctx);const rects=[[35,55,190,165],[285,30,190,100],[285,165,190,80],[545,45,230,195],[855,45,190,195]];ctx.strokeStyle=colors.line;ctx.lineWidth=3;[[225,120,285,80],[475,80,545,100],[475,205,545,175],[775,140,855,140]].forEach(l=>{ctx.beginPath();ctx.moveTo(l[0],l[1]);ctx.lineTo(l[2],l[3]);ctx.stroke();});rects.forEach((r,i)=>{drawCard(ctx,r[0],r[1],r[2],r[3],step===i);ctx.fillStyle=step===i?colors.orange:i===2?colors.purple:colors.blue;const count=i===3?7:i===4?4:4;for(let j=0;j<count;j++){const xx=r[0]+15+j*(r[2]-30)/count;ctx.globalAlpha=step===i?1:.45;ctx.fillRect(xx,r[1]+15,(r[2]-40)/count-6,i===2?25:(i===4?[90,140,45,65][j]:r[3]-30));}ctx.globalAlpha=1;});}}/>
 <Steps value={step} max={4} onChange={setStep}/><Detail><b>{stages[step]}</b><div>{info[step][0]}</div><div>{info[step][1]}</div><div>尺寸按“每个标记占一列”书写。dᵥ、dₗ是向量长度，N、M是位置数量；画中的柱子用简化长度展示它们的排列方式。</div></Detail>
 <Feedback tone={step===4?'good':''}>{step===0?'图片经过视觉编码器，变成一叠记录视觉特征的数字卡片。':step===1?'连接层用同一矩阵处理每张视觉卡片，把每张卡片的数字数量调整为dₗ。':step===2?'文字向量由文字编号查表得到，来源与视觉向量不同，但长度要兼容。':step===3?'把视觉卡片与文字卡片按顺序排好，一起交给Vicuna。注意力让回答位置从这些卡片里取用信息。':'现在走完了一圈：图片编码、线性连接、图文共同计算、预测下一个标记；新标记接回输入，回答就逐步写出来了。'}</Feedback></>}
