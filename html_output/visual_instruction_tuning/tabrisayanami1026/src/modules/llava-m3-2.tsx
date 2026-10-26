import React, { useState } from 'react';
import { Canvas, clearScene, drawPhoto, drawCard, drawBars, drawPen, colors, Chips, Steps, Feedback, Detail, softmax } from './llava-kit';
export function M3B(){
 const [mode,setMode]=useState(0);const W=mode===0?[[0,1],[1,0]]:[[1,0],[0,1]];const z=[1,0];const h=W.map(r=>r.reduce((s,v,i)=>s+v*z[i],0));
 return <><Canvas label="长度均为二维但对应关系不同的投影示意" draw={ctx=>{clearScene(ctx);drawPhoto(ctx,35,35,420,210,{highlight:'house'});drawBars(ctx,h,{x:600,y:55,width:400,height:190,max:1,colors:[colors.green,colors.red]});}}/>
 <Chips labels={['接口能用但对应错','教学设定的正确对应']} value={mode} onChange={setMode} label="选择连接矩阵"/>
 <Detail><b>手工规定：</b>输入[1,0]是房屋线索；输出第1方向对应房屋，第2方向对应船。<br/>W=[{W.map(r=>'['+r.join(', ')+']').join(', ')}]；W×[1,0]=[{h.join(', ')}]。</Detail>
 <Feedback tone={mode===0?'bad':'good'}>{mode===0?'输出是[0,1]：长度完全合适，却被送到了教学设定的“船”方向。':'输出是[1,0]，落在本例设定的“房屋”方向。训练连接层，就是利用大量图文样本反复调整这样的对应关系。'}</Feedback></>;
}
