import React, { useState } from 'react';
import { Canvas, clearScene, drawPhoto, drawCard, drawBars, drawPen, colors, Chips, Steps, Feedback, Detail, softmax } from './llava-kit';
export function M2A(){
 const [patch,setPatch]=useState(0);
 const rgb=[[182,139,94],[151,181,204],[126,158,111],[80,125,168]];
 const z=[[2,1],[.4,1.6],[1.5,.5],[.3,2]];
 const names=['左上区域','右上区域','左下区域','右下区域'];
 const choose=(e:React.PointerEvent<HTMLCanvasElement>)=>{const r=e.currentTarget.getBoundingClientRect();const x=(e.clientX-r.left)*1080/r.width;const y=(e.clientY-r.top)*280/r.height;if(x>=30&&x<=490&&y>=30&&y<=250)setPatch((y>=140?2:0)+(x>=260?1:0));};
 return <><Canvas label="可点选四个图块的教学照片" onPointerDown={choose} draw={ctx=>{clearScene(ctx);drawPhoto(ctx,30,30,460,220,{grid:true});
 ctx.strokeStyle=colors.orange;ctx.lineWidth=6;ctx.strokeRect(30+(patch%2)*230,30+Math.floor(patch/2)*110,230,110);
 drawBars(ctx,z[patch],{x:600,y:45,width:360,height:195,max:2,colors:[colors.blue,colors.orange]});
 }}/><Chips labels={names} value={patch} onChange={setPatch} label="选择图块"/>
 <Detail><b>{names[patch]}，手工教学数字：</b>一个RGB示例 [{rgb[patch].join(', ')}]；虚构视觉特征 [{z[patch].join(', ')}]。RGB记录一个像素的颜色；视觉特征汇总图像中的模式。这里用两组教学数字展示这两种记录方式。</Detail>
 <Feedback>切块只按网格分组，不会沿物体边缘剪。当前选中第{patch+1}块：它有2个教学特征数，这与一共有4块是两回事。</Feedback></>;
}
