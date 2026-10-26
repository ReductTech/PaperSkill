import React, { useState } from 'react';
import { Canvas, Chips, Steps, Feedback, Detail, clearScene, drawPhoto, drawCard, drawBars, drawPen, colors, softmax, projectionStep } from './llava-kit';
const chunks=['船','在','房屋右侧','停止'];
const candidates=[['船','树','房屋'],['在','有','停止'],['房屋右侧','房屋左侧','停止'],['停止','附近','上方']];
const scores=[[2,1,0],[1.8,.5,0],[2,.8,.1],[2.4,.3,-.2]];
export function M6A(){const [step,setStep]=useState(0);const done=step===4;const probs=done?[]:softmax(scores[step]);return <>
 <Canvas label="手工设置的逐步生成演示" draw={ctx=>{clearScene(ctx);drawPhoto(ctx,25,35,340,200,{highlight:'boat'});drawCard(ctx,390,40,640,65,true);ctx.lineWidth=6;for(let i=0;i<Math.min(step,3);i++){ctx.strokeStyle=colors.green;ctx.beginPath();ctx.moveTo(420+i*160,72);ctx.lineTo(530+i*160,72);ctx.stroke();}drawPen(ctx,430+Math.min(step,3)*155,95,-.5,done?colors.green:colors.blue);if(!done)drawBars(ctx,probs,{x:500,y:130,width:480,height:115,max:1,colors:[colors.orange,colors.light,colors.light]});else{ctx.strokeStyle=colors.green;ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(680,180);ctx.lineTo(715,215);ctx.lineTo(800,140);ctx.stroke();}}}/>
 <Steps value={step} max={4} onChange={setStep}/><Detail><b>逐步生成演示（教学片段与分数）</b><div>问题：船在房屋哪一侧？</div><div>已生成前缀：{step===0?'（空）':chunks.slice(0,Math.min(step,3)).join('')}{done?'〔已停止〕':''}</div>{!done&&<div>下一步候选：{candidates[step].map((x,i)=>`${x} ${(probs[i]*100).toFixed(1)}%`).join(' ／ ')}；本例取最大项“{chunks[step]}”。</div>}</Detail>
 <Feedback tone={done?'good':''}>{done?'“船在房屋右侧”已经写完，停止标记像句末交卷的信号，结束本次回答。':step===0?'现在还没有回答前缀，第一步只依据图片、问题和对话格式预测。':`现在只确定了前缀“${chunks.slice(0,step).join('')}”；后面的文字还没有生成。新标记将加入上下文，再预测下一步。`}</Feedback></>}
