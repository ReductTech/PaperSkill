import React, { useState } from 'react';
import { Canvas, clearScene, drawPhoto, drawCard, drawBars, drawPen, colors, Chips, Steps, Feedback, Detail, softmax } from './llava-kit';
export function M2B(){
 const [step,setStep]=useState(0);
 const titles=['问题文字','切分示意','虚构编号','虚构嵌入向量'];
 const tokens=['船','在','哪里','？'];const ids=[17,42,8,5];const vecs=[[1,.2],[.3,.8],[.7,.4],[.2,.6]];
 return <><Canvas label="文字依次表示为片段、编号和向量的示意" draw={ctx=>{clearScene(ctx);
 if(step===0){drawCard(ctx,90,70,900,135,true);ctx.strokeStyle=colors.blue;ctx.lineWidth=10;ctx.beginPath();ctx.moveTo(145,135);ctx.lineTo(920,135);ctx.stroke();}
 else tokens.forEach((_,i)=>{const x=50+i*260;drawCard(ctx,x,45,220,190,true);if(step===1){ctx.fillStyle=colors.blue;ctx.fillRect(x+35,110,150,20);}else if(step===2){ctx.fillStyle=colors.orange;ctx.font='36px sans-serif';ctx.fillText(String(ids[i]),x+90,145);}else drawBars(ctx,vecs[i],{x:x+30,y:65,width:160,height:140,max:1});});
 }}/><Steps value={step} max={3} onChange={setStep}/><Detail><b>{titles[step]}：</b>{step===0?'船在哪里？':step===1?tokens.join(' / '):step===2?ids.join(' / '):vecs.map((v,i)=>tokens[i]+' → ['+v.join(', ')+']').join('；')}</Detail>
 <Feedback>{step===0?'第一步是整理文字：接下来要给文字片段分配编号，再用编号查找向量。':step===1?'这里用中文片段演示切分：把一句话拆成几张小卡片，接下来逐张处理。':step===2?'编号像图书馆的索书号：拿到42号，就去取表里的第42条向量。':'文字这一路通过编号查表得到向量；图片那一路通过视觉编码器计算得到向量。'}</Feedback></>;
}
