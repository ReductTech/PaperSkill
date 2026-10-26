import React, { useState } from 'react';
import { Canvas, clearScene, drawPhoto, drawCard, drawBars, drawPen, colors, Chips, Steps, Feedback, Detail, softmax } from './llava-kit';
export function M4A(){
 const [pos,setPos]=useState(0);const slots=['视觉1','视觉2','问题','回答1','回答2','停止'];
 const choose=(e:React.PointerEvent<HTMLCanvasElement>)=>{const r=e.currentTarget.getBoundingClientRect();const x=(e.clientX-r.left)*1080/r.width;const y=(e.clientY-r.top)*280/r.height;const i=Math.floor((x-30)/175);if(i>=0&&i<6&&y>=75&&y<=205)setPos(i);};
 return <><Canvas label="选中位置可参考自己和左侧输入，右侧未来输入被遮住" onPointerDown={choose} draw={ctx=>{clearScene(ctx);slots.forEach((_,i)=>{const x=30+i*175;drawCard(ctx,x,75,150,130,i===pos);ctx.fillStyle=i<=pos?colors.blue:colors.red;ctx.globalAlpha=i<=pos?.85:.16;ctx.fillRect(x+8,83,134,114);ctx.globalAlpha=1;if(i>pos){ctx.strokeStyle=colors.red;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x+25,180);ctx.lineTo(x+125,100);ctx.stroke();}if(i===pos){ctx.strokeStyle=colors.orange;ctx.lineWidth=6;ctx.strokeRect(x,75,150,130);}});}}/>
 <Chips labels={slots} value={pos} onChange={setPos} label="选择已有输入位置"/>
 <Detail><b>当前输入：</b>{slots[pos]}。<br/><b>允许参考：</b>{slots.slice(0,pos+1).join('、')}。<br/><b>禁止参考：</b>{slots.slice(pos+1).join('、')||'没有更后的位置'}。<br/><b>本例的预测目标：</b>{pos<2?'视觉位置只展示访问规则，不要求预测下一块图片。':pos===2?'第1个回答标记（从问题结束位置预测）。':pos===3?'第2个回答标记（接在已有第1个标记后面）。':pos===4?'停止标记。':'回答已经结束，本例没有后续目标。'}</Detail>
 <Feedback>{pos===5?'遇到停止标记，就像写完后放下笔，这次回答到此结束。':'选中位置可以参考自己及以前的输入。遮罩像一张逐步向右移动的纸，露出已有内容，把后面待写的答案盖住。'}</Feedback></>;
}
