import React, { useState } from 'react';
import { Canvas, clearScene, drawPhoto, drawCard, drawBars, drawPen, colors, Chips, Steps, Feedback, Detail, softmax } from './llava-kit';
export function M1A() {
 const [question,setQuestion]=useState(0);
 const answers=['照片里有房屋和船。','船在房屋右侧。','屋顶、窗户和墙壁共同支持房屋判断。'];
 const focus:('all'|'boat'|'house')[]=['all','boat','house'];
 return <><Canvas label="同一幅房屋与船的插图，随问题突出不同线索" draw={ctx=>{
 clearScene(ctx);drawPhoto(ctx,30,30,470,220,{highlight:focus[question]});drawCard(ctx,550,38,480,200,true);
 ctx.strokeStyle=colors.blue;ctx.lineWidth=6;const lengths=[330,260,390];
 for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(580,85+i*46);ctx.lineTo(580+lengths[(i+question)%3],85+i*46);ctx.stroke();}
 drawPen(ctx,970,160,-.5,colors.orange);
 }}/><Chips labels={['图里有什么？','船在哪里？','为什么像房屋？']} value={question} onChange={setQuestion} label="选择问题"/>
 <Detail><b>示意答案：</b>{answers[question]}</Detail>
 <Feedback>{question===0?'问题要求列出可见物体，所以同时标出房屋和船。':question===1?'问题要求相对位置，要把船的位置与房屋联系起来。':'问题要求说明依据，所以突出屋顶、窗户和墙壁，把判断用到的线索找出来。'}</Feedback></>;
}
