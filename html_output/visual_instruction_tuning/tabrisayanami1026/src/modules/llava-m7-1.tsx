import React, { useState } from 'react';
import { Canvas, Chips, Steps, Feedback, Detail, clearScene, drawPhoto, drawCard, drawBars, drawPen, colors, softmax, projectionStep } from './llava-kit';
const roles=['系统消息','图片位置','用户问题','助手标记','答案目标','停止目标'];
const explain=['规定对话背景，属于作答时参考的材料。','视觉向量提供图片信息，后面的回答位置会参考这些线索。','告诉模型要做什么；这个问题仍会影响后面的答案。','指出接下来轮到助手回答，相当于答题栏前面的标题。','把模型对标准答案标记的预测概率拿来计算损失。','学习在正确的位置结束回答，因此也参与损失。'];
export function M7A(){const [selected,setSelected]=useState(0);const active=selected>=4;return <>
 <Canvas label="条件位置与参与损失的目标位置" onPointerDown={e=>{const r=e.currentTarget.getBoundingClientRect();const x=(e.clientX-r.left)*1080/r.width;setSelected(Math.max(0,Math.min(5,Math.floor((x-30)/175))));}} draw={ctx=>{clearScene(ctx);for(let i=0;i<6;i++){const x=30+i*175;drawCard(ctx,x,45,145,90,i===selected);ctx.fillStyle=i>=4?colors.green:colors.blue;ctx.fillRect(x+18,65,109,14);ctx.fillStyle=colors.ink;ctx.font='30px sans-serif';ctx.fillText(i>=4?'1':'0',x+65,113);ctx.strokeStyle=i===selected?colors.orange:colors.line;ctx.lineWidth=i===selected?5:2;ctx.beginPath();ctx.moveTo(x+72,140);ctx.lineTo(850,210);ctx.stroke();}ctx.fillStyle=active?colors.green:colors.blue;ctx.beginPath();ctx.arc(850,210,22,0,Math.PI*2);ctx.fill();}}/>
 <Chips labels={roles} value={selected} onChange={setSelected} label="查看目标位置"/>
 <Detail><b>{roles[selected]}：损失记号为{active?1:0}</b><div>{explain[selected]}</div><div>1＝在此目标位置计分；0＝忽略此位置的直接损失。图中的连线表示上下文会影响答案。像做阅读题：先读材料，再给答题栏里的内容计分。</div></Detail>
 <Feedback tone={active?'good':''}>{active?'这个位置属于答题栏，要把预测与标准答案比较并计分。分数随后沿计算过程传回去，用来调整可训练参数。':'这个位置属于阅读材料，给回答提供线索。记号0表示跳过它的直接计分；接着点击回答位置，就能找到真正的答题栏。'}</Feedback></>}
