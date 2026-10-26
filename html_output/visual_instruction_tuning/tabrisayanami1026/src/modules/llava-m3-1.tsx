import React, { useState } from 'react';
import { Canvas, clearScene, drawPhoto, drawCard, drawBars, drawPen, colors, Chips, Steps, Feedback, Detail, softmax } from './llava-kit';
export function M3A(){
 const [step,setStep]=useState(0);const z=[2,1];const W=[[1,0],[0,1],[1,-1]];const h=W.map(row=>row.reduce((s,v,i)=>s+v*z[i],0));
 const equations=['1×2 + 0×1 = 2','0×2 + 1×1 = 1','1×2 − 1×1 = 1'];
 return <><Canvas label="相同比例尺下的两维输入与逐项计算的三维输出" draw={ctx=>{clearScene(ctx);drawBars(ctx,z,{x:70,y:55,width:340,height:190,max:2,colors:[colors.blue,colors.blue]});drawBars(ctx,h.map((v,i)=>i<step?v:0),{x:600,y:55,width:400,height:190,max:2,colors:h.map((_,i)=>i===step-1?colors.orange:colors.green)});ctx.fillStyle=colors.ink;ctx.font='24px sans-serif';ctx.fillText('输入',190,35);ctx.fillText('输出',765,35);}}/>
 <Steps value={step} max={3} onChange={setStep}/><Detail><b>输入 z=[2,1]；矩阵 W 的三行：</b>[1,0]、[0,1]、[1,−1]。<br/>{step===0?'尚未计算输出。':equations.slice(0,step).map((eq,i)=><div key={eq}>第{i+1}项：{eq}</div>)}<b>当前输出：</b>[{h.map((v,i)=>i<step?v:'待算').join(', ')}]</Detail>
 <Feedback tone={step===3?'good':''}>{step===0?'W有2列，所以每一行接收2个输入；有3行，所以最后输出3个数。':step<3?equations[step-1]+'。把同一张输入卡片[2,1]交给每一行规则，各自算出一个结果。':'结果是[2,1,1]：原来一张卡片上有2个数，现在有3个数。其余视觉卡片也用同一组规则转换。'}</Feedback></>;
}
