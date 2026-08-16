import React, { useState } from 'react';
const states = {
  stop: { title:'终止', color:'bad', path:'失败 → 终止', feedback:'红色路径到此为止：中间结果和失败原因不会影响下一轮。' },
  refine: { title:'Refine', color:'mid', path:'失败 → 诊断 → 修复当前实验', feedback:'蓝色路径保留方向：结果弱或实现可修时，先细化当前实验。' },
  pivot: { title:'Pivot', color:'good', path:'失败 → 记录原因 → 返回假设', feedback:'绿色闭环承认方向不成立，但把失败变成下一次假设的约束。' },
};
export function FailureRoute(){const [choice,setChoice]=useState<keyof typeof states>('stop');const s=states[choice];return <div className="tool">
  <div className="chip-row">{Object.entries(states).map(([k,v])=><button key={k} className={'chip '+(choice===k?'active':'')} onClick={()=>setChoice(k as keyof typeof states)}>{v.title}</button>)}</div>
  <div className={'route-board '+s.color}><span>研究想法</span><b>→</b><span>实验失败</span><b>→</b><strong>{s.path.split('→').slice(-1)[0].trim()}</strong></div>
  <div className={'feedback '+s.color}>{s.feedback}</div></div>}