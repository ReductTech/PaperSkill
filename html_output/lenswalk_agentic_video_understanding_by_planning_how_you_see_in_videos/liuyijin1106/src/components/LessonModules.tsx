import { useId, useState } from 'react';
import { ArrowRight, Check, ExternalLink } from 'lucide-react';
import { CODE, PAPER } from '../content';
import { InferenceTraceLesson } from './InferenceTraceLesson';
import { FixedObservationLesson, ObservationLoopLesson, ParameterPlanningLesson } from './FoundationLessons';
import { ScanSearchLesson } from './ScanSearchLesson';
import { SegmentFocusLesson } from './SegmentFocusLesson';
import { StitchedVerifyLesson } from './StitchedVerifyLesson';
import { EvidenceMemoryLesson } from './EvidenceMemoryLesson';

type Props = { id: string; onComplete: () => void };
type Item = { label:string; title:string; text:string; detail?:string };

function SourceBadge({ kind='paper' }: { kind?:'paper'|'demo'|'analysis'|'lineage' }) {
  const labels = { paper:'论文报告', demo:'教学示意', analysis:'基于方法结构的分析', lineage:'专题脉络中的教学性解释' };
  return <span className={`source-badge ${kind}`}>{labels[kind]}</span>;
}
function Tabs({ items, onComplete, note, kind='paper' }: { items:Item[]; onComplete:()=>void; note?:string; kind?:'paper'|'demo'|'analysis'|'lineage' }) {
  const instance = useId();
  const [selected, setSelected] = useState(0);
  const [seen, setSeen] = useState<number[]>([]);
  const choose = (index:number) => { setSelected(index); const next=[...new Set([...seen,index])]; setSeen(next); if (next.length >= Math.min(2,items.length)) onComplete(); };
  return <div className="lab-card"><div className="tab-head"><SourceBadge kind={kind}/><span>{note ?? '点击切换视角，比较它们的作用。'}</span></div><div className="tab-strip" role="tablist" aria-label="内容视角">{items.map((item,i) => <button role="tab" aria-selected={selected===i} aria-controls={`${instance}-panel-${i}`} id={`${instance}-tab-${i}`} className={selected===i?'active':''} onClick={() => choose(i)} key={item.label}>{item.label}</button>)}</div><div className="tab-panel" role="tabpanel" id={`${instance}-panel-${selected}`} aria-labelledby={`${instance}-tab-${selected}`}><span className="eyebrow">{String(selected+1).padStart(2,'0')} / {String(items.length).padStart(2,'0')}</span><h3>{items[selected].title}</h3><p>{items[selected].text}</p>{items[selected].detail && <div className="insight-box">{items[selected].detail}</div>}</div></div>;
}

function Tools({ onComplete, initialTool=0 }: { onComplete:()=>void; initialTool?:number }) {
  const items:Item[] = [
    { label:'Scan Search', title:'先在宽范围找线索', text:'把指定大区间切成片，对每片稀疏采样并分别询问 VLM，返回候选位置或相关性判断。各片独立，因而可并行。', detail:'代码名 scan_observer；论文 §3.3。注意 Scan 不等于“永远先调用”。' },
    { label:'Segment Focus', title:'锁定一个连续时间段', text:'在单一连续区间更密集地取帧，回答明确的细节问题；必要时可对同一区间进一步加密。', detail:'代码名 segment_observer；适合动作、属性、相似实体消歧。' },
    { label:'Stitched Verify', title:'把多个关键时刻并排核验', text:'各个非连续区间可有自己的采样率，采样帧进入一个 VLM 上下文，便于联合比较与全局核查。', detail:'代码名 stitched_observer；不是把整个原视频无差别拼接。' }
  ];
  const [tool,setTool]=useState(initialTool);
  const [seen,setSeen]=useState<number[]>([]);
  const pick=(i:number)=>{setTool(i);const next=[...new Set([...seen,i])];setSeen(next);if(next.length===3)onComplete();};
  return <div className="lab-card"><div className="lab-head"><div><span className="eyebrow">OBSERVER TOOL BENCH</span><h3>同一个问题，尝试不同观察目标</h3></div><SourceBadge/></div><div className="observer-grid">{items.map((item,i)=><button className={tool===i?'active':''} onClick={()=>pick(i)} key={item.label}><span className="observer-number">0{i+1}</span><strong>{item.label}</strong><small>{['广域定位','连续细节','跨时刻核查'][i]}</small>{seen.includes(i)&&<Check size={16}/>}</button>)}</div><div className="observer-panel"><div className={`observer-visual variant-${tool}`}><span>00:00</span><div>{Array.from({length:14},(_,i)=><i key={i} className={tool===0?'on':tool===1?i>=5&&i<=8?'on':'':i===2||i===3||i===10||i===11?'on':''}/>)}</div><span>10:00</span></div><h4>{items[tool].title}</h4><p>{items[tool].text}</p><div className="insight-box">{items[tool].detail}</div></div><p className="source-caption">请逐一查看三种工具。橙色采样条为教学示意；功能依据论文 §3.3 与官方工具配置。</p></div>;
}

function Training({ onComplete }: { onComplete:()=>void }) {
  return <><div className="stack-diagram"><div><span>BASE MODELS</span><strong>LLM Reasoner + VLM Observer</strong></div><ArrowRight size={21}/><div className="emphasis"><span>LENSWALK AGENTIC LAYER</span><strong>计划观察 · 调用工具 · 整合证据</strong></div><ArrowRight size={21}/><div><span>LONG-VIDEO QA</span><strong>论文设置下的准确率提升</strong></div></div><Tabs onComplete={onComplete} note="切换至少两个视角，识别“无需微调”的边界。" items={[
    {label:'论文方法',title:'变化发生在 inference path',text:'Reasoner 用工具调用决定视频观察范围、密度和子问题；Observer 根据计划读取采样视频。论文说框架可接入不同模型配方，不要求微调。',detail:'摘要与 §4.1：报告的组合包含 o3、GPT-4.1、GPT-5、Qwen2.5-VL-72B。'},
    {label:'公开代码',title:'仓库交付的是推理路径',text:'官方 README 列出 VCS observation tools、配置、JSON/JSONL reader 与 smoke tests，并明确未附训练代码与 benchmark annotations。',detail:'这是仓库发布事实，不应误标成论文正文原句。'},
    {label:'成本边界',title:'不训练 ≠ 零成本',text:'多轮调用消耗模型推理、视频解码、时间与 token；Appendix Table 6 中 LensWalk 的在线时长高于 o3 单次基线。',detail:'论文 Table 6：190.35s vs 38.9s。'}
  ]}/></>;
}

function Comparison({ onComplete }: { onComplete:()=>void }) {
  return <><Tabs onComplete={onComplete} note="比较方法时只读论文有证据支持的维度。" items={[
    {label:'固定均匀采样',title:'一次决定，固定上下文',text:'按固定策略从长视频抽帧，形成一次视觉上下文，再进行回答；中途无法因为假设变化而重新分配视觉预算。',detail:'论文 §1 对典型设置的分析。'},
    {label:'启发式选帧',title:'更会筛，但仍多在推理前选完',text:'关键帧或 token 选择可减少冗余；论文讨论的这类方法通常一次决定可见内容。',detail:'论文 §1–2。不要据此断言所有选帧系统都不能动态调整。'},
    {label:'反应式检索',title:'可按需请求，常依赖预处理表示',text:'LLM 可检索 ASR、OCR、clip caption 等预先生成的产物，但对原始视频的重新观测粒度控制受预处理工作流约束。',detail:'论文 §1–2 对相关方法的归纳。'},
    {label:'LensWalk',title:'把新观察变成推理动作',text:'每轮计划工具、时间范围、帧数或 FPS，按需从源视频取证，并把带时间信息的新证据放回下一轮推理。',detail:'论文 §3.2–3.4。'}
  ]}/><div className="comparison-wrap"><div className="comparison-note"><SourceBadge/><span>依据论文 §1–2 的方法类别归纳；“—”表示论文未对该类别作统一断言。</span></div><div className="table-scroll"><table className="comparison-table"><thead><tr><th>比较维度</th><th>固定均匀采样</th><th>启发式帧/Token 选择</th><th>反应式检索</th><th>LensWalk</th></tr></thead><tbody>
    <tr><th>一次性确定可见视频</th><td>是</td><td>通常是</td><td>否，按需取预处理产物</td><td>否</td></tr>
    <tr><th>随中间假设重规划</th><td>否</td><td>论文所述类别：否</td><td>可重定检索问题</td><td>是，重规划观察</td></tr>
    <tr><th>控制时间范围</th><td>固定设置</td><td>推理前选择</td><td>受预处理索引限制</td><td>逐轮设定</td></tr>
    <tr><th>控制采样密度</th><td>固定设置</td><td>推理前选择</td><td>论文称控制有限</td><td>逐轮设定</td></tr>
    <tr><th>推理中重新访问源视频</th><td>否</td><td>通常否</td><td>论文所述类别：有限</td><td>是</td></tr>
    <tr><th>多轮获得新证据</th><td>否</td><td>通常否</td><td>可检索新产物</td><td>可新观测</td></tr>
    <tr><th>非连续片段联合观察</th><td>—</td><td>—</td><td>—</td><td>Stitched Verify</td></tr>
    <tr><th>框架需要模型微调</th><td>—</td><td>—</td><td>—</td><td>不需要</td></tr>
    <tr><th>带时间戳证据</th><td>—</td><td>—</td><td>—</td><td>Timestamp Anchors</td></tr>
  </tbody></table></div></div></>;
}

function Benchmarks({ onComplete }: { onComplete:()=>void }) {
  return <Tabs onComplete={onComplete} note="选择不同测试问题。这里列的是论文实际评测范围。" items={[
    {label:'长视频',title:'长范围的信息检索与理解',text:'LVBench；LongVideoBench 验证集 long split；Video-MME 30–60 分钟 long split。论文以准确率比较不同 Reasoner/Observer 配方。',detail:'论文 §4.1 与 Table 1。Video-MME Long 不等于整个 Video-MME 总分。'},
    {label:'视频推理',title:'更强调综合推断',text:'MMVU 与 Video-MMMU 用于检查高层视频推理任务。Table 2 报告 MMVU 多选题准确率、Video-MMMU 分维与 Overall。',detail:'论文 §4.1、Table 2。'},
    {label:'第一视角',title:'补充 egocentric 视频场景',text:'EgoSchema 验证集用于第一视角视频理解。论文 Table 1 中 o3 单次基线为 63.2，LensWalk(o3) 为 74.8。',detail:'论文 §4.1、Table 1；这是报告的准确率，不是本地复现。'}
  ]}/>;
}

function Figures({ onComplete }: { onComplete:()=>void }) {
  const [figure,setFigure]=useState(1);
  const [seen,setSeen]=useState<number[]>([]);
  const pick=(n:number)=>{setFigure(n);const next=[...new Set([...seen,n])];setSeen(next);if(next.length===2)onComplete();};
  return <div className="lab-card"><div className="lab-head"><div><span className="eyebrow">READ THE ORIGINAL FIGURES</span><h3>原图负责证据，重绘负责理解</h3></div><SourceBadge/></div><div className="segmented"><button className={figure===1?'active':''} onClick={()=>pick(1)}>Figure 1 · 范式比较</button><button className={figure===2?'active':''} onClick={()=>pick(2)}>Figure 2 · 真实轨迹</button></div><figure className="paper-figure"><a href={`./paper/figure-${figure}.png`} target="_blank" rel="noreferrer" aria-label={`在新标签放大论文 Figure ${figure}`}><img src={`./paper/figure-${figure}.png`} alt={figure===1?'论文 Figure 1：单次前向、检索式代理与 LensWalk 的观察范式比较':'论文 Figure 2：包含 Scan、Segment、Stitch 与 Subject Memory 的真实推理轨迹'} loading="lazy"/></a><figcaption><strong>论文原图 · Figure {figure}</strong> · 作者官方仓库 assets/{figure===1?'intro.png':'method_illustration.png'}。点击图片可放大。<a href={PAPER} target="_blank" rel="noreferrer">查看论文说明 <ExternalLink size={14}/></a></figcaption></figure><div className="figure-reading"><span className="eyebrow">如何读这张图</span><p>{figure===1?'先读 (a) 的一次性上下文，再读 (b) 的预处理检索，最后看 (c) LensWalk 如何按当前推理主动从源视频取不同范围的证据；(d) 是论文报告的准确率与预算关系，不是这里的动画结果。':'Figure 2 是论文实际轨迹：Scan/Segment 寻找问题相关证据，实体表中出现了冲突，随后 Stitch 将关键片段放在一起核查并修正判断。请区分图中的真实案例与本站虚构模拟。'}</p><div className="figure-points">{(figure===1?['(a) 固定上下文','(b) 预处理检索','(c) 逐轮观察源视频','(d) 准确率与预算']:['时间轴：广扫到细看','工具调用：Scan / Segment / Stitch','冲突：Subject Memory Table','结论：跨片段复核后回答']).map(point=><span key={point}>{point}</span>)}</div></div></div>;
}

function Active({ onComplete }: { onComplete:()=>void }) {
  return <Tabs onComplete={onComplete} kind="analysis" note="点击阶段，指出主动控制发生在哪里。" items={[
    {label:'Question',title:'问题确定证据需求',text:'同一视频的不同问题可能需要不同时间范围与不同观察密度。',detail:'这是对论文机制的教学性分解。'},
    {label:'Plan Observation',title:'主动性位于观察策略',text:'Reasoner 根据当前证据决定工具、区间、帧数或 FPS，必要时重新观察源视频。',detail:'论文 §3.2 明确的动作参数。'},
    {label:'Update',title:'新证据反过来改写下一轮计划',text:'带时间戳观察进入历史；Reasoner 决定继续探索、跨时刻验证或 Finish。',detail:'论文 §3.2–3.4。它没有控制真实相机视点、曝光或机器人动作。'}
  ]}/>;
}

function Lineage({ onComplete }: { onComplete:()=>void }) {
  return <Tabs onComplete={onComplete} kind="lineage" note="这是一条课程线索，不是三篇论文的直接实验对比。" items={[
    {label:'V*',title:'Where should I look?',text:'在高分辨率图像中根据任务线索主动寻找有价值的空间区域。',detail:'课程定位：看哪里。此处不比较其基准分数。'},
    {label:'Act2See',title:'When should I seek new evidence?',text:'在推理过程中判断何时需要补充视觉证据。',detail:'课程定位：何时再看。此处为专题脉络中的教学性解释。'},
    {label:'LensWalk',title:'How should I look?',text:'进一步把长视频观察范围、采样密度和工具类型作为每轮推理可规划的动作。',detail:'课程定位：怎样看。论文 §3 支持 LensWalk 的机制，但未做这里的直接比较实验。'}
  ]}/>;
}

export function LessonModule({ id,onComplete }: Props) {
  switch(id) {
    case 'fixed': return <FixedObservationLesson onComplete={onComplete}/>;
    case 'loop': return <ObservationLoopLesson onComplete={onComplete}/>;
    case 'scope': return <ParameterPlanningLesson onComplete={onComplete}/>;
    case 'scan': return <ScanSearchLesson onComplete={onComplete}/>;
    case 'segment': return <SegmentFocusLesson onComplete={onComplete}/>;
    case 'tools': return <Tools onComplete={onComplete}/>;
    case 'stitch': return <StitchedVerifyLesson onComplete={onComplete}/>;
    case 'memory': return <EvidenceMemoryLesson onComplete={onComplete}/>;
    case 'simulator': return <InferenceTraceLesson onComplete={onComplete}/>;
    case 'training': return <Training onComplete={onComplete}/>;
    case 'comparison': return <Comparison onComplete={onComplete}/>;
    case 'benchmarks': return <Benchmarks onComplete={onComplete}/>;
    case 'figures': return <Figures onComplete={onComplete}/>;
    case 'active': return <Active onComplete={onComplete}/>;
    case 'lineage': return <Lineage onComplete={onComplete}/>;
    default: return <div className="lab-card"><a href={CODE}>官方代码</a></div>;
  }
}
