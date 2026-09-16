import React,{useState} from 'react';
import {Canvas,Chips,Feedback,Stats,C,paperView,rect,label,target} from './notebook-scene';
export function Verifier(){const [mode,setMode]=useState(0),[answer,setAnswer]=useState(0);const ok=mode===2?null:!!answer;return <>
 <Canvas label="可验证答案判定" draw={c=>{paperView(c,ok);rect(c,445,40,340,158,'#fff');label(c,'验证结果',465,72);if(ok===null)label(c,'?',590,150,58,C.purple);else {label(c,String(+ok),590,152,64,ok?C.green:C.red);target(c,723,128,ok,1.8);}}}/>
 <Chips options={['数学','代码','开放写作']} value={mode} onChange={setMode}/>
 <Chips options={mode===0?['x = 3','x = 4']:mode===1?['返回数组首项','返回数组最大值']:['华丽的描写','简洁的描写']} value={answer} onChange={setAnswer}/>
 <Stats items={[[mode===0?'问题':mode===1?'测试':'目标',mode===0?'2x + 3 = 11':mode===1?'max([1, 5, 2]) 应为 5':'写一段优美的日落描写']]}/>
 <Feedback tone={ok===null?'':ok?'good':'bad'}>{mode===2?'文风没有唯一标准答案，不能仅凭这些候选给出可靠的0/1正确奖励；需要评价标准或奖励模型。':mode===0?(answer?'x=4：2×4+3=11，满足等式，奖励为1。':'x=3：2×3+3=9，代回失败，奖励为0。'):(answer?'返回最大值5，通过这个测试；实际代码评测需要更多测试和沙箱。':'返回首项1，与期望5不符，这个测试即能发现错误。')}</Feedback>
 </>;}
