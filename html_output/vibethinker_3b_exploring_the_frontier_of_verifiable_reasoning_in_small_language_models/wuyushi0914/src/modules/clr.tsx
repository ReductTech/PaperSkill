import React,{useState} from 'react';
import {Canvas,Stats,Feedback,C,rect,label,target,Table} from './notebook-scene';
export function reliability(verdicts:boolean[]){return (verdicts.filter(Boolean).length/verdicts.length)**verdicts.length;}
export function CLR(){const [verdicts,setVerdicts]=useState([true,true,true,true,false]);const a=3*reliability(verdicts),b=1;const winner=a>b?'A':a<b?'B':'平局';const flip=(i:number)=>setVerdicts(verdicts.map((v,j)=>i===j?!v:v));return <>
 <Canvas label="点击五项主张切换判定，比较答案组权重" style={{cursor:'pointer'}} onClick={e=>{const r=e.currentTarget.getBoundingClientRect();const x=(e.clientX-r.left)/r.width*840,y=(e.clientY-r.top)/r.height*240;if(y<85){const i=Math.round((x-210)/100);if(i>=0&&i<5&&Math.abs(x-(210+i*100))<35)flip(i);}}} draw={c=>{verdicts.forEach((v,i)=>target(c,210+i*100,42,v,1.15));[a,b].forEach((v,i)=>{const y=103+i*70;label(c,i?'答案B':'答案A',35,y+24);rect(c,155,y,560,34,'#e3e8e0');rect(c,155,y,v/3*560,34,(i===0?winner==='A':winner==='B')?C.green:C.blue);label(c,v.toFixed(5),725,y+25,18);});}}/>
 <div className="ctrl" style={{gap:8,flexWrap:'wrap'}}>{verdicts.map((v,i)=><button className={`chip ${v?'selected':''}`} key={i} aria-pressed={v} onClick={()=>flip(i)}>主张 {i+1}：{v?'通过':'不通过'}</button>)}<button className="chip" onClick={()=>setVerdicts([true,true,true,true,false])}>重置</button></div>
 <Stats items={[["A单条通过",`${verdicts.filter(Boolean).length} / 5`],["A单条权重",reliability(verdicts).toFixed(5)],["加权胜者",winner]]}/>
 <Feedback tone="good">{winner==='B'?`虽然A有3票，但加权合计只有${a.toFixed(5)}，低于B的1；更可靠的少数票胜出。`:`A的5项都通过，每条权重1，三条合计3；在这组自验证判定下A胜出。`} 这里把A的三条轨迹设成相同判定以便观察，不代表它们在真实推理中独立无误。</Feedback>
 <Table headers={['等价答案组','候选数','每条权重','组总权重']} rows={[["A",3,reliability(verdicts).toFixed(5),a.toFixed(5)],["B",1,'1.00000','1.00000']]}/>
 </>;}
