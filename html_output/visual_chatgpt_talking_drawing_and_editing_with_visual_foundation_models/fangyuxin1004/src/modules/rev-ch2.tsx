import { useState } from 'react';
import { Scene, colors, panel, line, dot, label } from './vc-visual-kit';
const items=[
 {name:'系统原则',detail:'定义角色、工具使用范围、分步执行、输出格式和对观察结果的忠实要求。它们共同约束控制器怎样行动。',short:'怎样行动、怎样表达',color:colors.purple},
 {name:'工具管理',detail:'把每个视觉工具的名称、用途、输入和输出整理成可比较的说明，帮助控制器选择适合当前子任务的能力。',short:'有什么工具、如何调用',color:colors.blue},
 {name:'用户查询管理',detail:'把用户文字与图像输入组织成一次可处理的请求，提醒控制器调用视觉工具获得观察；图像像素交给视觉模型处理。',short:'用户要什么、需要观察什么',color:colors.orange},
 {name:'模型输出管理',detail:'把工具结果整理成下一轮上下文，供控制器判断继续调用、回答用户，或在需求不清楚时请求澄清。',short:'得到什么、下一步做什么',color:colors.green}
];
function flow(c:CanvasRenderingContext2D,points:number[][],time:number,color:string){
 let lengths=points.slice(1).map((p,i)=>Math.hypot(p[0]-points[i][0],p[1]-points[i][1]));let total=lengths.reduce((a,b)=>a+b,0),pos=(time%3)/3*total;
 points.slice(1).forEach((p,i)=>line(c,points[i][0],points[i][1],p[0],p[1],color,3));
 for(let i=0;i<lengths.length;i++){if(pos<=lengths[i]){let f=pos/lengths[i];dot(c,points[i][0]+(points[i+1][0]-points[i][0])*f,points[i][1]+(points[i+1][1]-points[i][1])*f,7,color);break;}pos-=lengths[i];}
}
export default function PromptManagerOverview(){
 const [selected,setSelected]=useState(0);const s=items[selected];
 return <div data-widget="rev-ch2"><div className="ctrl">{items.map((v,i)=><button key={v.name} type="button" className={`chip ${selected===i?'active':''}`} aria-pressed={selected===i} onClick={()=>setSelected(i)}>{v.name}</button>)}</div>
 <Scene height={380} animate label={`同一个提示管理器的四类职责，当前展示${s.name}`} draw={(c,t)=>{
  panel(c,242,18,596,253,'#edf2e8',colors.dark);label(c,'同一个 Prompt Manager',377,49,colors.dark,22);
  items.forEach((v,i)=>{const x=262+(i%2)*286,y=70+Math.floor(i/2)*99;panel(c,x,y,266,80,selected===i?'#fff':'#f5f8f0',selected===i?v.color:colors.border);label(c,v.name,x+14,y+28,selected===i?v.color:colors.muted,20);label(c,v.short,x+14,y+58,colors.ink,15);});
  panel(c,20,143,174,72);label(c,'用户请求',61,173,colors.ink,20);label(c,'文字 ＋ 图像',47,199,colors.muted,16);
  panel(c,886,143,174,72);label(c,'视觉工具',927,173,colors.ink,20);label(c,'读取 / 生成图像',904,199,colors.muted,16);
  panel(c,399,316,282,53,'#fff',colors.blue);label(c,'语言控制器：决定下一步',419,349,colors.blue,20);
  if(selected===0)flow(c,[[394,150],[240,150],[240,296],[474,296],[474,316]],t,s.color);
  if(selected===1)flow(c,[[682,150],[840,150],[840,296],[606,296],[606,316]],t,s.color);
  if(selected===2){flow(c,[[194,178],[226,178],[226,209],[262,209]],t,s.color);flow(c,[[394,249],[394,290],[504,290],[504,316]],t+1,s.color);}
  if(selected===3){flow(c,[[886,178],[854,178],[854,209],[814,209]],t,s.color);flow(c,[[682,249],[682,290],[576,290],[576,316]],t+1,s.color);}
  label(c,'组织提示与反馈',22,297,colors.muted,16);label(c,'图像处理由视觉工具完成',792,352,colors.muted,14);
 }}/><div className="feedback" aria-live="polite"><strong>{s.name}：</strong>{s.detail}</div>
 <p style={{fontSize:'.9em'}}>四个类别描述的是同一管理器的不同职责；它们不是四个分别决策的智能体。</p></div>;
}
