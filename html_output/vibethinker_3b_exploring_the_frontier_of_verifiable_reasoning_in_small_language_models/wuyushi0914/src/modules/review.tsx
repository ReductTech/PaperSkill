import React,{useState} from 'react';
import {Canvas,Chips,Feedback,C,notebook,target,label} from './notebook-scene';
const questions=[
 ['数学基准平均64次生成的Pass@1，意味着什么？',['每题64个答案里挑一个最好','对单次答对率做重复估计'],1,'重复独立采样用于降低估计波动，报告平均单次表现；Pass@64才关心64个候选里至少一次成功。'],
 ['Long2Short零和再分配，直接保证了什么？',['组奖励均值不变','模型准确率一定不变'],0,'零和公式保证奖励总和、均值守恒；模型训练后的准确率是否保持，仍要用验证集检查。'],
 ['CLR中r_k=1，可以解释为？',['模型自验证判定5个主张都通过','答案100%正确'],0,'自验证也会犯错或漏掉关键主张。权重1只表示所抽取主张在这次核验中全过，不是事实保证。'],
 ['LeetCode的123/128，分母代表什么？',['128道不同题','128次独立首答提交'],1,'8场×4题=32题，每题4次独立Python生成，一共产生128次首答提交。'],
 ['参数压缩—覆盖假说，当前证据支持？',['可验证推理与知识覆盖可能有不同参数需求','已经严格证明3B可替代所有大模型'],0,'作者提出解释性假说，数学与知识基准差异提供线索。缺少等预算对照和组件消融，不能推出普遍替代结论。']
] as const;
export function Review(){const [q,setQ]=useState(0),[answer,setAnswer]=useState<number|null>(null);const item=questions[q];const ok=answer===item[2];return <>
 <Canvas h={180} label="概念判断即时反馈" draw={c=>{notebook(c,75,22,690,132);label(c,String(q+1),120,102,53);if(answer!==null)target(c,678,87,ok,2);else label(c,'?',665,103,47,C.blue);}}/>
 <p style={{fontWeight:650}}>{item[0]}</p>
 <Chips options={[...item[1]]} value={answer??-1} onChange={setAnswer}/>
 <Feedback tone={answer===null?'':ok?'good':'bad'}>{answer===null?'选择一个说法，检验自己是否区分了指标、机制和结论。':(ok?'这个判断成立。':'再看清证据的边界。')+item[3]}</Feedback>
 <div className="ctrl" style={{gap:10,flexWrap:'wrap',marginTop:14}}><button className="chip" disabled={q===0} onClick={()=>{setQ(q-1);setAnswer(null);}}>上一题</button><span>{q+1} / {questions.length}</span><button className="chip" disabled={q===4} onClick={()=>{setQ(q+1);setAnswer(null);}}>下一题</button><button className="chip" onClick={()=>{setQ(0);setAnswer(null);}}>重新思考</button></div>
 </>;}
