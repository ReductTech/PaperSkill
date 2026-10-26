import React, { useState } from 'react';
import { Canvas, clearScene, drawPhoto, drawCard, drawBars, drawPen, colors, Chips, Steps, Feedback, Detail, softmax } from './llava-kit';
export function M4B(){
 const [query,setQuery]=useState(0);const q=query===0?[1,0]:[0,1];const keys=[[1,0],[0,1]];const values=[[2,0],[0,2]];const raw=keys.map(k=>k.reduce((s,v,i)=>s+v*q[i],0));const scaled=raw.map(x=>x/Math.sqrt(2));const a=softmax(scaled);const o=[0,1].map(i=>values.reduce((s,v,j)=>s+a[j]*v[i],0));
 return <><Canvas label="Q变化时两个注意力份额与加权结果同步变化" draw={ctx=>{clearScene(ctx);drawBars(ctx,a,{x:70,y:60,width:340,height:180,max:1,colors:[colors.blue,colors.orange]});drawBars(ctx,o,{x:600,y:60,width:400,height:180,max:2,colors:[colors.blue,colors.orange]});ctx.fillStyle=colors.ink;ctx.font='24px sans-serif';ctx.fillText('参考份额',160,36);ctx.fillText('汇总向量',720,36);}}/>
 <Chips labels={['当前更匹配第1块','当前更匹配第2块']} value={query} onChange={setQuery} label="选择教学Q"/>
 <Detail><b>固定：</b>K₁=[1,0]，K₂=[0,1]；V₁=[2,0]，V₂=[0,2]。<br/>
 <b>当前 Q=[{q.join(', ')}]：</b>点积 [{raw.join(', ')}] ÷ √2 → [{scaled.map(x=>x.toFixed(3)).join(', ')}]。<br/>
 <b>softmax：</b>exp({scaled[0].toFixed(3)}) / (exp({scaled[0].toFixed(3)})+exp({scaled[1].toFixed(3)})) = {a[0].toFixed(3)}；另一份为{a[1].toFixed(3)}。<br/>
 <b>取回内容：</b>{a[0].toFixed(3)}×[2,0]+{a[1].toFixed(3)}×[0,2] = [{o.map(x=>x.toFixed(3)).join(', ')}]。</Detail>
 <Feedback>Q与K决定份额，V提供被汇总的数。当前第{query+1}块份额更大，它的V在混合结果中占得更多。切换查询，就能看到取用信息的比例怎样变化。</Feedback></>;
}
