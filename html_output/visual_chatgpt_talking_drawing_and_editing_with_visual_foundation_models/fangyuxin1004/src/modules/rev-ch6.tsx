import { useState } from 'react';
import { Scene,colors,label,panel,line } from './vc-visual-kit';
import { flowerFrame,phase,scan } from './rev-visual-scenes';
const stages=[
 {name:'1 · 估计深度',tool:'深度估计',input:'输入：黄色花朵',output:'输出：深度条件',detail:'从原图估计远近结构，形成后续生成的条件。'},
 {name:'2 · 按深度生成红花',tool:'深度条件生成',input:'输入：深度条件',output:'输出：生成的红花',detail:'深度条件与“红色花朵”的文字描述共同引导生成。深度帮助约束画面的大体结构。'},
 {name:'3 · 转为卡通风格',tool:'风格转换',input:'输入：生成的红花',output:'输出：卡通红花',detail:'把上一阶段的红花图像转换为卡通风格，沿用已有内容完成用户的第二项外观要求。'}
];
export default function DepthWorkflow(){
 const [state,setState]=useState({step:0,start:performance.now()/1000});const s=stages[state.step];
 return <div><div className="ctrl">{stages.map((it,i)=><button type="button" className={`chip ${state.step===i?'active':''}`} key={it.name} aria-pressed={state.step===i} onClick={()=>setState({step:i,start:performance.now()/1000})}>{it.name}</button>)}</div>
 <Scene height={425} animate label={`${s.tool}的输入输出动画对照`} draw={(c,t)=>{
  const p=phase(t,state.start);
  label(c,s.input, 30,32,colors.ink,22);label(c,s.output,590,32,colors.blue,22);
  flowerFrame(c,30,54,450,300,state.step===1?{depth:1}:state.step===2?{red:1}:{});
  if(state.step===0){flowerFrame(c,590,54,450,300,{depth:p});scan(c,602,66,426,274,p);}
  if(state.step===1){flowerFrame(c,590,54,450,300,{red:1,reveal:p});}
  if(state.step===2)flowerFrame(c,590,54,450,300,{red:1,cartoon:p});
  if(state.step===1){panel(c,44,365,422,41,'#fff',colors.red);label(c,'同时输入文字条件：“红色花朵”',60,393,colors.red,19);}else label(c,state.step===0?'先提取空间结构':'使用上一阶段的红花结果',44,391,colors.muted,19);
  label(c,state.step===0?'灰阶逐渐呈现远近层次':state.step===1?'结构条件引导新图像形成':'轮廓和线条逐渐形成卡通风格',599,388,colors.blue,18);
  line(c,600,408,1030,408,colors.border,2);line(c,600,408,600+430*p,408,colors.green,3);
 }}/><p aria-live="polite">{s.detail}</p></div>;
}
