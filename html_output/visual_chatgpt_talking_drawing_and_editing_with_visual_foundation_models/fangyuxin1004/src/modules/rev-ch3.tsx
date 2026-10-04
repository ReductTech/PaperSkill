import { useState } from 'react';
import { Scene, colors, panel, line, dot, label } from './vc-visual-kit';
const rules=[
 {name:'保留完整原则',stop:4,result:'按步骤调用允许的工具，并根据实际返回结果作答。',why:'系统角色和可用工具范围提供边界；分步要求组织复杂任务；格式约束便于程序解析；观察约束防止把猜测写成已完成的事实。'},
 {name:'移除分步要求',stop:0,result:'复合需求可能被遗漏，只完成其中一项。',why:'“先变红，再转卡通”包含两个目标。分步执行要求帮助控制器把目标拆成前后衔接的工具调用；移除它会增加漏步的可能。'},
 {name:'移除格式约束',stop:1,result:'表达了意图，也可能无法被程序解析成调用。',why:'工具名称与输入需要符合约定格式。只写“帮我把图改一下”并不能保证程序知道要执行哪个工具、传入什么参数。'},
 {name:'移除观察约束',stop:3,result:'尚未获得工具结果，就可能把意图当成完成。',why:'忠于观察意味着有结果才能报告结果。生成目标“红色卡通花”与工具已经产生该图像是两件事；文字控制器不能凭空确认画面。'}
];
const steps=['拆解任务','组织可解析调用','执行允许的工具','根据观察回应'];
export default function SystemPrinciples(){
 const [mode,setMode]=useState(0);const r=rules[mode];
 return <div data-widget="rev-ch3"><div className="ctrl">{rules.map((v,i)=><button type="button" key={v.name} className={`chip ${mode===i?'active':''}`} aria-pressed={mode===i} onClick={()=>setMode(i)}>{v.name}</button>)}</div>
 <Scene height={320} animate label={`系统原则对执行过程的影响：${r.name}`} draw={(c,t)=>{
  label(c,'任务：先把花变红，再转换为卡通风格',28,38,colors.ink,22);
  label(c,'角色与工具边界贯穿整个过程；下方切换展示不同约束的作用',28,68,colors.muted,17);
  const time=t%7,position=Math.min(time/1.5,3.8),current=Math.min(Math.floor(position),r.stop,3);
  for(let i=0;i<4;i++){
   const x=28+i*262,fail=i===r.stop,active=i===current;
   panel(c,x,113,238,106,fail?'#fff1ee':active?'#eaf2e2':'#fff',fail?colors.red:active?colors.green:colors.border);
   label(c,steps[i],x+15,145,fail?colors.red:colors.ink,19);
   const detail=[['先改颜色','再改风格'],['工具名称','明确输入参数'],['视觉模型处理图像','等待真实返回'],['阅读工具观察','再决定如何回复']][i];
   label(c,detail[0],x+15,175,colors.muted,16);label(c,detail[1],x+15,201,colors.muted,16);
   if(i<3){line(c,x+239,163,x+259,163,colors.border,3);line(c,x+252,158,x+259,163,colors.border,2);line(c,x+252,168,x+259,163,colors.border,2);}
   if(active){const progress=(time/1.5)%1;line(c,x+15,231,x+15+progress*207,231,fail?colors.red:colors.green,4);dot(c,x+218,129,5+Math.sin(t*3)*1.5,fail?colors.red:colors.green);}
  }
  label(c,mode===0?'完整原则：每一步都有明确的执行边界':'移除约束：在对应环节出现潜在失误',28,277,mode===0?colors.green:colors.red,21);
 }}/><div className={`feedback ${mode===0?'good':''}`} aria-live="polite"><strong>{r.result}</strong><div>{r.why}</div></div></div>;
}
