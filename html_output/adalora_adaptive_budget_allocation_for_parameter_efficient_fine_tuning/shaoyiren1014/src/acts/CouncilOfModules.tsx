import { AnimatePresence, motion } from 'framer-motion';
import Icon from '../components/Icon';
import { figure1, figure1b } from '../data/paperEvidence';
import { councilSections, eligibleCouncil, type useCouncil } from '../store/councilStore';

type Props = ReturnType<typeof useCouncil> & { reduced: boolean; onRoute:()=>void; onNext:()=>void };
export default function CouncilOfModules({state:s,dispatch:d,reduced,onRoute,onNext}:Props){
  const next=(value:number)=>d({type:'step',value});
  return <>
    <nav className="section-nav council-nav" aria-label="本章各部分">{councilSections.map((name,i)=><button key={name} disabled={!eligibleCouncil(s,i)} aria-current={s.step===i?'step':undefined} onClick={()=>next(i)}><span>{s.completed||i<s.step?<Icon name="check" size={12}/>:String(i+1).padStart(2,'0')}</span><span className="section-name">{name}</span></button>)}</nav>
    <AnimatePresence mode="wait" initial={false}><motion.article key={s.step} initial={{opacity:reduced?1:0,y:reduced?0:8}} animate={{opacity:1,y:0}} exit={{opacity:reduced?1:0}} transition={{duration:reduced?0:.2}}>
      {s.step===0&&<section className="reading-section wide council-opening">
        <p className="eyebrow"><Icon name="layers" size={16}/>ACT 1 / COUNCIL OF MODULES</p>
        <h1>先认识机器，<br/><span>再决定资源给谁。</span></h1>
        <p className="section-description">上一幕留下了一个问题：同样多的参数，为什么换个位置，效果就不同？</p>
        <p className="narrative">先别急着选部门。我们先回顾机器怎样工作、LoRA 改在哪里，以及它怎样省下训练资源。然后，用论文证据检验自己的想法。</p>
        <div className="chapter-itinerary"><span>认识 Transformer</span><Icon name="arrow"/><span>回顾 LoRA</span><Icon name="arrow"/><span>调查资源位置</span></div>
        <p className="inline-note">不需要提前学会矩阵运算。看懂图上的主路和支路，就能继续。</p>
        <Continue text="从一层小处理单元开始。" button="看看机器的结构" onClick={()=>next(1)}/>
      </section>}
      {s.step===1&&<section className="reading-section wide">
        <Heading index="02" title="一台大机器，由许多层组成。" description="Transformer 把信息交给一层又一层的处理单元。每层里有两个主要部分，先点开它们，看看各自在忙什么。"/>
        <Source locator="教学结构示意 · 省略部分细节"/>
        <div className="structure-layout"><div className="layer-stack" aria-label="Transformer 层结构示意"><div className="flow-caption">输入信息</div><div className="flow-line"/><div className="ghost-layer">更早的层 · 重复处理</div><div className="flow-line"/><div className="expanded-layer"><span className="layer-label">展开其中一层</span>{(['Attention','FFN'] as const).map((name,i)=><div key={name}>{i===1&&<div className="flow-line"/>}<button className={`structure-button ${s.structure===name?'active':''}`} aria-pressed={s.structure===name} onClick={()=>d({type:'structure',value:name})}><Icon name={i===0?'route':'sliders'}/><span>{name}<small>{i===0?'联系信息':'加工信息'}</small></span>{s.visited.includes(name)?<Icon name="check"/>:<Icon name="arrow"/>}</button></div>)}</div><div className="flow-line"/><div className="ghost-layer">更后的层 · 继续处理</div><div className="flow-line"/><div className="flow-caption">交给任务输出</div></div>
        <div className="structure-explanation" aria-live="polite">{!s.structure?<><h3>每层都不是一个黑箱。</h3><p>点开 Attention，再点开 FFN。它们一起工作，但做的事不同。</p></>:s.structure==='Attention'?<><p className="eyebrow">ATTENTION / 联系信息</p><h3>哪些词应该互相参考？</h3><p>读“杯子没放稳，它掉了下来”时，“它”需要参考前面的“杯子”。Attention 让不同位置的信息互相联系。</p><p className="inline-note">像各部门先交换线索。内部有 Wq、Wk、Wv、Wo 等权重矩阵，用来变换信息。</p></>:<><p className="eyebrow">FFN / 加工信息</p><h3>收到线索，再进一步加工。</h3><p>FFN 用一组共享的规则，分别处理每个位置的信息。它会先改变表示，再整理成下一步需要的样子。</p><p className="inline-note">像各部门用同一套加工工具处理自己的材料。这里也有权重矩阵，论文记作 Wf1、Wf2。</p></>}
        <p className="visit-progress">已认识 {s.visited.length} / 2 个部分</p></div></div>
        <details className="technical-details"><summary>想再多了解一点结构</summary><div className="details-content">这张图抓住主要关系，省略了残差连接、归一化等细节。不同 Transformer 的具体顺序和激活函数可以不同。“层”指一整套重复单元；Attention、FFN 是层里的部分，不是两种互不相干的模型。</div></details>
        <Continue text="这些部分都有原来的参数。LoRA 要改动它们，却不用重新训练整台机器。" button="找到 LoRA 的位置" disabled={s.visited.length!==2} onClick={()=>next(2)}/>
      </section>}
      {s.step===2&&<section className="reading-section wide">
        <Heading index="03" title="大表不动，旁边加一条小支路。" description="选中一个权重矩阵，把它想成机器里的大参数表。切换两种训练方式，观察哪些部分需要调整。"/>
        <Source locator="教学结构示意 · 不是训练日志"/>
        <div className="mode-switch" role="group" aria-label="训练方式">{(['full','lora'] as const).map(mode=><button className={`secondary-button ${s.modes.includes(mode)&&s.tuningMode===mode?'is-active':''}`} key={mode} aria-pressed={s.modes.includes(mode)&&s.tuningMode===mode} onClick={()=>d({type:'mode',value:mode})}>{mode==='full'?'全量微调':'LoRA 微调'}{s.modes.includes(mode)&&<Icon name="check" size={14}/>}</button>)}</div>
        <div className="lora-layout"><LoraBlueprint mode={s.tuningMode}/><div aria-live="polite"><h3 className="diagram-title">{s.tuningMode==='full'?'直接调整原来的大表。':'保留大表，只训练两张小表。'}</h3><p className="narrative">{s.tuningMode==='full'?'全量微调会更新模型原有的参数。这里先观察其中一张大表：每个格子都可能需要调整。':'LoRA 冻结选定的原权重，用 A、B 两张小表组成更新支路。主路的结果与支路的改动相加，得到这次任务使用的结果。'}</p><p className="inline-note">LoRA 可以作用在选定的 Attention 或 FFN 权重矩阵上。它的位置，是原矩阵的更新支路。</p><p className="visit-progress">已比较 {s.modes.length} / 2 种方式</p></div></div>
        <details className="technical-details"><summary>用一行式子对应图上的位置</summary><div className="details-content"><p className="intuition-formula">W = W₀ + BA</p><p>直觉：原来的大表 W₀ 不动；B 和 A 合起来补上这次任务需要的改动。图中的输入先经过 A，再经过 B，所以写作 BA。这里省略缩放系数。</p><p>这条更新支路作用于选定的权重矩阵。独立 Adapter 的典型做法是在网络中插入额外的变换模块；不要把它和这张图上的 LoRA 位置混为一谈。</p></div></details>
        <Continue text="小支路为什么省钱？接下来，不用抽象术语，直接数一数需要训练的格子。" button="数数要训练的参数" disabled={s.modes.length!==2} onClick={()=>next(3)}/>
      </section>}
      {s.step===3&&<section className="reading-section wide">
        <Heading index="04" title="两张小表，比一张大表小多少？" description="先做预测，再看一个简化例子。假设大表有 64 × 64 个格子，LoRA 只开 2 条调节通道。这里的通道数，就叫 Rank。"/>
        <Source locator="教学算例 · 非论文模型的实际参数统计"/>
        <Prediction name="count" question="只训练这两张小表，参数数量会怎样？" value={s.countPrediction} options={ [['fewer','比训练整张大表更少'],['same','和整张大表一样多'],['more','比整张大表更多']] } onChange={value=>d({type:'predictCount',value})}/>
        {!s.countObserved?<button className="primary-button" disabled={!s.countPrediction} onClick={()=>d({type:'observeCount'})}>核对这个算例 <Icon name="arrow"/></button>:<>
          <p className="feedback">{s.countPrediction==='fewer'?'你的预测符合这个算例。':'这个算例里，两张小表加起来更小。'}<span>当 Rank 足够小时，只训练小支路能大幅减少可训练参数。</span></p>
          <div className="parameter-comparison"><div><span>原大表 · 全部训练</span><strong>4,096</strong><small>64 × 64 个参数</small><div className="parameter-line"><span style={{width:'100%'}}/></div></div><div><span>两张小表 · 只训练支路</span><strong>{128*s.rank}</strong><small>64 × {s.rank} + {s.rank} × 64 个参数</small><div className="parameter-line"><span className="teal-line" style={{width:`${s.rank/32*100}%`}}/></div></div></div>
          <label className="rank-control" htmlFor="rank-range"><span>试着改变通道数 · Rank <strong>{s.rank}</strong></span><input id="rank-range" aria-label="LoRA 调节通道数 Rank" type="range" min="1" max="8" step="1" value={s.rank} onChange={e=>d({type:'rank',value:Number(e.target.value)})}/><span>1 条 <span>8 条</span></span></label>
          <p className="narrative" aria-live="polite">每多开一条通道，两侧都需要增加一小列或一小行参数。容量增加了，需要训练的参数也增加了。</p><p className="inline-note">这个例子只数选定矩阵的参数，不含偏置、任务头等额外项。更多通道不保证任务准确率更高。请实际移动一次滑块，再继续。</p>
          <details className="technical-details"><summary>对应的简式与直觉</summary><div className="details-content"><p className="intuition-formula">小支路参数数 = r × (64 + 64)</p><p>直觉：每条通道都需要两侧的小参数表。r 是通道数；这里两侧的尺寸恰好都是 64。这是参数数量的计算，不是预测训练效果的公式。</p></div></details>
        </>}
        <Continue text="我们知道怎样省参数了。可是每个位置都开一样多的通道，合适吗？" button="看看旧分配办法" disabled={!s.countObserved||!s.rankChanged} onClick={()=>next(4)}/>
      </section>}
      {s.step===4&&<section className="reading-section">
        <Heading index="05" title="省下来了，还要分得合适。" description="下面是一个简单配置：六个同尺寸的位置，每处都开两条通道。配置很方便，但没有先调查各处的任务需求。"/>
        <Source locator="相同尺寸、相同 Rank 的教学配置"/>
        <div className="uniform-ranks">{figure1.rows.map(r=><div key={r.id}><span>{r.group} · {r.id}</span><div><i/><i/></div><small>Rank 2</small></div>)}</div>
        <p className="narrative">这像给每个部门同样多的调节工具。可是，刚才我们看见 Attention 和 FFN 做的事不同，不同层也处在不同处理位置。</p>
        <p className="narrative">现在要问的不是“LoRA 能不能省参数”，而是“省下来的改动容量，放在哪里更值得”。</p>
        <details className="technical-details"><summary>“平均分配”准确指什么？</summary><div className="details-content">这里指对目标矩阵采用预先设定的相同 Rank，不是把每个原始权重平均修改。LoRA 也允许人为设定不同 Rank；旧配置缺少自动按重要性调整的机制。不同尺寸的矩阵即使 Rank 一样，需要训练的参数数量也可能不同。</div></details>
        <Continue text="先提出一个猜想，再用保持总参数量相同的论文实验检验它。" button="调查不同模块" onClick={()=>{d({type:'uniform'});next(5);}}/>
      </section>}
      {s.step===5&&<section className="reading-section wide">
        <Heading index="06" title="同样预算，放在什么模块？" description="现在进入原论文的实验记录。你先预测，再选一个矩阵位置，把它作为重点观察对象。不会在这里训练模型。"/>
        <Source paper locator="第 2 页 · Figure 1a"/>
        <Prediction name="module" question="你猜，这个实验里哪一类位置可能更值得适配？" value={s.modulePrediction} options={ [['attention','Attention：负责联系信息'],['ffn','FFN：负责加工信息'],['same','相同预算，结果应该差不多']] } onChange={value=>d({type:'predictModule',value})}/>
        <fieldset className="selection-field"><legend>选一个位置，重点观察它的研究记录</legend><div className="matrix-select">{figure1.rows.map(r=><button key={r.id} className={`secondary-button ${s.moduleSelection===r.id?'is-active':''}`} aria-pressed={s.moduleSelection===r.id} onClick={()=>d({type:'selectModule',value:r.id})}><span>{r.group}</span>{r.id}</button>)}</div></fieldset>
        {!s.moduleRead?<button className="primary-button" disabled={!s.modulePrediction||!s.moduleSelection} onClick={()=>d({type:'readModule'})}>揭示模块实验 <Icon name="arrow"/></button>:<>
          <div className="evidence-layout"><div><p className="evidence-lead">这次，FFN 的两个位置较高。</p><p className="narrative">在这组对照里，把同样总量的参数用于 FFN 的两种矩阵，结果分别高于四种 Attention 矩阵。</p><p className="selected-evidence" aria-live="polite">你重点观察的是 {s.moduleSelection}，原记录为 {figure1.rows.find(r=>r.id===s.moduleSelection)?.value.toFixed(2)}%。这是查阅已有记录，不是你的选择生成的成绩。</p><p className="evidence-boundary">它提示这个实验中的适配价值有差异，不能推出所有任务都应优先 FFN。这里也没有改变 Rank 大小来测试准确率。</p></div><EvidencePlot rows={figure1.rows.map(r=>({...r,beginner:r.id}))} selected={s.moduleSelection} min={88.5} max={90} title="不同矩阵位置 · MNLI-m 正确率"/></div>
          <EvidenceConditions panel="a"/>
        </>}
        <Continue text="位置除了模块类型，还有层的先后。把这个问题单独拿出来再检查一次。" button="调查不同层组" disabled={!s.moduleRead} onClick={()=>next(6)}/>
      </section>}
      {s.step===6&&<section className="reading-section wide">
        <Heading index="07" title="同样预算，放在较早还是较后的层？" description="这是另一组独立实验：研究者选择连续三层，把相同总量的可训练参数放在那里，比较四种层组。"/>
        <Source paper locator="第 2 页 · Figure 1b"/>
        <Prediction name="layer" question="你猜，这个实验里哪一组可能较高？" value={s.layerPrediction} options={ [['lower','较早的层：先处理输入'],['higher','较后的层：更靠近任务输出'],['same','层的位置应该没有区别']] } onChange={value=>d({type:'predictLayer',value})}/>
        <fieldset className="selection-field"><legend>选一组层，重点观察它的研究记录</legend><div className="layer-select">{figure1b.rows.map((r,i)=><button className={`secondary-button ${s.layerSelection===r.id?'is-active':''}`} key={r.id} aria-pressed={s.layerSelection===r.id} onClick={()=>d({type:'selectLayer',value:r.id})}><span className="mini-layers" aria-hidden="true">{[0,1,2,3].map(j=><i key={j} className={j===i?'lit':''}/>)}</span><span>{r.beginner}</span><small>{i===0?'更早':i===3?'更后':'中间'}</small></button>)}</div></fieldset>
        {!s.layerRead?<button className="primary-button" disabled={!s.layerPrediction||!s.layerSelection} onClick={()=>d({type:'readLayer'})}>揭示层组实验 <Icon name="arrow"/></button>:<>
          <div className="evidence-layout"><div><p className="evidence-lead">这次，较后的层组较高。</p><p className="narrative">同样的总参数量，放在第 10–12 层的结果高于第 1–3 层。后两组之间的差距，也比前两组之间小。</p><p className="selected-evidence" aria-live="polite">你重点观察的是第 {s.layerSelection} 层，原记录为 {figure1b.rows.find(r=>r.id===s.layerSelection)?.value.toFixed(2)}%。</p><p className="evidence-boundary">这是该模型、任务和配置的结果。换任务、模型或预算，需要重新验证。“越高层越好”不是通用规则。</p></div><EvidencePlot rows={figure1b.rows} selected={s.layerSelection} min={75} max={90} title="不同层组 · MNLI-m 正确率"/></div>
          <EvidenceConditions panel="b"/>
          <p className="inline-note">Figure 1a 与 1b 是独立实验，不能把你选的模块和层组拼起来，当作一个已经测过的组合。</p>
        </>}
        <Continue text="两份记录都提醒我们：数量之外，位置也重要。现在给这条认识加上条件。" button="修正我的判断" disabled={!s.layerRead} onClick={()=>next(7)}/>
      </section>}
      {s.step===7&&<section className="reading-section">
        <Heading index="08" title="我们能说到哪一步？" description="你已经从小支路看到真实研究记录。最后，把观察与保证区分开。"/>
        <div className="journal-lines prediction-summary"><div><span>你的模块预测</span><p>{s.modulePrediction==='ffn'?'FFN 可能较高':s.modulePrediction==='attention'?'Attention 可能较高':'相同预算，结果可能相近'}</p></div><div><span>你的层组预测</span><p>{s.layerPrediction==='higher'?'较后的层可能较高':s.layerPrediction==='lower'?'较早的层可能较高':'层的位置可能没有区别'}</p></div></div>
        <fieldset className="choices"><legend>你现在会怎样向下一位工程师解释？</legend>{[['universal','以后所有任务，都把预算放到 FFN 和最高层。'],['conditional','LoRA 用小支路省参数；不同位置的适配价值可能不同，应按任务证据分配。'],['rank','只要增加 Rank，就一定能提高准确率。']].map(([value,label])=><label key={value} className={s.reflection===value?'selected':''}><input type="radio" name="council-reflection" checked={s.reflection===value} disabled={s.completed} onChange={()=>d({type:'reflect',value})}/><span className="choice-text">{label}</span></label>)}</fieldset>
        {s.reflection&&<p className="feedback" role="status">{s.reflection==='conditional'?'你把省参数的方法和分配问题连接起来了，也保留了实验的条件。':'这句话给出的保证，超过了我们看到的证据。'}<span>{s.reflection==='rank'?'更大 Rank 会增加容量和参数量，但这两组实验没有证明它必然提高准确率。':s.reflection==='universal'?'这两份研究记录只能支持本实验中的比较。其他任务是否相同，还需要调查。':'模块与层组的价值需要观察，不能只按名字决定。'}</span></p>}
        <Continue text="旧办法已经省了参数。下一步，我们学习怎样把有限的容量重新分配。" button="完成本章，点亮路线" disabled={s.reflection!=='conditional'} onClick={()=>d({type:'complete'})}/>
      </section>}
      {s.step===8&&<section className="reading-section completion">
        <p className="eyebrow"><Icon name="check" size={17}/>ACT 1 / DISCOVERY UNLOCKED</p><h2>同样的工具，<br/>不同的位置。</h2><p className="completion-discovery">模块重要性可能不同。<br/><small>Importance varies across modules.</small></p><p className="narrative">LoRA 冻结原来的大表，用低秩支路减少可训练参数。论文的这组实验又提示：适配容量放在不同模块、不同层组，效果会不同。</p><p className="evidence-boundary">FFN 和较高层的优势限于刚才的实验。你学会的是带着任务条件调查位置，而不是记住一个永远最好的部门。</p>
        <div className="next-preview"><span className="eyebrow">NEXT / ACT 2</span><h3>资源总量不变，怎样调整容量？</h3><p>下一幕把 Rank 当成可分配的调节通道。一个位置得到更多，其他位置就需要让出一些。</p></div>
        <div className="completion-actions"><button className="primary-button" onClick={onNext}>进入 ACT 2 <Icon name="arrow"/></button><button className="text-button" onClick={onRoute}>查看点亮的路线 <Icon name="route"/></button><button className="text-button" onClick={()=>next(0)}>回看这一幕</button></div>
      </section>}
    </motion.article></AnimatePresence>
  </>;
}
function Heading({index,title,description}:{index:string;title:string;description:string}){return <div className="section-heading"><p className="eyebrow">{index} / {councilSections[Number(index)-1]}</p><h2>{title}</h2><p className="section-description">{description}</p></div>;}
function Continue({text,button,onClick,disabled=false}:{text:string;button:string;onClick:()=>void;disabled?:boolean}){return <div className="transition"><p>{text}</p><button className="primary-button" disabled={disabled} onClick={onClick}>{button}<Icon name="arrow"/></button></div>;}
function Source({paper=false,locator}:{paper?:boolean;locator:string}){return <p className={`source-label ${paper?'paper':'simulation'}`} data-source-type={paper?'paper_evidence':'conceptual_simulation'}><span/>{paper?'论文证据':'帮助理解的模拟'} · {locator}</p>;}
function Prediction({name,question,value,options,onChange}:{name:string;question:string;value:string|null;options:string[][];onChange:(value:string)=>void}){return <fieldset className="choices compact-choices"><legend>{question}</legend>{options.map(([id,label])=><label key={id} className={value===id?'selected':''}><input type="radio" name={name} checked={value===id} disabled={!!value} onChange={()=>onChange(id)}/><span className="choice-text">{label}</span></label>)}{value&&<p className="inline-note">已记录这次预测。选错也可以继续，看完证据再修正。</p>}</fieldset>;}
function LoraBlueprint({mode}:{mode:'full'|'lora'}){const lora=mode==='lora';return <svg className="lora-blueprint" viewBox="0 0 480 320" role="img" aria-label={lora?'LoRA：输入经过冻结的大表，同时经过可训练的 A、B 小表，两路结果相加。':'全量微调：输入经过可训练的大表得到输出。'}>
  <defs><pattern id="matrix-grid" width="12" height="12" patternUnits="userSpaceOnUse"><path d="M12 0H0V12" fill="none" stroke="currentColor" strokeWidth=".5"/></pattern></defs>
  <g fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M35 158H92M222 158H383M406 158H450"/>{lora&&<path d="M62 158V62H92M155 62H210M273 62H395V147"/>}<path d="m443 153 7 5-7 5"/></g>
  <text x="28" y="185">输入</text><text x="415" y="185">输出</text>
  <rect x="92" y="113" width="130" height="90" className={lora?'frozen-matrix':'trainable-matrix'}/><rect x="98" y="119" width="118" height="78" fill="url(#matrix-grid)" opacity=".5"/>
  <text x="157" y="239" textAnchor="middle">{lora?'W₀ · 原来的大表':'W · 原来的大表'}</text><text x="157" y="265" textAnchor="middle" className={lora?'svg-muted':'svg-teal'}>{lora?'冻结 · 原参数不变':'训练 · 调整原参数'}</text>
  {lora&&<><rect x="92" y="36" width="63" height="50" className="trainable-matrix"/><rect x="210" y="36" width="63" height="50" className="trainable-matrix"/><text x="123" y="67" textAnchor="middle">A</text><text x="241" y="67" textAnchor="middle">B</text><text x="182" y="21" textAnchor="middle" className="svg-teal">训练两张小表 · 更新支路</text><circle cx="395" cy="158" r="12" fill="var(--bg)" stroke="currentColor"/><path d="M389 158h12M395 152v12" stroke="currentColor"/></>}
  <text x="240" y="308" textAnchor="middle" className="svg-muted">选定的 Attention / FFN 权重矩阵</text>
</svg>;}
function EvidencePlot({rows,selected,min,max,title}:{rows:{id:string;beginner:string;value:number}[];selected:string|null;min:number;max:number;title:string}){return <div className="evidence-chart council-chart"><div className="chart-heading"><span>{title}</span><small>原论文已有记录 · 越高越好</small></div><div className="point-chart"><div className="chart-axis">{[0,1,2,3].map(i=><span key={i}>{(min+(max-min)*i/3).toFixed(1)}</span>)}</div>{rows.map(r=><div className={`point-row ${selected===r.id?'point-selected':''}`} key={r.id}><span>{r.beginner}</span><div className="point-track"><span className="point" style={{left:`${(r.value-min)/(max-min)*100}%`}}/></div><span className="point-value">{r.value.toFixed(2)}</span></div>)}</div><p className="chart-footnote">正确率（%）· 局部坐标范围 {min}–{max}%，用于看清差异。高亮表示你选的观察对象。</p></div>;}
function EvidenceConditions({panel}:{panel:'a'|'b'}){const rows=panel==='a'?figure1.rows.map(r=>({name:`${r.group} · ${r.id}`,value:r.value})):figure1b.rows.map(r=>({name:r.beginner,value:r.value}));return <details className="technical-details"><summary>展开研究问题、控制条件与原始数据</summary><div className="details-content"><p><strong>研究问题：</strong>相同总参数量，{panel==='a'?'放在不同矩阵位置':'放在不同层组'}，表现是否不同？</p><p><strong>保持不变：</strong>LoRA、DeBERTaV3-base、MNLI-m、总可训练参数 0.28M（约 28 万）。</p><p><strong>改变条件：</strong>{panel==='a'?'每次在所有层的一种目标矩阵类型上使用 LoRA。':'每次在选定的连续三层组内的矩阵上使用 LoRA。'}</p><p><strong>相对表现与趋势：</strong>{panel==='a'?'FFN 的两个位置高于四种 Attention 位置。':'较后层组较高，后两组的差距较小。'}</p><p><strong>适用条件：</strong>只支持本模型、任务、预算与配置的比较；图注未独立说明 split 与随机种子协议。两面板是独立对照。</p><table><caption>原论文第 2 页 · Figure 1{panel}</caption><thead><tr><th>实验位置</th><th>MNLI-m 正确率 %</th></tr></thead><tbody>{rows.map(r=><tr key={r.name}><td>{r.name}</td><td>{r.value.toFixed(2)}</td></tr>)}</tbody></table><a href={figure1.source.url} target="_blank" rel="noreferrer">阅读原论文 · arXiv 2303.10512v2 ↗</a></div></details>;}
