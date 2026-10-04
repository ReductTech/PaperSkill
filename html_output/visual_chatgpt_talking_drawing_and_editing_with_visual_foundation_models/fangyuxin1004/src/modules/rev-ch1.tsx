import { useState } from 'react';
import { Scene,colors,label,panel,line } from './vc-visual-kit';
import { flowerFrame,phase,scan } from './rev-visual-scenes';
const modes=[
 {name:'按需求选择工具',request:'这朵花是什么颜色？',note:'语言控制器选择视觉问答，视觉工具观察图片并返回“黄色”的文字结果；像素处理发生在视觉工具中。'},
 {name:'建立工具之间的关系',request:'按深度结构生成红花，再变成卡通',note:'深度估计提供结构条件，条件生成结合“红花”要求，风格转换再处理红花结果。每一步都有不同职责。'},
 {name:'承接多轮视觉对话',request:'先改成红花，下一轮再转成卡通',note:'新请求沿用上一轮的图像结果与对话意图。已有视觉工具完成变化，语言控制器负责组织调用。'}
];
export default function Innovation(){
 const [state,setState]=useState({mode:0,start:performance.now()/1000});const m=modes[state.mode];
 return <div data-widget="rev-ch1"><div className="ctrl">{modes.map((v,i)=><button type="button" key={v.name} className={`chip ${state.mode===i?'active':''}`} aria-pressed={state.mode===i} onClick={()=>setState({mode:i,start:performance.now()/1000})}>{v.name}</button>)}</div>
 <Scene height={405} animate label={`${m.name}：直接展示花朵的观察、颜色与风格变化`} draw={(c,t)=>{
  const elapsed=t<state.start?3.8:t-state.start;const p=phase(t,state.start);
  label(c,m.request,30,35,colors.blue,22);
  let caption='',description='',detail='';
  if(state.mode===0){flowerFrame(c,30, 60,470,305);scan(c,42,72,446,279,p);caption=p<.65?'视觉工具正在观察花朵':'观察结果：花朵是黄色的';description='视觉问答读取图像';detail='语言控制器根据返回的文字观察组织回答。';
   panel(c,558,104,477,83,'#fff',colors.blue);label(c,'用户问：这朵花是什么颜色？',581,151,colors.blue,23);
   label(c,caption,563,240,p<.65?colors.muted:colors.green,24);
   if(p>=.65){c.fillStyle='#e6bb59';c.beginPath();c.arc(581,292,15,0,Math.PI*2);c.fill();label(c,'黄色',610,299,colors.ink,22);}
  }else{
   const stage=Math.floor((elapsed%12)/4);const q=Math.min(1,(elapsed%4)/2.7);
   if(state.mode===1){flowerFrame(c,30,60,470,305,stage===0?{depth:q}:stage===1?{red:1,depth:1-q}:{red:1,cartoon:q});caption=['从黄花估计远近结构','深度条件与红花描述共同引导生成','在红花结果上形成卡通描边'][stage];description=['深度估计','深度条件生成','风格转换'][stage];detail=['灰阶表示画面中的空间关系。','深度结构与文字条件共同引导生成。','输入是上一阶段的红花图像。'][stage];}
   else{const turn=Math.floor((elapsed%10)/5);const q=Math.min(1,(elapsed%5)/3);flowerFrame(c,30,60,470,305,{red:turn===0?q:1,cartoon:turn===1?q:0});caption=turn===0?'第一轮：把黄花改成红花':'第二轮：将红花转为卡通';description=turn===0?'图像编辑':'风格转换';detail='后一轮使用前一轮的红花结果。';}
   label(c,'当前视觉操作',557,104,colors.muted,18);label(c,description,557,149,colors.blue,30);
   label(c,caption,557,214,colors.ink,21);label(c,detail,557,254,colors.muted,18);
   line(c,558,302,1020,302,colors.border,3);line(c,558,302,558+462*(state.mode===1?q:p),302,colors.green,4);
  }
  label(c,'由已有视觉工具执行，无需重新联合训练。',30,391,colors.muted,16);
 }}/><div className="feedback" aria-live="polite">{m.note}</div></div>;
}
