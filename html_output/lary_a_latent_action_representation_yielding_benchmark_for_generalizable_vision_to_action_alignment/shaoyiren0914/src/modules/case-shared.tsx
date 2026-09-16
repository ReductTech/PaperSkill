import React, { useEffect, useRef, useState } from 'react';
import { Character } from '../components/Character';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { PuzzlePreludePanel } from './PuzzlePrelude';

type Style = 'intuition' | 'evidence' | 'technical';
type CaseState = { style: Style; clues: string[] };
type Scene = `ana-${number}` | `mod-${number}-${number}` | 'hero-old' | 'hero-new';

const COLORS = { bg:'#07100b', panel:'#111a12', line:'#3d5535', cyan:'#5fc7c7', green:'#77994d', red:'#b75c55', yellow:'#e2bd58', purple:'#75639b', text:'#e4edda', muted:'#9ead91' };
const KEY = 'lary-case-state-v2';
const styleNames: Record<Style,string> = { intuition:'直觉派', evidence:'证据派', technical:'技术派' };
const clues: Record<string,string> = {
  'mod-1-2':'线索01：画面变化 ≠ 动作理解', 'mod-2-1':'线索02：潜在动作是表示，不是真实动作标签',
  'mod-3-1':'线索03：双轨任务拆开“做什么”与“怎么做”', 'mod-4-1':'线索04：统一 attentive probe 受控读取动作语义',
  'mod-5-1':'线索05：回归检验表示是否保留连续控制', 'mod-6-1':'线索06：通用视觉先验仍会经过量化瓶颈',
  'mod-7-1':'线索07：本基准中通用视觉编码器意外领先', 'mod-8-1':'线索08：部分 LAM 跨 stride 较稳，但绝对误差仍需比较',
  'mod-9-1':'线索09：容量、利用率与性能并非单调', 'mod-10-1':'线索10：会模仿，不代表真的理解'
};

type Puzzle = {
  questions: Record<Style,string>;
  hint: Record<Style,string>;
  answers: string[];
  correct: string;
  summary: string;
  next: string;
};

const puzzles: Record<string,Puzzle> = {
  'mod-1-2': {
    questions: { intuition:'只看前后两帧，你愿意给机器人盖上“理解动作”的章吗？', evidence:'以下哪项，是现有监控证据最稳妥支持的判断？', technical:'在没有动作标签时，观测转移 oₜ→oₜ₊₁ 能直接识别真实动作吗？' },
    hint: { intuition:'先想一种“画面一样变了，但原因不同”的情况。', evidence:'证据只记录了结果，没有记录导致结果的动作。', technical:'这是典型的不可辨识性：同一观测转移可能对应多个动作或环境因素。' },
    answers:['A. 已经真正理解动作','B. 只是在记忆像素','C. 暂时无法判断'], correct:'C. 暂时无法判断',
    summary:'两帧只证明视觉发生了变化，既不能证明“真理解”，也不能直接判定“只记像素”。我们需要一个能被单独检验的中间表示。',
    next:'没有真实动作标签，中间发生了什么，模型该怎样表示？'
  },
  'mod-2-1': {
    questions:{ intuition:'动作标签失踪了，你会先从哪里找回“中间发生了什么”？', evidence:'哪种中间量既来自画面变化，又允许后续独立检验？', technical:'视觉序列 o₁:T 应映射成什么，才能作为动作信息的可测载体？' },
    hint:{ intuition:'别凭空补一个动作名，先保存能解释变化的线索。', evidence:'它不是动作真值，而是由观测转移学习出的表示。', technical:'需要学习 z∈Z，再检查 z 对语义与控制是否可读出。' },
    answers:['A. 人工猜一个动作标签','B. 学习潜在动作表示 z','C. 只重建下一帧就结案'], correct:'B. 学习潜在动作表示 z',
    summary:'Latent Action 是视觉转移压缩出的表示 z，不是真实动作标签。它的价值必须由下游的语义和控制任务来检验。',
    next:'有了 z，怎样判断它真的包含动作信息？'
  },
  'mod-3-1': {
    questions:{ intuition:'两道审讯已经就位，你会怎样使用它们判断机器人是否真的懂动作？', evidence:'应该如何运用两道审讯，避免单项成绩替动作理解作证？', technical:'应该如何联合使用 Z→C 与 Z→A 两条读出路径？' },
    hint:{ intuition:'会报菜名和会下锅，是两种本事。这个类比只帮助理解。', evidence:'一个指标要读类别，一个指标要还原连续控制。', technical:'分类读出 f_sem(z)，回归读出 f_dyn(z)，二者缺一不可。' },
    answers:['A. 只看语义分类','B. 只看控制回归','C. 同时使用语义分类与控制回归'], correct:'C. 同时使用语义分类与控制回归',
    summary:'LARYBench 用语义分类回答“做什么”，用控制回归回答“怎么做”。双轨设计防止一种能力替另一种能力作证。',
    next:'怎样抽查表示本身，而不是让复杂策略代答？'
  },
  'mod-4-1': {
    questions:{ intuition:'为什么不能让每个模型带着自己的“最强大脑”来参加语义考试？', evidence:'为什么语义分类要给不同表示使用统一 attentive probe？', technical:'为什么冻结编码器并统一分类读出器，有助于隔离表示质量？' },
    hint:{ intuition:'如果考生连同私人教练一起答题，分数就不只属于考生了。这个类比只帮助理解。', evidence:'分类比较时要控制读出器能力，把主要变量留给输入表示。', technical:'冻结编码器、对齐维度并固定 attentive probe，可减少分类读出容量这一混杂因素。' },
    answers:['A. 让 Probe 替模型学会完整策略','B. 控制分类读出能力，减少策略差异的干扰','C. 证明 Probe 完全没有偏差'], correct:'B. 控制分类读出能力，减少策略差异的干扰',
    summary:'语义分类轨冻结上游表示并统一 attentive probe，使比较更聚焦于可读出的动作类别；控制回归轨则另用统一的 MLP Action Expert。两种读出都减少混杂，但都不是绝对无偏的测量。',
    next:'动作名能读出来之后，连续控制信息该怎么查？'
  },
  'mod-5-1': {
    questions:{ intuition:'认出“倒水”以后，机器人还缺哪份关键证据？', evidence:'什么结果最能说明表示保留了连续控制轨迹？', technical:'若 â 是预测动作、a 是真值，应优化和比较哪个量？' },
    hint:{ intuition:'知道要去哪儿，不等于知道每一步怎么走。', evidence:'要看预测轨迹与真实轨迹的距离，而且不同动作空间不能混比。', technical:'使用 MSE=(1/N)Σ‖âᵢ−aᵢ‖²，越低越好。' },
    answers:['A. 更好看的重建图','B. 更低的控制回归 MSE','C. 更多动作类别名称'], correct:'B. 更低的控制回归 MSE',
    summary:'控制回归检查 z 是否保留连续方向、姿态和夹爪等信息。MSE 越低越好，但必须同时注明数据集、动作维度和时间跨度。',
    next:'四类模型带着不同先验入场，该怎样公平理解它们？'
  },
  'mod-6-1': {
    questions:{ intuition:'通才接上动作词典，就一定会变成最强机器人专家吗？', evidence:'对“通用 LAM”的结构，哪种描述最完整？', technical:'冻结视觉骨干接入 VQ 动作瓶颈后，性能还受什么约束？' },
    hint:{ intuition:'好底子很重要，但中间那道窄门也可能丢信息。', evidence:'同时看预训练先验与量化瓶颈，不能只看模型名字。', technical:'视觉特征经投影、量化与预测目标后，码本利用和动作建模都会限制可读信息。' },
    answers:['A. 只有机器人动作先验','B. 强视觉先验加量化瓶颈','C. 与原始视觉编码器完全相同'], correct:'B. 强视觉先验加量化瓶颈',
    summary:'通用 LAM 继承强视觉先验，同时要经过潜在动作训练和量化瓶颈。结构履历解释可能原因，最终优劣仍要由统一实验判定。',
    next:'专门学机器人动作的模型，真的会稳赢吗？'
  },
  'mod-7-1': {
    questions:{ intuition:'谁才是真正懂动作的人？', evidence:'谁才是真正懂动作的人？', technical:'谁才是真正懂动作的人？' },
    hint:{ intuition:'泛化像换题型后的考试表现；这是类比，不是技术等价。', evidence:'分类看高，回归看低，别把两个箭头读反。', technical:'代表结果包括 V-JEPA2 分类 Accuracy 76.62，以及 DINOv3 控制 MSE 0.19。' },
    answers:['A. 具身 LAM','B. 通用 LAM','C. 通用视觉编码器'], correct:'C. 通用视觉编码器',
    summary:'反直觉结果是：现成通用视觉编码器在该协议下领先具身 LAM。强视觉先验可能比“专门训练过”这个标签更重要。',
    next:'通用视觉为什么占优——它究竟把注意力放在了哪里？'
  },
  'mod-8-1': {
    questions:{ intuition:'短跑很快、长跑却迷路——你会通过什么判断模型是否真的懂动作？', evidence:'哪组证据能同时检查模型关注哪里，以及动作信息能否跨时间保持？', technical:'判断表示是否保留动作信息，应采用哪种跨 stride 诊断协议？' },
    hint:{ intuition:'看向线索和真正使用线索，不是一回事。', evidence:'热图负责定性诊断，跨 stride 的 MSE 才提供定量比较。', technical:'把可视化视为假设生成工具，再用受控的跨时间回归验证。' },
    answers:['A. 只看注意力热图','B. 热图结合跨 stride 回归','C. 只看单个短跨度结果'], correct:'B. 热图结合跨 stride 回归',
    summary:'temporal pooler 的 cross-attention 落点只能提供诊断线索；跨 stride 控制回归显示表示在时间跨度变化下的稳定性。两者结合，因果措辞仍需克制。',
    next:'加入离散码本后，容量越大就一定越好吗？'
  },
  'mod-9-1': {
    questions:{ intuition:'买了 64 页词典却只翻第一页，问题出在“书不够厚”吗？', evidence:'容量、码本利用率与任务性能之间是什么关系？', technical:'利用率 U 与 K 增大时，是否应当单调上升？' },
    hint:{ intuition:'拥有多少页和真正用过多少页，是两回事。', evidence:'同时观察序列长度、潜在维度、利用率、Accuracy 与 MSE。', technical:'U=|{k:count(k)>0}|/K。K 增大并不保证更多码字被使用。' },
    answers:['A. 容量越大性能越好','B. 利用率越高性能必然越好','C. 三者是非单调权衡'], correct:'C. 三者是非单调权衡',
    summary:'码本容量、实际利用率和下游性能不是单调关系。Codebook Collapse 指大量码字闲置，调参必须联合观察多个指标。',
    next:'证据齐了，结案报告怎样写才不过度外推？'
  },
  'mod-10-1': {
    questions:{ intuition:'最后盖章：哪句话既有力量，又没有把证据说过头？', evidence:'哪项结论准确保留了评测协议和能力边界？', technical:'从 Probe 结果能够合法推出哪一层主张？' },
    hint:{ intuition:'好侦探会把“在什么条件下”写进结论。', evidence:'结果比较的是动作信息可读性，不等于证明完整机器人智能。', technical:'Probe 支持的是条件性表征结论，不能升级为因果或普遍能力结论。' },
    answers:['A. 机器人已经真正理解动作','B. 本基准下通用视觉表示更强','C. 专用 LAM 毫无价值'], correct:'B. 本基准下通用视觉表示更强',
    summary:'机器人会模仿，不代表机器人真的理解。LARYBench 把“看起来会”和“表示中确实含有可读动作信息”分开，同时明确数据、Probe 与动作空间的边界。',
    next:'案件解决。带着你亲手拼出的完整证据链，继续查看延伸材料。'
  }
};

const clueAliases: Record<string,string> = {
  '线索04：统一 Probe 控制读出能力，隔离表示质量':'线索04：统一 attentive probe 受控读取动作语义',
  '线索08：latent 更稳，但 Heatmap 只是诊断线索':'线索08：部分 LAM 跨 stride 较稳，但绝对误差仍需比较'
};
function readCase(): CaseState {
  try { const v = JSON.parse(localStorage.getItem(KEY)||'{}'); return {style: v.style||'evidence', clues:Array.isArray(v.clues)?v.clues.map((clue:string)=>clueAliases[clue]||clue):[]}; }
  catch { return {style:'evidence', clues:[]}; }
}
function saveCase(next: CaseState){ localStorage.setItem(KEY,JSON.stringify(next)); window.dispatchEvent(new CustomEvent('lary-case-state',{detail:next})); }
function useCase(){
  const [state,setState]=useState<CaseState>(()=>readCase());
  useEffect(()=>{ const on=()=>setState(readCase()); window.addEventListener('lary-case-state',on); window.addEventListener('storage',on); return()=>{window.removeEventListener('lary-case-state',on);window.removeEventListener('storage',on)};},[]);
  const setStyle=(style:Style)=>{const n={...readCase(),style};saveCase(n);setState(n)};
  const addClue=(clue:string)=>{const old=readCase();const isNew=!old.clues.includes(clue);const n={...old,clues:Array.from(new Set([...old.clues,clue]))};saveCase(n);setState(n);if(isNew)window.dispatchEvent(new CustomEvent('lary-paper-place'))};
  return {state,setStyle,addClue};
}

function CaseDock(){
  const {state,setStyle}=useCase(); const [wall,setWall]=useState(false);
  return <><div className="case-dock"><img src={`${import.meta.env.BASE_URL}images/characters/phebe-base.png`} alt="侦探 Phebe"/><div className="case-style-label"><small>调查风格</small><strong>{styleNames[state.style]}</strong></div><div className="case-style-quick" aria-label="切换调查风格">{(['intuition','evidence','technical'] as Style[]).map(s=><button key={s} className={state.style===s?'active':''} onClick={()=>setStyle(s)}>{styleNames[s]}</button>)}</div><button onClick={()=>setWall(true)}>档案墙 · {state.clues.length}</button></div>{wall&&<div className="evidence-wall" role="dialog" aria-modal="true"><div className="evidence-wall-inner"><button className="wall-close" onClick={()=>setWall(false)}>退出档案墙 ×</button><h3>案件档案墙</h3><p>这些线索由你在互动后收集。现场小瓶为虚构道具，不含真实药物信息。</p><div className="clue-grid">{state.clues.length?state.clues.map((c,i)=><article key={c}><span>#{String(i+1).padStart(2,'0')}</span>{c}</article>):<article>还没有贴上线索。先回主线做一次判断。</article>}</div></div></div>}</>;
}

function TechEvidence({scene}:{scene:Scene}){
  const {state}=useCase();
  const texts:Record<string,{title:string;body:string;formula:string;notes:string[]}>= {
    'mod-1-2':{title:'观测变化的不可辨识性',body:'只给定前后观测，造成变化的真实因素通常不唯一：机器人动作、镜头运动、遮挡与环境动力学都可能产生相似像素差异。因此，视觉预测成功只能说明模型会描述转移，不能自动证明动作语义已经被编码。',formula:'同一 (oₜ, oₜ₊₁) ⇏ 唯一动作 aₜ',notes:['评测对象应是中间表示，而非重建画面的观感。','需要独立任务测试语义与物理控制信息能否被读出。']},
    'mod-2-1':{title:'潜在动作表示',body:'潜在动作模型把一段观察或一对观察编码为 z。z 是从视觉变化中学习出的压缩变量，并不等于数据集中真实记录的机器人动作。连续 z 保留的几何结构可供统一读出器使用；离散 token 则还会受到量化误差和码本利用率影响。',formula:'E(o₁:T) = z，z ∈ Z',notes:['E 是视觉到潜在空间的编码器。','表示是否“像动作”，要由下游可读性而不是名称决定。']},
    'mod-3-1':{title:'双轨读出协议',body:'语义轨测试高层行为类别是否在潜在空间中可分；动力学轨测试连续动作块能否由同一表示回归。只做分类会忽略精细轨迹，只做回归又可能错过跨形态共享的动作意图。',formula:'f_sem: Z→C　　f_dyn: Z→A',notes:['C 是离散动作类别集合，Accuracy 越高越好。','A 是连续动作空间，回归 MSE 越低越好。']},
    'mod-4-1':{title:'语义分类中的受控 Probe',body:'不同模型输出的 token 数和维度并不一致，因此先用投影器对齐，再交给相同结构的 4 层 attentive probe，训练 20 个 epoch。固定分类读出器降低额外模型容量对结果的干扰；连续控制轨使用的则是带 2 个残差块、隐藏维度 4096 的 MLP Action Expert。',formula:'ĉ = f_sem(P(z₁,…,zₙ))',notes:['P 对齐表示维度，attentive probe 聚合多个 token。','Probe 只对应语义分类；控制回归使用单独的 Action Expert。','两种读出器都有学习能力，不能把分数解释成无条件的“真实理解”。']},
    'mod-5-1':{title:'连续控制回归',body:'Action Expert 从潜在表示预测长度为 s 的动作块。输出维度由时间跨度与机器人自由度共同决定，例如 s×7、s×12 或 s×16。不同数据集的动作定义不同，不能只比较一个脱离协议的误差数字。',formula:'MSE = (1/N) Σᵢ ‖âᵢ − aᵢ‖²',notes:['âᵢ 是预测动作，aᵢ 是真实动作。','平方误差越低，表示中的连续控制信息越容易被恢复。']},
    'mod-6-1':{title:'四类表示与信息瓶颈',body:'语义编码器偏向高层概念，像素编码器偏向外观重建，具身 LAM 直接从机器人数据学习潜在动作；通用 LAM 则把冻结的通用视觉骨干接入潜在动作训练。后者兼有强视觉先验与量化瓶颈。',formula:'z_v = E_frozen(o) → q(z_v) → latent action',notes:['冻结骨干使原有视觉先验得以保留。','投影、量化和预测目标都可能丢失与控制有关的信息。']},
    'mod-7-1':{title:'反直觉的统一比较',body:'在相同读出协议下，通用视觉编码器在语义分类和控制回归中表现突出。代表性结果包括 V-JEPA2 的分类 Accuracy 76.62，以及 DINOv3 的控制 MSE 0.19。数值必须结合指标方向、数据切分和读出器共同解释。',formula:'更好 ⇔ Accuracy ↑ 且 MSE ↓',notes:['“专门训练”不保证更可读；强视觉先验可能更关键。','这是基准内的条件性排名，不是对所有机器人任务的普遍定论。']},
    'mod-8-1':{title:'定性定位与定量稳定性',body:'论文可视化的是 temporal pooler 的 cross-attention：它可观察读出过程中是否聚焦手—物体交互区域，但只说明读出器关注哪里。跨时间步长回归则测试表示在更长转移下是否仍保留控制信息。两种证据回答不同问题。',formula:'MSE(s) = E[‖f_dyn(zₜ,ₜ₊ₛ) − aₜ:ₜ₊ₛ‖²]',notes:['热图用于诊断和提出假设，不能单独证明因果。','随 s 变化的误差曲线用于比较时间稳定性与绝对误差。']},
    'mod-9-1':{title:'码本利用率与塌缩',body:'离散潜在动作把连续特征分配到 K 个码字。若训练只反复选择少数码字，就出现码本塌缩。实验中序列长度 16 时利用率仅 1.6%，49 时可达 100%；潜在维度增至 512 时又降到 1.6%，说明关系并不单调。',formula:'U = |{k : count(k)>0}| / K × 100%',notes:['U 衡量实际被使用的码字比例，不直接等价于任务性能。','容量、序列长度、潜在维度、Accuracy 与 MSE 必须联合选择。']},
    'mod-10-1':{title:'结论的逻辑边界',body:'Probe 证明的是：在给定数据、动作空间和读出协议下，某类表示包含更多可被读出的动作信息。它不直接证明机器人拥有因果理解，也不能推出专用 LAM 在其他数据规模、结构或控制任务上没有价值。',formula:'基准证据 ⇒ 条件性表征结论　≠　普遍智能结论',notes:['自动标签、长尾类别与跨形态差距会限制外推。','部分灵巧手关节被屏蔽，结果不能代表完整手部控制能力。']}
  };
  const item=texts[scene]; if(!item) return null;
  return <details className={state.style==='technical'?'tech-evidence tech-prominent':'tech-evidence'}><summary>展开技术证据</summary><div className="tech-chapter"><h5>{item.title}</h5><p>{item.body}</p><div className="tech-formula">{item.formula}</div><ul>{item.notes.map(x=><li key={x}>{x}</li>)}</ul></div></details>;
}

function ClueButton({scene,ready}:{scene:Scene;ready:boolean}){ const {state,addClue}=useCase(); const clue=clues[scene]; if(!clue||!ready)return null; const done=state.clues.includes(clue); return <button className="clue-button" onClick={()=>addClue(clue)}>{done?'已贴到档案墙':'贴到档案墙'}</button> }
function Feedback({text,tone='mid'}:{text:string;tone?:'good'|'bad'|'mid'}){return <div className={`feedback ${tone==='good'?'good':tone==='bad'?'bad':''}`}>{text}</div>}
function Chips({items,value,onChange}:{items:string[];value:string;onChange:(v:string)=>void}){return <div className="case-controls">{items.map(x=><button key={x} className={`chip ${value===x?'active':''}`} onClick={()=>onChange(x)}>{x}</button>)}</div>}

function drawBase(ctx:CanvasRenderingContext2D,w:number,h:number){ctx.fillStyle=COLORS.bg;ctx.fillRect(0,0,w,h);ctx.strokeStyle=COLORS.line;ctx.lineWidth=2;ctx.strokeRect(10,10,w-20,h-20);ctx.fillStyle=COLORS.panel;ctx.fillRect(28,28,w-56,h-56)}
function label(ctx:CanvasRenderingContext2D,text:string,x:number,y:number,color=COLORS.text){ctx.fillStyle=color;ctx.font='14px Cascadia Code, monospace';ctx.fillText(text,x,y)}
function drawFrame(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,active=false){ctx.fillStyle='#0a0f0b';ctx.fillRect(x,y,w,h);ctx.strokeStyle=active?COLORS.cyan:COLORS.line;ctx.lineWidth=active?4:2;ctx.strokeRect(x,y,w,h);ctx.fillStyle=active?COLORS.yellow:COLORS.muted;ctx.beginPath();ctx.arc(x+w*.62,y+h*.52,10,0,Math.PI*2);ctx.fill()}
function drawBars(ctx:CanvasRenderingContext2D,vals:number[],names:string[],w:number,h:number,invert=false){const max=Math.max(...vals);vals.forEach((v,i)=>{const bw=(w-140)/vals.length-14;const bh=(invert?(max-v+.08):v)/max*(h-105);const x=70+i*((w-140)/vals.length);ctx.fillStyle=i===0?COLORS.green:i===1?COLORS.cyan:i===2?COLORS.yellow:COLORS.red;ctx.fillRect(x,h-45-bh,bw,bh);label(ctx,names[i],x,h-22,COLORS.muted);label(ctx,String(v),x+4,h-52-bh,COLORS.text)})}

function useCanvas(scene:Scene,state:any,isAnalogy:boolean){
  const ref=useRef<HTMLCanvasElement>(null);
  useEffect(()=>{const canvas=ref.current;if(!canvas)return;const w=isAnalogy?560:960,h=isAnalogy?140:280;const ctx=setupCanvas(canvas,w,h);let raf=0;let running=true;const render=(time=0)=>{drawBase(ctx,w,h);const t=(time/2600)%1;drawScene(ctx,scene,state,w,h,t);canvas.classList.add('is-ready')};const loop=(time:number)=>{if(!running)return;render(time);raf=requestAnimationFrame(loop)};if(isAnalogy){const stop=observeCanvas(canvas,()=>{running=true;cancelAnimationFrame(raf);raf=requestAnimationFrame(loop)},()=>{running=false;cancelAnimationFrame(raf)});return()=>{running=false;cancelAnimationFrame(raf);stop()}}render();return()=>cancelAnimationFrame(raf)},[scene,state,isAnalogy]);
  return ref;
}

function drawScene(ctx:CanvasRenderingContext2D,scene:Scene,s:any,w:number,h:number,t:number){
  const n=Number((scene.match(/\d+/)||['1'])[0]);
  if(scene.startsWith('hero')){drawFrame(ctx,55,45,w-110,h-90,true);ctx.fillStyle=scene==='hero-old'?COLORS.red:COLORS.green;ctx.fillRect(70,h-62,(w-140)*(scene==='hero-old'?.38:.82),10);label(ctx,scene==='hero-old'?'证据缺口':'双轨审讯',80,74);return}
  if(scene.startsWith('ana-')){const x=50+(w-120)*t;ctx.save();ctx.globalAlpha=.22;ctx.fillStyle=COLORS.cyan;ctx.beginPath();ctx.arc(x,72,34,0,Math.PI*2);ctx.fill();ctx.restore();ctx.fillStyle=COLORS.yellow;ctx.beginPath();ctx.arc(x,72,8,0,Math.PI*2);ctx.fill();ctx.strokeStyle=COLORS.line;ctx.beginPath();ctx.moveTo(45,105);ctx.lineTo(w-45,105);ctx.stroke();label(ctx,`CASE ${String(n).padStart(2,'0')}`,45,45,COLORS.muted);return}
  if(scene==='mod-1-1'){['intuition','evidence','technical'].forEach((x,i)=>{const active=s.choice===x;ctx.fillStyle=active?COLORS.yellow:COLORS.line;ctx.fillRect(150+i*230,80,140,90-(i*8));});label(ctx,'调查风格',70,55);return}
  if(scene==='mod-1-2'||scene==='mod-2-1'){drawFrame(ctx,80,70,250,130,true);drawFrame(ctx,w-330,70,250,130,true);const reveal=scene==='mod-1-2'?s.choice:(s.choice||s.step);ctx.strokeStyle=reveal?COLORS.cyan:COLORS.red;ctx.setLineDash(reveal?[0]:[8,8]);ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(330,135);ctx.lineTo(w-330,135);ctx.stroke();ctx.setLineDash([]);if(reveal){ctx.fillStyle=COLORS.yellow;ctx.beginPath();ctx.arc(w/2,135,24,0,Math.PI*2);ctx.fill();label(ctx,'z',w/2-4,140,COLORS.bg)}return}
  if(scene==='mod-3-1'){ctx.strokeStyle=COLORS.cyan;ctx.strokeRect(90,55,330,170);ctx.strokeStyle=COLORS.green;ctx.strokeRect(540,55,330,170);label(ctx,'做什么',210,82);label(ctx,'怎么做',660,82);ctx.fillStyle=s.choice?COLORS.yellow:COLORS.muted;ctx.fillRect(s.choice==='控制回归'?650:260,125,60,55);return}
  if(scene==='mod-4-1'){['聚类图','完整策略','统一 Probe'].forEach((x,i)=>{ctx.fillStyle=String(s.choice||'').includes(x)?COLORS.green:COLORS.line;ctx.fillRect(100+i*270,85,190,95);label(ctx,x,135+i*270,138,COLORS.text)});return}
  if(scene==='mod-5-1'){ctx.strokeStyle=COLORS.green;ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(80,200);ctx.bezierCurveTo(280,40,600,230,880,80);ctx.stroke();ctx.strokeStyle=COLORS.cyan;ctx.setLineDash([8,6]);ctx.beginPath();ctx.moveTo(80,200);ctx.bezierCurveTo(280,55+s.value*2,600,210-s.value,880,80+s.value);ctx.stroke();ctx.setLineDash([]);label(ctx,`s=${s.value}`,80,55,COLORS.yellow);return}
  if(scene==='mod-6-1'){const xs=[100,285,470,655,840];xs.forEach((x,i)=>{ctx.fillStyle=i<=s.step?COLORS.cyan:COLORS.line;ctx.beginPath();ctx.arc(x,135,38,0,Math.PI*2);ctx.fill();if(i<4){ctx.strokeStyle=i<s.step?COLORS.green:COLORS.line;ctx.beginPath();ctx.moveTo(x+38,135);ctx.lineTo(xs[i+1]-38,135);ctx.stroke()}});label(ctx,s.choice||'选择范式',70,55,COLORS.yellow);return}
  if(scene==='mod-7-1'){drawBars(ctx,s.reveal?[76.62,49.36,20.90]:[4,4,4],['通用视觉','通用LAM','具身LAM'],w,h);return}
  if(scene==='mod-8-1'){ctx.fillStyle='#0a0f0b';ctx.fillRect(60,50,520,180);ctx.save();ctx.globalAlpha=.3;ctx.fillStyle=COLORS.cyan;ctx.beginPath();ctx.arc(140+s.focus*4,135,55-(s.choice==='像素编码器'?0:24),0,Math.PI*2);ctx.fill();ctx.restore();drawBars(ctx,s.choice==='像素编码器'?[.04,.57,.62]:s.choice==='通用LAM'?[.25,.20,.26]:[.07,.13,.16],['5','15','30'],370,230,true);return}
  if(scene==='mod-9-1'){const v=s.values[s.index];for(let i=0;i<16;i++){ctx.strokeStyle=i<Math.max(1,Math.round(v.util/6.25))?COLORS.green:COLORS.line;ctx.strokeRect(75+i*48,75,32,95)}label(ctx,`${v.util}%`,780,205,v.util>80?COLORS.green:COLORS.red);return}
  if(scene==='mod-10-1'){drawBars(ctx,s.reveal?[76.62,49.36,20.90]:[2,2,2],['视觉通才','通用LAM','具身LAM'],w,h);const scoped=String(s.choice||'').includes('本基准');ctx.fillStyle=scoped?COLORS.green:COLORS.yellow;ctx.fillRect(790,55,95,45);label(ctx,scoped?'可盖章':'需收窄',805,84,COLORS.bg);return}
}

function contentFor(scene:Scene,state:any,setState:(v:any)=>void){
  if(scene==='mod-1-1')return <><Chips items={['直觉派','证据派','技术派']} value={state.label||''} onChange={v=>{const map:any={'直觉派':'intuition','证据派':'evidence','技术派':'technical'};saveCase({...readCase(),style:map[v]});setState({...state,label:v,choice:map[v],ready:true})}}/><Feedback tone="good" text={state.label?`${state.label}已记录。你随时可以在右上角切换；证据不会因此缺席。`:'先选一种查案手感，课程不会给你贴学习风格标签。'}/></>;
  if(scene==='mod-1-2')return <><Chips items={['A 真正理解了动作','B 只记住画面变化','C 暂时无法判断']} value={state.choice||''} onChange={v=>setState({...state,choice:v,ready:true})}/><Feedback text={!state.choice?'你觉得机器人为何会从人类视频学到行为？':state.choice.startsWith('A')?'这个猜法很合理，但两帧还分不出理解与记忆。':state.choice.startsWith('B')?'你刚好踩中了作者想排除的一种可能：捷径不能靠直觉定罪。':'谨慎得漂亮：下一步需要可检验的表示。'}/></>;
  if(scene==='mod-2-1')return <><div className="case-controls"><button onClick={()=>setState({...state,step:Math.max(0,state.step-1)})}>上一步</button><button onClick={()=>setState({...state,step:Math.min(3,state.step+1),ready:state.step+1>=3})}>下一步</button><button onClick={()=>setState({...state,step:0,ready:false})}>重置</button></div><Feedback tone={state.step>=3?'good':'mid'} text={['只有前后观察，动作标签缺席。','先圈出真正变化的区域。','给变化压出中间表示 z。','现在才有资格问：z 能否支持语义与控制？'][state.step]}/></>;
  if(scene==='mod-3-1')return <><Chips items={['动作名：pour','末端轨迹','夹爪开合','行为类别']} value={state.card||''} onChange={v=>setState({...state,card:v,choice:''})}/><Chips items={['语义分类','控制回归']} value={state.choice||''} onChange={v=>setState({...state,choice:v,ready:!!state.card})}/><Feedback tone={state.choice?'good':'mid'} text={!state.choice?'选一张证据，再决定送去哪间审讯室。':`${state.card} 被送往${state.choice}。分类看 Accuracy↑，回归看 MSE↓。`}/></>;
  if(scene==='mod-4-1')return <><Chips items={['聚类图','完整策略','统一Probe']} value={state.choice||''} onChange={v=>setState({...state,choice:v,ready:true})}/><Feedback tone={state.choice==='统一Probe'?'good':'mid'} text={!state.choice?'哪种抽查更能隔离表示质量？':state.choice==='统一Probe'?'统一 Probe 减少策略代答，但 Probe 本身仍会影响结果。':state.choice==='聚类图'?'聚类图直观，却很难量化“能不能读出动作”。':'完整策略会把表示与策略能力混在一起。'}/></>;
  if(scene==='mod-5-1')return <><label className="case-range">时间间隔 s = {state.value}<input type="range" min="5" max="30" step="5" value={state.value} onChange={e=>setState({...state,value:+e.target.value,ready:true})}/></label><Chips items={['CALVIN 7DoF','VLABench 7DoF','RoboCOIN 12DoF','AgiBot 16DoF']} value={state.choice||''} onChange={v=>setState({...state,choice:v,ready:true})}/><Feedback text={`间隔变大时要回归更长动作块；${state.choice||'请选择数据集'} 的动作空间不能与别数据集硬混为一谈。`}/></>;
  if(scene==='mod-6-1')return <><Chips items={['语义编码器','像素编码器','具身LAM','通用LAM']} value={state.choice||''} onChange={v=>setState({...state,choice:v,step:0,ready:true})}/><div className="case-controls"><button onClick={()=>setState({...state,step:Math.max(0,state.step-1)})}>上一节点</button><button onClick={()=>setState({...state,step:Math.min(4,state.step+1)})}>下一节点</button></div><Feedback text={state.choice?`${state.choice}路径已点亮。履历解释结构，最终排名仍要交给实验。`:'先选一类模型，再逐节点检查有效路径。'}/></>;
  if(scene==='mod-7-1')return <><Chips items={['具身LAM','通用LAM','通用视觉']} value={state.choice||''} onChange={v=>setState({...state,choice:v,reveal:false})}/><div className="case-controls"><button disabled={!state.choice} onClick={()=>setState({...state,reveal:true,ready:true})}>揭开监控记录</button></div><Feedback tone={state.reveal?'good':'mid'} text={!state.reveal?'先押一个分类赢家。':state.choice==='通用视觉'?'你的直觉与表1一致，但别忘了协议边界。':'如果你刚才押错了，恭喜，你和大多数人的第一直觉一样：通用视觉编码器反而领先。'}/></>;
  if(scene==='mod-8-1')return <><Chips items={['通用视觉','像素编码器','通用LAM']} value={state.choice||''} onChange={v=>setState({...state,choice:v,ready:true})}/><label className="case-range">光圈位置 {state.focus}<input type="range" min="0" max="100" value={state.focus} onChange={e=>setState({...state,focus:+e.target.value,ready:true})}/></label><Feedback text={state.choice==='像素编码器'?'FLUX 在 stride=5 的 0.04 很亮眼，却在 stride=30 升到 0.62。':state.choice==='通用LAM'?'通用 LAM 跨 stride 较稳，但绝对 MSE 仍高于未压缩通用编码器。':'注意力更聚焦是诊断线索；V-JEPA2 的跨 stride MSE 为 0.07/0.13/0.16。'}/></>;
  if(scene==='mod-9-1')return <><Chips items={['序列长度','码本大小','潜在维度']} value={state.factor} onChange={v=>setState({factor:v,index:0,values:factorValues(v),ready:false})}/><label className="case-range">候选 {state.values[state.index].x}<input type="range" min="0" max={state.values.length-1} step="1" value={state.index} onChange={e=>setState({...state,index:+e.target.value,ready:true})}/></label><Feedback tone={state.values[state.index].util<10?'bad':'good'} text={`利用率 ${state.values[state.index].util}%。更大不必然更好，必须与 Accuracy 和 MSE 联合判断。`}/></>;
  if(scene==='mod-10-1')return <><Chips items={['机器人已经理解','范围恰当','专用LAM毫无价值']} value={state.choice||''} onChange={v=>setState({...state,choice:v,reveal:false})}/><div className="case-controls"><button disabled={!state.choice} onClick={()=>setState({...state,reveal:true,ready:true})}>核对证据并盖章</button></div><Feedback tone={state.reveal&&state.choice==='范围恰当'?'good':'mid'} text={!state.reveal?'哪句话能写进结案报告？':state.choice==='范围恰当'?'可写：在 LARYBench 协议下，通用视觉表示更强；仍不能宣称机器人已经真正理解。':'这个猜法很合理，但证据支持的范围更窄。请选择带有“本基准协议下”的结论。'}/>{state.reveal&&<div className="case-ending"><div className="ending-cast"><Character name="nuonuo-awake" alt="醒来的 Nuonuo"/><Character name="phebe-snacks" alt="拿着证物零食的 Phebe"/></div><div><b>现场有新证据。</b><p>小瓶只是虚构昏睡剂，Nuonuo 安然醒来。</p><p className="typewriter-note">案件解决，零食作为证物全部没收。——侦探 Phebe</p></div></div>}</>;
  return null;
}

function factorValues(factor:string){
  if(factor==='码本大小')return[{x:8,util:100},{x:64,util:100},{x:256,util:89.5}];
  if(factor==='潜在维度')return[{x:32,util:3.1},{x:64,util:100},{x:256,util:100},{x:512,util:1.6},{x:1024,util:84.4}];
  return[{x:16,util:1.6},{x:49,util:100},{x:64,util:79.7}];
}

function initialFor(scene:Scene):any{
  if(scene==='mod-1-2')return{choice:'',ready:false,opening:'scene'};
  if(scene==='mod-2-1')return{step:0,ready:false}; if(scene==='mod-5-1')return{value:5,choice:'',ready:false};
  if(scene==='mod-6-1')return{choice:'',step:0,ready:false}; if(scene==='mod-7-1'||scene==='mod-10-1')return{choice:'',reveal:false,ready:false};
  if(scene==='mod-8-1')return{choice:'通用视觉',focus:45,ready:false}; if(scene==='mod-9-1')return{factor:'序列长度',index:0,values:factorValues('序列长度'),ready:false};
  return{choice:'',ready:false};
}

function SurveillanceClip({onComplete}:{onComplete:()=>void}){
  const clipRef=useRef<HTMLCanvasElement>(null);
  useEffect(()=>{const canvas=clipRef.current;if(!canvas)return;const w=960,h=300,ctx=setupCanvas(canvas,w,h);let raf=0;let doneTimer=0;let finished=false;const start=performance.now();
    const render=(now:number)=>{const p=Math.min(1,(now-start)/6200);const demo=Math.min(1,p/.36);const imitation=Math.max(0,Math.min(1,(p-.5)/.42));canvas.classList.add('is-ready');ctx.fillStyle='#030806';ctx.fillRect(0,0,w,h);ctx.strokeStyle='#1d3426';ctx.lineWidth=1;for(let x=0;x<w;x+=48){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke()}for(let y=0;y<h;y+=48){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke()}
      ctx.fillStyle='#08120c';ctx.fillRect(20,20,w-40,h-40);ctx.strokeStyle=COLORS.cyan;ctx.lineWidth=2;ctx.strokeRect(20,20,w-40,h-40);label(ctx,'REC 00:17:24  ·  家庭监控',42,48,COLORS.cyan);label(ctx,p<.42?'01  人类示范：正常倒水':p<.54?'02  机器人观察并记录':'03  机器人模仿：倒入某种东西',600,48,p<.54?COLORS.text:COLORS.yellow);
      ctx.fillStyle='#233329';ctx.fillRect(54,216,852,12);ctx.fillStyle='#101b13';ctx.fillRect(92,228,16,35);ctx.fillRect(852,228,16,35);
      const robotX=150+imitation*430;const eyeY=100+Math.sin(p*Math.PI*7)*3;ctx.fillStyle='#17271b';ctx.fillRect(robotX-46,116,92,92);ctx.fillStyle='#809a72';ctx.fillRect(robotX-29,76,58,48);ctx.fillStyle='#06100b';ctx.fillRect(robotX-19,90,38,14);ctx.fillStyle=COLORS.cyan;ctx.beginPath();ctx.arc(robotX,eyeY,6,0,Math.PI*2);ctx.fill();label(ctx,imitation>.05?'正在复现动作':'观察机器人',robotX-55,249,imitation>.05?COLORS.yellow:COLORS.muted);
      if(imitation<.12){ctx.strokeStyle='rgba(95,199,199,.34)';ctx.beginPath();ctx.moveTo(robotX+7,eyeY);ctx.lineTo(602,112);ctx.lineTo(690,203);ctx.closePath();ctx.stroke()}
      const humanAlpha=Math.max(0,1-Math.max(0,p-.42)/.13);ctx.save();ctx.globalAlpha=humanAlpha;ctx.fillStyle='#d8c06d';ctx.beginPath();ctx.arc(660,99,29,0,Math.PI*2);ctx.fill();ctx.fillStyle='#9db9cc';ctx.fillRect(625,128,70,78);const arm=-.65+Math.sin(demo*Math.PI)*.22;ctx.save();ctx.translate(646,142);ctx.rotate(arm);ctx.fillStyle='#d8c06d';ctx.fillRect(0,-7,86,14);ctx.fillStyle='#6caeb4';ctx.fillRect(70,-19,34,30);ctx.restore();ctx.strokeStyle=COLORS.cyan;ctx.lineWidth=5;ctx.globalAlpha=humanAlpha*Math.max(0,Math.sin(demo*Math.PI));ctx.beginPath();ctx.moveTo(738,132);ctx.quadraticCurveTo(766,158,765,202);ctx.stroke();ctx.restore();
      ctx.strokeStyle='#809a72';ctx.lineWidth=4;ctx.strokeRect(744,183,55,34);ctx.fillStyle='rgba(95,199,199,.22)';ctx.fillRect(748,199,47,14);
      if(imitation>.02){ctx.save();ctx.translate(robotX+32,143);ctx.rotate(-.72+imitation*.42);ctx.fillStyle='#738872';ctx.fillRect(0,-7,82,14);ctx.fillStyle=COLORS.yellow;ctx.fillRect(67,-18,29,27);ctx.restore();ctx.fillStyle=COLORS.yellow;for(let i=0;i<5;i++){const fall=Math.max(0,imitation-.22)*90+i*8;ctx.beginPath();ctx.arc(robotX+111+i*3,152+fall%58,2.2,0,Math.PI*2);ctx.fill()}}
      ctx.fillStyle='rgba(95,199,199,.72)';ctx.fillRect(42,268,(w-84)*p,5);
      if(p>=1){ctx.fillStyle='rgba(0,0,0,.38)';ctx.fillRect(20,20,w-40,h-40);ctx.fillStyle=COLORS.yellow;ctx.fillRect(408,118,144,48);label(ctx,'Ⅱ  PAUSED',432,149,'#07100b')}else raf=requestAnimationFrame(render);
      if(p>=1&&!finished){finished=true;doneTimer=window.setTimeout(onComplete,260)}};raf=requestAnimationFrame(render);return()=>{cancelAnimationFrame(raf);window.clearTimeout(doneTimer)}},[]);
  return <canvas ref={clipRef} className="case-canvas surveillance-canvas" aria-label="监控动画：糯糯正常倒水，机器人观察后模仿倒入某种东西的动作，随后画面暂停"/>;
}

function LatentActionIntro({onComplete}:{onComplete:()=>void}){
  const correct='靠近 → 抓住 → 抬起';
  const options=[correct,'杯子自动瞬移','背景变暗导致杯子消失'];
  const [choice,setChoice]=useState('');
  const solved=choice===correct;
  const choose=(next:string)=>setChoice(next);
  return <section className={`latent-intro ${solved?'is-solved':''}`}>
    <div className="latent-kicker">EVIDENCE GAP · 动作缺口</div>
    <h3>两张定格画面之间，究竟发生了什么？</h3>
    <div className="freeze-comparison" aria-label="杯子被拿起前后的两张监控定格画面">
      <div className="freeze-frame frame-a"><small>FRAME A · 00:17:31</small><div className="freeze-table"/><span className="freeze-cup"/><b>杯子还在桌上</b></div>
      <div className="latent-gap" aria-live="polite">{solved?<span className="latent-token">z<sub>t</sub></span>:<strong>???</strong>}</div>
      <div className="freeze-frame frame-b"><small>FRAME B · 00:17:34</small><div className="freeze-table"/><span className="freeze-cup lifted"/><span className="freeze-hand"/><b>杯子已经被拿起</b></div>
    </div>
    <div className="latent-phebe"><Character name="phebe-entrance" alt="菲比冒头观察两张定格画面，随后拿出放大镜"/><div><small>菲比 · 调查搭档</small><p>“我们看见了结果。但中间发生的动作呢？”</p></div></div>
    <div className="latent-choice-area"><p>从三张动作卡中，选择最合理的解释：</p><div className="latent-options">{options.map((option,index)=><button key={option} className={choice===option?(option===correct?'selected correct':'selected reconsider'):''} onClick={()=>choose(option)}><span>0{index+1}</span>{option}</button>)}</div></div>
    {choice&&!solved&&<div className="latent-retry" role="status">这个猜法很合理，但它还没有解释杯子的位置为何改变。菲比把录像倒回去了——再想想？</div>}
    {solved&&<div className="latent-reveal" role="status">
      <small>中间变量已显影</small><h4>Latent Action / 潜在动作表示</h4>
      <p>没有真实控制信号时，模型尝试从画面变化中，推断“中间发生了什么动作”。</p>
      <div className="latent-mini-flow" aria-label="Frame A 经过潜在动作表示得到 Frame B"><span>FRAME A</span><i>→</i><b>z · LATENT ACTION</b><i>→</i><span>FRAME B</span></div>
      <button className="latent-continue" onClick={onComplete}>进入正式判断 →</button>
    </div>}
  </section>;
}

const semanticTrials = [
  { id:'pick', label:'Pick', prompt:'手靠近杯子，夹爪闭合，杯子离开桌面。' },
  { id:'place', label:'Place', prompt:'夹爪把杯子降到桌面，然后松开。' },
  { id:'pour', label:'Pour', prompt:'容器在杯口上方倾斜，内容物流入杯中。' },
  { id:'up', label:'Move Up', prompt:'机械臂保持抓取，沿竖直方向向上移动。' }
];

function ActionGlyph({kind}:{kind:string}) {
  return <div className={`action-glyph action-${kind}`} aria-hidden="true">
    <span className="glyph-table"/><span className="glyph-cup"/><span className="glyph-hand"/><span className="glyph-stream"/><i/>
  </div>;
}

function CountUp({value,decimals=0,suffix}:{value:number;decimals?:number;suffix:string}) {
  const [shown,setShown]=useState(0);
  useEffect(()=>{
    const reduce=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if(reduce){setShown(value);return;}
    let frame=0; const start=performance.now();
    const tick=(now:number)=>{const t=Math.min(1,(now-start)/900);setShown(value*(1-Math.pow(1-t,3)));if(t<1)frame=requestAnimationFrame(tick)};
    frame=requestAnimationFrame(tick); return()=>cancelAnimationFrame(frame);
  },[value]);
  return <>{shown.toFixed(decimals)}{suffix}</>;
}

function LaryBenchInterrogation({onComplete}:{onComplete:()=>void}) {
  const [phase,setPhase]=useState<'briefing'|'semantic'|'semantic-summary'|'control'|'control-summary'|'report'>('briefing');
  const [trial,setTrial]=useState(0);
  const [semanticMessage,setSemanticMessage]=useState('看动作过程，不要只盯最后一帧。');
  const [offset,setOffset]=useState(54);
  const [dragging,setDragging]=useState(false);
  const [controlTried,setControlTried]=useState(false);
  const current=semanticTrials[Math.min(trial,semanticTrials.length-1)];
  const mse=Math.pow(offset/54,2)*0.81;
  const aligned=Math.abs(offset)<=7;
  const chooseAction=(label:string)=>{
    if(label!==current.label){setSemanticMessage('动作名和这段运动还没对上。菲比把片段倒回去了，再观察物体怎样移动。');return;}
    if(trial===semanticTrials.length-1){setSemanticMessage('四段动作都被正确读出。语义审讯通过。');setTimeout(()=>setPhase('semantic-summary'),420);}
    else {setTrial(trial+1);setSemanticMessage('标签吻合。下一段录像已送达。');}
  };
  const updateOffset=(clientY:number,svg:SVGSVGElement)=>{
    const box=svg.getBoundingClientRect(); const y=(clientY-box.top)/box.height*180;
    setOffset(Math.max(-58,Math.min(58,y-90)));setControlTried(true);
  };
  return <section className={`lary-interrogation phase-${phase}`} aria-label="LARYBench 动作表示能力测试">
    <div className="interrogation-light" aria-hidden="true"/>
    <header className="interrogation-head"><span>ACTION INTERROGATION ROOM</span><h3>LARYBench：动作表示能力测试</h3><p>{phase==='briefing'?'菲比决定把机器人的动作表示请进审讯室。先考试，定义稍后再说。':phase==='semantic'?'考试 A · 先看表示能不能说清“做什么”。':phase==='semantic-summary'?'考试 A 完成 · 先核对第一份口供。':phase==='control'?'考试 B · 再看表示能不能交代“怎么做”。':phase==='control-summary'?'考试 B 完成 · 再核对第二份口供。':'两份口供已核对。现在给这套测试正式归档。'}</p></header>
    {phase==='briefing'&&<div className="interrogation-briefing"><Character name="phebe-investigate" alt="菲比在聚光灯下准备测试机器人的动作表示"/><div><small>菲比 · 主审搭档</small><p>“会重建画面，只能证明它会补画面。动作表示到底藏了什么？我们给它来一次正式测试。”</p><button onClick={()=>{window.dispatchEvent(new CustomEvent('lary-interrogation-light'));setPhase('semantic')}}>打开审讯灯 →</button></div></div>}
    {phase==='semantic'&&<div className="exam-panel semantic-exam">
      <div className="exam-label"><b>考试 A</b><span>WHAT TO DO</span><em>{trial+1} / {semanticTrials.length}</em></div>
      <div className="semantic-stage"><div className="clip-screen"><span>CLIP 0{trial+1}</span><ActionGlyph kind={current.id}/><p>{current.prompt}</p></div><div className="semantic-answer"><small>这段表示对应哪个动作？</small><div>{semanticTrials.map(item=><button key={item.label} onClick={()=>chooseAction(item.label)}>{item.label}</button>)}</div><p>{semanticMessage}</p></div></div>
      <aside><b>先体验，再解释</b><p>如果 latent representation 真的包含动作语义，分类器就应该能从它里面解码出 Pick、Place、Pour 等动作类别。</p></aside>
    </div>}
    {phase==='semantic-summary'&&<div className="exam-summary">
      <Character name="phebe-confident" alt="菲比自信地总结第一场动作语义考试"/>
      <div><small>菲比 · 考试 A 总结</small><h4>“第一场问：你知道自己在干什么吗？”</h4><p>Pick、Place、Pour、Move Up 是离散的动作语义。如果潜在表示能让分类器稳定读出这些类别，它至少保留了“做什么”的信息。</p><button onClick={()=>setPhase('control')}>进入考试 B：HOW TO DO →</button></div>
    </div>}
    {phase==='control'&&<div className="exam-panel control-exam">
      <div className="exam-label"><b>考试 B</b><span>HOW TO DO</span><em>{aligned?'轨迹已对齐':'拖动蓝色轨迹'}</em></div>
      <div className="trajectory-stage">
        <svg viewBox="0 0 640 180" role="img" aria-label="拖动预测轨迹，使它与真实轨迹重合" onPointerDown={e=>{setDragging(true);e.currentTarget.setPointerCapture(e.pointerId);updateOffset(e.clientY,e.currentTarget)}} onPointerMove={e=>{if(dragging)updateOffset(e.clientY,e.currentTarget)}} onPointerUp={e=>{setDragging(false);e.currentTarget.releasePointerCapture(e.pointerId)}}>
          <defs><filter id="traceGlow"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
          <path className="trajectory-grid" d="M20 45H620M20 90H620M20 135H620M100 20V160M220 20V160M340 20V160M460 20V160M580 20V160"/>
          <path className="true-trace" d="M44 132 C145 26 246 42 330 92 S500 156 596 48"/>
          <g transform={`translate(0 ${offset})`}><path className="prediction-hit" d="M44 132 C145 26 246 42 330 92 S500 156 596 48"/><path className="prediction-trace" filter="url(#traceGlow)" d="M44 132 C145 26 246 42 330 92 S500 156 596 48"/><circle className="drag-handle" cx="330" cy="92" r="13"/></g>
        </svg>
        <div className="trajectory-legend"><span className="truth">真实轨迹</span><span className="prediction">预测轨迹 · 可拖动</span></div>
        <label className="trajectory-fine"><span>精调预测轨迹</span><input aria-label="精调预测轨迹" type="range" min="-58" max="58" value={offset} onChange={e=>{setOffset(+e.target.value);setControlTried(true)}}/></label>
      </div>
      <div className={`mse-readout ${aligned?'is-aligned':''}`}><small>MSE · 轨迹距离分数</small><strong>{mse.toFixed(2)}</strong><p>{!controlTried?'先拖动蓝色预测轨迹。':aligned?'两条轨迹几乎重合，距离分数降下来了。':'两条轨迹差得越远，分数越惨。'}</p></div>
      {aligned&&<button className="exam-continue" onClick={()=>setPhase('control-summary')}>提交轨迹，听菲比总结 →</button>}
    </div>}
    {phase==='control-summary'&&<div className="exam-summary">
      <Character name="phebe-confident" alt="菲比自信地总结第二场控制轨迹考试"/>
      <div><small>菲比 · 考试 B 总结</small><h4>“第二场问：很好，那你做给我看。”</h4><p>只认得动作名还不够。预测轨迹与真实轨迹越接近，说明潜在表示越能保留方向、姿态等“怎么做”的连续控制信息。</p><button onClick={()=>setPhase('report')}>查看整体审讯报告 →</button></div>
    </div>}
    {phase==='report'&&<div className="benchmark-report">
      <div className="interrogation-verdict"><Character name="phebe-investigate" alt="菲比将两场考试合并成完整的动作表示评测"/><div><small>菲比 · 整体总结</small><p>单独通过一场还不能结案。LARYBench 把“做什么”的语义与“怎么做”的控制拆开评测，再把两份证据放回同一张案情图。</p></div></div>
      <div className="benchmark-columns">
        <article><span>WHAT TO DO</span><div className="classification-demo"><i>Pick</i><i>Place</i><i>Pour</i></div><h4>Semantic Action Classification</h4><p>从潜在表示中读出离散动作语义；分类 Accuracy 越高，说明动作类别越容易被识别。</p></article>
        <article><span>HOW TO DO</span><div className="regression-demo"><svg viewBox="0 0 210 64"><path d="M8 49 C55 4 112 62 202 14"/><path d="M8 52 C55 7 112 59 202 17"/></svg></div><h4>Low-Level Control Regression</h4><p>从潜在表示中恢复连续控制轨迹；回归 MSE 越低，说明精细动作信息越容易被还原。</p></article>
      </div>
      <div className="benchmark-scale" aria-label="LARYBench 数据规模"><article><strong><CountUp value={1.2} decimals={1} suffix="M+"/></strong><span>videos</span></article><article><strong><CountUp value={620} suffix="K+"/></strong><span>image pairs</span></article><article><strong><CountUp value={595} suffix="K"/></strong><span>trajectories</span></article><article><strong><CountUp value={151} suffix=""/></strong><span>actions</span></article><article><strong><CountUp value={11} suffix=""/></strong><span>robotic embodiments</span></article></div>
      <div className="benchmark-next"><Character name="phebe-investigate" alt="菲比指向潜在动作表示的下一条问题"/><div><small>菲比 · 下一步调查</small><p>审讯工具已经准备好。但在正式评分前，我们还缺被审讯的对象：没有真实动作标签，模型该怎样留下可供这两场考试读取的中间表示？</p></div><button onClick={onComplete}>继续探索 →</button></div>
    </div>}
  </section>;
}

type BetChoice = 'Embodied LAM' | 'General Vision Encoder' | 'General LAM';

function ModelLineupCard({kind,title,badge,models,quote}:{kind:string;title:string;badge:string;models:string[];quote:string}) {
  return <article className={`suspect-card suspect-${kind}`}>
    <div className="suspect-portrait" aria-hidden="true"><span/><i/><b/></div>
    <small>{badge}</small><h4>{title}</h4>
    <div className="suspect-models">{models.map(model=><span key={model}>{model}</span>)}</div>
    <blockquote>“{quote}”</blockquote>
  </article>;
}

type AttentionModel = 'V-JEPA 2' | 'DINOv3' | 'Embodied LAM';

function AttentionScene({model}:{model:AttentionModel|null}) {
  const spots=model==='V-JEPA 2'?['contact strong','hand focused','cup soft']:model==='DINOv3'?['contact strong','hand soft','cup soft','object faint']:model==='Embodied LAM'?['contact faint','hand faint','cup soft','object strong','wall soft']:[];
  return <div className={`attention-scene ${model?'heatmap-on':''}`} role="img" aria-label={model?`${model} 的概念注意力模拟图`:'手、杯子、桌面和背景物体组成的简化场景'}>
    <span className="scene-wall-line"/><span className="scene-plant"><i/><i/><i/></span><span className="scene-frame"/><span className="scene-table"/><span className="scene-bowl"/><span className="scene-hand"><i/></span>
    {spots.map((spot,index)=><b key={`${spot}-${index}`} className={`heat-spot ${spot}`}/>) }
    {model&&<small>{model} · TEMPORAL POOLER CROSS-ATTENTION 模拟</small>}
  </div>;
}

function EvidenceExperiment({kind}:{kind:number}) {
  if(kind===0)return <div className="micro-experiment world-pretrain" aria-label="扫描多样公开视频场景形成视觉先验的动画"><div className="world-mosaic">{['人','杯','门','车','手'].map(x=><span key={x}>{x}</span>)}<i/></div><p>观察对象越多样，可复用的手—物体关系越丰富。</p></div>;
  if(kind===1)return <div className="micro-experiment abstract-motion" aria-label="像素噪声消退而动作结构保留的动画"><div className="pixel-field">{Array.from({length:20},(_,i)=><i key={i}/>)}</div><div className="motion-trace"><span>杯</span><b>→</b><span>杯 ↑</span></div><p>外观细节可以变化，“拿起”这一结构仍能保持。</p></div>;
  return <div className="micro-experiment generalization-test" aria-label="专用训练在题型变化时泛化受限的动画"><div><span>机器人题</span><span>机器人题</span><span>新场景</span></div><i/><p>训练题过窄时，遇到没见过的对象和场景更容易卡住。</p></div>;
}

function PostBetInvestigation({question,onComplete}:{question:string;onComplete:()=>void}) {
  const [page,setPage]=useState<'gate'|'attention'|'evidence'>('gate');
  const [answer,setAnswer]=useState('');
  const [heatmap,setHeatmap]=useState(false);
  const [model,setModel]=useState<AttentionModel>('V-JEPA 2');
  const [opened,setOpened]=useState<number[]>([]);
  const correct=answer==='手与杯子接触处';
  const cards=[
    {title:'证据 1 · 看得更多',body:'大规模通用视觉预训练已经包含丰富的动作相关知识。'},
    {title:'证据 2 · 抽象表示更接近动作',body:'模型不必记住每个像素，更需要抓住“什么发生了变化”。'},
    {title:'证据 3 · 过早专业化限制泛化',body:'机器人专用数据的规模与多样性不足，换场景时更容易失去优势。'}
  ];
  const toggle=(index:number)=>setOpened(old=>old.includes(index)?old.filter(x=>x!==index):[...old,index]);
  if(page==='gate')return <div className="puzzle-next postbet-gate"><Character name="phebe-investigate" alt="菲比指向下一条注意力线索"/><div><small>菲比 · 下一个问题</small><p>{question}</p></div><button onClick={()=>setPage('attention')}>继续探索 →</button></div>;
  return <section className="postbet-investigation">
    <header><span>{page==='attention'?'FOLLOW THE GAZE · 追踪视线':'WHY VISION WINS · 解释反直觉结果'}</span><h3>{page==='attention'?'动作线索究竟藏在哪里？':'通用视觉模型为什么会领先？'}</h3></header>
    {page==='attention'&&<>
      <div className="attention-question"><Character name="phebe-investigate" alt="菲比在简化场景旁询问观众应该关注哪里"/><div><small>菲比 · 现场追问</small><p>“如果你真正在理解动作，你最应该看哪里？”</p></div></div>
      <AttentionScene model={heatmap?model:null}/>
      {!heatmap&&<div className="attention-options">{['整幅画面的每个像素','手与杯子接触处','背景中最显眼的物体'].map(option=><button key={option} className={answer===option?(correct?'correct':'reconsider'):''} onClick={()=>setAnswer(option)}>{option}</button>)}</div>}
      {answer&&!correct&&!heatmap&&<div className="attention-feedback retry">这个观察点很显眼，但它还没有解释动作是怎样作用到物体上的。再看看手与杯子的关系？</div>}
      {correct&&!heatmap&&<div className="attention-feedback success"><b>判断成立。</b> 手与物体的交互位置，通常比静止背景更直接地暴露动作变化。<button onClick={()=>setHeatmap(true)}>复现全貌 →</button></div>}
      {heatmap&&<div className="heatmap-lab">
        <div className="model-tabs" aria-label="切换模型注意力图">{(['V-JEPA 2','DINOv3','Embodied LAM'] as AttentionModel[]).map(item=><button key={item} className={model===item?'active':''} onClick={()=>setModel(item)}>{item}</button>)}</div>
        <p className="simulation-note">概念模拟：对应论文对 temporal pooler cross-attention 的诊断，用于比较“集中”与“分散”，并非原始热图复刻，也不是因果证明。</p>
        <div className="attention-legend"><span>低关注</span><i/><b>高关注</b></div>
        <div className="attention-summary"><Character name="phebe-confident" alt="菲比总结动作注意力分布"/><div><small>菲比 · 视线复盘</small><p>“优秀的动作理解，不是看得最多。”</p><p>“而是知道哪里正在发生真正重要的变化。”</p></div></div>
        <button className="postbet-primary" onClick={()=>setPage('evidence')}>探查通用视觉模型更强的原因 →</button>
      </div>}
    </>}
    {page==='evidence'&&<>
      <p className="evidence-lead">三份解释都只是待检验的机制线索。逐张打开小实验，看看它们各自解释了什么。</p>
      <div className="why-evidence-grid">{cards.map((card,index)=>{const active=opened.includes(index);return <article key={card.title} className={active?'opened':''}><button onClick={()=>toggle(index)} aria-expanded={active}><span>0{index+1}</span><h4>{card.title}</h4><p>{card.body}</p><b>{active?'收起实验 −':'启动实验 +'}</b></button>{active&&<EvidenceExperiment kind={index}/>}</article>})}</div>
      {opened.length===3?<div className="postbet-final"><Character name="phebe-investigate" alt="菲比提出潜在动作模型仍然有什么价值"/><div><small>菲比 · 下一步调查</small><h4>“所以 LAM 还有用吗？”</h4><p>通用视觉赢下这一轮，不等于潜在动作模型从此退场。下一题，我们检查它还可能保留什么独特价值。</p></div><button onClick={onComplete}>继续探索 →</button></div>:<div className="evidence-progress">已检查 {opened.length} / 3 份机制线索</div>}
    </>}
  </section>;
}

function StrideRunIntro({onComplete}:{onComplete:()=>void}) {
  const [step,setStep]=useState(0);
  const strides=[5,15,30];
  const stride=strides[step];
  const complete=step===2;
  const progress=[.12,.55,1][step];
  const flux=[0.04,0.57,0.62][step];
  const generalLam=[0.25,0.20,0.26][step];
  return <section className={`stride-intro ${complete?'at-climax':''}`} aria-label="跨时间跨度动作表示稳定性测试">
    <CaseDock/>
    <header><span>LONG-RANGE TEST · 长跨度追踪</span><h3>LAM 还有价值吗？换一把尺子再测一次</h3></header>
    <div className="stride-phebe"><Character name="phebe-investigate" alt="菲比拿出一把标有不同时间跨度的测试尺"/><div><small>菲比 · 追问</small><p>“有没有什么其他的指标，能说明模型是否懂得动作？”</p></div></div>
    <div className="stride-chart-wrap">
      <div className="stride-chart-head"><b>VLABench · 跨 stride 控制回归</b><span>MSE ↓ 越低越好</span></div>
      <svg viewBox="0 0 700 300" role="img" aria-label={`当前 stride 为 ${stride}，FLUX.2-dev 的 MSE 为 ${flux.toFixed(2)}，LAPA-DINOv3 的 MSE 为 ${generalLam.toFixed(2)}`}>
        <path className="stride-grid" d="M70 48H660M70 116H660M70 184H660M70 252H660M90 32V264M360 32V264M630 32V264"/>
        <text x="16" y="54">高</text><text x="16" y="251">低</text>
        <path className="pixel-error-curve" style={{strokeDashoffset:520*(1-progress)}} d="M90 236 C185 228 267 205 360 178 S532 97 630 48"/>
        <path className="lam-error-curve" style={{strokeDashoffset:520*(1-progress)}} d="M90 192 C190 188 267 178 360 174 S530 160 630 151"/>
       {[0,1,2].map((index)=><React.Fragment key={index}><circle className={`pixel-point ${index===2?'final':''} ${index<=step?'seen':''}`} cx={[90,360,630][index]} cy={[236,178,48][index]} r={index===2?10:7}/><circle className={`lam-point ${index<=step?'seen':''}`} cx={[90,360,630][index]} cy={[192,174,151][index]} r="7"/></React.Fragment>)}
        <text className="axis-label" x="77" y="287">5</text><text className="axis-label" x="343" y="287">15</text><text className="axis-label" x="612" y="287">30</text>
     </svg>
      <div className="stride-legend"><span className="pixel">FLUX.2-dev · Pixel Encoder</span><span className="lam">LAPA-DINOv3 · General LAM</span></div>
      <div className="stride-status"><article><small>FLUX.2-dev</small><b>MSE {flux.toFixed(2)} · {step===0?'短距很低':step===1?'明显爬升':'长距快速冲高'}</b></article><article><small>LAPA-DINOv3</small><b>MSE {generalLam.toFixed(2)} · {step===0?'起点更高':step===1?'变化温和':'长距相对稳定'}</b></article></div>
    </div>
    <label className="stride-control"><span>stride：<b>{stride}</b></span><input type="range" min="0" max="2" step="1" value={step} onChange={e=>setStep(+e.target.value)} aria-label="调整 stride 时间跨度"/><div><i>5</i><i>15</i><i>30</i></div></label>
    <p className="stride-note"><b>stride</b> 表示两次观察之间相隔的时间步数。这里展示论文 VLABench 消融中的代表性模型原值；不同模型的曲线并不完全相同，不能把这组对比外推成所有 Pixel Encoder 与所有 LAM 的定律。</p>
    {complete?<div className="stride-climax"><Character name="phebe-confident" alt="菲比看见长跨度结果后露出恍然大悟的表情"/><div><small>菲比 · 长跑复盘</small><p>“FLUX.2-dev 从 0.04 升到 0.62；LAPA-DINOv3 则从 0.25 到 0.26。”</p><p>“LAM 的这项价值是跨度相对稳定——但稳定，不等于绝对误差最低。”</p></div><button onClick={onComplete}>进入正式判断 →</button></div>:<div className="stride-prompt">把滑杆推向 30，同时观察绝对误差与变化幅度。</div>}
  </section>;
}

const finalReviewLayers = [
  {
    key:'attention', label:'第一层 · 注意力热力图', title:'看向哪里，就等于理解了吗？',
    question:'热力图集中在手与物体交互处，最稳妥的判断是什么？',
    options:['A. 已经证明模型拥有因果理解','B. 读出器更关注动作相关的交互线索','C. 背景像素从此完全没有价值'],
    correct:'B. 读出器更关注动作相关的交互线索',
    feedback:'热力图是定位注意区域的诊断证据，但不能单独升级为因果证明。'
  },
  {
    key:'stride', label:'第二层 · 跨 stride 测试', title:'短跑冠军，也能跑完长程吗？',
    question:'比较 stride=5、15、30 的控制回归误差，应该重点判断什么？',
    options:['A. 只看 stride=5 的最低误差','B. 只看最长 stride 的单个数字','C. 同时看绝对误差与跨跨度稳定性'],
    correct:'C. 同时看绝对误差与跨跨度稳定性',
    feedback:'短跨度成绩回答“眼前做得准不准”，误差随 stride 的变化回答“动作信息能保持多久”。'
  },
  {
    key:'parameter', label:'第三层 · 参数与码本', title:'词典越厚，就一定越懂动作吗？',
    question:'码本容量、利用率和下游性能之间，哪种结论最可靠？',
    options:['A. 参数越大，动作理解必然越强','B. 利用率越高，所有任务一定越好','C. 三者并非单调关系，需要联合验证'],
    correct:'C. 三者并非单调关系，需要联合验证',
    feedback:'容量只是“有多少页”，利用率是“翻过多少页”，最终还要看分类与回归是否真的受益。'
  }
];

function FinalReviewVisual({kind}:{kind:string}) {
  if(kind==='attention')return <div className="final-review-visual heat-review" aria-label="注意力集中在手与杯子接触区域的示意图"><span className="review-table"/><span className="review-cup"/><span className="review-hand"/><i/></div>;
  if(kind==='stride')return <div className="final-review-visual stride-review" aria-label="像素表示误差冲高而潜在表示保持稳定的曲线示意"><svg viewBox="0 0 360 130"><path className="mini-grid" d="M24 25H340M24 65H340M24 105H340"/><path className="mini-pixel" d="M30 105 C130 100 210 84 330 18"/><path className="mini-lam" d="M30 76 C140 73 235 69 330 61"/></svg><span>5</span><span>15</span><span>30</span></div>;
  return <div className="final-review-visual parameter-review" aria-label="大码本中只有部分参数单元被使用的示意图"><div>{Array.from({length:24},(_,i)=><i key={i} className={i<7||i===12||i===18?'used':''}/>)}</div><p><b>64</b> 个候选码字 ≠ 64 个都被有效使用</p></div>;
}

function FinalReviewQuiz({clue,collected,addClue,puzzle}:{clue:string;collected:boolean;addClue:(clue:string)=>void;puzzle:Puzzle}) {
  const [step,setStep]=useState(0);
  const [selected,setSelected]=useState('');
  const [finished,setFinished]=useState(false);
  const [caseClosed,setCaseClosed]=useState(false);
  const layer=finalReviewLayers[step];
  const correct=selected===layer.correct;
  const advance=()=>{if(step===finalReviewLayers.length-1)setFinished(true);else{setStep(old=>old+1);setSelected('')}};
  const closeCase=()=>{window.dispatchEvent(new CustomEvent('lary-truth-revealed'));setCaseClosed(true)};
  return <div className="case-widget final-review-shell">
    <CaseDock/>
    <div className="final-review-progress" aria-label="结案复盘进度">{finalReviewLayers.map((item,index)=><span key={item.key} className={index<step||finished?'done':index===step&&!finished?'active':''}><i>{index+1}</i>{item.key==='attention'?'热力图':item.key==='stride'?'Stride':'参数'}</span>)}</div>
    {!finished&&!caseClosed&&<section className="final-review-question">
      <header><span>{layer.label}</span><h3>{layer.title}</h3><p>{layer.question}</p></header>
      <FinalReviewVisual kind={layer.key}/>
      <div className="final-review-options">{layer.options.map(option=><button key={option} className={selected===option?(correct?'correct':'reconsider'):''} onClick={()=>setSelected(option)}>{option}</button>)}</div>
      {selected&&<div className={`final-review-feedback ${correct?'success':'retry'}`}>{correct?<><b>这一层证据成立。</b><p>{layer.feedback}</p><button onClick={advance}>{step===2?'汇总三层证据 →':'进入下一层 →'}</button></>:<><b>这个猜法很合理，但证据还撑不起这么强的结论。</b><p>把“诊断线索”“跨跨度趋势”和“参数规模”与真正的任务表现分开，再试一次。</p></>}</div>}
    </section>}
    {finished&&!caseClosed&&<section className="final-verdict">
      <Character name="phebe-confident" alt="菲比在结案前汇总三层实验结论"/>
      <div><small>菲比 · 最终实验总结</small><h3>三层证据已经对齐。</h3><p>“在 LARYBench 的数据与读出协议下，现成通用视觉编码器在语义分类和平均控制回归上领先；部分 LAM 跨 stride 较稳，但绝对误差仍须一起比较。temporal pooler 的注意力、码本容量或参数规模中的任何一项，都不能单独证明动作理解。”</p><p className="verdict-boundary">这里的“懂”指既定任务中可解码的动作信息，不是对因果理解或普遍机器人智能的证明。</p><button onClick={closeCase}>完成案件 →</button></div>
    </section>}
    {caseClosed&&<section className="final-case-closed">
      <div className="case-ending"><div className="ending-cast"><Character name="nuonuo-ending" alt="糯糯苏醒后发现零食被拿走，露出生气表情"/><Character name="phebe-ending-happy" alt="菲比举着证物薯片开心大笑"/></div><div><b>现场有新证据。</b><p>小瓶只是虚构昏睡剂，糯糯安然醒来。菲比刚举起“证物”薯片，糯糯的表情就从迷糊切换成了控诉。</p><p className="typewriter-note">案件解决，零食作为证物全部没收。——侦探菲比</p></div></div>
      <div className="puzzle-tools"><button className="clue-button" onClick={()=>addClue(clue)}>{collected?'✓ 线索已加入档案库':'＋ 收集最终线索加入档案库'}</button><TechEvidence scene="mod-10-1"/></div>
      {collected&&<div className="puzzle-next"><Character name="phebe-investigate" alt="菲比邀请观众进入最终档案复盘"/><div><small>菲比 · 案件已解决</small><p>{puzzle.next}</p></div><button onClick={()=>window.dispatchEvent(new CustomEvent('lary-next-slide'))}>查看案件复盘 →</button></div>}
    </section>}
  </div>;
}

function Mod7Showdown({clue,collected,addClue,puzzle}:{clue:string;collected:boolean;addClue:(clue:string)=>void;puzzle:Puzzle}) {
  const [phase,setPhase]=useState<'intro'|'lineup'|'countdown'|'blackout'|'reveal'>('intro');
  const [bet,setBet]=useState<BetChoice|null>(null);
  const [count,setCount]=useState(3);
  const audioRef=useRef<AudioContext|null>(null);
  const revealed=phase==='reveal';
  const tickClock=()=>{
    const ctx=audioRef.current; if(!ctx)return;
    const now=ctx.currentTime; const osc=ctx.createOscillator(); const gain=ctx.createGain();
    osc.type='square';osc.frequency.setValueAtTime(920,now);osc.frequency.exponentialRampToValueAtTime(420,now+.045);
    gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(.055,now+.004);gain.gain.exponentialRampToValueAtTime(.0001,now+.07);
    osc.connect(gain);gain.connect(ctx.destination);osc.start(now);osc.stop(now+.075);
  };
  const startCountdown=(choice:BetChoice)=>{
    setBet(choice);setCount(3);
    try { if(!audioRef.current)audioRef.current=new AudioContext();void audioRef.current.resume(); } catch { audioRef.current=null; }
    window.dispatchEvent(new CustomEvent('lary-bgm-intensity',{detail:{level:1}}));
    setPhase('countdown');
  };
  useEffect(()=>{
    if(phase!=='countdown')return;
    if(count<=0){setPhase('blackout');return;}
    tickClock();const timer=window.setTimeout(()=>setCount(old=>old-1),820);return()=>window.clearTimeout(timer);
  },[phase,count]);
  useEffect(()=>{if(phase!=='blackout')return;window.dispatchEvent(new CustomEvent('lary-bgm-blackout',{detail:{duration:620}}));const timer=window.setTimeout(()=>{setPhase('reveal');window.dispatchEvent(new CustomEvent('lary-bgm-intensity',{detail:{level:.45}}));window.dispatchEvent(new CustomEvent('lary-ranking-sequence'))},620);return()=>window.clearTimeout(timer)},[phase]);
  useEffect(()=>()=>{void audioRef.current?.close()},[]);
  const feedback=bet==='General Vision Encoder'?'侦探直觉不错。你押中了领先的模型组；榜单再用 V-JEPA 2 与 DINOv3 的具体成绩展示组内表现。':'这个猜法很合理，但证据似乎不支持。论文作者大概也知道你会这样押。';
  return <div className="case-widget puzzle-shell mod7-shell">
    <CaseDock/>
    <div className="puzzle-progress" aria-label="谜题进度"><span className="active">01 下注</span><span className={revealed?'active':''}>02 揭榜</span><span className={collected?'active':''}>03 归档</span></div>
    <section className="betting-room">
      <div className="betting-question-head"><span>第七题 · 下注时刻</span><b>语义分类 · Attentive Probe</b></div>
      <h3>“谁才是真正懂动作的人？”</h3>
      {phase==='intro'&&<div className="betting-intro"><Character name="phebe-confident" alt="菲比拿着三份机器人动作表示档案邀请观众下注"/><div><small>菲比 · 调查搭档</small><p>“三组嫌疑人都说自己懂动作。履历挺漂亮——可成绩单还扣在桌下。你敢先押一个吗？”</p><button onClick={()=>setPhase('lineup')}>开始模型下注 →</button></div></div>}
      {(phase==='lineup'||phase==='countdown')&&<>
        <div className="suspect-lineup" aria-label="三组模型嫌疑人">
          <ModelLineupCard kind="embodied" badge="机器人专科生" title="Embodied LAM" models={['LAPA','UniVLA','villa-X']} quote="我们就是专门研究机器人动作的。"/>
          <ModelLineupCard kind="vision" badge="通用视觉观察员" title="General Vision Encoder" models={['DINOv3','V-JEPA 2']} quote="我只是看过很多世界。"/>
          <ModelLineupCard kind="general" badge="跨领域转学生" title="General LAM" models={['LAPA-MAGVIT2','LAPA-SigLIP2','LAPA-DINOv2','LAPA-DINOv3']} quote="理论我懂，实践也沾一点。"/>
        </div>
        <div className="betting-console"><p>三组嫌疑人中，你觉得哪一组的动作表示最容易被读出来？</p><div>{(['Embodied LAM','General Vision Encoder','General LAM'] as BetChoice[]).map(choice=><button key={choice} disabled={phase==='countdown'} className={bet===choice?'selected':''} onClick={()=>startCountdown(choice)}>{choice}</button>)}</div></div>
      </>}
      {phase==='countdown'&&<div className="countdown-overlay" role="status" aria-live="assertive"><div className="countdown-clock"><i/><span>{count}</span></div><p>封存下注 · 结果即将显影</p></div>}
      {phase==='blackout'&&<div className="betting-blackout" role="status"><span>证据灯熄灭</span><p>……排行榜正在显影……</p></div>}
      {phase==='reveal'&&<div className="betting-reveal">
        <div className="reveal-board"><header><span>SEMANTIC ACTION CLASSIFICATION</span><b>Accuracy ↑</b></header>
          <div className="reveal-row embodied"><label>Best Embodied · villa-X</label><div><i style={{'--score':'20.90%' } as React.CSSProperties}/></div><strong>20.90</strong></div>
          <div className="reveal-row general-lam"><label>Best General LAM · LAPA-DINOv2</label><div><i style={{'--score':'49.36%' } as React.CSSProperties}/></div><strong>49.36</strong></div>
          <div className="reveal-row dinov3"><label>DINOv3</label><div><i style={{'--score':'68.68%' } as React.CSSProperties}/></div><strong>68.68</strong></div>
          <div className="reveal-row vjepa"><label>V-JEPA 2</label><div><i style={{'--score':'76.62%' } as React.CSSProperties}/></div><strong>76.62</strong></div>
        </div>
        <div className="reveal-phebe"><Character name="phebe-confident" alt="菲比指向反直觉的模型排行榜"/><div><small>菲比 · 揭榜现场</small><h4>“结果有点不给面子。”</h4><p>我们以为专门学习机器人的模型会赢，但真正领先的是通用视觉编码器。</p><b>{feedback}</b></div></div>
        <section className="puzzle-resolution betting-resolution">
          <div className="phebe-summary"><span>菲</span><div><small>菲比的谜题总结</small><p>{puzzle.summary}</p></div></div>
          <div className="puzzle-tools"><button className="clue-button" onClick={()=>addClue(clue)}>{collected?'✓ 线索已加入档案库':'＋ 收集线索加入档案库'}</button><TechEvidence scene="mod-7-1"/></div>
          {collected&&<PostBetInvestigation question={puzzle.next} onComplete={()=>window.dispatchEvent(new CustomEvent('lary-next-slide'))}/>}
        </section>
      </div>}
    </section>
  </div>;
}

function CrimeSceneOpening({onMonitor}:{onMonitor:()=>void}) {
  const [recordFinished,setRecordFinished]=useState(false);
  useEffect(()=>{const timer=window.setTimeout(()=>setRecordFinished(true),6900);return()=>window.clearTimeout(timer)},[]);
  return <div className="opening-scene">
    <div className={`opening-visual staged-opening ${recordFinished?'record-finished':''}`}>
      <div className="opening-victim crime-room" aria-label="手电筒扫过昏暗档案室，依次照亮倒地的糯糯与空瓶">
        <span className="scene-stamp">现场记录 00:16:58</span>
        <img className="crime-victim" src={`${import.meta.env.BASE_URL}images/characters/nuonuo-crime-scene.png`} alt="糯糯仰面倒在地上，双眼呈叉形，嘴角有少量卡通白沫"/>
        <span className="mystery-bottle" aria-label="糯糯身旁的空瓶子"/><span className="flashlight-spot" aria-hidden="true"/><span className="film-grain" aria-hidden="true"/>
        {!recordFinished&&<span className="recording-status">● 正在扫描现场</span>}
      </div>
      {recordFinished&&<div className="opening-detective delayed-detective">
        <Character name="phebe-entrance" alt="现场记录结束后，菲比冒头观察并拿出放大镜"/>
        <div><small>菲比 · 调查搭档</small><h3>现场有点不对劲。</h3><p className="opening-first-line">“糯糯怎么倒在了这里？看药瓶，难道有人给它下药了？”</p><p className="opening-followup">糯糯家里有一个机器人，目前是唯一可能给糯糯下药的。但是那个机器人应该没有经过潜在动作模型的训练，他是怎样学会下药这一动作的呢？</p><p className="opening-question">这个问题不能靠猜。监控里也许藏着答案——要不要一起看看？</p><button onClick={onMonitor}>查看监控 →</button></div>
      </div>}
    </div>
  </div>;
}

function DualInterrogationIntro({onReady}:{onReady:()=>void}) {
  const [watched,setWatched]=useState(false);
  return <section className="concept-intro dual-interrogation-intro">
    <header><span>观察证物 · 两道审讯</span><h4>同一份潜在表示，将分别走进两间审讯室</h4></header>
    <div className="dual-exam-grid">
      <article className="semantic-exam"><div className="exam-screen"><span className="latent-evidence">z</span><i>→</i><div className="action-labels"><b>PICK</b><b>POUR</b><b>PLACE</b></div></div><h5>语义分类 · WHAT TO DO</h5><p>检查潜在表示能否被读成离散动作类别，也就是辨认“正在做什么”。</p></article>
      <article className="control-exam"><div className="exam-screen"><svg viewBox="0 0 320 150" aria-label="预测轨迹沿时间逐渐逼近真实控制轨迹"><path className="exam-target" d="M25 118 C82 20 156 132 292 34"/><path className="exam-prediction" d="M25 126 C90 56 172 126 292 48"/><circle className="exam-gripper" r="9"><animateMotion dur="3.6s" repeatCount="indefinite" path="M25 126 C90 56 172 126 292 48" keyTimes="0;0.62;1" keyPoints="0;1;1" calcMode="linear"/></circle></svg></div><h5>控制回归 · HOW TO DO</h5><p>检查潜在表示能否还原连续方向、姿态与夹爪状态，也就是辨认“具体怎么做”。</p></article>
    </div>
    <div className="concept-observation"><p>两幅动画回答的是不同层级的问题。先观察它们各自保留了什么，再决定应该怎样使用。</p><button onClick={()=>{setWatched(true);onReady()}}>{watched?'✓ 已完成观察':'完成观察，开始判断 →'}</button></div>
  </section>;
}

function ProbeIntro({onReady}:{onReady:()=>void}) {
  const [watched,setWatched]=useState(false);
  return <section className="concept-intro probe-intro">
    <header><span>证人演示 · PROBE</span><h4>把不同模型的“脑内笔记”交给同一个小型读出器</h4></header>
    <div className="probe-stage" aria-label="冻结不同编码器，用统一 attentive probe 读取动作类别信息的动画">
      <div className="probe-sources"><span>DINO<sub>z</sub></span><span>LAM<sub>z</sub></span><span>JEPA<sub>z</sub></span></div>
      <div className="probe-projector">维度对齐<i>→</i></div>
      <div className="probe-box"><small>FROZEN INPUT</small><b>Attentive Probe</b><em>只训练分类读出器</em></div>
      <div className="probe-output"><span>动作类别</span><span>Accuracy ↑</span></div>
      <i className="probe-scan" aria-hidden="true"/>
    </div>
    <p className="concept-caption">这是语义分类轨：上游表示被冻结，对齐后交给相同的 4 层 attentive probe，并训练 20 个 epoch。下一题的连续控制轨会改用统一的 MLP Action Expert；两者不是同一个读出器。</p>
    <div className="concept-observation"><p>注意：这里比较的重点，是表示里原本有多少动作信息能被同一工具读出来。</p><button onClick={()=>{setWatched(true);onReady()}}>{watched?'✓ 演示已记录':'记录演示，开始判断 →'}</button></div>
  </section>;
}

function MSETrajectoryLab({onReady}:{onReady:()=>void}) {
  const [frame,setFrame]=useState(0);
  const [playing,setPlaying]=useState(true);
  const [explored,setExplored]=useState(false);
  useEffect(()=>{if(!playing)return;const timer=window.setInterval(()=>setFrame(old=>old>=100?0:old+1),55);return()=>window.clearInterval(timer)},[playing]);
  const t=frame/100;
  const cubic=(p0:number,p1:number,p2:number,p3:number)=>Math.pow(1-t,3)*p0+3*Math.pow(1-t,2)*t*p1+3*(1-t)*t*t*p2+t*t*t*p3;
  const x=cubic(34,175,430,586);
  const targetY=cubic(176,42,42,176);
  const predictionY=cubic(188,91,82,212);
  const delta=Math.abs(predictionY-targetY);
  const squared=Math.round(delta*delta);
  const squaredAt=(q:number)=>{const cy=(p0:number,p1:number,p2:number,p3:number)=>Math.pow(1-q,3)*p0+3*Math.pow(1-q,2)*q*p1+3*(1-q)*q*q*p2+q*q*q*p3;const d=cy(188,91,82,212)-cy(176,42,42,176);return d*d};
  const runningMse=Array.from({length:frame+1},(_,index)=>squaredAt(index/100)).reduce((sum,value)=>sum+value,0)/(frame+1)/100;
  const move=(value:number)=>{setFrame(value);setPlaying(false);setExplored(true)};
  return <section className="concept-intro mse-lab">
    <header><span>可操作证物 · 轨迹尺</span><h4>摇动时间杆，停在任意一帧检查误差</h4></header>
    <div className="mse-screen">
      <div className="mse-readout"><span>当前帧 <b>{frame}</b></span><span>距离 Δ <b>{delta.toFixed(1)}</b></span><span>本帧 Δ² <b>{squared}</b></span><strong>截至此帧平均 MSE {runningMse.toFixed(2)}</strong></div>
      <svg viewBox="0 0 620 250" aria-label="真实轨迹、预测轨迹及当前帧平方误差关系图">
        <path className="mse-grid" d="M30 45H600M30 95H600M30 145H600M30 195H600"/>
        <path className="mse-target" d="M34 176 C175 42 430 42 586 176"/>
        <path className="mse-predicted" d="M34 188 C175 91 430 82 586 212"/>
        <line className="mse-error-line" x1={x} x2={x} y1={targetY} y2={predictionY}/>
        <circle className="mse-target-dot" cx={x} cy={targetY} r="8"/><circle className="mse-predicted-dot" cx={x} cy={predictionY} r="8"/>
        <text x="40" y="32">真实轨迹 a</text><text x="450" y="232">预测轨迹 â</text>
      </svg>
      <div className="mse-legend"><span className="truth">真实轨迹</span><span className="prediction">预测轨迹</span><span className="error">当前帧距离：先求差，再平方</span></div>
    </div>
    <div className="trajectory-joystick"><button onClick={()=>{setPlaying(v=>!v);setExplored(true)}}>{playing?'Ⅱ 停在这一帧':'▶ 继续播放'}</button><label><span>时间摇杆</span><input type="range" min="0" max="100" value={frame} onChange={e=>move(+e.target.value)} onPointerDown={()=>{setPlaying(false);setExplored(true)}}/></label></div>
    <p className="concept-caption">每一帧都计算预测动作 â 与真实动作 a 的差，再把平方误差跨样本取平均。上方是归一化二维教学示意，不是论文表格中的 MSE；论文数值来自各数据集的 7、12 或 16 自由度控制向量，不能与这里横向比较。</p>
    <div className="concept-observation"><p>{explored?'你已经亲手停过轨迹。现在判断哪种证据能说明连续控制信息被保留。':'拖动摇杆或按下暂停，观察橙色误差尺怎样随两条轨迹的距离变化。'}</p><button disabled={!explored} onClick={onReady}>{explored?'完成轨迹检查 →':'请先操作摇杆'}</button></div>
  </section>;
}

export function InvestigationWidget({scene}:{scene:Scene}){
  const isAnalogy=scene.startsWith('ana-')||scene.startsWith('hero'); const [state,setState]=useState<any>(()=>initialFor(scene)); const ref=useCanvas(scene,state,isAnalogy);
  if(isAnalogy)return <><canvas ref={ref} className="case-canvas" aria-label="夜间档案室动态线索"/>{scene==='hero-new'||scene.startsWith('ana-')?<CaseDock/>:null}</>;
  const puzzle=puzzles[scene];
  const {state:caseState,addClue}=useCase();
  const [hint,setHint]=useState(false);
  const [preludeReady,setPreludeReady]=useState(false);
  const [beginnerHint,setBeginnerHint]=useState(false);
  const [latentIntroReady,setLatentIntroReady]=useState(scene!=='mod-1-2');
  const [benchmarkDone,setBenchmarkDone]=useState(false);
  const [strideIntroReady,setStrideIntroReady]=useState(scene!=='mod-8-1');
  if(!puzzle)return <div className="case-widget"><canvas ref={ref} className="case-canvas case-main-canvas" aria-label="互动证据图"/></div>;
  if(scene==='mod-1-2'&&state.opening!=='puzzle')return <div className="case-widget opening-shell"><CaseDock/>{state.opening==='scene'?<CrimeSceneOpening onMonitor={()=>setState({...state,opening:'monitor'})}/>:<div className="monitor-scene"><div className="monitor-head"><span>{state.opening==='monitor-paused'?'Ⅱ PAUSED':'● REC'}</span><b>00:17 · 家庭监控</b></div><SurveillanceClip onComplete={()=>setState((old:any)=>({...old,opening:'monitor-paused'}))}/>{state.opening==='monitor-paused'?<div className="monitor-phebe"><Character name="phebe-entrance" alt="菲比冒头露出疑惑表情，随后拿出放大镜进入侦探状态"/><div><small>菲比 · 调查搭档</small><p>“等等……机器人观察人类的过程中，究竟学到了什么？”</p><button onClick={()=>setState({...state,opening:'puzzle'})}>带着问题继续调查 →</button></div></div>:<><p>先看糯糯的正常示范，再观察机器人如何复现相似动作。</p><div className="monitor-loading"><span/></div></>}</div>}</div>;
  if(scene==='mod-1-2'&&!latentIntroReady)return <div className="case-widget latent-intro-shell"><CaseDock/><LatentActionIntro onComplete={()=>setLatentIntroReady(true)}/></div>;
  if(scene==='mod-8-1'&&!strideIntroReady)return <div className="case-widget stride-intro-shell"><StrideRunIntro onComplete={()=>{setStrideIntroReady(true);setPreludeReady(true)}}/></div>;
  const selected=state.choice||'';
  const correct=selected===puzzle.correct;
  const clue=clues[scene];
  const collected=caseState.clues.includes(clue);
  if(scene==='mod-7-1')return <Mod7Showdown clue={clue} collected={collected} addClue={addClue} puzzle={puzzle}/>;
  if(scene==='mod-10-1')return <FinalReviewQuiz clue={clue} collected={collected} addClue={addClue} puzzle={puzzle}/>;
  const choose=(choice:string)=>{if(choice!==puzzle.correct)setBeginnerHint(true);setState({...state,choice,reveal:true,ready:true})};
  return <div className="case-widget puzzle-shell">
    <CaseDock/>
    <div className="puzzle-progress" aria-label="谜题进度"><span className="active">01 判断</span><span className={selected?'active':''}>02 验证</span><span className={collected?'active':''}>03 归档</span></div>
    <div className="puzzle-grid">
      <aside className={`puzzle-detective ${hint?'is-confident':''}`}>
        <Character name={hint?'phebe-confident':'phebe-investigate'} alt={hint?'菲比露出自信神态，举起放大镜提示你':'菲比拿着放大镜陪你推理'}/>
        <small>菲比 · 调查搭档</small>
        <p>{selected?'证据已经亮出来了。先用你自己的话解释一次，再看我的总结。':preludeReady?'中间证据已经接上。现在由你来作最终判断。':'先别急着下注。操作右边的证据图，把问题拆成几步。'}</p>
        {!selected&&<button className="hint-button" onClick={()=>setHint(!hint)}>{hint?'先自己想想':'问问菲比'}</button>}
        {hint&&!selected&&<p className="puzzle-hint">提示：{puzzle.hint[caseState.style]}</p>}
      </aside>
      <div className="puzzle-main">
        <div className="puzzle-question-head"><span>{styleNames[caseState.style]}谜题</span><b>先判断，再看证据</b></div>
        <h3>{puzzle.questions[caseState.style]}</h3>
        {scene==='mod-3-1'?<DualInterrogationIntro onReady={()=>setPreludeReady(true)}/>:scene==='mod-4-1'?<ProbeIntro onReady={()=>setPreludeReady(true)}/>:scene==='mod-5-1'?<MSETrajectoryLab onReady={()=>setPreludeReady(true)}/>:scene!=='mod-8-1'&&<PuzzlePreludePanel scene={scene} onReady={()=>setPreludeReady(true)} revealHint={beginnerHint} onMisstep={()=>setBeginnerHint(true)}/>}
        {preludeReady&&<div className="puzzle-answers" aria-label="选择你的最终答案">{puzzle.answers.map((answer,i)=><button key={answer} className={selected===answer?(correct?'selected correct':'selected reconsider'):''} onClick={()=>choose(answer)}><span>{String(i+1).padStart(2,'0')}</span>{answer}</button>)}</div>}
        {selected&&<div className={`puzzle-feedback ${correct?'correct':'reconsider'}`} role="status"><b>{correct?'回答正确。':'这个猜法很合理。'}</b><p>{correct?'你找到了当前证据最支持的判断。':'你刚好踩中了作者想排除的一种可能。看看证据，再决定要不要修正。'}</p></div>}
        {correct&&<section className="puzzle-resolution">
          <div className="phebe-summary"><span>菲</span><div><small>菲比的谜题总结</small><p>{puzzle.summary}</p></div></div>
          {scene==='mod-10-1'&&<div className="case-ending"><div className="ending-cast"><Character name="nuonuo-ending" alt="糯糯苏醒后发现零食被拿走，露出生气表情"/><Character name="phebe-ending-happy" alt="菲比举着证物薯片开心大笑"/></div><div><b>现场有新证据。</b><p>小瓶只是虚构昏睡剂，糯糯安然醒来。菲比刚举起“证物”薯片，糯糯的表情就从迷糊切换成了控诉。</p><p className="typewriter-note">案件解决，零食作为证物全部没收。——侦探菲比</p></div></div>}
          <div className="puzzle-tools"><button className="clue-button" onClick={()=>addClue(clue)}>{collected?'✓ 线索已加入档案库':'＋ 收集线索加入档案库'}</button><TechEvidence scene={scene}/></div>
          {collected&&scene==='mod-1-2'&&!benchmarkDone&&<LaryBenchInterrogation onComplete={()=>{setBenchmarkDone(true);window.dispatchEvent(new CustomEvent('lary-next-slide'))}}/>}
          {collected&&scene!=='mod-1-2'&&<div className="puzzle-next"><Character name="phebe-investigate" alt="菲比指向下一条线索"/><div><small>菲比 · 下一个问题</small><p>{puzzle.next}</p></div><button onClick={()=>window.dispatchEvent(new CustomEvent('lary-next-slide'))}>{scene==='mod-10-1'?'完成调查 →':'继续探索 →'}</button></div>}
        </section>}
      </div>
    </div>
  </div>;
}

export function CaseSharedWidget(){ return null; }
