import React, { useState } from 'react';
import { Canvas, clearScene, drawPhoto, drawCard, drawBars, drawPen, colors, Chips, Steps, Feedback, Detail, softmax } from './llava-kit';
export function M1B(){
 const [mode,setMode]=useState(0);
 return <><Canvas label="同一幅图片的匹配输出与回答输出对照" draw={ctx=>{clearScene(ctx);
 drawPhoto(ctx,30,25,440,145,{highlight:'all'});drawPhoto(ctx,610,25,440,145,{highlight:'all'});
 const xs=[45,195,345];xs.forEach((x,i)=>{drawCard(ctx,x,195,110,48,mode===0&&i===0);ctx.fillStyle=i===0?colors.green:colors.light;ctx.fillRect(x+8,225,(i===0?.85:i===1?.28:.12)*94,8);});
 drawCard(ctx,620,185,420,65,mode===1);ctx.strokeStyle=mode===1?colors.green:colors.line;ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(645,220);ctx.lineTo(mode===1?990:720,220);ctx.stroke();drawPen(ctx,mode===1?992:722,207,-.5,mode===1?colors.green:colors.dark);
 }}/><Chips labels={['匹配候选描述','根据问题回答']} value={mode} onChange={setMode} label="输出方式"/>
 <Detail>{mode===0?<><b>候选卡片与相似度示意：</b>房屋与船 0.85；汽车 0.28；猫 0.12。分数越高，表示卡片与图片越匹配。</>:<><b>右侧示意回答：</b>问题“船在哪里？” → “船在房屋右侧。”</>}</Detail>
 <Feedback>{mode===0?'三张候选卡片里，“房屋与船”得分最高，所以它被选作这张照片的描述。':'回答模式需要语言模型继续生成文字。接上视觉输入之后，还要训练它利用这些信息。'}</Feedback></>;
}
