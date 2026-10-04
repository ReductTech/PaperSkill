import { useState } from 'react';
import { Scene,colors,label,panel } from './vc-visual-kit';
import { flowerFrame,phase,scan } from './rev-visual-scenes';
const turns=[
 {name:'询问花色',user:'这朵花是什么颜色？',action:'视觉问答观察图像',reply:'观察结果：花朵是黄色的。',history:'当前图片提供视觉输入。',note:'图像由视觉问答工具读取；语言控制器根据文字观察回答，不自行猜测颜色。'},
 {name:'依照深度生成红花',user:'根据这张图的深度，生成红花。',action:'先预测深度，再做条件生成',reply:'红花图像已生成。',history:'沿用上一轮的花朵图片与对话目标。',note:'先取得深度条件，再结合红花描述生成图像；中间的深度条件与后续生成有明确依赖。'},
 {name:'再变成卡通',user:'再把它变成卡通风格。',action:'对上一轮的红花进行风格转换',reply:'卡通红花已生成。',history:'“它”指上一轮生成的红花。',note:'历史帮助解释指代。风格转换使用上一轮结果；收到输出后再向用户展示，不等于自动完成视觉一致性检查。'}
];
export default function VisualConversation(){
 const [state,setState]=useState({turn:0,start:performance.now()/1000});const item=turns[state.turn];
 return <div><div className="ctrl">{turns.map((v,i)=><button type="button" className={`chip ${state.turn===i?'active':''}`} key={v.name} aria-pressed={state.turn===i} onClick={()=>setState({turn:i,start:performance.now()/1000})}>{i+1}. {v.name}</button>)}</div>
 <Scene height={440} animate label={`第${state.turn+1}轮对话：${item.user}，右侧直接展示视觉结果变化`} draw={(c,t)=>{
  const p=phase(t,state.start);
  label(c,`第 ${state.turn+1} 轮 · 保留对话，继续编辑`,28,32,colors.blue,22);
  panel(c,29,66,510,87,'#e8eff6',colors.border);label(c,'用户',47,91,colors.blue,16);label(c,item.user,47,129,colors.ink,22);
  label(c,item.history,32,193,colors.muted,17);
  panel(c,29,229,510,142,'#fff',colors.green);label(c,'工具执行与反馈',47,258,colors.green,17);
  label(c,item.action,47,293,colors.ink,20);
  const ready=p>.88;
  label(c,ready?item.reply:'正在处理视觉输入…',47,337,ready?colors.green:colors.muted,21);
  if(state.turn===0){flowerFrame(c,604,65,440,305);scan(c,616,77,416,281,p);label(c,'视觉工具观察颜色',616,405,colors.blue,19);}
  else if(state.turn===1){const depthPhase=p<.4;flowerFrame(c,604,65,440,305,depthPhase?{depth:p/.4}:{red:1,depth:1-(p-.4)/.6});label(c,depthPhase?'先形成深度条件':'再根据条件生成红花',616,405,colors.blue,19);}
  else{flowerFrame(c,604,65,440,305,{red:1,cartoon:p});label(c,'红花内容延续，外观转为卡通',616,405,colors.blue,19);}
  label(c,'语言控制器读文字上下文，视觉工具处理图像。',30,414,colors.muted,16);
 }}/><p aria-live="polite">{item.note}</p></div>;
}
