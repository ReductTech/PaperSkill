import React,{useState} from 'react';
import {Canvas,Chips,Stats,Feedback,Table,C,rect,label} from './notebook-scene';
const names=['VibeThinker-3B','DeepSeek V3.2','GLM-5','Gemini 3 Pro'];
export const metrics=['AIME26','LiveCodeBench v6','GPQA-Diamond','IMO-AnswerBench'];
export const values=[[94.3,94.2,95.8,91.7],[80.2,80.8,85.5,87.4],[70.2,82.4,86,91.9],[76.4,78.3,82.5,83.1]];
const extra=[97.1,null,72.9,80.6];
const protocol=['本模型：每题64次独立生成，报告平均Pass@1；不是64次挑最好。','本模型：代码基准按8次独立生成取平均；执行测试判正确。','本模型：知识基准按16次独立生成取平均。','本模型：400道IMO级答案问题，16次独立生成取平均Pass@1；不是证明题自动证明。'];
const allRows=[['AIME25',91.4,96.7],['AIME26',94.3,97.1],['HMMT25',89.3,95.4],['BruMO25',93.8,99.2],['IMO-AnswerBench',76.4,80.6],['LiveCodeBench v6',80.2,'未报告'],['OJBench',38.6,'未报告'],['GPQA-Diamond',70.2,72.9],['IFEval',93.4,'未报告'],['IFBench',74.5,'未报告']];
export function Results(){const [metric,setMetric]=useState(0),[clr,setClr]=useState(false),[started,setStarted]=useState<number|null>(null);const actual=values[metric].map((v,i)=>i===0&&clr&&extra[metric]!==null?extra[metric]!:v);const rows=names.map((n,i)=>[String(i+1),n+(i===0&&clr?' + CLR':''),['3B','671B','744B','未公开'][i],actual[i].toFixed(1)]);const change=(i:number)=>{setMetric(i);if(extra[i]===null)setClr(false);setStarted(null);};return <>
 <Canvas h={280} animate label="4模型同一基准分数对比，精确值见下表" draw={(c,t)=>{const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;const p=started===null?0:reduced?1:Math.min(1,Math.max(0,(t-started)/1200));actual.forEach((v,i)=>{const y=25+i*57;label(c,String(i+1),20,y+25,22);rect(c,70,y,675,34,'#e2e7df');rect(c,70,y,v/100*675*(1-(1-p)**3),34,i===0?C.green:C.blue);label(c,(v*p).toFixed(1),760,y+26,22,i===0?C.green:C.blue);});label(c,'0',69,272,16);label(c,'100',714,272,16);}}/>
 <Chips options={metrics} value={metric} onChange={change}/>
 <div className="ctrl" style={{gap:10,flexWrap:'wrap'}}><button className="chip selected" onClick={()=>setStarted(performance.now())}>查看对比</button><button className={`chip ${clr?'selected':''}`} aria-pressed={clr} disabled={extra[metric]===null} onClick={()=>{setClr(!clr);setStarted(null);}}>{extra[metric]===null?'代码 CLR 未报告':clr?'已加入 CLR':'加入 CLR'}</button></div>
 <Stats items={[["本模型分数",actual[0].toFixed(1)],["方向",'越高越好'],["协议",clr?'CLR：额外推理预算':'标准评测']]}/>
 <Feedback tone={metric===2?'':'good'}>{protocol[metric]} {clr?'CLR每题生成32条、每条核验5个主张，完整流程独立运行8次后平均；额外预算不能忽略。 ':''}{metric===2?'科学知识密集任务仍有明显差距，不能从数学成绩推出通用知识全面领先。':'这是表2中选取的代表模型，不是全部榜单；小幅差异没有附带显著性检验，不能过度解读。'}</Feedback>
 <Table headers={['图中编号','模型','总参数量','分数 / 100']} rows={rows}/>
 <details style={{marginTop:20}}><summary style={{cursor:'pointer',fontWeight:650}}>展开全部基准与评测口径</summary>
 <Table headers={['基准','VibeThinker-3B','+ CLR']} rows={allRows}/>
 <p>原文表1–2记录。vLLM 推理，temperature=1.0，top-p=0.95，top-k=−1；除模型最大生成长度外不另加输出长度限制。数学评测联合规则工具与LLM裁判，代码以执行测试验证。</p>
 <p>近期 LeetCode：2026年4月25日至5月31日，8场比赛，每场4题，每题4次独立Python首答，123/128次通过，接受率96.1%。这是32道题的重复采样聚合，不是128道独立题；范围不包括真实软件工程项目。</p>
 <p>总参数不等于激活参数、算力或延迟。本报告没有组件逐项量化消融和完整训练成本，不能把分数提升归因给单一技术。数据去污染是作者的报告，仍需要独立复现来增强可信度。</p>
 <p><a href="https://arxiv.org/html/2606.16140v1#S3" target="_blank" rel="noreferrer">核对原文评测与表格 ↗</a></p>
 </details>
 </>;}
