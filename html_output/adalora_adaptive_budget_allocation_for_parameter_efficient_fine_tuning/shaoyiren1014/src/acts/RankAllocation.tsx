import {AnimatePresence,motion} from 'framer-motion';
import Icon from '../components/Icon';
import BudgetAllocator from '../components/BudgetAllocator';
import {rankExperiment,rankMechanism,rankPredictions} from '../data/rankAllocation';
import {figure1} from '../data/paperEvidence';
import {eligibleRank,rankSections,type useRank} from '../store/rankStore';
type Props=ReturnType<typeof useRank>&{reduced:boolean;onRoute:()=>void;onNext:()=>void};
export default function RankAllocation({state:s,dispatch:d,reduced,onRoute,onNext}:Props){
  const next=(value:number)=>d({type:'step',value});
  const prediction=rankPredictions.find(p=>p.id===s.prediction);
  const changed=s.ranks.some((r,i)=>r!==rankExperiment.initialRanks[i]);
  return <>
    <nav className="section-nav council-nav" aria-label="本章各部分">{rankSections.map((name,i)=><button key={name} disabled={!eligibleRank(s,i)} aria-current={s.step===i?'step':undefined} onClick={()=>next(i)}><span>{s.completed||i<s.step?<Icon name="check" size={12}/>:String(i+1).padStart(2,'0')}</span><span className="section-name">{name}</span></button>)}</nav>
    <AnimatePresence mode="wait" initial={false}><motion.article key={s.step} initial={{opacity:reduced?1:0,y:reduced?0:8}} animate={{opacity:1,y:0}} exit={{opacity:reduced?1:0}} transition={{duration:reduced?0:.2}}>
      {s.step===0&&<section className="reading-section wide council-opening">
        <p className="eyebrow"><Icon name="sliders" size={17}/>ACT 2 / RANK ALLOCATION</p><h1>工具总数不变，<br/><span>换一个分配办法。</span></h1>
        <p className="section-description">上一章，我们看见不同位置可能需要不同的适配容量。现在由你来调整份额。</p><p className="narrative">你接管了四个教学位置，每处先有三条调节通道。总共只有十二条。如果一个位置想多要一条，这一条从哪里来？</p>
        <div className="chapter-itinerary"><span>提出猜想</span><Icon name="arrow"/><span>交换通道</span><Icon name="arrow"/><span>观察代价</span></div><p className="inline-note">本章的 Rank 可以理解为小支路的通道数。我们只观察容量怎样分配，训练效果还没有测量。</p>
        <Continue text="先留下你的想法，再亲手试一次。" button="我来决定怎样分" onClick={()=>next(1)}/>
      </section>}
      {s.step===1&&<section className="reading-section">
        <Heading index="02" title="想给一处更多，需要付出什么？" description="总预算不能增加。你想试着把更多通道给某个位置，先预测这次调整会发生什么。"/>
        <fieldset className="choices"><legend>你更认同哪一种猜想？</legend>{rankPredictions.map(p=><label key={p.id} className={s.prediction===p.id?'selected':''}><input type="radio" name="rank-prediction" checked={s.prediction===p.id} disabled={!!s.prediction} onChange={()=>d({type:'predict',value:p.id})}/><span className="choice-text">{p.label}<small>{p.detail}</small></span></label>)}</fieldset>
        {s.prediction&&<p className="inline-note">这次预测已记录。即使猜错，也会走完整个观察与修正过程。</p>}
        <Continue text="接下来，指定谁让出通道、谁接收通道。看看能否满足总预算。" button="进入配额台" disabled={!s.prediction} onClick={()=>next(2)}/>
      </section>}
      {s.step===2&&<section className="reading-section wide">
        <Heading index="03" title="一处多一条，另一处少一条。" description="先选转出位置，再选转入位置。每次只交换一个 Rank，不会悄悄改动其他位置。你可以多试几种份额，再继续。"/>
        <Source/>
        <p className="inline-note">为方便比较，四个示例矩阵都设为 64 × 64；真实 Attention 与 FFN 矩阵未必同尺寸。这里总 Rank 12，对应两小表合计 1,536 个可训练参数。</p>
        <BudgetAllocator state={s} dispatch={d} reduced={reduced}/>
        <details className="technical-details"><summary>如果某处 Rank 降到 0，会怎样？</summary><div className="details-content">本章把 Rank 0 定义为不为该位置分配低秩更新支路。原来的权重矩阵仍参与主模型计算。这里没有删除主模型，也没有展示下一章的贡献强度掩蔽机制。每处上限 8 只是这个教学操作的限制。</div></details>
        <Continue text="交换成功不等于模型变好了。先把我们实际观察到的变化说清楚。" button="观察这次调整的代价" disabled={s.transfers.length===0} onClick={()=>next(3)}/>
      </section>}
      {s.step===3&&<section className="reading-section wide">
        <Heading index="04" title="变的是份额，总量仍然一样。" description="把当前配置与最初的配置放在一起看。多拿的容量来自哪里？别处又让出了多少？"/>
        <Source/>
        <div className="rank-comparison"><div className="rank-ledger-head"><span>位置</span><span>最初 → 当前 Rank</span><span>参数变化</span></div>{rankExperiment.positions.map((p,i)=><div className="rank-comparison-row" key={p.id}><span>{p.id} · {p.name}</span><span>3 <Icon name="arrow" size={16}/> <strong>{s.ranks[i]}</strong></span><span className={s.ranks[i]>3?'gain':s.ranks[i]<3?'loss':''}>{s.ranks[i]===3?'不变':`${s.ranks[i]>3?'+':''}${(s.ranks[i]-3)*128}`}</span></div>)}<div className="rank-comparison-total"><span>合计</span><strong>12 → 12</strong><span>1,536 → 1,536</span></div></div>
        {!changed&&<p className="inline-note">你目前回到了平均配额。之前的交换仍保留在记录中；份额可以改变，也可以恢复。</p>}
        <p className="narrative">在这个同尺寸算例里，一条通道需要 128 个参数。给一个位置增加一条，同时从另一个位置减去一条，总参数量就保持不变。</p>
        <p className="past-prediction"><span>你的最初预测</span><span className="prediction-quote">“{prediction?.label}”</span></p>
        <fieldset className="choices"><legend>这次操作直接证明了什么？</legend>{[['capacity','容量可以转移，但一处增加会占用别处的份额。'],['accuracy','我的配置已经提高了模型准确率。'],['weights','少一条通道，就删除了主模型的一部分知识。']].map(([value,label])=><label key={value} className={s.observation===value?'selected':''}><input type="radio" name="rank-observation" disabled={s.evidenceRead} checked={s.observation===value} onChange={()=>d({type:'observe',value:value as 'capacity'|'accuracy'|'weights'})}/><span className="choice-text">{label}</span></label>)}</fieldset>
        {s.observation&&<p className="feedback" role="status">{s.observation==='capacity'?'这就是我们刚才能直接观察到的预算关系。':s.observation==='accuracy'?'页面只改变了通道份额，没有进行模型训练或评测。':'这里调整的是更新支路容量，原来的主模型权重没有被删除。'}<span>{s.observation==='capacity'?(s.prediction==='free'?'多开的通道也要占参数，所以固定总预算时需要交换。':s.prediction==='accuracy'?'上一章的 FFN 趋势不能保证这次配置提高准确率。':'你的猜想与预算守恒的观察一致。'):'请区分容量变化、原参数和任务表现，再试一次判断。'}</span></p>}
        <Continue text="接下来，把这个预算关系与论文中的 LoRA 结构对应起来。" button="对照论文的解释" disabled={s.observation!=='capacity'} onClick={()=>next(4)}/>
      </section>}
      {s.step===4&&<section className="reading-section">
        <Heading index="05" title="Rank 为什么会占用参数预算？" description="刚才的操作是教学模拟。这里换成原论文的结构说明，确认通道数为什么会与参数数量相关。"/>
        <Source paper/>
        {!s.evidenceRead?<div className="evidence-before"><p>你已经实际调过份额。现在查看论文如何描述 LoRA 的低秩更新。</p><button className="primary-button" onClick={()=>d({type:'read'})}>查看论文机制说明 <Icon name="arrow"/></button></div>:<>
          <p className="evidence-lead">多一条通道，两侧都要多一些参数。</p><p className="narrative">{rankMechanism.intuition}</p>
          <div className="factor-intuition"><span>A · 输入侧小表</span><Icon name="arrow"/><strong>Rank 条通道</strong><Icon name="arrow"/><span>B · 输出侧小表</span></div>
          <p className="narrative">对同一个位置，调大 Rank 会允许更丰富的低秩更新，也会增加可训练参数。是否值得增加，要看任务证据；容量本身不能保证效果。</p>
          <details className="technical-details"><summary>参数数目的简式与适用条件</summary><div className="details-content"><p className="intuition-formula">两小表参数数 = r × (输入尺寸 + 输出尺寸)</p><p>直觉：每条通道都需要输入侧和输出侧的一组参数。r 就是 Rank。在本章，每条需要 64 + 64 = 128 个参数；四处 Rank 合计 12，所以总数是 12 × 128 = 1,536。</p><p>这个数只统计 LoRA 的两个因子，不含偏置、任务头等额外项。Rank 是更新矩阵秩的上限，实际更新也可能存在重复方向。不同尺寸的矩阵，一条 Rank 的参数成本可以不同，因此“总 Rank 不变”并不在所有情况下等于“参数总量不变”。</p><p><strong>来源：</strong>上传 PDF 第 2 页 Sections 1–2、Eq. 1–2 的 LoRA 结构说明。本章算例尺寸和预算由教学设计设定。</p><a href={rankMechanism.source.url} target="_blank" rel="noreferrer">阅读原论文 · arXiv 2303.10512v2 ↗</a></div></details>
          <div className="evidence-reminder" data-source-type="paper_evidence"><p className="eyebrow">回看实验 · 第 2 页 FIGURE 1</p><p>上一章的实验还提醒我们：同样总参数量，放在不同位置，结果可以不同。</p><p className="inline-note">条件：LoRA、DeBERTaV3-base、MNLI-m、0.28M 可训练参数。这个真实对照支持调查位置的价值，没有测量你刚才的四处配置。{figure1.boundary}</p></div>
          <p className="evidence-boundary">{rankMechanism.boundary}本章也没有给出自动判断重要性或自动分配的算法。</p>
        </>}
        <Continue text="知道预算怎样交换之后，还需要知道哪些交换值得做。先整理这一章能确定的结论。" button="修正我的分配认识" disabled={!s.evidenceRead} onClick={()=>next(5)}/>
      </section>}
      {s.step===5&&<section className="reading-section">
        <Heading index="06" title="能调整容量，还没决定最佳分配。" description="你已经完成预测、交换、观察和论文对照。现在选一句既能说明关系、又不超过证据的话。"/>
        <fieldset className="choices"><legend>你会怎样解释这次配额实验？</legend>{[['conditional','Rank 可以调整容量。同尺寸、固定预算下，一处增加需要另一处减少；是否更好还要验证。'],['universal','按上一章的趋势把 Rank 都给 FFN，就能得到所有任务的最佳结果。'],['automatic','只要能手动交换 Rank，就已经实现了 AdaLoRA 的自动分配。']].map(([value,label])=><label key={value} className={s.reflection===value?'selected':''}><input type="radio" name="rank-reflection" disabled={s.completed} checked={s.reflection===value} onChange={()=>d({type:'reflect',value:value as 'conditional'|'universal'|'automatic'})}/><span className="choice-text">{label}</span></label>)}</fieldset>
        {s.reflection&&<p className="feedback" role="status">{s.reflection==='conditional'?'你分清了容量、预算和效果之间的关系。':s.reflection==='universal'?'这条判断把特定实验的趋势变成了所有任务的保证。':'我们只是手动调了份额，还缺少判断重要性和随训练调整的机制。'}<span>{s.reflection==='conditional'?'工具变多意味着改动空间更大，是否有帮助仍需要任务实验。':'回到可直接观察和有论文依据的关系，再修正一次。'}</span></p>}
        <Continue text="把这条发现留在路线中。下一个问题是：谁来决定正确的分配方式？" button="完成本章，点亮路线" disabled={s.reflection!=='conditional'} onClick={()=>d({type:'complete'})}/>
      </section>}
      {s.step===6&&<section className="reading-section completion">
        <p className="eyebrow"><Icon name="check" size={17}/>ACT 2 / DISCOVERY UNLOCKED</p><h2>容量可以调整，<br/>预算需要取舍。</h2><p className="completion-discovery">Rank 是控制低秩适配容量的重要变量。</p><p className="narrative">你用同样的总预算改变了份额。一个位置得到更多，其他位置就要让出一些。容量增加不保证准确率提高。</p>
        <p className="evidence-boundary">这个预算等价关系建立在本章四个同尺寸矩阵的设定上；真实矩阵尺寸不同，还需要计算各自的参数成本。</p>
        <div className="next-preview"><span className="eyebrow">NEXT / ACT 3</span><h3>那么，谁来决定正确的分配方式？</h3><p>我们先需要一种容易调整、容易纠错的更新结构。下一章去检查：能否先调小某个方向的贡献，同时留下再次调整的余地？</p></div>
        <div className="completion-actions"><button className="primary-button" onClick={onNext}>进入 ACT 3 <Icon name="arrow"/></button><button className="text-button" onClick={onRoute}>查看点亮的路线 <Icon name="route"/></button><button className="text-button" onClick={()=>next(2)}>回看配额台 <Icon name="arrow"/></button></div>
      </section>}
    </motion.article></AnimatePresence>
  </>;
}
function Heading({index,title,description}:{index:string;title:string;description:string}){return <div className="section-heading"><p className="eyebrow">{index} / {rankSections[Number(index)-1]}</p><h2>{title}</h2><p className="section-description">{description}</p></div>;}
function Continue({text,button,onClick,disabled=false}:{text:string;button:string;onClick:()=>void;disabled?:boolean}){return <div className="transition"><p>{text}</p><button className="primary-button" onClick={onClick} disabled={disabled}>{button}<Icon name="arrow"/></button></div>;}
function Source({paper=false}:{paper?:boolean}){return <p className={`source-label ${paper?'paper':'simulation'}`} data-source-type={paper?'paper_evidence':'conceptual_simulation'}><span/>{paper?'论文机制说明 · 第 2 页 LoRA 结构 · Eq. 1–2':'教学模拟 · 同尺寸矩阵的 Rank 交换，不测量模型效果'}</p>;}
