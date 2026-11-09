import { useState, type ReactNode } from 'react';
import { Architecture, ReasoningFlow, ToolDependencies } from './Diagrams';
import { useScenario } from './ScenarioContext';
import { chartTools, geometryTools, chartTypes, scenarios, truth, toolOutput, reward, groupStats } from './scenario';

const paper='https://arxiv.org/html/2505.20289v2';
function Ref({at,children}:{at:string;children:ReactNode}) {
  return <a className="v-ref" href={paper+at} target="_blank" rel="noreferrer">{children}</a>;
}
function PaperFigure({number,description}:{number:3|4|5;description:string}){
  const src='./images/figure-'+number+'.png';
  return <figure className="v-paper-figure"><a href={src} target="_blank" rel="noreferrer" aria-label={'放大论文原始 Figure '+number}><img src={src} alt={description}/></a><figcaption>原论文 Figure {number} · {description} · <a href={src} target="_blank" rel="noreferrer">打开大图</a></figcaption></figure>;
}
function Sim(){return <small className="v-sim">教学模拟 · 非论文实验样本</small>}
function Pick({on,click,children}:{on:boolean;click:()=>void;children:ReactNode}){
  return <button type="button" aria-pressed={on} onClick={click}>{children}</button>;
}
function Controls({children}:{children:ReactNode}){return <div className="v-controls">{children}</div>}
function Heading({children}:{children:ReactNode}){return <h3 className="v-heading">{children}</h3>}
function Select({label,value,change,options}:{label:string;value:number;change:(n:number)=>void;options:string[]}){
  return <label>{label} <select value={value} onChange={e=>change(Number(e.target.value))}>{options.map((x,i)=><option key={x} value={i}>{x}</option>)}</select></label>;
}
export function Overview({start}:{start:()=>void}){
  const [step,setStep]=useState(0);
  const names=['选工具','工具输出','冻结 Reasoner','奖励','GRPO'];
  const details=['可训练 Agent 从原图与问题中选出工具编号。','所选工具分别处理原图，返回结构化证据。','同一冻结 Reasoner 对原图作答，并评估加入证据后的答案。','训练时对照标准答案，区分帮助、干扰和无变化。','同题候选组的相对优势驱动 Agent 更新。'];
  return <div className="vista-lab v-overview">
    <Architecture step={step}/><p><strong>实线 · 部署路径</strong>，复用 Agent，可换接兼容推理器。<br/><strong>虚线 · 训练额外路径</strong>，分别作答并比较标准答案，奖励只更新 Agent。</p>
    <Controls>{names.map((x,i)=><Pick key={x} on={step===i} click={()=>setStep(i)}>{i+1} · {x}</Pick>)}</Controls>
    <output aria-live="polite">{details[step]}</output>
    <Ref at="#S1.F1">根据 Figure 1 教学重绘 · 打开原论文 Figure 1</Ref>
    <button type="button" onClick={start}>开始学习 →</button>
  </div>;
}
function Motivation(){
  const [q,setQ]=useState(2);
  const choices=[
    ['提示选取',['T2','T4','T2'],'按工具描述匹配任务。','可能漏掉颜色与数值的组合证据。'],
    ['固定选取',['T1','T1','T1'],'每题都选同一转表工具。','颜色题仍缺颜色映射。'],
    ['从反馈学习',['T1','T4','T1 + T4'],'按题调整工具组合。','实际效果依赖工具和推理器。']
  ] as const;
  return <div className="vista-lab"><Sim/><Heading>同一问题的三种模拟选取策略</Heading><Controls>{['需要数值','需要颜色','两者都要'].map((x,i)=><Pick key={x} on={q===i} click={()=>setQ(i)}>{x}</Pick>)}</Controls>
    <div className="v-grid v-three" aria-live="polite">{choices.map(([title,tools,rule,limit])=><section key={title}><Heading>{title}</Heading><p>{rule}</p><p><strong>{tools[q]}</strong> → {tools[q].includes('T4')?(tools[q].includes('+')?'数值与颜色映射':'颜色映射'):'类别与数值'}</p><p>{q===2&&!tools[q].includes('+')?'缺少颜色与数值的互补证据。':q===1&&!tools[q].includes('T4')?'缺少颜色映射。':'覆盖当前所需证据。'}</p><small>{limit}</small></section>)}</div>
    <section className="v-paper-results"><Heading>论文统计 · Table 3</Heading><p>ChartQA，QwenVL-7B 推理器。全选使用全部 9 个工具，随机策略每题选 2 个。</p><Bars source="Table 3 · 准确率（%）" rows={[['全选',74.6],['随机两种',75.8],['VisTA',79.4]]}/><p>在该对照中，学习选择优于全用和随机。</p><Ref at="#S4.T3">打开原论文 Table 3</Ref></section></div>;
}
function Chart(){
  return <svg viewBox="0 0 320 180" role="img" aria-label="模拟图表，甲厅 20 人，乙厅 32 人" className="v-chart">
    <path d="M40 16V143H297" fill="none" stroke="#8094ac" strokeWidth="2"/>
    <rect x="88" y="78" width="55" height="65" fill="#27446e"/><rect x="195" y="39" width="55" height="104" fill="#f07e47"/>
    <g fill="#25364b" textAnchor="middle" fontSize="15"><text x="115" y="69">20</text><text x="222" y="30">32</text><text x="115" y="168">甲厅</text><text x="222" y="168">乙厅</text></g>
  </svg>;
}
function Tools(){
  const s=useScenario();
  return <div className="vista-lab"><Sim/><div className="v-grid v-tool-layout"><section><Heading>模拟图像 I 与问题 q</Heading><Chart/><p>甲厅 20 人，乙厅 32 人。</p><p>{scenarios[s.example].question}</p><Controls><Select label="案例" value={s.example} change={s.choose} options={['数值与颜色互补','模拟转表读错']}/><button type="button" onClick={s.reset}>重置案例</button></Controls></section>
    <section><Heading>Agent 输出工具编号</Heading><div className="v-tool-groups">{chartTypes.map((type,group)=><div key={type}><small>{type}</small><div className="v-tool-picks">{chartTools.slice(group*3,group*3+3).map((name,offset)=>{const id=group*3+offset;return <Pick key={name} on={s.ids.includes(id)} click={()=>s.toggle(id)}>{s.ids.includes(id)?'✓ ':''}T{id} {name}</Pick>})}</div></div>)}</div></section></div>
    <output aria-live="polite"><strong>Agent 输出 · 工具索引 </strong><code>{'<answer>'+s.ids.join(',')+'</answer>'}</code></output>
    <div className="v-tool-evidence" aria-live="polite"><Heading>模拟输出 · 将送入推理器</Heading>
    {s.ids.length?<ul>{s.ids.map(id=><li key={id}>T{id} · {['表格','图形元素','描述文本'][Math.floor(id/3)]} · {toolOutput(id,s.example)}</li>)}</ul>:<p>尚未选择工具，只保留原题与图像。</p>}
    {s.example===0&&s.ids.some(id=>id<3)&&s.ids.some(id=>id>=3&&id<6)&&<p><strong>证据拼合</strong> · 橙色 → 乙厅 → 32 人</p>}</div>
    <p><strong>Reasoner 模拟作答</strong> · {s.augmentedAnswer} 人</p><p>编号按点击顺序排列，各工具独立读取图像。切换案例会恢复该案例的默认工具。状态 s = (q, I)。策略 πφ(t|s) 输出有序序列 t，长度 K 随题变化。每个工具分别读取原图，输出 oᵢ = Tᵢ(I)。</p>
    <Ref at="#S4.F7">教学案例借鉴数值与颜色互补思路 · 打开原论文 Figure 7</Ref>
  </div>;
}
function Paths(){
  const s=useScenario();
  const [highlight,setHighlight]=useState(false);
  return <div className="vista-lab"><Sim/><Controls><Pick on={s.mode==='training'} click={()=>s.setMode('training')}>训练</Pick><Pick on={s.mode==='deployment'} click={()=>s.setMode('deployment')}>部署</Pick><Pick on={highlight} click={()=>setHighlight(!highlight)}>高亮冻结推理器</Pick></Controls>
    <p>{scenarios[s.example].question} · <strong>Agent πφ 可训练</strong> · 选中 {s.ids.map(x=>'T'+x).join('、')||'无工具'}</p>
    <ReasoningFlow training={s.mode==='training'} highlight={highlight} direct={s.directAnswer} augmented={s.augmentedAnswer}/><p>{s.mode==='training'&&<>调用① yᵢₘɡ = fθ(q, I)；</>}调用{s.mode==='training'?'② ':' '}yᵢₘɡ₊ₜₒₒₗₛ = fθ(q, I, {'{oᵢ}'})。</p>{s.mode==='training'&&<p>两次独立前向计算共享冻结参数 θ。答案是教学模拟。</p>}
    <div className="v-tool-evidence"><Heading>增强路径收到的证据</Heading>{s.ids.length?<ul>{s.ids.map(id=><li key={id}>T{id} {chartTools[id]} · {toolOutput(id,s.example)}</li>)}</ul>:<p>没有选中工具，推理器收到原图和原题。</p>}</div>
    <output aria-live="polite">{s.mode==='training'?'两条路径均与标准答案对照，结果用于训练奖励。':'部署只执行增强路径，已学策略可换接不同 Reasoner。'}</output><Ref at="#S3.F2">根据 Figure 2 教学重绘 · 打开原论文 Figure 2</Ref></div>;
}
const cases=[
  {direct:false,augmented:true,name:'工具纠错'},
  {direct:true,augmented:false,name:'工具干扰'},
  {direct:false,augmented:false,name:'两条路径均失败'},
  {direct:true,augmented:true,name:'保持正确'}
];
function signed(x:number){return x>0?'+'+x:String(x).replace('-','−')}
function Reward(){
  const s=useScenario();
  const current=cases.find(x=>x.direct===s.direct&&x.augmented===s.augmented)!;
  return <div className="vista-lab"><Sim/>
    <p>标准答案 y* = {truth} 人。{s.override?'当前正在独立演练四种对错组合。':`当前对错来自 §03：直接 ${s.directAnswer} 人（${s.direct ? "正确" : "错误"}），增强 ${s.augmentedAnswer} 人（${s.augmented ? "正确" : "错误"}）。`}</p>
    <div className="v-grid v-reward">{cases.map(x=><Pick key={x.name} on={x===current} click={()=>s.setOverride(x)}><strong>{signed(reward(x.direct,x.augmented))} · {x.name}</strong><small>直接{ x.direct?'正确':'错误'} · 增强{x.augmented?'正确':'错误'}</small></Pick>)}</div>
    <Controls><button type="button" onClick={()=>s.setOverride(null)}>恢复案例结果</button></Controls>
    <output aria-live="polite">当前奖励 {signed(s.score)} · {current.name}{s.mode==='deployment'?'（切回训练规则的教学演练）':''}</output>
    <div className="v-piecewise" aria-label="分段奖励公式"><strong>r =</strong><ul>{[
      {value:'+1',condition:'直接错、增强对 · 工具纠错',active:!s.direct&&s.augmented},
      {value:'+1',condition:'直接对、增强对 · 保持正确',active:s.direct&&s.augmented},
      {value:'−0.5',condition:'增强错误且直接正确',active:!s.augmented&&s.direct},
      {value:'0',condition:'两路均错',active:!s.augmented&&!s.direct}
    ].map(({value,condition,active})=><li key={condition} className={active?'is-current':''}><b>{value}</b> {condition}{active?' · 当前分支':''}</li>)}</ul></div>
    <p><strong>分析</strong> · 保持正确也得到 +1。奖励没有单独计入时延或工具数量成本。</p><details><summary>两条路径都答对，为什么仍是 +1？</summary><p>规则优先奖励增强答案正确。直接答案也正确时，这个奖励只表示保持正确，无法度量工具的额外贡献。</p></details><Ref at="#S3.SS3">论文 §3.3 奖励定义</Ref>
  </div>;
}
function Policy(){
  const s=useScenario();
  const [step,setStep]=useState(2);
  const [rest,setRest]=useState([0,-.5,1]);
  const [newProbability,setNewProbability]=useState(.26);
  const oldProbability=.20;
  const ratio=newProbability/oldProbability;
  const [epsilon,setEpsilon]=useState(.2);
  const [beta,setBeta]=useState(.1);
  const [kl,setKl]=useState(.2);
  const scores=[s.score,...rest];
  const {mean,std,advantages}=groupStats(scores);
  const clipped=Math.min(1+epsilon,Math.max(1-epsilon,ratio));
  const advantage=advantages[0];
  const surrogate=advantage===null?null:Math.min(ratio*advantage,clipped*advantage);
  return <div className="vista-lab"><Sim/><Controls>{['同题采样','计算奖励','组内优势','更新目标'].map((x,i)=><Pick key={x} on={step===i} click={()=>setStep(i)}>{i+1} · {x}</Pick>)}</Controls>
    <p>{['旧策略对同一道题采样四组候选工具序列。','候选 1 接收 §04 的奖励。其余三个奖励可独立设置。','组内优势 Aⱼ = (rⱼ − μ) / σ。μ、σ 分别是同题候选奖励的均值与标准差。','概率比值的裁剪限制单次更新，KL 项约束策略相对参考策略的偏移。'][step]}</p>
    <div className="v-grid v-candidates">{scores.map((score,i)=><section key={i}><strong>候选 {i+1}{i===0?' · 承接当前教学案例':''}</strong><small>{i===0?s.ids.map(id=>'T'+id).join('、')||'无工具':['T0','T4、T7','T2、T5'][i-1]}</small>{i===0?<span>奖励 {signed(score)}</span>:<Select label="奖励" value={[-.5,0,1].indexOf(score)} change={n=>setRest(rest.map((r,j)=>j===i-1?[-.5,0,1][n]:r))} options={['−0.5','0','+1']}/>}
      {step>=2&&<span className={(advantages[i]??0)>0?'v-positive':(advantages[i]??0)<0?'v-negative':''}>优势 {advantages[i]?.toFixed(2)??'—'}</span>}</section>)}</div>
    {step>=2&&<div className="v-advantage" aria-label="奖励与标准化优势"><small>奖励 → 标准化优势 · 中线为 0</small>{scores.map((score,i)=>{const a=advantages[i];return <div key={i}><span>{i+1} · {signed(score)}</span><i>{a!==null&&<b style={{left:a<0?50-Math.abs(a)*25+'%':'50%',width:Math.abs(a)*25+'%',background:a<0?'#a12c41':'#228d5c'}}/>}</i><strong>{a?.toFixed(3)??'—'}</strong></div>})}</div>}
    {step>=2&&<output aria-live="polite">均值 {mean.toFixed(3)} · 标准差 {std.toFixed(3)}{std?' · 演示用总体标准差':' · 无可区分的组内反馈'}</output>}
    {step===3&&<section className="v-update"><p className="v-math">J(φ) = Eₛ,ₜ [ (1/G) Σⱼ min(ρⱼ Aⱼ, clip(ρⱼ, 1−ε, 1+ε) Aⱼ) − β Dₖₗ(πφ ‖ πref) ]</p>
    <p>ρⱼ = πφ(tⱼ|s) / πold(tⱼ|s)。期望对数据状态 s 与旧策略抽取的候选 t 求取。G 为组大小，ε 为裁剪半径，β 为 KL 权重，πref 是固定参考策略。</p>
    <div className="v-grid v-two">{[[newProbability,setNewProbability,.04,.40,'假设新概率'],[epsilon,setEpsilon,.05,.5,'裁剪半径 ε'],[beta,setBeta,0,1,'KL 权重 β'],[kl,setKl,0,1,'示意 KL 散度']].map((row,i)=>{const [value,change,min,max,label]=row as [number,(n:number)=>void,number,number,string];return <label key={i}>{label} · {value.toFixed(2)} <input type="range" min={min} max={max} step={i===0?".01":".05"} value={value} onChange={e=>change(Number(e.target.value))}/></label>})}</div>
    <div className="v-grid v-three"><section><b>ρ · 概率比</b><p>新概率除以旧概率。</p></section><section><b>Clip · 裁剪</b><p>比较裁剪前后两项，取较小者。</p></section><section><b>KL · 参考约束</b><p>用 β 加权示意 KL 散度。</p></section></div><meter min=".2" max="2" low={1-epsilon} high={1+epsilon} optimum={1} value={ratio} aria-label="示意比值在裁剪区间的位置"/>
    <output aria-live="polite">旧概率 {oldProbability.toFixed(2)} · 新概率 {newProbability.toFixed(2)} · ρ = {ratio.toFixed(2)} · 裁剪区间 [{(1-epsilon).toFixed(2)}, {(1+epsilon).toFixed(2)}] · 裁剪比值 {clipped.toFixed(2)} · ρA {advantage===null?'—':(ratio*advantage).toFixed(3)} · clip(ρ)A {advantage===null?'—':(clipped*advantage).toFixed(3)} · 较小项 {surrogate?.toFixed(3)??'—'} · KL 惩罚 {(beta*kl).toFixed(3)}</output>
    <p>正优势通常鼓励提高候选概率，负优势通常鼓励降低。滑块只演示一个候选的目标项。全组同分时，教程省略归一化除法。</p></section>}
    <Ref at="#S3.SS3">论文 §3.3 完整训练目标</Ref></div>;
}
function Setup(){
  const [data,setData]=useState(0);
  return <div className="vista-lab"><Controls><Pick on={!data} click={()=>setData(0)}>ChartQA · 9 工具</Pick><Pick on={!!data} click={()=>setData(1)}>Geometry3K · 4 工具</Pick></Controls>
    <div className="v-table v-tool-table"><table><thead><tr><th>编号</th><th>工具</th><th>读取图像后提供的证据</th></tr></thead><tbody>{(data?geometryTools:chartTools).map((tool,i)=><tr key={tool}><td>T{i}</td><td>{tool}</td><td>{data?(i<2?'符号解析 · 实体、标注与关系':'几何求解 · 题目与几何图的解题步骤'):chartTypes[Math.floor(i/3)]}</td></tr>)}</tbody></table></div>
    <p>以下为论文实验设置。{data?'几何题工具池由两种符号解析器和两种专业求解器组成。':'图表工具池由三种转表、三种图形提取与三种描述工具组成。'}</p><dl className="v-params">{[['每个数据集','800 道训练题'],['硬件','8 × A100'],['批量','8'],['每题候选','4'],['优化器','AdamW · 5×10⁻⁵'],['迭代','100']].map(([k,v])=><div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl><p>工具编号以数据集为范围。BlindTest 使用独立的六工具库，分别检测线、圆与矩形。</p><p className="v-sources">原文依据 · <Ref at="#S4.SS1">§4.1 训练设置</Ref></p>{data===1&&<p className="v-sources">几何题中的 Inter-GPS 选取实例 · <Ref at="#S4.F6">打开原论文 Figure 6</Ref></p>}</div>;
}
const table1=[
 ['直接作答','无','QwenVL-7B',76.4,62.3,54.0],['免训练','QwenVL-7B','QwenVL-7B',76.1,66.8,51.3],
 ['免训练','GPT-4o','QwenVL-7B',73.0,66.4,51.5],['直接强化学习','无','QwenVL-7B',77.5,64.3,41.0],['VisTA','QwenVL-7B','QwenVL-7B',79.4,73.2,55.6],
 ['直接作答','无','GPT-4o',84.3,50.1,50.1],['免训练','QwenVL-7B','GPT-4o',82.3,67.1,48.7],['免训练','GPT-4o','GPT-4o',84.6,73.3,49.5],['VisTA','QwenVL-7B','GPT-4o',88.9,76.8,52.4]
] as const;
function Bars({rows,source}:{rows:(readonly [string,number])[];source:string}){
  return <div className="v-bars" aria-live="polite">{rows.map(([name,value])=><div key={name} title={source+' · '+name+' · '+value.toFixed(1)+'%'}><span>{name}</span><i><b style={{width:value+'%',background:name.startsWith('VisTA')?'#228d5c':undefined}}/></i><strong>{value.toFixed(1)}%</strong></div>)}</div>;
}
export function Evidence({extended=false}:{extended?:boolean}){
  const [panel,setPanel]=useState(0);
  const [strategy,setStrategy]=useState(0);
  const [reasoner,setReasoner]=useState(0);
  const [dataset,setDataset]=useState(0);
  const models=['QwenVL-7B','GPT-4o'];
  const datasets=['ChartQA','ChartQA-OoD','Geometry3K'];
  const rows=table1.filter(row=>row[2]===models[reasoner]);
  if(extended)return <div className="vista-lab"><details><summary>其他迁移与泛化 · MathVerse 73.1%，BlindTest 53.4% · 展开表 4–6</summary><ul><li>MathVerse 平面几何子集（2,550/3,940 题），GPT-o1 直接作答 67.7%，VisTA + GPT-o1 73.1%。选择策略从 Geometry3K 直接迁移，未在 MathVerse 上重训。</li><li>BlindTest 单独训练选择器，最佳列出的免训练选工具 51.8%，VisTA 53.4%。</li><li>Geometry3K* 精选子集，Visual Sketchpad 66.7%，VisTA 68.8%，均用 GPT-4o 推理器。</li></ul></details></div>;
  return <div className="vista-lab"><Controls>{['主结果 · 表 1','单工具 · 图 3','策略行为 · 图 4–5','选取策略 · 表 3'].map((x,i)=><Pick key={x} on={panel===i} click={()=>setPanel(i)}>{x}</Pick>)}</Controls>
    {(panel===0||panel===3)&&<Select label="冻结推理器" value={reasoner} change={setReasoner} options={models}/>}
    {panel===0&&<><Select label="柱图数据集" value={dataset} change={setDataset} options={datasets}/><p><strong>{models[reasoner]} 推理器 · {datasets[dataset]} · 准确率（%）</strong></p><Bars source="表 1" rows={rows.map(row=>[row[0]+(row[0]==='免训练'?' · '+row[1]:''),Number(row[3+dataset])])}/>
      <details><summary>查看完整 Table 1（9 行）</summary><div className="v-table"><table><thead><tr>{['方法','Agent','Reasoner','ChartQA','ChartQA-OoD','Geometry3K'].map(x=><th key={x}>{x}</th>)}</tr></thead><tbody>{table1.map(row=><tr key={row[0]+row[1]+row[2]}>{[row[0],row[1],row[2],...row.slice(3).map(x=>Number(x).toFixed(1))].map((x,i)=><td key={i}>{x}</td>)}</tr>)}</tbody></table></div></details>
      <p>表 1 · 准确率（%）。ChartQA 数值容差 5%，Geometry3K 精确选项匹配。OoD 去掉几何元素标签，另以 50% 概率沿横轴或纵轴拉伸至两倍。</p>
      <p><strong>读表 1</strong> · QwenVL-7B 推理器下，VisTA 的 ChartQA 准确率为 79.4%，直接作答为 76.4%。保留已学 Agent 换接 GPT-4o 后，ChartQA 达到 88.9%。</p><p><strong>OoD 对照</strong> · 同用 QwenVL-7B 推理器时，VisTA 73.2%，最佳免训练 66.8%，相差 6.4 个百分点。</p><details><summary>原文数值校核说明</summary><p>GPT-4o 推理器下，ChartQA 从最佳免训练 84.6% 到 88.9%，差 4.3 个百分点。§4.2 正文写 3.5 点，与该列不一致。OoD 的 76.8 − 73.3 正好为 3.5 点。</p></details><Ref at="#S4.T1">论文 Table 1</Ref></>}
    {panel===1&&<><Bars source="图 3 · ChartQA" rows={ [['无工具',76.4],['T1 DePlot',78],['T2 ChartMoE',78.3],['VisTA',79.4],['单工具事后松上界',88]] }/><PaperFigure number={3} description="ChartQA 单工具准确率与 VisTA 对照"/><p>ChartQA 准确率（%）。任一单工具答对就把该题计为正确，得到 88.0% 的事后覆盖率。单工具在不同题目上的覆盖互有差异；该参考值也不限制多工具策略。</p><details><summary>T2 单用表现不错，为什么仍要按题选择？</summary><p>不同工具在不同题目上提供互补证据。固定 T2 无法利用其他工具独有的正确案例。</p></details><Ref at="#S4.F3">打开原论文 Figure 3</Ref></>}
    {panel===2&&<>
      <PaperFigure number={4} description="工具选用频率与单工具准确率的 Pearson 相关性"/>
      <p>相关性从接近 0 上升到大于 0.8。纵轴是相关系数。原图记录每隔十次迭代测得的结果。</p>
      <PaperFigure number={5} description="VisTA、免训练 QwenVL-7B 与 GPT-4o 的工具选择频率"/>
      <Controls>{['VisTA','免训练 QwenVL-7B','免训练 GPT-4o'].map((name,i)=><Pick key={name} on={strategy===i} click={()=>setStrategy(i)}>{name}</Pick>)}</Controls>
      <output aria-live="polite">{['倾向 T1 与 T2（DePlot 和 ChartMoE），较少使用 T3 与 T6。','工具选择相对均衡，偏好不如 VisTA 集中。','每题倾向选用更多工具，分布较广。'][strategy]}</output>
      <p>整体分布显示偏好变化。逐题是否找到最优组合仍需独立证据。</p>
    </>}
    {panel===3&&<><Bars source="表 3 · ChartQA" rows={reasoner?[['全选',81.3],['随机两种',83.5],['VisTA',88.1]]:[['全选',74.6],['随机两种',75.8],['VisTA',79.4]]}/><p>ChartQA 准确率（%）。GPT-4o 的 VisTA 在表 3 为 88.1%，表 1 为 88.9%。论文未说明两表差异的原因。</p><Ref at="#S4.T3">论文 Table 3</Ref></>}
  </div>;
}
function Limits(){
  const [chain,setChain]=useState(false);
  return <div className="vista-lab"><Controls><Pick on={!chain} click={()=>setChain(false)}>同图取证</Pick><Pick on={chain} click={()=>setChain(true)}>依赖前一步输出</Pick></Controls>
    <ToolDependencies chain={chain}/><div className="v-grid"><section className={!chain?'v-active':''}><Heading>论文框架支持</Heading><div className="v-flow"><span>同一原图</span><b>→</b><span>T1 转表、T4 取颜色（各自执行）</span><b>→</b><span>汇入 Reasoner</span></div></section><section className={chain?'v-active':''}><Heading>论文框架尚未支持</Heading><div className="v-flow"><span>OCR</span><b>→</b><span>按识别结果裁剪</span><b>→</b><span>新图再识别</span></div></section></div>
    <output aria-live="polite">{chain?'后一步需要前一步的输出，属于顺序组合。':'各工具都可直接读取原图，因此能汇总多种证据。'}</output>
    <p>方法局限 · ① 尚不支持顺序依赖工具链。② 工具池由人工预先整理，尚未实现自动发现或注册工具。</p><p><strong>教程分析</strong> · 工具输出可能出错，调用成本和延迟仍可单独评估。</p><p><strong>研究闭环</strong> · 冻结推理器提供反馈 → GRPO 学习选择策略 → 在论文测试设置中换接推理器。</p><Ref at="#S5">打开论文 §5</Ref></div>;
}
const labs=[Motivation,Tools,Paths,Reward,Policy,Setup,Evidence,Limits];
export function Lab({scene}:{scene:number}){const Page=labs[scene];return <Page/>}
