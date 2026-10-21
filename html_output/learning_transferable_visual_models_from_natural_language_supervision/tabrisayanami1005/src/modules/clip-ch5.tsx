import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { Canvas, C, arrow, label, photo, Chips, Feedback } from './clip-scenes';

const rad=(deg:number)=>deg*Math.PI/180;
function Prompt() {
  const [mode,setMode]=useState(0);
  const angles=[60,35,15];const a=angles[mode];const cosine=Math.cos(rad(a));
  const texts=['crane','a photo of a crane','a photo of a crane, a type of bird'];
  return <>
    <Canvas ariaLabel={`照片与第${mode+1}种提示词方向夹角${a}度，教学相似度${cosine.toFixed(3)}`} draw={ctx=>{
      label(ctx,'同一张照片',70,34);label(ctx,'文字方向',580,34);
      photo(ctx,70,70,200,'鹤');
      const ox=570,oy=205,r=150;
      ctx.strokeStyle=C.border;ctx.beginPath();ctx.arc(ox,oy,r,-Math.PI/2,0);ctx.stroke();
      arrow(ctx,ox,oy,ox+r,oy,C.blue);arrow(ctx,ox,oy,ox+r*Math.cos(rad(a)),oy-r*Math.sin(rad(a)),C.orange);
      label(ctx,`${a}°`,765,110,C.orange);label(ctx,`cos = ${cosine.toFixed(3)}`,765,160,C.green);
    }}/>
    <Chips options={['仅类名','照片句式','鸟类语境']} value={mode} onChange={setMode} label="提示词形式"/>
    <p><strong>实际输入文字：</strong><code>{texts[mode]}</code></p>
    <p>中文含义：{['鹤；英语 crane 也可以指起重机。','一张鹤的照片。','一张鹤的照片，鹤是一种鸟。'][mode]}</p>
    <Feedback>手设向量：文字方向为 {a}°，于是余弦为 {cosine.toFixed(3)}；数值用于展示“输入语境改变表示”的机制，不是论文测得的提升。真实模型可能对某些模板更敏感，也可能因额外文字而变差，应在具体任务上验证。</Feedback>
  </>;
}
function Ensemble() {
  const [mode,setMode]=useState(0);
  const angles=[-20,10,40];
  const vectors=angles.map(a=>[Math.cos(rad(a)),Math.sin(rad(a))]);
  const mean=[vectors.reduce((s,v)=>s+v[0],0)/3,vectors.reduce((s,v)=>s+v[1],0)/3];
  const length=Math.hypot(...mean);const unit=mean.map(x=>x/length);
  const target=mode===0?vectors[0]:unit;
  const angle=Math.atan2(target[1],target[0])*180/Math.PI;
  return <>
    <Canvas ariaLabel={`单模板方向负20度，三模板均值方向10度，当前选中${mode===0?'单模板':'三模板'}`} draw={ctx=>{
      label(ctx,'单个模板',135,30);label(ctx,'三个模板',660,30);
      [250,760].forEach((ox,panel)=>{
        const oy=157,r=93;
        ctx.strokeStyle=C.border;ctx.lineWidth=2;ctx.beginPath();ctx.arc(ox,oy,r,0,Math.PI*2);ctx.stroke();
        arrow(ctx,ox,oy,ox+r,oy,C.blue);
        if(panel===0){arrow(ctx,ox,oy,ox+r*vectors[0][0],oy-r*vectors[0][1],mode===0?C.orange:C.muted);label(ctx,'−20°',ox-20,265,C.orange);}
        else {vectors.forEach((v,i)=>{arrow(ctx,ox,oy,ox+r*v[0],oy-r*v[1],C.passive);label(ctx,`${angles[i]}°`,ox+r*v[0]+10,oy-r*v[1]+5,C.muted);});arrow(ctx,ox,oy,ox+r*unit[0],oy-r*unit[1],mode===1?C.orange:C.green);label(ctx,'10°',ox-20,265,C.green);}
      });
    }}/>
    <Chips options={['选用单模板','选用三模板集成']} value={mode} onChange={setMode} label="类别方向来源"/>
    <div className="metrics"><div className="metric"><div className="l">平均向量长度</div><div className="v">{length.toFixed(4)}</div></div><div className="metric"><div className="l">平均后再归一化</div><div className="v">({unit[0].toFixed(4)}, {unit[1].toFixed(4)})</div></div><div className="metric"><div className="l">当前与图片的余弦</div><div className="v">{target[0].toFixed(4)}</div></div></div>
    <Feedback>二维算例：当前类别方向为 {angle.toFixed(1)}°。三个单位向量先逐坐标平均，得到 ({mean[0].toFixed(4)}, {mean[1].toFixed(4)})，长度 {length.toFixed(4)}；再除以长度，得到长度为 1 的类别向量。这里平均的是文字特征，不是三个预测概率。</Feedback>
    <p>单模板与集成方向同时显示，选项决定最终使用哪一个方向。这个二维例子中集成的余弦更高，但不能推出所有类别、模板和数据集都会受益；论文讨论的是用多个表达描述同一类别。</p>
  </>;
}
export const ClipCh5:React.FC<WidgetProps>=({moduleId})=>moduleId==='5.1'?<Prompt/>:<Ensemble/>;
