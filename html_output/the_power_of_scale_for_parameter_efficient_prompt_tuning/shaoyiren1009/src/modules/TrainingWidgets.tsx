import {TrainScene,ScaleScene,InitializationScene,LengthScene} from './VisualLessons';
import { useState, type ReactNode } from 'react';
import { SceneCanvas, drawGarden, drawRobot, drawPrompt, drawTarget, C } from './GardenKit';

type Context = CanvasRenderingContext2D;
function line(ctx: Context, x1:number,y1:number,x2:number,y2:number,color:string=C.sage,width=2) { ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke(); }
function box(ctx:Context,x:number,y:number,w:number,h:number,color:string,active=false) { ctx.fillStyle=color;ctx.globalAlpha=.3;ctx.fillRect(x,y,w,h);ctx.globalAlpha=1;ctx.strokeStyle=active?C.ink:C.sage;ctx.lineWidth=active?3:1.5;ctx.strokeRect(x,y,w,h); }
function label(ctx:Context,text:string,x:number,y:number,color:string=C.ink) {ctx.fillStyle=color;ctx.font='19px sans-serif';ctx.fillText(text,x,y);}
function Chip({selected,onClick,children}:{selected:boolean;onClick:()=>void;children:ReactNode}) {return <button type="button" className={`trainer-button ${selected?'is-selected':''}`} aria-pressed={selected} onClick={onClick}>{children}</button>}

export function TrainWidget() {
  const [prompt,setPrompt]=useState(-1.5); const [step,setStep]=useState(0); const [part,setPart]=useState<'prompt'|'brain'>('prompt');
  const theta=1.25, x=.4, bias=-.3, eta=.4;
  const z=theta*(x+prompt)+bias, probability=1/(1+Math.exp(-z));
  const loss=-Math.log(probability), gradient=theta*(probability-1);
  const update=()=>{setPrompt(p=>p-eta*gradient);setStep(s=>s+1)};
  const reset=()=>{setPrompt(-1.5);setStep(0);setPart('prompt')};
  const select=(e:any)=>{const r=e.currentTarget.getBoundingClientRect();const px=(e.clientX-r.left)*1080/r.width;const py=(e.clientY-r.top)*280/r.height;if(py>65&&py<178&&px>470&&px<640)setPart('prompt');if(py>65&&py<178&&px>=640&&px<900)setPart('brain')};
  return <div className="experiment">
    <TrainScene prompt={prompt} part={part} onPart={setPart}/>
    <div className="trainer-controls" aria-label="检查模型结构">
      <Chip selected={part==='prompt'} onClick={()=>setPart('prompt')}>检查可训练提示</Chip><Chip selected={part==='brain'} onClick={()=>setPart('brain')}>检查冻结大脑</Chip>
    </div>
    <p className="trainer-feedback" aria-live="polite">{part==='prompt'?'输入端提示 Pₑ 是唯一可更新部分。梯度从目标损失穿过解码器、编码器，再抵达提示；输入文本 Xₑ 不更新。':'编码器与解码器都被冻结，参数 θ 不更新；仍需要前向运算与关于输入的反向计算。冻结权重并不等于切断梯度。'}</p>
    <p className="metric-line">Pₑ：p × e　＋　Xₑ：n × e　→　编码器输入：(p+n) × e　→　冻结编码器　→　冻结解码器　→　目标序列</p>
    <div className="trainer-output"><strong>真实可计算的一维 toy；不是 T5 或论文训练曲线。</strong><p>标注目标 y = 1；z = θ(x + P) + b；Pr(y=1) = sigmoid(z)；L = −log Pr(y=1)</p><p>θ = 1.25，x = 0.4，b = −0.3 始终固定。提示 P = {prompt.toFixed(4)}；概率 = {probability.toFixed(4)}；损失 = {loss.toFixed(4)}；∂L/∂P = {gradient.toFixed(4)}；更新次数 = {step}</p><p>下一步：P ← P − 0.4 × ∂L/∂P</p></div>
    <div className="trainer-controls"><button type="button" className="trainer-button" onClick={update}>更新提示一次</button><button type="button" className="trainer-button" onClick={reset}>重置提示</button></div>
    <p className="trainer-feedback" aria-live="polite">{step===0?'随机提示还未对齐目标，损失来自正确标签；只读大脑没有被改写。':`第 ${step} 次更新后，正类概率升高，损失下降。改变的是提示 P，核心权重 θ 仍为 1.25。`}</p>
    <p className="evidence-note">论文 §2（p2–3）：提示仅拼接在 T5 编码器输入前，不添加逐层或解码器前缀。§3（p4）：真实实验使用 LM-adapted T5.1.1、100-token 提示、类别标签初始化、交叉熵、Adafactor、学习率 0.3、batch 32、最多 30,000 步，并按开发集提前停止。这里的 toy 使用简单梯度下降，学习率 0.4。</p>
  </div>
}

const scales=['Small','Base','Large','XL','XXL'];
const scaleStatements=[
  'Small：轻量提示与模型调优仍有明显差距。机器人有通用能力，但这么少的任务参数还不能充分发挥它。',
  'Base：论文呈现的整体趋势开始缩小适配差距；这里不把图形距离解读为分数。',
  'Large：随着底座增长，提示调优继续接近模型调优。尺度与方法共同决定结果。',
  'XL：差距进一步缩小；“更接近”仍不等于每个任务都匹配。',
  'XXL（约 11B）：在本文 SuperGLUE 开发集聚合指标上，提示调优匹配强多任务模型调优基线。结论限于本文实验。'
];
export function ScaleWidget() {
  const [index,setIndex]=useState(0);
  return <div className="experiment"><ScaleScene index={index}/><div className="trainer-controls" aria-label="选择底座尺度">{scales.map((name,i)=><Chip key={name} selected={index===i} onClick={()=>setIndex(i)}>{name}</Chip>)}</div>
  <p className="trainer-feedback" aria-live="polite">{scaleStatements[index]}</p>
  <p className="trainer-output">观测镜中的距离是<strong>定性示意</strong>，没有精确数值刻度。五个尺度来自同一 T5.1.1 系列；不是重新训练你的机器人，而是在选择已交付的冻结底座。</p>
  <p className="evidence-note">p1 Figure 1、p4 §3.1：SuperGLUE 开发集聚合分数，越高越好；调优结果为 3 次运行均值及标准差。默认 100K 步 LM adaptation、100-token 提示、类别标签初始化。论文图未提供精确数据表，因此不生成伪造点值。图中的 GPT-3 对比属于跨模型对比，不能只归因于适配方法。</p></div>
}

const initializations=['随机','常见词表','类别标签'];
const initializationDetails=['每个提示元素采样自均匀分布 [−0.5, 0.5]。','从 5,000 个最常见词对应的嵌入中采样。','用输出类别名称的词嵌入初始化；多 token 名称取均值，不足的提示位置由常见词表补齐。'];
export function AblationWidget() {
  const [size,setSize]=useState<'Small'|'XXL'>('Small'); const [init,setInit]=useState(0);
  const feedback=size==='XXL'?'XXL：三种初始化的表现差距基本消失。强底座更宽容，但不能推断所有超参数都不重要。':init===2?'Small：类别标签初始化最好，先提供与任务相关的起点更有帮助。':init===1?'Small：词表初始化比随机起点更有帮助，仍不及类别标签初始化。':'Small：随机初始化更落后，小模型更依赖提示起点。';
  return <div className="experiment"><InitializationScene size={size} init={init}/><div className="trainer-controls" aria-label="初始化实验模型大小">{(['Small','XXL'] as const).map(s=><Chip key={s} selected={size===s} onClick={()=>setSize(s)}>{s}</Chip>)}</div><div className="trainer-controls" aria-label="初始化方式">{initializations.map((name,i)=><Chip key={name} selected={init===i} onClick={()=>setInit(i)}>{name}</Chip>)}</div>
  <p className="trainer-feedback" aria-live="polite">{feedback}</p><p className="trainer-output">{initializationDetails[init]} 图中的起点关系用于解释定性差异，不是嵌入空间测量，也不是分数。</p><p className="evidence-note">p5–6 Figure 3(b)、§3.2：只改变初始化，其他设置保持默认；SuperGLUE 开发集分数越高越好，3 次运行均值与标准差。默认长度 100、LM-adapted T5.1.1；类别标签初始化使用标签知识，不代表可直接读懂训练后的软提示。</p></div>
}

const lengths=[1,5,20,100,150];
export function LengthWidget() {
  const [length,setLength]=useState(1), [size,setSize]=useState<'Small'|'XXL'>('Small');
  const dimension=size==='Small'?512:4096;
  const statement=size==='Small'?(length<20?'Small：短提示省参数，但通常需要更多条件信号；增加长度可帮助缩小差距。':'Small：超过 20 token，进一步加长通常只有有限收益。长度并非越长越好。'):(length===1?'XXL：即使只有 1 个提示 token，本文实验也已有很强表现。':length>100?'XXL：超过 100 token 可能轻微损害大模型表现，150 不保证更好。':'XXL：较短提示已能充分引导，超过 20 token 通常收益有限。');
  return <div className="experiment"><LengthScene length={length} size={size}/><div className="trainer-controls" aria-label="长度实验模型大小">{(['Small','XXL'] as const).map(s=><Chip key={s} selected={size===s} onClick={()=>setSize(s)}>{s}</Chip>)}</div><div className="trainer-controls" aria-label="提示token数量">{lengths.map(n=><Chip key={n} selected={length===n} onClick={()=>setLength(n)}>{n} token</Chip>)}</div>
  <p className="trainer-feedback" aria-live="polite">{statement}</p><p className="metric-line">{size} 嵌入维度 e = {dimension.toLocaleString('en-US')}：{length} × {dimension.toLocaleString('en-US')} = <strong>{(length*dimension).toLocaleString('en-US')} 个任务参数</strong></p><p className="trainer-output">参数计算与当前选择的底座同步：Small 为 512 维，XXL 为 4,096 维。超过 20 token 的提示带折叠显示；默认训练长度为 100。参数少不等于免除底座前后向计算。</p><p className="evidence-note">p5 Figure 3(a)、§3.2：长度为 1 / 5 / 20 / 100 / 150，其他默认设置固定；SuperGLUE 开发集分数越高越好，3 次均值及标准差。这里显示定性结论，不提供假造性能数据。嵌入维度来自 p14 Table 4 的每 token 参数数。</p></div>
}
