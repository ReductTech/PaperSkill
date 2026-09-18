import React, { useEffect, useState } from 'react';
import { PedagogicalLabel } from './index-kit';

type Tone = 'blue' | 'green' | 'red' | 'orange' | 'purple';

function Evidence({ children }: { children: React.ReactNode }) {
  const raw = typeof children === 'string' ? children : '论文证据见当前模块说明。';
  const sections = [...raw.matchAll(/§[\d.]+(?:[–-][\d.]+)?/g)].map(x=>x[0]).join('、') || (raw.startsWith('摘要')?'摘要 / 全文':'全文');
  const refs = [...raw.matchAll(/(?:Figure|Table)s?\s*[\d–-]+/gi)].map(x=>x[0]).join('、') || '—';
  const locator = refs==='—'?sections:`${sections} · ${refs}`;
  return <details className="evidence-disclosure"><summary><span>Paper Evidence</span><b>{locator}</b><i>展开证据 ＋</i></summary><div className="evidence-grid"><div><small>SECTION</small><b>{sections}</b></div><div><small>FIGURE / TABLE</small><b>{refs}</b></div><div><small>论文事实</small><p>{raw}</p></div><div><small>本页如何解释</small><p>交互只编码论文支持的关系与方向；教学模拟、视觉比例和中间状态不作为论文测量值。</p></div></div></details>;
}

function Autoplay({ playing, onToggle }: { playing: boolean; onToggle: () => void }) {
  return <button className="autoplay-toggle" aria-pressed={playing} onClick={onToggle}><i />{playing ? '自动演示中 · 暂停' : '继续自动演示'}</button>;
}

function useAutoplay(run: () => void, playing: boolean, delay = 2200) {
  useEffect(() => {
    if (!playing || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(run, delay);
    return () => window.clearInterval(timer);
  }, [playing, delay, run]);
}

function Segmented({ items, value, onChange }: { items: string[]; value: number; onChange: (n: number) => void }) {
  return <div className="v2-segment" role="tablist">{items.map((item, i) => <button key={item} role="tab" aria-selected={value === i} onClick={() => onChange(i)}>{item}</button>)}</div>;
}

function MiniBars({ values, labels, max = 100, colors = ['blue', 'green'] }: { values: number[]; labels: string[]; max?: number; colors?: Tone[] }) {
  return <div className="mini-bars">{values.map((v, i) => <div className="mini-bar" key={labels[i]}><span>{labels[i]}</span><div><i className={colors[i] || 'blue'} style={{ width: `${Math.max(2, v / max * 100)}%` }} /></div><b>{v.toFixed(2)}</b></div>)}</div>;
}

export function IndexLineage() {
  const [active, setActive] = useState(0);
  const nodes = [
    ['Base', '预训练基础模型', '2.8T tokens 后进入通用评测或继续后训练'],
    ['Pure', '控制变量', '从相同训练设计中移除 instruction-like data，观察其影响'],
    ['Chat', '对齐模型', 'Base 经 SFT 与 DPO，面向指令跟随与偏好'],
    ['Character', '角色模型', '在对齐模型上加入角色数据与检索增强'],
  ];
  return <div className="v2-lab">
    <div className="lineage" aria-label="Index 模型谱系树">
      <button className={`lineage-node source ${active === 0 ? 'active' : ''}`} onClick={() => setActive(0)}><b>Base</b><small>pretrain</small></button>
      <div className="lineage-rail"><i /><i /><i /></div>
      <button className={`lineage-node pure ${active === 1 ? 'active' : ''}`} onClick={() => setActive(1)}><b>Pure</b><small>control</small></button>
      <div className="lineage-chain">
        <span>SFT</span><em>→</em><span>DPO</span><em>→</em>
        <button className={`lineage-node chat ${active === 2 ? 'active' : ''}`} onClick={() => setActive(2)}><b>Chat</b><small>aligned</small></button>
        <em>→ RAG →</em>
        <button className={`lineage-node character ${active === 3 ? 'active' : ''}`} onClick={() => setActive(3)}><b>Character</b><small>persona</small></button>
      </div>
    </div>
    <div className="state-readout"><span>{nodes[active][0]}</span><b>{nodes[active][1]}</b><p>{nodes[active][2]}</p></div>
    <Evidence>摘要、§1、§3–4。Pure 是用于隔离 instruction-like data 影响的对照版本，不是 Chat 的弱化版。</Evidence>
  </div>;
}

export function IndexDepthWidth() {
  const [depth, setDepth] = useState(36);
  const deep = depth >= 24;
  const width = Math.round(8192 / Math.sqrt(depth));
  return <div className="v2-lab">
    <PedagogicalLabel detail="拖杆产生的 visual width 仅表达固定参数预算下的形状关系" />
    <div className="shape-stage">
      <div className="axis-label y">DEPTH</div><div className="axis-label x">WIDTH</div>
      <div className="layer-stack" style={{ '--layers': Math.min(depth, 18), '--w': width } as React.CSSProperties}>
        {Array.from({ length: Math.min(depth, 18) }, (_, i) => <i key={i} style={{ transform: `translate(${i * 5}px, ${-i * 5}px)` }} />)}
      </div>
      <div className="shape-stats"><span>{depth} layers</span><span>≈ {width} visual width</span><span>固定参数预算示意</span></div>
    </div>
    <div className="ctrl"><label htmlFor="depth">模型深度</label><input id="depth" type="range" min="9" max="36" step="3" value={depth} onChange={e => setDepth(Number(e.target.value))} /></div>
    <div className={`feedback ${deep ? 'good' : ''}`}>{deep ? '更深的形状更接近论文最终采用的 36 层、2048 hidden 设计。' : '宽浅形状对应受控实验中的 9-layer 对照；拖动时参数预算保持为概念上的共同约束。'}</div>
    <Evidence>§2.3、Table 2、§6.2、Figure 3。最终架构为 36 layers、hidden 2048、FFN 5888、16 heads、sequence length 4096；深宽实验比较同为 1.01B non-embedding parameters 的 36-layer 与 9-layer 模型。</Evidence>
  </div>;
}

export function IndexNormHeadV2() {
  const [normalized, setNormalized] = useState(true);
  const [rare, setRare] = useState(true);
  const [playing, setPlaying] = useState(true);
  useAutoplay(React.useCallback(() => setNormalized(value => { if (value) setRare(r => !r); return !value; }), []), playing, 2400);
  const norm = normalized ? 1 : (rare ? 5.6 : 3.1);
  const grad = normalized ? (rare ? 1.1 : .8) : (rare ? 4.8 : 2.4);
  return <div className="v2-lab">
    <PedagogicalLabel detail="1.1×、2.4×、4.8× 等动态信号与词表行排布均非论文测量值" />
    <div className="norm-stage">
      <div className="vocab-column"><b>65,029 vocabulary rows</b>{Array.from({ length: 12 }, (_, i) => <i key={i} className={rare && i === 10 ? 'rare' : ''} />)}<small>{rare ? 'rare token row selected' : 'frequent token row selected'}</small></div>
      <div className="norm-equation"><span>w</span><em>→</em>{normalized && <strong> w / ‖w‖ </strong>}<em>→</em><span>h · ŵ</span></div>
      <div className="gradient-scope"><b>teaching stability proxy</b><div><i style={{ height: `${grad * 18}%` }} className={grad > 3 ? 'red' : 'green'} /></div><output>SIM {grad.toFixed(1)}× <small>非论文测量</small></output></div>
    </div>
    <div className="v2-controls"><Segmented items={['Normal Head', 'Norm-Head']} value={normalized ? 1 : 0} onChange={i => {setPlaying(false);setNormalized(i === 1)}} /><Segmented items={['frequent token', 'rare token']} value={rare ? 1 : 0} onChange={i => {setPlaying(false);setRare(i === 1)}} /><Autoplay playing={playing} onToggle={()=>setPlaying(x=>!x)}/></div>
    <div className="formula-strip"><code>ŵᵢ = wᵢ / ‖wᵢ‖₂</code><span>归一化对象：LM Head weight row wᵢ · 当前范数 <b>{norm.toFixed(1)}</b></span></div>
    <div className={`feedback ${normalized ? 'good' : 'bad'}`}>{normalized ? 'Norm-Head 直接约束输出头权重行的尺度，并不直接“归一化梯度”。论文把它与更稳定的训练及采用更大学习率联系起来。' : rare ? '稀疏词表行更新少，未约束的权重尺度更容易漂移或振荡；右侧梯度柱只是观测信号。' : '普通 head 的权重尺度仍可漂移；频繁词行通常比稀有词行得到更多更新。'}</div>
    <Evidence>§2.3、§6.1、Figure 2。归一化对象是 LM Head 的 weight rows；论文观察 LM head 主导 total gradient norm、vocabulary sparsity 带来不稳定，并报告 Norm-Head 获得一致增益且容忍更高 learning rate。页面不把这一联系写成严格因果。</Evidence>
  </div>;
}

export function IndexOptimizerStep() {
  const [p, setP] = useState(.35);
  const [step, setStep] = useState(0);
  const nextP = Math.min(.95, p + .12);
  const ce = -Math.log(p), ppl = Math.exp(ce);
  const doStep = () => { setP(nextP); setStep(s => s + 1); };
  return <div className="v2-lab">
    <PedagogicalLabel detail="概率分配、CE、PPL 和参数更新步数由交互实时计算" />
    <div className="prob-grid">
      {['正确 token', '候选 B', '候选 C', '其他'].map((label, i) => { const v = i === 0 ? p : (1 - p) / 3; return <div key={label}><span>{label}</span><i style={{ height: `${v * 100}%` }} className={i === 0 ? 'green' : 'blue'} /><b>{v.toFixed(2)}</b></div>; })}
      <div className="backprop-arrow"><span>loss</span><em>← gradient ←</em><span>AdamW update</span></div>
    </div>
    <div className="metrics"><div className="metric"><div className="l">p(target)</div><output className="v">{p.toFixed(2)}</output></div><div className="metric"><div className="l">−log p / CE</div><output className="v">{ce.toFixed(3)}</output></div><div className="metric"><div className="l">Perplexity</div><output className="v">{ppl.toFixed(2)}</output></div></div>
    <div className="ctrl"><label htmlFor="prob">目标概率</label><input id="prob" type="range" min=".05" max=".95" step=".05" value={p} onChange={e => setP(Number(e.target.value))} /><button className="primary-action" onClick={doStep}>执行一次参数更新</button></div>
    <div className="feedback good">第 {step} 次更新：目标概率越大，交叉熵与困惑度越小。AdamW、weight decay 与 gradient clipping 决定实际更新方式。</div>
    <Evidence>Cross-Entropy / NLL / PPL 为标准教学机制；AdamW、weight decay、gradient clipping 与学习率配置见 §2.4。示例概率不是论文实测。</Evidence>
  </div>;
}

const factorial = [
  { schedule: 'Cosine', data: '原始分布', score: 35.63 },
  { schedule: 'WSD', data: '原始分布', score: 35.75 },
  { schedule: 'Cosine', data: '精选集中', score: 34.65 },
  { schedule: 'WSD', data: '精选集中', score: 38.10 },
];

export function IndexWsdDataLab() {
  const [phase, setPhase] = useState(1);
  const [wsd,setWsd]=useState(true);
  const [curated,setCurated]=useState(true);
  const [revealed,setRevealed]=useState(false);
  const [lr, setLr] = useState(5);
  const [playing,setPlaying]=useState(true);
  const [demo,setDemo]=useState(3);
  useAutoplay(React.useCallback(()=>setDemo(value=>{const next=(value+1)%4;setWsd(next===1||next===3);setCurated(next>=2);setRevealed(false);setPhase(p=>(p+1)%3);return next}),[]),playing,2600);
  useEffect(()=>{if(!playing||matchMedia('(prefers-reduced-motion: reduce)').matches)return;const timer=window.setTimeout(()=>setRevealed(true),700);return()=>clearTimeout(timer)},[demo,playing]);
  const cell = (wsd?1:0)+(curated?2:0);
  const current = factorial[cell];
  return <div className="v2-lab">
    <PedagogicalLabel detail="曲线造型和状态动画为机制图；四格 benchmark average 来自 Figure 6" />
    <div className="dual-timeline">
      <div className="timeline-head"><span>training progress</span><b>{['Warmup', 'Stable', 'Decay'][phase]}</b></div>
      <svg viewBox="0 0 900 220" role="img" aria-label="WSD 学习率与数据质量双轨时间轴">
        <path className="axis" d="M40 170 H860"/><path className="lr-path" d="M40 165 L80 45 L630 45 Q760 48 860 155"/>
        <path className="data-path" d="M40 150 L620 150 Q730 150 860 75"/>
        {[80,630,860].map((x,i)=><g key={x} className={i===phase?'active-marker':''}><line x1={x} y1="25" x2={x} y2="185"/><circle cx={x} cy={i===0?45:i===1?45:155} r="8"/><text x={x} y="208" textAnchor="middle">{['warmup','stable','decay'][i]}</text></g>)}
        <text x="44" y="36">learning rate</text><text x="44" y="136">curated-data concentration</text>
      </svg>
      <Segmented items={['Warmup', 'Stable', 'Decay']} value={phase} onChange={i=>{setPlaying(false);setPhase(i)}}/>
    </div>
    <div className="lr-choice"><span>峰值学习率</span><Segmented items={['2e−4', '5e−4']} value={lr === 5 ? 1 : 0} onChange={i => {setPlaying(false);setLr(i ? 5 : 2)}} /><p>{lr === 5 ? '最终模型峰值为 5×10⁻⁴；§6.3 的 1B / 1T cosine ablation 中，它也持续优于 2×10⁻⁴。' : '2×10⁻⁴ 是 §6.3 学习率幅度消融的对照，不是 Figure 6 的独立实验因素。'}</p><Autoplay playing={playing} onToggle={()=>setPlaying(x=>!x)}/></div>
    <div className="factorial-switchboard"><div><small>FACTOR A</small><b>WSD schedule</b><button aria-pressed={wsd} onClick={()=>{setPlaying(false);setRevealed(false);setWsd(x=>!x)}}><i/>{wsd?'ON':'OFF · Cosine'}</button></div><span>×</span><div><small>FACTOR B</small><b>Curated data</b><button aria-pressed={curated} onClick={()=>{setPlaying(false);setRevealed(false);setCurated(x=>!x)}}><i/>{curated?'ON':'OFF · original mix'}</button></div><button className="reveal-score" onClick={()=>setRevealed(true)}>{revealed?'结果已揭示':'Reveal result'}</button></div>
    <div className="factorial"><div className="factorial-label">FOUR CONTROLLED CELLS · 两个开关独立控制</div>{factorial.map((f,i)=><div key={i} className={cell===i?'selected':''}><small>{f.schedule}</small><span>{f.data}</span><b>{cell===i&&revealed?f.score.toFixed(2):'••••'}</b></div>)}</div>
    {revealed?<MiniBars values={factorial.map(x=>x.score)} labels={factorial.map(x=>`${x.schedule} + ${x.data}`)} max={40} colors={['blue','purple','red','green']} />:<div className="score-veiled">先独立设置两个因素，再揭示论文分数</div>}
    <div className={`feedback ${revealed&&cell===3?'good':revealed&&cell===2?'bad':''}`}>{revealed?`当前：${current.schedule} + ${current.data} = ${current.score.toFixed(2)}。单独换成 WSD 几乎不变；WSD 与精选数据组合才出现明显增益。`:'这两个开关形成四种组合；Reveal 前不显示结果，避免先看答案再理解实验设计。'}</div>
    <Evidence>§2.3、Table 2、§6.3、Figure 4、§6.5、Figure 6。最终模型 peak LR 为 5×10⁻⁴；2×10⁻⁴ vs 5×10⁻⁴ 来自单独的 1B/1T cosine ablation。Figure 6 四格为 35.63 / 35.75 / 34.65 / 38.10，curated data 在最后 10% 提高占比。</Evidence>
  </div>;
}

export function IndexSurgeInvestigation() {
  const [lens, setLens] = useState(2);
  const [playing,setPlaying]=useState(true);
  useAutoplay(React.useCallback(()=>setLens(x=>(x+1)%4),[]),playing,2500);
  const cards = [
    ['Observed', '约 1.0T–1.2T tokens 的 stable phase 出现 benchmark 突增。'],
    ['Known controls', '突增发生在衰减前，且 1.0T–1.2T 区间的数据混合保持不变。'],
    ['Hypothesis', '可能与训练动力学或能力涌现有关；论文没有给出因果证据。'],
    ['Unknown', '触发机制、可复现条件与是否可预测仍未知。'],
  ];
  return <div className="v2-lab">
    <PedagogicalLabel detail="曲线形状与放大镜位置为示意；1.0T–1.2T 区间及约 27/26→36/33 来自 §6.7" />
    <div className="surge-chart">
      <svg viewBox="0 0 900 300" role="img" aria-label="1.0T 到 1.2T tokens 性能突增示意">
        <path className="axis" d="M65 35 V250 H860"/><path className="surge-window" d="M600 35 V250 H720 V35 Z"/>
        <path className="score-path" d="M70 220 C230 210 400 205 575 190 C620 184 635 112 690 95 C740 82 790 80 850 76"/>
        <text x="605" y="25">1.0T</text><text x="700" y="25">1.2T</text><text x="390" y="285">training tokens →</text><text x="75" y="55">benchmark ↑</text>
      </svg>
      <div className="investigation-lens" style={{ left: `${[11,34,58,78][lens]}%` }}><i/></div>
    </div>
    <div className="v2-controls"><Segmented items={cards.map(x=>x[0])} value={lens} onChange={i=>{setPlaying(false);setLens(i)}}/><Autoplay playing={playing} onToggle={()=>setPlaying(x=>!x)}/></div>
    <div className={`evidence-card tone-${(['blue','blue','purple','orange'] as Tone[])[lens]}`}><b>{cards[lens][0]}</b><p>{cards[lens][1]}</p></div>
    <Evidence>§6.7、Figure 7。1.0T 前 C-Eval/MMLU 约在 27/26 附近振荡，1.0T–1.2T 间在 data mixture 不变时升至约 36/33。曲线只定位区间；作者明确表示尚不能解释，并把 high-quality data + stable large LR 标为 plausible account。</Evidence>
  </div>;
}

export function IndexSftMask() {
  const [showLoss, setShowLoss] = useState(false);
  const [stage, setStage] = useState(2);
  const [playing,setPlaying]=useState(true);
  const [inheritOpt,setInheritOpt]=useState(true);
  const [replay,setReplay]=useState(true);
  useAutoplay(React.useCallback(()=>setStage(s=>{if(s<2){setShowLoss(false);return s+1}setShowLoss(mask=>!mask);return showLoss?0:2}),[showLoss]),playing,2100);
  const pool = ['>10M pool', 'clustering + reward model', '<100k SFT'];
  const tokens = [
    ['system','你是严谨的助手'], ['query','解释 Norm-Head'], ['response','它约束输出头权重尺度'],
  ];
  const reported = !inheritOpt && !replay ? '1.793' : inheritOpt && !replay ? '1.818' : inheritOpt && replay ? '1.929' : '未报告';
  return <div className="v2-lab">
    <PedagogicalLabel detail="示例 system/query/response 文本为教学编写；数据规模和 Table 3 分数来自论文" />
    <div className="funnel">{pool.map((p,i)=><button key={p} className={i===stage?'active':''} onClick={()=>{setPlaying(false);setStage(i)}} style={{width:`${100-i*22}%`}}>{p}</button>)}</div>
    <div className="mask-sequence">{tokens.map(([type,text])=><div key={type} className={type}><small>{type}</small><span>{text}</span><i>{showLoss && type==='response'?'loss = ON':showLoss?'loss = 0':'mask hidden'}</i></div>)}</div>
    <div className="sft-strategy">
      <div><small>CONTINUITY CONTROL</small><b>Optimizer state</b><button aria-pressed={inheritOpt} onClick={()=>{setPlaying(false);setInheritOpt(x=>!x)}}><i/>{inheritOpt?'继承预训练状态':'重新初始化'}</button></div>
      <div><small>DISTRIBUTION CONTROL</small><b>Pretraining replay</b><button aria-pressed={replay} onClick={()=>{setPlaying(false);setReplay(x=>!x)}}><i/>{replay?'ON · 40% tokens':'OFF'}</button></div>
      <output><small>TABLE 3 · INTERNAL EVAL</small><b>{reported}</b><span>{reported==='未报告'?'该组合未报告，不补造分数':'Overall score · 满分 3 分'}</span></output>
    </div>
    <div className="v2-controls"><button className="primary-action" onClick={()=>{setPlaying(false);setShowLoss(x=>!x)}}>{showLoss?'隐藏 loss mask':'展开 loss mask'}</button><Autoplay playing={playing} onToggle={()=>setPlaying(x=>!x)}/></div>
    <div className={`feedback ${showLoss?'good':''}`}>{showLoss?'system 与 query 提供条件，只有 response tokens 参与这里展示的 SFT loss。':'展开 mask，观察训练信号落在哪些 token 上。'}</div>
    <Evidence>§3.1、Table 3：候选池超过 10M，经 clustering / reward model 筛选至不足 100k；只对 response tokens 计算 loss。三种已报告 Overall 为 1.793、1.818、1.929；最佳设置继承 optimizer state，并以 40% tokens replay 预训练数据。</Evidence>
  </div>;
}

export function IndexDpoLab() {
  const [beta, setBeta] = useState(.1);
  const [steps, setSteps] = useState(0);
  const [playing,setPlaying]=useState(true);
  useAutoplay(React.useCallback(()=>setSteps(s=>s>=6?0:s+1),[]),playing,1800);
  const chosen = Math.min(.9, .52 + steps * beta * .45);
  const rejected = 1 - chosen;
  const risk = beta * steps > .9;
  return <div className="v2-lab">
    <PedagogicalLabel detail="chosen/rejected 概率、迁移步数和风险阈值均为模拟；论文固定设置 β=0.1" />
    <div className="paper-setting">PAPER SETTING · &gt;100k preference pairs · β=0.1 · LR 1×10⁻⁶ · 1 epoch</div>
    <div className="preference-pair"><div className="chosen"><small>chosen</small><p>给出准确、直接、不过度拒绝的回答。</p><b style={{width:`${chosen*100}%`}}>{chosen.toFixed(2)}</b></div><div className="rejected"><small>rejected</small><p>含糊、偏离问题，或不必要地拒绝。</p><b style={{width:`${rejected*100}%`}}>{rejected.toFixed(2)}</b></div></div>
    <div className="ctrl"><label htmlFor="beta">β · 偏好力度 <output>{beta.toFixed(2)}</output></label><input id="beta" type="range" min=".05" max=".5" step=".05" value={beta} onChange={e=>{setPlaying(false);setBeta(Number(e.target.value))}}/><button className="primary-action" onClick={()=>{setPlaying(false);setSteps(s=>Math.min(6,s+1))}}>训练一步</button><button className="chip" onClick={()=>{setPlaying(false);setSteps(0)}}>重置</button><Autoplay playing={playing} onToggle={()=>setPlaying(x=>!x)}/></div>
    <div className={`feedback ${risk?'bad':steps?'good':''}`}>{risk?'偏好压力过强的教学情形：需要警惕 catastrophic forgetting 与 over-refusal。':steps?'概率质量正从 rejected 移向 chosen；β 控制相对参考策略的偏好压力。':'调整 β 并训练，观察 chosen / rejected 的相对概率。'}</div>
    <Evidence>§3.2：论文构建超过 100,000 个 preference pairs；DPO 使用 β=0.1、1×10⁻⁶ learning rate、cosine schedule 和 single epoch。交互概率与风险阈值是教学模拟。</Evidence>
  </div>;
}

export function IndexRagFlow() {
  const [step, setStep] = useState(0);
  const [playing,setPlaying]=useState(true);
  useAutoplay(React.useCallback(()=>setStep(s=>(s+1)%4),[]),playing,1900);
  const labels = ['Query', 'Retrieve', 'Context', 'Response'];
  const detail = ['用户提出角色相关问题。','从角色台词库检索相近片段。','把命中的台词作为上下文拼入 prompt。','模型在上下文约束下生成角色化回答。'];
  return <div className="v2-lab">
    <PedagogicalLabel detail="检索 query、命中台词与生成回答是教学文本；80k 与 1,000+ 来自论文" />
    <div className="rag-flow">{labels.map((l,i)=><React.Fragment key={l}><button className={i<=step?'active':''} onClick={()=>{setPlaying(false);setStep(i)}}><small>0{i+1}</small><b>{l}</b><span>{i===1?'80k dialogues':i===2?'>1,000 characters':''}</span></button>{i<3&&<i>→</i>}</React.Fragment>)}</div>
    <div className="retrieval-console"><span>{labels[step]}</span><p>{detail[step]}</p><code>{step===0?'「你会怎么面对失败？」':step===1?'top-k:「把失败叫作下一场练习。」':step===2?'[retrieved dialogue] + user query':'「先记下这次失误，然后去准备下一场。」'}</code></div>
    <div className="ctrl"><button className="primary-action" disabled={step===3} onClick={()=>{setPlaying(false);setStep(s=>Math.min(3,s+1))}}>下一步</button><button className="chip" disabled={step===0} onClick={()=>{setPlaying(false);setStep(0)}}>重置</button><Autoplay playing={playing} onToggle={()=>setPlaying(x=>!x)}/></div>
    <Evidence>§4：约 80k 角色对话、超过 1,000 个角色；训练与推理阶段将检索台词放入 prompt。示例台词是教学文本。</Evidence>
  </div>;
}

const tasks = [
  ['MMLU','知识推理','5-shot PPL'],['C-Eval','中文知识','5-shot PPL'],['CMMLU','中文理解','5-shot PPL'],
  ['HellaSwag','常识续写','0-shot PPL'],['ARC-C','挑战集','0-shot PPL'],['ARC-E','简单集','0-shot PPL'],
  ['GSM8K','数学','Generation'],['HumanEval','代码','Generation'],
];
export function IndexBenchmarkMap() {
  const [active, setActive] = useState(0);
  const [protocol,setProtocol]=useState(0);
  const protocols=['5-shot PPL','0-shot PPL','Generation'];
  const matching=tasks.map((t,i)=>t[2]===protocols[protocol]?i:-1).filter(i=>i>=0);
  return <div className="v2-lab">
    <div className="protocol-switch"><small>EVALUATION PROTOCOL</small><Segmented items={protocols} value={protocol} onChange={i=>{setProtocol(i);setActive(tasks.findIndex(t=>t[2]===protocols[i]))}}/></div>
    <div className={`constellation protocol-${protocol}`}>{tasks.map((t,i)=><button key={t[0]} className={`${i===active?'active ':''}${matching.includes(i)?'matched':'dimmed'}`} onClick={()=>{setActive(i);setProtocol(protocols.indexOf(t[2]))}}><b>{t[0]}</b><small>{t[1]}</small></button>)}<div className="constellation-core"><span>active cluster</span><b>{protocols[protocol]}</b><small>{matching.length} benchmarks</small></div></div>
    <div className="protocol-readout"><span>{tasks[active][0]}</span><b>{tasks[active][1]}</b><p>评测协议：{tasks[active][2]}。不同协议的分数不能脱离任务定义直接合并解释。</p></div>
    <Evidence>§5.1 与 Tables 4–5。MMLU/C-Eval/CMMLU 使用 5-shot perplexity；HellaSwag/ARC-C/ARC-E 使用 0-shot perplexity，并计算两种 PPL protocol 后报告较高者；GSM8K/HumanEval 使用 generation + answer extraction/verification。64.92 是六任务均分，不包含 GSM8K 与 HumanEval。</Evidence>
  </div>;
}

export function IndexEvidenceMap() {
  const [group, setGroup] = useState(0);
  const groups = [
    ['Established',['36×2048 架构与 2.8T tokens','WSD×精选数据 38.10','Pure/Boost 表 8 的任务级差异']],
    ['Suggested',['Norm-Head 支持更高 LR 的机制解释','instruction data 改善若干 benchmark','RAG 支持角色定制']],
    ['Unknown',['1.0T–1.2T surge 的原因','WSD×数据增益能否普遍外推','CharacterEval 正文与表格次序差异']],
  ] as const;
  return <div className="v2-lab">
    <Segmented items={groups.map(g=>g[0]) as unknown as string[]} value={group} onChange={setGroup}/>
    <div className={`evidence-map group-${group}`}>{groups[group][1].map((x,i)=><div key={x}><span>0{i+1}</span><p>{x}</p></div>)}</div>
    <div className="feedback">{group===0?'论文直接给出或以受控实验支持。':group===1?'论文提供解释或条件性证据，措辞需保留边界。':'作者未解释、未验证，或材料中存在需要人工对照的问题。'}</div>
    <Evidence>全篇证据收束。每个交互旁的 Paper Evidence 说明对应 section / table / figure 与解释边界。</Evidence>
  </div>;
}

export function IndexDataPipeline() {
  const [step,setStep]=useState(0);
  const names=['Raw crawl','Heuristic','Classifier','MinHash','Exact substring'];
  const detail=[
    ['原始网页片段混在正文中','JAN FEB MAR APR MAY JUN JUL AUG SEP OCT NOV DEC','同一网页模板可能跨大量文档反复出现。'],
    ['先清明显噪声','导航、乱码、极短页','规则适合处理明确垃圾，但复杂边界交给下一层。'],
    ['保守判断质量','高质量 / 可疑 / 低质量','分类器过滤使用保守阈值，以减少误删高质量内容。'],
    ['文档级近重复合并','Doc A ≈ Doc A′','MinHash 寻找整篇文档的近重复，不等同于查找文档内部片段。'],
    ['文档内重复片段移除','月份下拉菜单 × 156,000','论文给出的具体案例只能由 exact substring matching 识别。'],
  ];
  return <div className="v2-lab dedup-lab">
    <PedagogicalLabel detail="文档卡片和过滤过程为演示；月份字符串重复 156,000 次是论文实例" />
    <div className="data-stream">{names.map((n,i)=><button key={n} className={i<=step?'active':''} onClick={()=>setStep(i)}><i/><span>{n}</span><b>0{i+1}<small> stage</small></b></button>)}</div>
    <div className="dedup-case"><div className="document-stack">{[0,1,2,3].map(i=><article key={i} className={step>=3&&i>1?'removed':''}><small>COMMON CRAWL · DOC {String(i+1).padStart(2,'0')}</small><p>研究正文…… <mark className={step>=4?'cut':''}>JAN FEB MAR APR MAY JUN JUL AUG SEP OCT NOV DEC</mark> ……页面内容</p></article>)}</div><div className="filter-inspector"><small>{names[step].toUpperCase()}</small><b>{detail[step][0]}</b><code>{detail[step][1]}</code><p>{detail[step][2]}</p></div></div>
    <div className="ctrl"><button className="primary-action" disabled={step===names.length-1} onClick={()=>setStep(s=>Math.min(names.length-1,s+1))}>通过下一道筛选</button><button className="chip" disabled={step===0} onClick={()=>setStep(0)}>重置</button></div>
    <Evidence>§2.1：heuristic filtering、classifier filtering、MinHash document deduplication、exact substring deduplication。论文明确举例：Common Crawl 中月份下拉菜单片段重复 156,000 次，只能由 exact substring matching 识别；各阶段保留率未披露。</Evidence>
  </div>
}

export function IndexGlossaryPrimer(){
  return <div className="v2-lab"><div className="glossary-rule"><span>01</span><b>中文名 / English term</b><span>02</span><b>一句话直觉</b><span>03</span><b>在 Index SLM 中的作用</b></div><p className="glossary-hint">带虚线下划线的术语只在全文第一次出现时提供解释；后续重复出现保持普通正文，避免同一个词反复弹出。</p></div>
}
