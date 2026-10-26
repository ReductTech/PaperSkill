import React, { useState } from 'react';
import { Canvas, Chips, Steps, Feedback, Detail, clearScene, drawPhoto, drawCard, drawBars, drawPen, colors, softmax, projectionStep } from './llava-kit';
export function M5A() {
  const [role,setRole]=useState(0);
  return <><Canvas label={role===0?'文本教师只接收说明与框，照片被遮住':'LLaVA训练接收照片与问题'} draw={ctx=>{
    clearScene(ctx);drawPhoto(ctx,30,30,410,220,{covered:role===0,highlight:role===1?'all':'none'});
    [0,1,2].forEach(i=>{drawCard(ctx,540,35+i*73,480,55,role===0?i<2:i!==1);ctx.fillStyle=role===0?colors.blue:colors.green;ctx.fillRect(560,50+i*73,role===0?[280,180,95][i]:[180,95,340][i],10);ctx.fillRect(560,68+i*73,role===0?[190,260,65][i]:[120,65,250][i],6);});
  }}/><Chips labels={['生成训练题的GPT-4','学习看图的LLaVA']} value={role} onChange={setRole} label="查看信息来源"/>
  <Detail>{role===0?<><b>文本教师收到：</b><div>图片说明：“左侧有房屋，右侧有船。”</div><div>框的文字示意：“船：[0.60, 0.45, 0.90, 0.85]”。</div><div>少量人工编写的出题范例。</div><b>生成的训练问答示意：</b><div>问：船在房屋哪一侧？ 答：船在房屋右侧。</div></>:<><b>LLaVA收到：</b><div>输入：原始图片＋问题“船在房屋哪一侧？”</div><div>学习目标：“船在房屋右侧。”</div><div>这里没有要求它先读出框坐标，也没有调用GPT-4替用户作答。</div></>}</Detail>
  <Feedback>{role===0?'生成数据时，文本版GPT-4拿到图片说明和物体框的文字表示，没有直接读取图片。':'训练LLaVA时，输入包括原始图片和问题，目标是对应回答；这与出题时的输入不同。'}</Feedback></>;
}
