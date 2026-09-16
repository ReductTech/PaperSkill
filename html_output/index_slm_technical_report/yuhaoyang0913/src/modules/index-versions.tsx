import React, {useState} from 'react';
import {Scene,Feedback,C,drawDesk,drawPaper,drawPen,drawTarget,drawLabel,line,bar} from './index-kit';
const names=['Base','Pure','Chat','Character'];
const feedback=['当前是 Base：先认识系列的基础模型；版本用途不是能力排名。','当前是 Pure：用对照视角理解基础能力，不能把它与其他消融检查点混为一谈。','当前是 Chat：关注对话任务，后面再拆开监督与偏好训练的作用。','当前是 Character：角色相关历史台词通过检索进入提示，上传语料不等于立即更新权重。'];
export const IndexVersions:React.FC=()=>{
 const [model,setModel]=useState(0);
 return <div onKeyDown={e=>{if(e.key.startsWith('Arrow'))e.stopPropagation();}}>
 <Scene label={`${names[model]}：${feedback[model]}`} draw={(ctx,w,h)=>{
 drawDesk(ctx,w,h);drawPaper(ctx,80,70,300,145);line(ctx,490,24,490,255);drawLabel(ctx,'所选版本',80,35);drawLabel(ctx,'用途',530,24);
 names.forEach((_,i)=>{drawTarget(ctx,130+70*i,185,i===model?C.blue:C.axis);ctx.globalAlpha=i===model?1:.3;bar(ctx,530,36+55*i,490,42,i===model?C.blue:C.light);ctx.globalAlpha=1;ctx.strokeStyle=i===model?C.dark:C.axis;ctx.lineWidth=i===model?3:2;ctx.strokeRect(530,36+55*i,490,42);});drawPen(ctx,130+70*model,130);
 }}/>
 <div className="ctrl" style={{flexWrap:'wrap'}}>{names.map((n,i)=><button key={n} type="button" className={i===model?'chip selected':'chip'} aria-pressed={model===i} onClick={()=>setModel(i)}>{n}</button>)}<output aria-live="polite">所选版本：{names[model]}</output></div>
 <Feedback tone={model>=2?'good':'neutral'}>{feedback[model]}</Feedback></div>;
};
