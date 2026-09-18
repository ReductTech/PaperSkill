import {useState} from 'react';
import {CanvasView,Controls,Feedback,Metric,palette as p,page,line,label} from './proofKit';
const methods=[
{name:'WebVoyager / GPTeval',model:'GPT-4o（本文比较配置）',inputs:[true,false,true,false],text:'将轨迹截图与代理最终答复交给多模态模型，直接判断任务成功与否。截图超过限制时只保留最后 N 张，默认 N=30。',risk:'不输入完整动作历史；最终答复可能含幻觉，末尾截取也可能丢失早期证据。',output:'二元结果判断'},
{name:'WebJudge',model:'o4-mini（本文比较配置）',inputs:[true,true,false,false],text:'先从任务提取要点，再给截图打相关性分，最后结合筛选后的截图与完整动作历史判断成功。Table 1 的配置按1–5分筛选、最多保留5张。',risk:'不使用代理最终答复，减少其幻觉干扰；但任务级选图不等同于每项评分标准分别检索证据。',output:'二元结果判断'},
{name:'Universal Verifier',model:'GPT-5.2（本文比较配置）',inputs:[true,true,true,true],text:'生成任务专属的明确评分标准，对全量截图按每项标准计算相关性，逐项选取 top-k，再用视觉证据核对动作与答复。',risk:'用逐项证据支持过程分、结果标签和失败诊断；调用更多、实现更复杂，也仍可能选错证据或推理出错。',output:'过程分 + 结果标签 + 诊断'}
];
const inputs=['轨迹截图','完整动作历史','代理最终答复','任务专属评分标准'];
const threads=[
{name:'失败定位：AgentRx',what:'识别关键失败步骤，并用九类根因分类解释哪里出了问题。',why:'成功/失败的单个标签不足以指导修复；诊断需要位置和类型。AgentRx 的分类不能直接当成 UV 自己的错误分类。',values:[1,0,1],out:'失败步骤与根因'},
{name:'多维评估：AgentRewardBench',what:'包含1,302条专家标注轨迹，覆盖5个基准与4种代理模型。其 Simplified Judge 在一次模型生成中预测成功、副作用和重复循环三个二元标签。',why:'在该基准与协议中，被评估的 LLM judge 精确率均未超过70%，人际一致率为89.3%。精确率与一致率是不同指标，这些结果不能与本文主表直接排名。',values:[1,1,1],out:'成功 / 副作用 / 重复'},
{name:'过程奖励与结果奖励',what:'相关工作在数学推理中研究过程监督与结果监督，也将验证扩展到 agentic RAG 等领域；有工作训练过程奖励模型。',why:'这些研究为区分过程质量与最终完成提供背景，不表示本文训练了新的 CUA 奖励网络，或已经证明了强化学习训练收益。',values:[1,1,0],out:'过程监督与结果监督'}
];
export function BackgroundAnalogy(){return <CanvasView height={380} animate label="书签滑入校样，标记需要核对的段落" draw={(c,w,h,time)=>{page(c,220,40,640,300);for(let i=0;i<5;i++)line(c,270,105+i*43,800,105+i*43,p.border,5);const t=(1-Math.cos(time/1400))/2;c.fillStyle=p.blue;c.beginPath();c.moveTo(365,20+t*60);c.lineTo(425,20+t*60);c.lineTo(425,170+t*60);c.lineTo(395,145+t*60);c.lineTo(365,170+t*60);c.closePath();c.fill();}}/>}
export function BackgroundMethods(){const [method,setMethod]=useState(0);const m=methods[method];return <div>
<p>同一份轨迹，验证器能看见什么？先切换方法，比较证据入口，再看选图方式如何影响判断。</p>
<Controls>{methods.map((x,i)=><button className={'chip'+(i===method?' active':'')} key={x.name} style={{minHeight:44}} aria-pressed={i===method} onClick={()=>setMethod(i)}>{x.name}</button>)}</Controls>
<CanvasView height={250} label={m.name+'输入：'+inputs.filter((_,i)=>m.inputs[i]).join('、')} draw={c=>{m.inputs.forEach((yes,i)=>{const x=30+i*265;page(c,x,40,225,150);label(c,String(i+1),x+98,90,p.blue,32);if(yes){line(c,x+80,133,x+98,150,p.green,7);line(c,x+98,150,x+142,108,p.green,7)}else{line(c,x+88,118,x+132,152,p.red,6);line(c,x+132,118,x+88,152,p.red,6)}})}}/>
<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:8}}>{inputs.map((x,i)=><Metric key={x} label={`${i+1}. ${x}`} value={m.inputs[i]?'纳入判断':'未纳入'}/>)}</div>
<Controls><Metric label="模型配置" value={m.model}/><Metric label="输出" value={m.output}/></Controls>
<Feedback tone="neutral"><b>怎样判断：</b>{m.text}<br/><b>能力与边界：</b>{m.risk}</Feedback>
<p>WebVoyager 原研究使用 GPT-4V，在300个任务上报告85.3%人类一致率、κ=0.70；这是相关工作的历史实验，不是本文 GPT-4o 配置的成绩。此处比较机制，不把不同模型与评测协议的成绩混排。</p>
<p><a href="https://arxiv.org/pdf/2604.06240#page=3" target="_blank" rel="noreferrer">原文：§2 Background and Related Work、Table 1（p.3）</a></p>
</div>}
export function BackgroundResearch(){const [topic,setTopic]=useState(0);const t=threads[topic];return <div>
<Controls>{threads.map((x,i)=><button key={x.name} className={'chip'+(topic===i?' active':'')} style={{minHeight:44}} aria-pressed={topic===i} onClick={()=>setTopic(i)}>{x.name}</button>)}</Controls>
<CanvasView height={220} label={`当前研究线索：${t.name}；输出${t.out}`} draw={c=>{page(c,80,35,280,150);for(let i=0;i<4;i++)line(c,115,70+i*27,320,70+i*27,p.border,5);line(c,370,110,495,110,p.blue,5);t.values.forEach((v,i)=>{const x=545+i*160;c.fillStyle=v?p.blue:p.border;c.fillRect(x,60,110,100);label(c,String(i+1),x+43,121,v?'#fff':p.ink,30)});if(topic===0){c.strokeStyle=p.red;c.lineWidth=5;c.strokeRect(100,86,230,28)}if(topic===2){line(c,115,166,320,166,p.orange,5)}}}/>
<p>图示为教学归纳，不是论文网络结构：左侧为轨迹或推理记录，右侧为当前研究关注的信号。</p><Metric label="关注的输出" value={t.out}/>
<Feedback tone="neutral"><b>已有研究：</b>{t.what}<br/><b>为什么与本文有关：</b>{t.why}</Feedback>
<p>本文承接这些问题，将具体评分标准、过程与结果分离、视觉证据和诊断接到同一个验证系统中。理解这些背景后，再进入原第2节的“先写好评分标准”。</p>
<p><a href="https://arxiv.org/pdf/2604.06240#page=3" target="_blank" rel="noreferrer">原文：§2（p.3）；图示与联系说明为教学归纳</a></p>
</div>}
