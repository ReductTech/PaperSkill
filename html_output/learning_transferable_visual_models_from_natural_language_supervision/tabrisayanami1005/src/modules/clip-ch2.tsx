import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { C, Canvas, photo, card, arrow, label, Chips, Feedback } from './clip-scenes';

const radians=(degrees:number)=>degrees*Math.PI/180;
const neat=(x:number)=>(Math.abs(x)<1e-8?0:x).toFixed(3);
function Direction(){
 const [angle,setAngle]=useState(60);const dragging=useRef(false);
 const cosine=Math.cos(radians(angle));
 const update=(e:React.PointerEvent<HTMLCanvasElement>)=>{
  const rect=e.currentTarget.getBoundingClientRect();
  const x=(e.clientX-rect.left)*1080/rect.width-620;
  const y=145-(e.clientY-rect.top)*280/rect.height;
  if(Math.hypot(x,y)>3)setAngle(Math.round(Math.atan2(y,x)*180/Math.PI));
 };
 const change=(delta:number)=>setAngle(a=>Math.max(-180,Math.min(180,a+delta)));
 return <div>
  <Canvas ariaLabel="拖动橙色文字向量端点，或用左右方向键每次旋转五度" tabIndex={0}
   onPointerDown={e=>{dragging.current=true;e.currentTarget.setPointerCapture(e.pointerId);update(e);}}
   onPointerMove={e=>{if(dragging.current)update(e);}}
   onPointerUp={e=>{dragging.current=false;if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);}}
   onKeyDown={e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();e.stopPropagation();change(e.key==='ArrowLeft'?-5:5);}}}
   draw={ctx=>{
    photo(ctx,55,75,145,'猫');card(ctx,240,108,130,58,'猫的照片',cosine>.7?C.green:C.blue);
    arrow(ctx,218,133,233,133,cosine>.7?C.green:C.blue);
    ctx.strokeStyle=C.border;ctx.lineWidth=2;ctx.beginPath();ctx.arc(620,145,95,0,Math.PI*2);ctx.moveTo(502,145);ctx.lineTo(742,145);ctx.moveTo(620,27);ctx.lineTo(620,258);ctx.stroke();
    arrow(ctx,620,145,715,145,C.blue);
    const tx=620+95*cosine,ty=145-95*Math.sin(radians(angle));
    arrow(ctx,620,145,tx,ty,C.orange);ctx.fillStyle=C.orange;ctx.beginPath();ctx.arc(tx,ty,9,0,2*Math.PI);ctx.fill();
    label(ctx,'图片向量',795,85,C.blue);label(ctx,'文字向量',795,160,C.orange);
    ctx.fillStyle=C.text;ctx.font='24px "Microsoft YaHei",sans-serif';ctx.fillText(`θ = ${angle}°`,800,211);ctx.fillText(`cos θ = ${neat(cosine)}`,800,249);
   }}/>
  <div className="chip-row" role="group" aria-label="文字方向的键盘等效操作">
   <button type="button" className="chip" onClick={()=>change(-5)}>旋转 −5°</button><button type="button" className="chip" onClick={()=>change(5)}>旋转 +5°</button><button type="button" className="chip" onClick={()=>setAngle(60)}>重置为 60°</button>
  </div>
  <Feedback>二维算例：图片单位向量 u = (1, 0)，文字单位向量 v = ({neat(cosine)}, {neat(Math.sin(radians(angle)))})。当前夹角为 {angle}°，余弦相似度为 {neat(cosine)}；方向越接近，相似度越高。</Feedback>
  <p>拖动图中的橙色端点，也可以先聚焦画布再按左右方向键，每次改变 5°。图片中的“猫”只是帮助记忆的例子：真实 CLIP 的向量具有很多维，每一维通常没有可直接命名的含义，网页也没有把文字重新送进编码器。</p>
 </div>;
}
function Normalization(){
 const [choice,setChoice]=useState(0);const length=[1,3,8][choice];const rawDot=length*.5;
 return <div><Canvas ariaLabel="长度改变原始点积，但归一化后的余弦保持不变" draw={ctx=>{
  label(ctx,'归一化前',84,38);label(ctx,'归一化后',665,38);
  ctx.strokeStyle=C.border;ctx.lineWidth=2;[130,680].forEach(x=>{ctx.beginPath();ctx.moveTo(x-30,225);ctx.lineTo(x+260,225);ctx.stroke();});
  arrow(ctx,130,225,154,225,C.blue);arrow(ctx,130,225,130+24*length*.5,225-24*length*Math.sin(Math.PI/3),C.orange);
  arrow(ctx,680,225,775,225,C.blue);arrow(ctx,680,225,727.5,225-95*Math.sin(Math.PI/3),C.orange);
  ctx.fillStyle=C.text;ctx.font='25px "Microsoft YaHei",sans-serif';ctx.fillText(`‖b‖ = ${length}`,370,87);ctx.fillText(`a·b = ${rawDot.toFixed(1)}`,370,131);ctx.fillText(`‖v‖ = 1`,875,87);ctx.fillText('u·v = 0.5',875,131);
  ctx.fillStyle=C.border;ctx.fillRect(546,48,2,190);
 }}/><Chips options={['长度 1','长度 3','长度 8']} value={choice} onChange={setChoice} label="改变文字向量的长度"/>
 <Feedback>二维算例：已投影的图片向量 a = (1, 0)，文字向量 b = ({(length*.5).toFixed(1)}, {(length*Math.sin(Math.PI/3)).toFixed(3)})，长度为 {length}。原始点积是 {rawDot.toFixed(1)}；两者除以各自长度后成为 u、v，夹角仍为 60°，余弦始终是 0.500。</Feedback>
 <p>点积就是同位置数字相乘再相加。L2 归一化将非零向量除以自己的长度，保留方向；CLIP 先做这个操作，再用点积得到余弦相似度，避免仅因向量更长而得到更高的匹配分数。</p></div>;
}
export const ClipCh2:React.FC<WidgetProps>=({moduleId})=>moduleId==='2.2'?<Normalization/>:<Direction/>;
