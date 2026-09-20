import {useEffect,useMemo,useState} from 'react'

const nav=[['thesis','主张'],['tokenizer','图像词'],['sequence','序列'],['stability','稳定'],['scale','规模'],['alignment','对齐'],['evidence','证据'],['lineage','演进'],['limits','边界'],['quiz','验收']]
const H=({n,k,t,p}:{n:string,k:string,t:string,p:string})=><header className="chapter-head"><b>{n}</b><div><small>{k}</small><h2>{t}</h2><p>{p}</p></div></header>
const LabTop=({n,t,source}:{n:string,t:string,source:string})=><div className="labtop"><small>INTERACTIVE NOTE {n}</small><h3>{t}</h3><em>{source}</em></div>
const Tabs=({labels,on,set}:{labels:string[],on:number,set:(n:number)=>void})=><div className="tabs">{labels.map((x,i)=><button className={on===i?'on':''} onClick={()=>set(i)} key={x}>{x}</button>)}</div>

function TokenizerLab(){
  const [zoom,setZoom]=useState(4)
  const size=zoom===4?4:zoom===8?8:16
  const tokens=size*size
  const cells=useMemo(()=>Array.from({length:tokens},(_,i)=>i),[tokens])
  return <div className="lab"><LabTop n="01" t="把一张图像压成可预测的“词”" source="论文 §2.1"/>
    <div className="tokenizer">
      <div className="mosaic" style={{gridTemplateColumns:`repeat(${size},1fr)`}}>{cells.map(i=><i style={{background:`hsl(${(i*37)%360} 45% ${38+(i%5)*7}%)`}} key={i}>{size<=8?i:''}</i>)}</div>
      <article><label>教学网格 <b>{size}×{size}</b><input type="range" min="0" max="2" value={zoom===4?0:zoom===8?1:2} onChange={e=>setZoom([4,8,16][+e.target.value])}/></label>
        <dl><div><dt>论文真实输入</dt><dd>512×512 px</dd></div><div><dt>论文真实输出</dt><dd>1,024 tokens</dd></div><div><dt>图像 codebook</dt><dd>8,192</dd></div><div><dt>压缩率</dt><dd>每 token 对应约 16×16 像素区域</dd></div></dl>
        <p>上方 {tokens} 格是缩小的教学模拟。真实 tokenizer 产生 32×32 个离散索引，再由自回归模型像预测文字一样预测它们。</p>
      </article>
    </div><p className="note">教学模拟只展示离散网格概念，不代表真实 codebook 的颜色或空间结构。</p>
  </div>
}

type Segment={kind:'text'|'image'|'code',label:string}
function SequenceLab(){
  const presets:Segment[][]=[
    [{kind:'text',label:'给我一份旅行攻略'},{kind:'image',label:'海岸照片'},{kind:'text',label:'解释地貌'}],
    [{kind:'image',label:'参考图'},{kind:'text',label:'改变季节'},{kind:'image',label:'生成图'}],
    [{kind:'text',label:'标题'},{kind:'image',label:'插图'},{kind:'text',label:'正文'},{kind:'image',label:'图表'}]
  ]
  const [mode,setMode]=useState(2)
  const [seq,setSeq]=useState<Segment[]>(presets[2])
  const choose=(i:number)=>{setMode(i);setSeq(presets[i])}
  const add=(kind:Segment['kind'])=>setSeq([...seq,{kind,label:kind==='image'?'图像 token':'新片段'}])
  return <div className="lab"><LabTop n="02" t="同一序列里，模态可以任意交错" source="论文 Fig. 1–4"/>
    <Tabs labels={['看图回答','图像编辑','混合文档']} on={mode} set={choose}/>
    <div className="sequence">{seq.map((x,i)=><button className={x.kind} title="点击删除" onClick={()=>setSeq(seq.filter((_,j)=>j!==i))} key={i}><small>{x.kind}</small>{x.label}<b>×</b></button>)}</div>
    <div className="addrow"><span>添加：</span><button onClick={()=>add('text')}>文字</button><button onClick={()=>add('image')}>图像</button><button onClick={()=>add('code')}>代码</button><button onClick={()=>setSeq(presets[mode])}>复原</button></div>
    <blockquote>Chameleon 的核心不是“既能看又能画”，而是用一个 next-token 接口建模任意图文交错文档。点击片段可删除，自行测试序列。</blockquote>
  </div>
}

function StabilityLab(){
  const [qk,setQk]=useState(true),[z,setZ]=useState(true),[reorder,setReorder]=useState(true),[scale,setScale]=useState(34)
  const risk=Math.max(4,96-(qk?43:0)-(z?21:0)-(reorder?scale===34?30:20:0))
  const state=risk<20?'稳定区间':risk<55?'需要警惕':'高风险'
  return <div className="lab darklab"><LabTop n="03" t="为什么把图像塞进语言模型会失稳？" source="论文 Fig. 5–6"/>
    <div className="stability">
      <article><Tabs labels={['7B','34B']} on={scale===7?0:1} set={i=>setScale(i?34:7)}/>
        {[['QK-Norm',qk,setQk,'约束 attention softmax 前的 query/key 范数'],['z-loss',z,setZ,'抑制最终 softmax 的 log-partition 漂移'],['Norm 重排',reorder,setReorder,'限制残差分支和 SwiGLU 的范数增长']].map(([n,v,s,d])=><label className="switch" key={String(n)}><input type="checkbox" checked={Boolean(v)} onChange={e=>(s as (x:boolean)=>void)(e.target.checked)}/><span/><b>{String(n)}</b><small>{String(d)}</small></label>)}
      </article>
      <div className="gauge"><div style={{'--risk':risk} as React.CSSProperties}><i/><b>{risk}</b></div><h4>{state}</h4><p>{!qk?'缺少 QK-Norm 是论文中最明确的失稳信号。':scale===34&&!reorder?'34B 还需要归一化重排；仅靠 dropout 未能修复。':'组合稳定化控制了跨模态共享参数的范数竞争。'}</p></div>
    </div>
    <p className="note">风险分数是教学映射，不是论文报告的概率。论文观察：7B 无 QK-Norm 约在训练 epoch 的 20% 处发散；QK-Norm 对两种规模都关键。</p>
  </div>
}

function ScaleLab(){
  const [m,setM]=useState(1)
  const d=[{name:'Chameleon-7B',ctx:'4,096',batch:'≈8M',drop:'0.1',tokens:'9.2T',note:'QK-Norm + z-loss；原方案使用 dropout'},{name:'Chameleon-34B',ctx:'4,096',batch:'≈12M',drop:'0',tokens:'9.2T',note:'QK-Norm + z-loss + norm reordering'}][m]
  return <div className="lab"><LabTop n="04" t="切换 7B 与 34B 的训练账本" source="论文 Table 1–2"/>
    <Tabs labels={['7B 参数','34B 参数']} on={m} set={setM}/>
    <div className="modelcard"><div><small>MODEL CARD</small><h3>{d.name}</h3><p>{d.note}</p></div><dl>{[['上下文',d.ctx],['全局批量',d.batch+' token'],['Dropout',d.drop],['总训练量',d.tokens]].map(x=><div key={x[0]}><dt>{x[0]}</dt><dd>{x[1]}</dd></div>)}</dl></div>
    <div className="recipe">{[['优化器','AdamW β₁=0.9, β₂=0.95'],['Warm-up','4,000 steps'],['Weight decay','0.1'],['梯度裁剪','1.0'],['训练轮数','2.1 epochs'],['硬件规模','数千张 A100 80GB']].map(x=><p key={x[0]}><span>{x[0]}</span><b>{x[1]}</b></p>)}</div>
  </div>
}

function AlignmentLab(){
  const data=[['文本','语言指令与对话',24],['代码','代码指令',12],['视觉聊天','图像问答',22],['图像生成','文生图',18],['图文交错','混合输出',16],['安全','拒答与红队',8]]
  const [active,setActive]=useState(2)
  return <div className="lab"><LabTop n="05" t="SFT 不是一锅数据：六类能力共同对齐" source="论文 §3.1"/>
    <div className="palette"><div className="wheel">{data.map((x,i)=><button className={active===i?'on':''} style={{flexGrow:Number(x[2])}} onClick={()=>setActive(i)} key={x[0]}><span>{x[0]}</span></button>)}</div>
    <article><small>当前样本族</small><h3>{data[active][0]}</h3><p>{data[active][1]}。图中宽度仅用于交互区分，论文没有公开六类数据的精确占比。</p><b>对齐目标：让统一预训练模型遵循用户意图，同时保留混合模态输出。</b></article></div>
  </div>
}

function EvidenceLab(){
  const [base,setBase]=useState(0)
  const rows=base===0?[['更好',41.5],['相当',34.5],['更差',24.0]]:[['更好',35.8],['相当',31.6],['更差',32.6]]
  const win=Number(rows[0][1])+Number(rows[1][1])/2
  return <div className="lab"><LabTop n="06" t="把“胜率”还原成胜、平、负" source="论文 Fig. 9"/>
    <Tabs labels={['对 Gemini+','对 GPT-4V+']} on={base} set={setBase}/>
    <div className="votes">{rows.map(([n,v],i)=><div className={'v'+i} style={{width:`${v}%`}} key={String(n)}><b>{v}%</b><span>{n}</span></div>)}</div>
    <div className="equation"><span>论文 win rate</span><b>{rows[0][1]} + 0.5 × {rows[1][1]} = {win.toFixed(1)}%</b><p>“胜率”把平局计半分，因此不能读成 {win.toFixed(1)}% 的回答都直接获胜。每题由 3 位标注者评判。</p></div>
    <div className="evidencegrid">{[['任务完全满足','55.2%','Chameleon；GPT-4V+ 为 44.7%'],['人工偏好','开放式混合输出','评测偏向需要图文交错回答的提示'],['静态基准','多任务','文本、VQA、描述、图像生成分别比较']].map(x=><article key={x[0]}><small>{x[0]}</small><b>{x[1]}</b><p>{x[2]}</p></article>)}</div>
  </div>
}

function LineageLab(){
  const [i,setI]=useState(0)
  const xs=[
    ['Chameleon · 2024','一套离散词表 + next-token','优点：真正任意图文交错。代价：视觉 tokenizer 上限与跨模态训练失稳。'],
    ['Show-o · 2025','共享 Transformer + AR / 离散扩散双目标','保留统一主干，为图像采用并行遮罩预测，减少纯 AR 图像生成的限制。'],
    ['Janus · 2025','理解/生成双视觉编码 + 共享主干','承认两类视觉表征需求冲突，把输入编码路径拆开再统一推理。']
  ]
  return <div className="lab"><LabTop n="07" t="把三篇论文连成一条问题链" source="课程专题串联"/>
    <div className="timeline">{xs.map((x,j)=><button className={i===j?'on':''} onClick={()=>setI(j)} key={x[0]}><i>{j+1}</i><span>{x[0]}</span></button>)}</div>
    <article className="linecard"><small>统一策略</small><h3>{xs[i][1]}</h3><p>{xs[i][2]}</p></article>
    <blockquote>演进主线：先统一 token 和目标，再放宽生成目标，最后解耦互相冲突的视觉表征。后两篇并非简单“更好”，而是在回应 Chameleon 暴露的具体张力。</blockquote>
  </div>
}

function Audit(){
  const items=[
    ['“没有独立视觉 encoder”','基本成立','图像先由独立 tokenizer 离散化；主 Transformer 不再接专用理解 encoder。'],
    ['“9.2T 都是图像 token”','错误','9.2T 是模型见过的总 token；数据包含文本、代码、图文对和交错文档。'],
    ['“60.4% 表示直接赢 60.4%”','错误','41.5% 赢、34.5% 平、24.0% 负；平局按 0.5 计入。'],
    ['“发布版能生成图像”','需限定','论文模型展示图像生成；官方开源说明称图像生成模块未发布。'],
    ['“OCR 也会自然变强”','错误','论文明确指出 tokenizer 难以重建大量文字，构成 OCR 相关任务上限。']
  ]
  const [open,setOpen]=useState(-1)
  return <div className="audit">{items.map((x,i)=><button className={open===i?'open':''} onClick={()=>setOpen(open===i?-1:i)} key={x[0]}><span>{x[0]}<b>{x[1]}</b></span>{open===i&&<p>{x[2]}</p>}</button>)}</div>
}

function Quiz(){
  const qs:[string,string[],number][]=[
    ['512×512 图像会被编码为多少离散 token？',['256','1,024','8,192'],1],
    ['65,536 指什么？',['统一 BPE 词表规模','图像尺寸','训练步数'],0],
    ['论文中两种规模都离不开？',['QK-Norm','34B dropout','独立 CLIP encoder'],0],
    ['对 Gemini+ 的 60.4% win rate 如何得到？',['直接胜 60.4%','胜 + 一半平局','只统计无平局样本'],1],
    ['最准确的 Chameleon 主张是？',['所有模态使用同一 tokenizer','图像与文本离散化后由同一 AR Transformer 建模','完全消除视觉表征瓶颈'],1]
  ]
  const [a,setA]=useState(qs.map(()=>-1))
  const score=a.reduce((s,v,i)=>s+(v===qs[i][2]?1:0),0)
  return <div className="quiz">{qs.map((q,i)=><fieldset key={q[0]}><legend><b>{i+1}</b>{q[0]}</legend>{q[1].map((x,j)=><button className={a[i]===j?(j===q[2]?'right':'wrong'):''} onClick={()=>setA(a.map((v,k)=>k===i?j:v))} key={x}>{x}</button>)}</fieldset>)}<div className="score"><small>READING SCORE</small><b>{score}/5</b><p>{score===5?'你已抓住架构、稳定性与证据口径。':'答完五题；错误项可回到对应章节核对。'}</p></div></div>
}

export default function App(){
  const [active,setActive]=useState('thesis'),[prog,setProg]=useState(0)
  useEffect(()=>{const f=()=>{const max=document.documentElement.scrollHeight-innerHeight;setProg(max?scrollY/max*100:0);let a='thesis';nav.forEach(([id])=>{const el=document.getElementById(id);if(el&&el.getBoundingClientRect().top<innerHeight*.42)a=id});setActive(a)};f();addEventListener('scroll',f,{passive:true});return()=>removeEventListener('scroll',f)},[])
  return <><div className="progress" style={{width:`${prog}%`}}/><nav><a className="mark" href="#top">C<span>H</span></a>{nav.map(([id,n],i)=><a className={active===id?'active':''} href={'#'+id} key={id}><i>{String(i+1).padStart(2,'0')}</i>{n}</a>)}</nav><main id="top">
    <section className="hero"><div className="hero-copy"><small>MIXED-MODAL READING LAB · 04</small><h1>把图像<br/><em>写进句子</em></h1><p>Chameleon 把像素压成离散“视觉词”，让图像、文字和代码进入同一条序列。但真正困难的，是让这些词在一套参数里稳定共存。</p><aside><a href="#thesis">开始解剖 ↓</a><a href="https://arxiv.org/abs/2405.09818" target="_blank">原论文 ↗</a></aside><dl>{[['图像输入','512²'],['视觉 token','1,024'],['统一词表','65,536'],['训练 token','9.2T']].map(x=><div key={x[0]}><dt>{x[0]}</dt><dd>{x[1]}</dd></div>)}</dl></div>
    <figure className="cover-art"><div className="textline">THE <b>MODEL</b> SEES</div><div className="visualgrid">{Array.from({length:36},(_,i)=><i style={{opacity:.35+(i%6)/10}} key={i}/>)}</div><div className="textline">ONE <b>SEQUENCE</b></div><span>TEXT / IMAGE / CODE</span></figure></section>

    <section id="thesis" className="paper"><H n="01" k="EARLY FUSION" t="统一发生在模型入口" p="许多多模态系统先用视觉 encoder 提取特征，再接语言模型。Chameleon 更激进：先把图像离散成 token，再与文本一起从头训练同一个 Transformer。"/>
      <div className="routes"><article><small>LATE FUSION</small><h3>视觉专家 → 投影 → LLM</h3><p>模态先各自编码，在高层连接。</p></article><article className="focus"><small>CHAMELEON</small><h3>图像 token + 文本 token → 同一 Transformer</h3><p>从第一个模型层开始共享表示与参数。</p></article><article><small>SEPARATE GENERATOR</small><h3>LLM → 扩散模型</h3><p>理解与像素生成由不同系统完成。</p></article></div>
      <div className="thesis"><b>早期融合的收益</b><p>任何图文次序都能写成同一概率分解，模型可理解、续写并生成混合文档。</p><b>它带来的新问题</b><p>不同模态共享权重并竞争表示尺度，长训练中会出现难以提前察觉的范数增长与损失发散。</p></div>
    </section>

    <section id="tokenizer" className="clay"><H n="02" k="DISCRETE VISION" t="先把像素翻译成词表索引" p="图像 tokenizer 用 8,192 个视觉代码表示局部图像块；文本 BPE 与视觉代码合并成 65,536 大小的词表。"/><TokenizerLab/></section>
    <section id="sequence" className="ink"><H n="03" k="ONE NEXT-TOKEN INTERFACE" t="图像和文字，共用一个预测问题" p="训练样本覆盖纯文本、单图文对以及完整交错文档。模型只需持续回答：下一个离散 token 是什么？"/><SequenceLab/></section>
    <section id="stability" className="acid"><H n="04" k="THE HARD PART" t="统一模型的难点，是数值稳定" p="模态竞争会放大 hidden state、attention logits 与最终 softmax。发散可能到训练 20–30% 后才暴露，因此论文把稳定性当作核心贡献。"/><StabilityLab/></section>
    <section id="scale" className="paper"><H n="05" k="SCALING RECIPE" t="9.2T token 背后的训练配方" p="Chameleon-7B 与 34B 都使用 4K 上下文并训练 2.1 个 epoch。相同主张在不同规模需要不同的稳定化细节。"/><ScaleLab/></section>
    <section id="alignment" className="clay"><H n="06" k="POST-TRAINING" t="预训练学会续写，对齐学会完成任务" p="监督微调数据分为文本、代码、视觉聊天、图像生成、交错图文生成和安全六类，覆盖统一模型的多种输出形态。"/><AlignmentLab/></section>
    <section id="evidence" className="ink"><H n="07" k="READ THE CLAIMS CAREFULLY" t="数字很强，口径更重要" p="论文把 Chameleon 与只能输出文字的 API 模型比较，并额外构造加入图片的 Gemini+、GPT-4V+ 基线。理解胜率前，先拆开胜、平、负。"/><EvidenceLab/></section>
    <section id="lineage" className="paper"><H n="08" k="THREE-PAPER THREAD" t="从 Chameleon 到 Show-o，再到 Janus" p="把已读三篇论文放在同一坐标系里，可以看到统一多模态模型如何逐步处理生成效率与表征冲突。"/><LineageLab/></section>
    <section id="limits" className="clay"><H n="09" k="LIMITS & RELEASE GAP" t="论文能力、开源能力与评测结论要分开" p="Chameleon 的贡献明确，但视觉 tokenizer、评测设计与模型发布范围都限定了我们能下多强的结论。"/><Audit/><div className="limits"><article><b>Tokenizer 上限</b><p>重建大量文字较弱，限制 OCR 与含字图像生成。</p></article><article><b>评测偏向</b><p>开放式提示要求图文混合输出，对文本-only API 不完全对称。</p></article><article><b>发布差距</b><p>官方仓库提供推理代码和 checkpoint；图像生成模块未随实现发布。</p></article><article><b>安全样本</b><p>论文安全评测很大，但 crowdsourced prompt 仍不能覆盖真实部署分布。</p></article></div></section>
    <section id="quiz" className="acid"><H n="10" k="UNDERSTANDING CHECK" t="你是否读懂了 Chameleon？" p="五题覆盖 tokenization、稳定训练、评测口径与论文主张。"/><Quiz/><div className="takeaway"><small>ONE SENTENCE TO KEEP</small><h2>统一不只是一套架构，<br/>更是一场跨模态数值平衡。</h2><aside><a href="https://arxiv.org/abs/2405.09818" target="_blank">论文 ↗</a><a href="https://github.com/facebookresearch/chameleon" target="_blank">代码 ↗</a><a href="https://grokcv.site/sprouts/umm/" target="_blank">专题 ↗</a></aside></div></section>
  </main><footer>CHAMELEON · 何熹淳 · XichunHe · 事实与数值以原论文为准</footer></>
}
