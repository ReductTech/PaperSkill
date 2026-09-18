import React,{useState} from 'react';
import {Canvas,Feedback,Stats,C,notebook,line,pencil,target,label} from './notebook-scene';
const notes=['只模仿一条标准路线，可能没有足够的候选可供探索。','多路径SFT保留不同的分解、推导和检查方法，扩展解法谱。','同一验证条件区分成功和失败；图中的数量仅作示意。','RL放大已验证的有效信号；更宽的探索空间与更可靠的单次输出分工配合。'];
export function Spectrum(){const [step,setStep]=useState(0);return <>
 <Canvas label="解法谱与信号强化" draw={c=>{notebook(c,40,25,560,180);for(let i=0;i<3;i++){const visible=step>0||i===0;const color=!visible?C.line:step<2?C.blue:i===2?C.red:C.green;const y=66+i*51;line(c,[[85,y],[180,y-15],[285,y+12],[410,y-9],[520,y]],color,step===3&&i<2?7:3);if(step>=2)target(c,555,y,i<2);}pencil(c,470,178);label(c,String(step===0?1:3),678,100,55);if(step>=2)label(c,'2',678,178,55,C.green);}}/>
 <div className="ctrl" style={{gap:10,flexWrap:'wrap'}}><button className="chip" onClick={()=>setStep(0)}>重置</button><button className="chip" disabled={step===0} onClick={()=>setStep(step-1)}>上一步</button><strong>{step+1} / 4</strong><button className="chip" disabled={step===3} onClick={()=>setStep(step+1)}>下一步</button></div>
 <Stats items={[["当前阶段",['单一路径','多路径SFT','验证候选','强化有效信号'][step]],["教学候选",step===0?'1 条':'3 条']]}/>
 <Feedback tone={step===3?'good':step===0?'bad':''}>{notes[step]}</Feedback>
 </>;}
