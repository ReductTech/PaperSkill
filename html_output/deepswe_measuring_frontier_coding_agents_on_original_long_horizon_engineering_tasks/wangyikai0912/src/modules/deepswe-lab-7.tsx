import React, {useEffect,useRef,useState} from 'react';
import {setupCanvas,observeCanvas} from '../lib/canvasKit';
import type {WidgetProps} from './registry';
const C={bg:'#f5f8f0',light:'#b8c9a7',dark:'#76906a',blue:'#27446e',green:'#228d5c',red:'#c43f52',orange:'#f07e47',purple:'#7c3aed',text:'#21324a',muted:'#68778f',axis:'#d7deea'};
const chapterNumber=(id:string)=>Number((id.match(/\d+/)||['1'])[0]);
type Config={labels:string[];values:number[];display?:string[];feedback:string[]};
const cfg:Config[]=[
 {labels:['公开PR','原创任务','继承测试'],values:[60,60,60],feedback:['论文指出公开答案可能被训练语料收录，高分因此可能混入答案回忆。','原创且评测时未合并上游，降低了直接回忆公开答案的机会。','继承自特定修复的测试可能偏爱参考实现，也可能遗漏需求。']},
 {labels:['提示字符','代码行','修改文件'],values:[47,100,91],display:['2,158','668','7.4'],feedback:['2,158字符：约为SWE-Bench Pro的一半。','668行：约为SWE-Bench Pro的5.5倍。','平均编辑7.4个文件，要求跨文件探索。']},
 {labels:['公开补丁','原创未上游','发布以后'],values:[60,60,60],feedback:['公开提交和PR历史可能被预训练语料收录。','评测时参考方案不在公开记录，降低了答案暴露风险。','发布后未来训练仍可能摄入这些任务，因此去污染具有时间边界。']},
 {labels:['TypeScript','Go','Python','JavaScript','Rust'],values:[35,34,34,5,5],display:['35','34','34','5','5'],feedback:['TypeScript 35项，约占31%。','Go 34项，约占30%。','Python 34项，约占30%。','JavaScript 5项，约占全部任务的4.4%。','Rust 5项，约占全部任务的4.4%。']},
 {labels:['参考同构','替代正确','表面通过'],values:[60,60,60],feedback:['参考实现满足需求，因此应通过功能验证。','不同内部实现只要可观察行为正确，也应得到通过。','只迎合窄测试却没有完成需求的实现，应被完整功能检查拒绝。']},
 {labels:['统一环境','运行规则','错误边界'],values:[60,60,60],feedback:['16种配置都使用mini-swe-agent、共享系统提示与单一bash工具；配置包含模型及其固定的reasoning effort（推理强度）。','每个配置对每项任务计划运行约4次，每次最多9000秒且无步数或成本上限；排除基础设施错误后，各配置保留428–452次，合计7,174次。','超时和上下文耗尽计失败；provider（模型服务方）、验证器和网络错误排除。论文未系统扫描不同effort，跨家族比较仍有这一混杂因素。']},
 {labels:['pass@1','pass@4','概率例子'],values:[60,60,60],feedback:['pass@1 = (1/N)Σₜ(cₜ/nₜ)：先算任务t在有效运行中的成功比例，再让N个任务等权平均。N=113，cₜ是成功次数，nₜ是有效运行次数。','pass@4 = (1/N)Σₜ1[cₜ≥1]：任务t最多4次实际运行中只要至少成功1次便得1分，再对任务等权平均；不要求各次独立同分布。','只有额外假设每次独立且成功率恒为50%时，四次至少成功一次才是1-(1-0.5)⁴=93.8%。这是概率教学例子，不是论文指标的计算过程。']},
 {labels:['GPT-5.5','GPT-5.4','Opus 4.7'],values:[70,55.5,54.2],display:['70.0%','55.5%','54.2%'],feedback:['70.0%，运行间95%区间[67.2,72.9]。','55.5%，区间[53.4,57.7]。','54.2%，区间[49.5,58.9]，与GPT-5.4重叠。']},
 {labels:['先检查解析树','按token猜测','只补渲染层'],values:[60,60,60],feedback:['✓ 推荐调查策略：先用最小输入观察KaTeX在数学模式下如何表示对齐值，再沿解析器—验证—渲染链路修改并补回归测试。这正好规避论文案例的根因。','✕ 论文真实行为：Claude Haiku 4.5猜测对齐值会以text类token出现。真实结构不同，导致center、left、right等合法输入全部被拒绝；Judge标为FAIL_UNVERIFIED_ASSUMPTION。','△ 教程设计的假设性干扰项：\\multicolumn不仅影响最终HTML/MathML，还牵涉命令解析、跨列计数和对齐验证。只改渲染层可能得到“看似有输出、语义仍错误”的补丁。']},
 {labels:['GPT-5.5','GPT-5.4','Opus 4.7'],values:[70,55.5,54.2],display:['70.0%','55.5%','54.2%'],feedback:['pass@1为70.0%，运行间95%区间[67.2,72.9]；这是固定脚手架下的功能通过率。','pass@1为55.5%，区间[53.4,57.7]；不能脱离协议解释成产品总分。','pass@1为54.2%，区间[49.5,58.9]；与GPT-5.4区间重叠，但区间比较不能替代正式差异检验。']}
];
const scoreSources:Config={labels:['A · 公开补丁题','B · 原创功能题','C · 原创窄测试'],values:[60,60,60],feedback:['△ 证据较弱：任务来自公开合并补丁，答案和讨论可能已进入训练数据；即使70%，也难区分原创求解与答案回忆。','✓ 三者中最可信：任务评测时未上游，容器无参考修复历史，验证器覆盖需求对应的外部行为。70%仍受任务集与固定脚手架限制，但更支持原创工程求解。','△ 仍不充分：任务虽然原创，但测试只覆盖一个局部例子；70%可能包含迎合窄测试的不完整实现。原创题目不能替代可靠裁判。']};
const evaluatedConfigs=[
 ['GPT-5.5','OpenAI','xhigh'],['GPT-5.4','OpenAI','xhigh'],['GPT-5.4 Mini','OpenAI','xhigh'],
 ['Claude Opus 4.7','Anthropic','max'],['Claude Opus 4.6','Anthropic','max'],['Claude Sonnet 4.6','Anthropic','high'],['Claude Haiku 4.5','Anthropic','默认'],
 ['Gemini 3.5 Flash','Google','medium'],['Gemini 3.1 Pro','Google','默认'],['Gemini 3 Flash','Google','默认'],
 ['Kimi K2.6','Moonshot','默认'],['MiMo v2.5 Pro','Xiaomi','默认'],['GLM-5.1','Zhipu','默认'],['DeepSeek-V4 Pro','DeepSeek','默认'],['Qwen3-6 Plus','Alibaba','默认'],['MiniMax-M2.7','MiniMax','默认']
];

const sceneRoutes:Record<number,number[]>={
  1:[35,108,150,92,275,101,405,74,525,82],
  2:[70,112,145,99,220,76,300,65,385,38,490,24],
  3:[40,110,145,95,245,72,355,48,510,28],
  4:[35,104,145,82,275,99,405,70,525,48],
  5:[45,112,155,96,265,72,390,50,510,24],
  6:[45,110,145,91,255,80,375,55,505,34],
  7:[55,112,155,88,275,70,390,44,505,23],
  8:[45,106,160,90,280,72,400,58,515,38],
  9:[45,112,150,101,260,77,385,61,510,30],
 10:[45,113,160,98,275,72,395,44,510,18]
};
const sceneLabels=['查旧路线','观察跨度','选择陌生路线','巡视岩区','不同攀法，同一终点','同装备 · 同规则','四次尝试 · 至少一次登顶','多次计时 · 区间重叠','录像回放 · 定位失败','登顶证明什么？'];

function pointOnRoute(route:number[],p:number){
 const segments=route.length/2-1;const scaled=Math.min(.999,p)*segments;const i=Math.floor(scaled);const u=scaled-i;
 const x=route[i*2]+(route[(i+1)*2]-route[i*2])*u;const y=route[i*2+1]+(route[(i+1)*2+1]-route[i*2+1])*u;return{x,y};
}
function strokeRoute(ctx:CanvasRenderingContext2D,route:number[],color:string,width=6,dash:number[]=[]){
 ctx.strokeStyle=color;ctx.lineWidth=width;ctx.setLineDash(dash);ctx.beginPath();ctx.moveTo(route[0],route[1]);for(let i=2;i<route.length;i+=2)ctx.lineTo(route[i],route[i+1]);ctx.stroke();ctx.setLineDash([]);
}
function drawAnalogy(ctx:CanvasRenderingContext2D,W:number,H:number,n:number){
 const route=sceneRoutes[n]||sceneRoutes[1];const cycle=Date.now()%5000;const raw=Math.min(cycle/3600,1);const p=raw*raw*(3-2*raw);
 let progress=p;const attempt=Math.floor(Date.now()/5000)%4+1;
 ctx.fillStyle=C.bg;ctx.fillRect(0,0,W,H);
 if(n===3){strokeRoute(ctx,[40,110,155,70,270,104,390,82,510,55],C.axis,4,[8,8]);}
 if(n===5){strokeRoute(ctx,[45,112,145,76,270,92,395,64,510,24],C.blue,4,[8,7]);}
 if(n===8){ctx.strokeStyle='rgba(39,68,110,.16)';ctx.lineWidth=22;ctx.beginPath();ctx.moveTo(route[0],route[1]);for(let i=2;i<route.length;i+=2)ctx.lineTo(route[i],route[i+1]);ctx.stroke();ctx.fillStyle=C.muted;ctx.font='11px Segoe UI';ctx.fillText('多次计时的波动范围',385,112);}
 strokeRoute(ctx,route,n===1?C.orange:C.dark,6,n===1?[12,6]:[]);
 if(n===4){ctx.fillStyle='rgba(39,68,110,.07)';ctx.fillRect(175,20,105,100);ctx.fillStyle='rgba(34,141,92,.08)';ctx.fillRect(390,20,105,100);}
 if(n===6){for(const i of [2,6]){ctx.strokeStyle=C.orange;ctx.lineWidth=3;ctx.beginPath();ctx.arc(route[i],route[i+1],7,0,Math.PI*2);ctx.stroke();}ctx.fillStyle=C.muted;ctx.font='11px Segoe UI';ctx.fillText('统一锚点',120,122);ctx.fillText('统一时限',345,122);}
 if(n===7){const limits=[.55,.72,.84,1];progress=p*limits[attempt-1];ctx.fillStyle=attempt===4?C.green:C.muted;ctx.font='600 13px Segoe UI';ctx.fillText(`尝试 ${attempt} / 4${attempt===4?' · 本次登顶':''}`,397,116);for(let i=0;i<4;i++){ctx.fillStyle=i<attempt?(i===3?C.green:C.orange):C.axis;ctx.beginPath();ctx.arc(430+i*24,94,5,0,Math.PI*2);ctx.fill();}}
 if(n===9){progress=p*.72;for(let q=.1;q<progress;q+=.12){const trail=pointOnRoute(route,q);ctx.fillStyle='rgba(39,68,110,.25)';ctx.beginPath();ctx.arc(trail.x,trail.y,3,0,Math.PI*2);ctx.fill();}const failure=pointOnRoute(route,.72);ctx.strokeStyle=C.red;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(failure.x-6,failure.y-6);ctx.lineTo(failure.x+6,failure.y+6);ctx.moveTo(failure.x+6,failure.y-6);ctx.lineTo(failure.x-6,failure.y+6);ctx.stroke();ctx.fillStyle=C.red;ctx.font='11px Segoe UI';ctx.fillText('回放定位：此处失败',385,116);}
 if(n===10){ctx.strokeStyle=C.orange;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(510,18);ctx.lineTo(510,2);ctx.stroke();ctx.fillStyle=C.orange;ctx.beginPath();ctx.moveTo(510,2);ctx.lineTo(535,8);ctx.lineTo(510,13);ctx.fill();ctx.fillStyle=C.green;ctx.font='600 11px Segoe UI';ctx.fillText('功能通过',462,34);ctx.fillStyle=C.muted;ctx.font='11px Segoe UI';ctx.fillText('≠ 所有场景下的总排名',382,119);}
 const pos=pointOnRoute(route,progress);ctx.strokeStyle=C.orange;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(pos.x,pos.y+8);ctx.lineTo(pos.x-8,H-8);ctx.stroke();ctx.fillStyle=C.blue;ctx.beginPath();ctx.arc(pos.x,pos.y,8,0,Math.PI*2);ctx.fill();
 ctx.fillStyle=C.text;ctx.font='600 13px Segoe UI';ctx.fillText(sceneLabels[n-1],18,22);
}
function Lab({chapterId,moduleId}:{chapterId:string,moduleId:string}){
 const n=chapterId==='hero'?(moduleId==='old'?1:3):chapterNumber(chapterId); const baseData=cfg[n-1]; const data=moduleId==='1.2'?scoreSources:baseData; const ana=moduleId==='ana';
 const decisionMode=n===9||moduleId==='1.2'; const [sel,setSel]=useState<number|null>(decisionMode?null:0); const canvasRef=useRef<HTMLCanvasElement>(null); const selRef=useRef<number|null>(decisionMode?null:0); selRef.current=sel;
 useEffect(()=>{const cv=canvasRef.current;if(!cv)return;const W=ana?560:720,H=ana?140:300;let ctx:CanvasRenderingContext2D;try{ctx=setupCanvas(cv,W,H)}catch{return}
  const draw=()=>{ctx.clearRect(0,0,W,H);if(ana){drawAnalogy(ctx,W,H,n);if(!cv.classList.contains('is-ready'))cv.classList.add('is-ready');return;}ctx.fillStyle=C.bg;ctx.fillRect(0,0,W,H);
   const k=selRef.current??0;const display=data.display;if(!display)return;const count=data.values.length;const margin=54,gap=count>3?18:44;const barWidth=Math.min(154,(W-margin*2-gap*(count-1))/count);const centers=data.values.map((_,i)=>margin+barWidth/2+i*(barWidth+gap));
   const baseline=248;ctx.strokeStyle=C.axis;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(30,baseline+1);ctx.lineTo(W-30,baseline+1);ctx.stroke();
   const maxValue=Math.max(...data.values,1);
   data.values.forEach((v,i)=>{const bh=28+(v/maxValue)*132;const bx=centers[i]-barWidth/2;const top=baseline-bh;ctx.save();ctx.shadowColor='rgba(33,50,74,.10)';ctx.shadowBlur=10;ctx.shadowOffsetY=4;ctx.fillStyle=i===k?C.blue:'#d8dfeb';ctx.beginPath();ctx.roundRect(bx,top,barWidth,bh,12);ctx.fill();ctx.restore();
    ctx.fillStyle=C.text;ctx.font=`700 ${count>3?24:30}px Arial, sans-serif`;ctx.textAlign='center';ctx.fillText(display[i],centers[i],top-12);ctx.textAlign='start';
    if(i===k){ctx.fillStyle=C.orange;ctx.beginPath();ctx.roundRect(bx,top,barWidth,7,[12,12,0,0]);ctx.fill();}
   });if(!cv.classList.contains('is-ready'))cv.classList.add('is-ready');};
  let raf=0;const tick=()=>{draw();raf=requestAnimationFrame(tick)};const start=()=>{if(!raf)raf=requestAnimationFrame(tick)};const stop=()=>{if(raf)cancelAnimationFrame(raf);raf=0};const dis=observeCanvas(cv,start,stop);return()=>{stop();dis()};},[ana,data]);
 if(ana)return <canvas ref={canvasRef} width={560} height={140}/>;
 const controls=<div className="ctrl" role="group" aria-label="选项">{data.labels.map((x,i)=><button key={x} type="button" aria-pressed={sel===i} className={'chip '+(sel===i?'active':'')} onClick={()=>setSel(i)}>{x}</button>)}</div>;
 if(data.display){const active=sel??0;return <div><canvas ref={canvasRef} width={720} height={300}/>{controls}<div className="feedback">{data.feedback[active]}</div>{n===10&&<SourceLinks/>}</div>}
 if(decisionMode&&sel===null)return <div className="concept-explorer decision-prompt">{controls}<div className="concept-content"><div className="concept-meta">先作判断</div><div className="concept-title">{n===9?'请选择你的第一步':'三个分数相同，证据不同'}</div><div className="concept-copy">{n===9?'答案与论文案例尚未揭示。先预测哪种行动最能避免长轨迹中的连锁错误，再点击选项。':'不要只看70%这个数字。先根据题目来源和裁判方式选择最可信的案例，再查看理由。'}</div></div></div>;
 const active=sel??0;return <div className="concept-explorer">{controls}<div className="concept-content"><div className="concept-meta">{decisionMode?'选择反馈':`概念 ${active+1} / ${data.labels.length}`}</div><div className="concept-title">{data.labels[active]}</div><div className="concept-copy">{data.feedback[active]}</div></div>{n===6&&<ConfigTable/>}</div>
}

function ConfigTable(){return <details className="config-details"><summary>查看论文附录B的16种配置</summary><div className="config-note">reasoning effort是模型投入推理计算的预设强度；“默认”表示使用服务方默认值。论文没有逐模型扫描不同强度，因此它可能影响跨家族比较。</div><div className="config-table-wrap"><table><thead><tr><th>模型</th><th>家族</th><th>effort</th></tr></thead><tbody>{evaluatedConfigs.map(r=><tr key={r[0]}><td>{r[0]}</td><td>{r[1]}</td><td>{r[2]}</td></tr>)}</tbody></table></div></details>}

function SourceLinks(){return <div className="source-links"><div className="source-links-title">核查与延伸</div><div className="version-note">本教程数字对应论文v1（2026年5月实验）；在线排行榜会持续更新，当前数值可能不同。</div><a href="https://arxiv.org/abs/2607.07946" target="_blank" rel="noreferrer">论文与PDF</a><a href="https://github.com/datacurve-ai/deep-swe" target="_blank" rel="noreferrer">官方代码与任务</a><a href="https://deepswe.datacurve.ai/" target="_blank" rel="noreferrer">持续更新的排行榜与轨迹</a></div>}

export const DeepSWE1:React.FC<WidgetProps>=(p)=><Lab {...p}/>;
export const DeepSWE2:React.FC<WidgetProps>=(p)=><Lab {...p}/>;
export const DeepSWE3:React.FC<WidgetProps>=(p)=><Lab {...p}/>;
export const DeepSWE4:React.FC<WidgetProps>=(p)=><Lab {...p}/>;
export const DeepSWE5:React.FC<WidgetProps>=(p)=><Lab {...p}/>;
export const DeepSWE6:React.FC<WidgetProps>=(p)=><Lab {...p}/>;
export const DeepSWE7:React.FC<WidgetProps>=(p)=><Lab {...p}/>;
export const DeepSWE8:React.FC<WidgetProps>=(p)=><Lab {...p}/>;
export const DeepSWE9:React.FC<WidgetProps>=(p)=><Lab {...p}/>;
export const DeepSWE10:React.FC<WidgetProps>=(p)=><Lab {...p}/>;
