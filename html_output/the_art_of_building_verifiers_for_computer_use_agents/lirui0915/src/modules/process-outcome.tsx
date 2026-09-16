import {useState} from 'react';
import {Controls,Feedback,Metric} from './proofKit';
import './review-polish.css';
const cases=[{name:'正常完成',process:true,outcome:true,text:'✓ 正确交付且没有额外副作用：过程和结果都成功。'},{name:'登录墙阻断',process:true,outcome:false,text:'充分尝试、明确报告登录墙且没有尝试替代时，过程可获满分；用户目标未达成，结果仍失败。不是遇到阻碍就自动免责。'},{name:'正确替代路径',process:true,outcome:true,text:'✓ 替代路径正确交付，且没有违反用户硬性指定的平台或其他约束，因此结果仍可成功。'},{name:'选错对象',process:false,outcome:false,text:'✕ 选错对象属于可控执行错误，不能归因为环境阻碍；过程有缺陷，结果也没有满足目标。'}];
const paths=[
 ['核对目标对象','按要求执行操作','交付正确结果'],
 ['核对目标对象','充分尝试后遇到登录墙','报告阻碍，未能交付'],
 ['核对目标对象','采用符合约束的替代路径','交付正确结果'],
 ['选中了错误对象','对错误对象执行操作','目标对象仍未完成'],
];
export function ProcessOutcome(){
 const [scenario,setScenario]=useState(0);
 const s=cases[scenario];
 return <div>
  <div className="outcome-scene" aria-label={`${s.name}：操作过程与最终交付`}>
   <div className="outcome-scene-heading"><strong>同一项委托，两条判断线</strong></div>
   <div className="outcome-path" key={scenario}>
    {paths[scenario].map((step,i)=><div className={`outcome-step ${scenario===3?'is-error':scenario===1&&i>0?'is-blocked':'is-good'}`} style={{animationDelay:`${i*150}ms`}} key={step}>
     <span className="outcome-step-icon" aria-hidden="true">{scenario===3?'×':scenario===1&&i===1?'▣':i===2?(s.outcome?'✓':'!'):i===0?'◎':'→'}</span>
     <small>{['确认对象','执行与应对','最终交付'][i]}</small><strong>{step}</strong>
    </div>)}
   </div>
   <div className="outcome-verdicts">
    <div><span>过程：怎么做的？</span><strong>{s.process?'符合要求，可获满分':'对象选错，执行有缺陷'}</strong></div>
    <div><span>结果：目标达成了吗？</span><strong>{s.outcome?'已正确交付':'未达成用户目标'}</strong></div>
   </div>
  </div>
  <div className="evidence-controls">{cases.map((v,i)=><button key={v.name} className={scenario===i?'verify-primary':'verify-secondary'} aria-pressed={scenario===i} onClick={()=>setScenario(i)}>{v.name}</button>)}</div>
  <Controls><Metric label="过程判断" value={s.process?'可满分':'有缺陷'}/><Metric label="结果标签" value={s.outcome?'成功':'失败'}/></Controls>
  <Feedback tone={s.outcome?'good':s.process?'neutral':'bad'}>{s.text}</Feedback>
 </div>;
}