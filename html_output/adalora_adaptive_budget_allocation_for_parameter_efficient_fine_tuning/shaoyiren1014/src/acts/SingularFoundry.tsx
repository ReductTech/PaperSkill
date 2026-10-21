import {AnimatePresence,motion} from 'framer-motion';
import Icon from '../components/Icon';
import SingularTriplet from '../components/SingularTriplet';
import {foundryPredictions,foundryEvidence} from '../data/singularFoundry';
import {foundrySections,eligibleFoundry,type useFoundry} from '../store/foundryStore';
type Props=ReturnType<typeof useFoundry>&{reduced:boolean;onRoute:()=>void;onNext:()=>void};
export default function SingularFoundry({state:s,dispatch:d,reduced,onRoute,onNext}:Props){
  const next=(value:number)=>d({type:'step',value});
  return <>
    <nav className="section-nav council-nav" aria-label="本章各部分">{foundrySections.map((name,i)=><button key={name} disabled={!eligibleFoundry(s,i)} aria-current={s.step===i?'step':undefined} onClick={()=>next(i)}><span>{s.completed||i<s.step?<Icon name="check" size={12}/>:String(i+1).padStart(2,'0')}</span><span className="section-name">{name}</span></button>)}</nav>
    <AnimatePresence mode="wait" initial={false}><motion.article key={s.step} initial={{opacity:reduced?1:0,y:reduced?0:8}} animate={{opacity:1,y:0}} exit={{opacity:reduced?1:0}} transition={{duration:reduced?0:.2}}>
      {s.step===0&&<section className="reading-section wide council-opening">
        <p className="eyebrow"><Icon name="sliders" size={17}/>ACT 3 / SINGULAR FOUNDRY</p><h1>先调小贡献，<br/><span>给调整留点余地。</span></h1>
        <p className="section-description">上一章你调了各处的容量。现在走进奇异方向工坊，检查一条更新内部怎样调整。</p><p className="narrative">想象一条小支路有几种改动方向。某个方向暂时不需要了，是把它的贡献关掉，还是把两端的方向参数一起删掉？这会影响以后能否方便地再调整。</p>
        <div className="chapter-itinerary"><span>猜一猜</span><Icon name="arrow"/><span>关闭再打开</span><Icon name="arrow"/><span>比较两种结构</span></div>
        <p className="inline-note">“方向”可以理解为一种有组织的改动方式；“强度”是它现在贡献多少。本章只理解这个区别，不计算复杂分解。</p>
        <Continue text="先不用记 P、Λ、Q。带着‘以后还能不能调整’这个问题开始。" button="进入奇异方向工坊" onClick={()=>next(1)}/>
      </section>}
      {s.step===1&&<section className="reading-section">
        <Heading index={1} title="暂时不用，就要彻底删除吗？" description="工坊准备减少一个方向的贡献。你希望保留纠错余地，先预测哪种处理更合适。"/>
        <fieldset className="choices"><legend>你最初的想法是什么？</legend>{foundryPredictions.map(p=><label key={p.id} className={s.prediction===p.id?'selected':''}><input type="radio" name="foundry-prediction" checked={s.prediction===p.id} disabled={!!s.prediction} onChange={()=>d({type:'predict',value:p.id})}/><span className="choice-text">{p.label}</span></label>)}</fieldset>
        {s.prediction&&<p className="inline-note">预测已保存。接下来两种处理都会亲手检查，猜错也不会跳过知识。</p>}
        <Continue text="先试着关闭贡献，看一看两端发生了什么。" button="展开更新支路" disabled={!s.prediction} onClick={()=>next(2)}/>
      </section>}
      {s.step===2&&<section className="reading-section wide">
        <Heading index={2} title="关掉一条贡献，再把它打开。" description="这条支路分成三个部分：Q 找到输入线索，Λ 调节强度，P 把改动送到输出。先把方向 3 的强度调到零，再调回一些。"/>
        <Source/>
        <SingularTriplet strengths={s.strengths} reduced={reduced}/>
        <div className="strength-controls">{s.strengths.map((n,i)=><label key={i}><span>方向 {i+1}<strong>{(n/10).toFixed(1)}</strong></span><input type="range" aria-label={`方向 ${i+1} 的贡献强度`} min="0" max="10" step="1" value={n} onChange={e=>d({type:'strength',index:i,value:Number(e.target.value)})}/></label>)}</div>
        <div className="completion-actions"><button className="secondary-button" onClick={()=>d({type:'strength',index:2,value:0})}>将方向 3 调到零</button><button className="secondary-button" disabled={!s.zeroed||s.strengths[2]!==0} onClick={()=>d({type:'strength',index:2,value:2})}>尝试恢复方向 3</button></div>
        <p className="feedback" role="status">{!s.zeroed?'观察方向 3：强度变小时，青绿色流动变弱；黄铜方向结构仍在。':!s.restored?'方向 3 已贡献为零，P 和 Q 没有删除。现在试着把强度调回来。':'你已完成关闭与恢复：保留的两端可以再次组成这条示例更新。'}<span>这次手动恢复是教学示意，不是训练自动恢复的记录，也不表示准确率上升。</span></p>
        <Continue text="保留结构可以再调。接着比较：如果连两端的方向参数也删掉，会怎样？" button="比较删除整组参数" disabled={!s.zeroed||!s.restored} onClick={()=>next(3)}/>
      </section>}
      {s.step===3&&<section className="reading-section wide">
        <Heading index={3} title="没有贡献，与没有结构，有什么不同？" description="这里对照一种具体操作：删除普通 LoRA 中对应的一列、一行方向参数。不是说 LoRA 不能改变结构，而是检查删除已经学到的方向会失去什么。"/>
        <Source/>
        <div className="foundry-comparison">
          <div><p className="eyebrow">回看刚才调到零时</p><h3>两端留着，中间调到零。</h3><div className="retained-direction"><span>Q 保留</span><Icon name="arrow"/><strong>λ = 0</strong><Icon name="arrow"/><span>P 保留</span></div><p>当时没有这条贡献。方向参数还在，之后有再次调整的余地。这里回看的是单个方向，不是把全部方向关闭。</p></div>
          <div><p className="eyebrow">删除 LoRA 的一组方向参数</p><h3>两端也一起移除。</h3><div className={`retained-direction ${s.pairDeleted?'removed-direction':''}`}><span>{s.pairDeleted?'A 对应行已删除':'A 的对应行'}</span><Icon name="arrow"/><span>{s.pairDeleted?'B 对应列已删除':'B 的对应列'}</span></div><button className="secondary-button" disabled={s.pairDeleted} onClick={()=>d({type:'delete'})}>删除这组方向参数</button>{s.pairDeleted&&<button className="text-button" onClick={()=>d({type:'try-recover'})}>试着只调大强度来恢复 <Icon name="arrow" size={16}/></button>}</div>
        </div>
        {s.recoveryTried&&<p className="feedback" role="status">找不到原来的两端了。只调大强度，不能找回已经删除的方向参数。<span>可以另外重建或重新初始化结构；那需要新的操作，不是恢复原来学到的那一组参数。普通 LoRA 也可以采用其他调整方案。</span></p>}
        {s.recoveryTried&&<fieldset className="choices"><legend>这次对照直接说明了什么？</legend>{[['retained','贡献为零可以保留方向结构，不等于把整套参数删掉。'],['memory','贡献为零，就已经释放了两端参数的全部存储。'],['accuracy','保留方向，就保证它以后恢复并提高准确率。']].map(([value,label])=><label key={value} className={s.observation===value?'selected':''}><input type="radio" name="foundry-observation" checked={s.observation===value} disabled={s.evidenceRead} onChange={()=>d({type:'observe',value:value as 'retained'|'memory'|'accuracy'})}/><span className="choice-text">{label}</span></label>)}</fieldset>}
        {s.observation&&<p className="feedback" role="status">{s.observation==='retained'?'你分清了当前贡献和方向结构。':s.observation==='memory'?'关闭贡献没有删除两端参数；存储与有效方向数量是不同的量。':'结构保留只提供可能，能否恢复、是否有用，还取决于训练和任务。'}</p>}
        <Continue text="动画帮助理解结构。现在看看，论文实际采用了什么设计，又留下了哪些条件。" button="查看论文的结构设计" disabled={s.observation!=='retained'} onClick={()=>next(4)}/>
      </section>}
      {s.step===4&&<section className="reading-section">
        <Heading index={4} title="论文把方向与强度分开调整。" description="这里是原论文的机制说明，不是刚才操作的实验成绩。重点是这种结构为什么便于选择性抑制贡献。"/>
        <Source paper/>
        {!s.evidenceRead?<div className="evidence-before"><p>你已比较两种处理。揭示论文说明，对照自己观察到的关系。</p><button className="primary-button" onClick={()=>d({type:'read'})}>揭示论文机制说明 <Icon name="arrow"/></button></div>:<>
          <p className="evidence-lead">方向留在两端，强度放在中间。</p><p className="narrative">{foundryEvidence[0].intuition}</p><p className="narrative">普通 LoRA 用两张小表共同描述更新；AdaLoRA 增加中间的强度控制，采用类似奇异值分解的结构。论文直接训练这几个部分，并不是反复把原来的大矩阵做精确分解。</p>
          <details className="technical-details"><summary>用一个简式对照结构：ΔW = PΛQ</summary><div className="details-content"><p className="intuition-formula">ΔW = PΛQ</p><p>直觉：输入先经过 Q 找线索，再由 Λ 决定各条方向贡献多少，最后由 P 送到输出。ΔW 是加在原权重旁的更新，不是整个原模型。</p><p>对某条方向把 λ 调到 0，它当前对更新的贡献为零；对应 P 的列、Q 的行仍保留。非零控制器的数量不一定等于更新的精确矩阵秩，实际方向也可能重复。本章只数启用的贡献方向，不宣称测量了真实秩。</p><p>来源：上传 PDF 第 4 页 Section 3.1，Eq. 3。图中强度是教学设定。</p></div></details>
          <p className="narrative">{foundryEvidence[1].intuition}这不是保证“关掉的方向一定重新打开”，也不是保证重新打开就更好。</p>
          <details className="technical-details"><summary>为什么留下可能，仍然不保证恢复？</summary><div className="details-content"><p>来源：上传 PDF 第 6 页 Section 4，Implementation Details。论文按间隔掩蔽奇异值，让两次掩蔽之间仍有更新机会。</p><p>保留 P、Q，不代表强度为零时它们仍得到与原来相同的任务损失梯度。训练信号、正交正则以及掩蔽间隔都会影响后续变化。这里的按钮只说明保留结构与删除结构的差别，没有复现训练过程。</p><p>减少有效方向的预算，与删除全部组成参数、释放训练存储，不是同一件事。</p></div></details>
          <details className="technical-details"><summary>补充直觉：为什么希望方向少一些重复？</summary><div className="details-content"><p>像几根调节杆，如果总在做相同的事，多装几根也未必多一种能力。论文的正交约束鼓励两侧方向减少重叠，便于分别控制。</p><div className="orthogonal-sketch" data-source-type="conceptual_simulation" role="img" aria-label="教学示意：两条重叠方向，与两条近似独立方向"><span>↗ ↗<small>改动方式容易重复</small></span><Icon name="arrow"/><span>↑ →<small>鼓励方向少一些重叠</small></span></div><p>这是结构示意，不是论文实验图。正则是鼓励近似正交，不保证始终严格正交。来源：第 4 页 Section 3.1，Eq. 4；不在这里展开推导。</p></div></details>
          <details className="technical-details"><summary>核对来源与适用范围</summary><div className="details-content"><p><strong>研究问题：</strong>如何方便地抑制某个更新方向，同时保留可调整结构？</p><p><strong>对照条件：</strong>本章仅比较强度掩蔽和删除一组方向参数的结构差异，不是控制变量训练实验。</p><p><strong>直觉概括：</strong>贡献可以关掉，结构可以留下；后续有调整余地。</p><p><strong>表现与趋势：</strong>本章不展示任务性能曲线或训练分数。</p><p><strong>适用条件：</strong>论文的 SVD-like 参数化与间隔掩蔽机制；恢复与效果还需训练验证。</p>{foundryEvidence.map(e=><p key={e.id}><strong>原文：</strong>第 {e.source.page} 页 · Section {e.source.section} · {e.source.locator}</p>)}<a href={foundryEvidence[0].source.url} target="_blank" rel="noreferrer">阅读原论文 · arXiv 2303.10512v2 ↗</a></div></details>
        </>}
        <Continue text="回到最初的预测：现在能确定的，是哪一种变量关系？" button="修正我的结构认识" disabled={!s.evidenceRead} onClick={()=>next(5)}/>
      </section>}
      {s.step===5&&<section className="reading-section">
        <Heading index={5} title="留下的是调整余地，不是效果保证。" description="把操作与论文放在一起，选一句能准确解释这次发现的话。"/>
        <div className="past-prediction"><span>你最初的预测</span><p>“{foundryPredictions.find(p=>p.id===s.prediction)?.label}”</p></div>
        <fieldset className="choices"><legend>现在你会怎样解释这个结构？</legend>{[['conditional','强度为零可以抑制当前贡献，同时保留两端方向；以后仍有调整可能，但不保证恢复或效果。'],['guarantee','只要保留两端，被关闭的方向就一定自动恢复，并提高准确率。'],['exact','AdaLoRA 每一步都精确分解整个原模型，找出永远正确的方向。']].map(([value,label])=><label key={value} className={s.reflection===value?'selected':''}><input type="radio" name="foundry-reflection" checked={s.reflection===value} disabled={s.completed} onChange={()=>d({type:'reflect',value:value as 'conditional'|'guarantee'|'exact'})}/><span className="choice-text">{label}</span></label>)}</fieldset>
        {s.reflection&&<p className="feedback" role="status">{s.reflection==='conditional'?'你分清了贡献、方向参数和后续效果。':s.reflection==='guarantee'?'有调整余地，并不保证训练一定用得上这个方向。':'论文训练的是类似分解的更新结构，不是每步精确分解整个原模型。'}<span>{s.reflection==='conditional'?'接下来还需要回答：哪些方向值得保留？':'请保留证据中的条件，再试一次。'}</span></p>}
        <Continue text="把发现加入路线。我们有了可调整的结构，下一步才是判断重要性。" button="完成本章，点亮路线" disabled={s.reflection!=='conditional'} onClick={()=>d({type:'complete'})}/>
      </section>}
      {s.step===6&&<section className="reading-section completion">
        <p className="eyebrow"><Icon name="check" size={17}/>ACT 3 / DISCOVERY UNLOCKED</p><h2>贡献可以关掉，<br/>方向可以留下。</h2><p className="completion-discovery">贡献强度可以被选择性抑制。</p><p className="narrative">你先关掉贡献，再比较了删除结构的代价。AdaLoRA 的可调整结构，让训练中的资源重分配有了操作空间；它没有替我们保证哪些方向最有用。</p>
        <div className="next-preview"><span className="eyebrow">NEXT / ACT 4</span><h3>哪些方向值得留下？</h3><p>下一章进入重要性裁判所：只看参数大小够吗？一次训练的信号可靠吗？我们会先预测，再认识重要性估计。</p></div>
        <div className="completion-actions"><button className="primary-button" onClick={onNext}>进入 ACT 4 <Icon name="arrow"/></button><button className="text-button" onClick={onRoute}>查看点亮的路线 <Icon name="route"/></button><button className="text-button" onClick={()=>next(2)}>回看强度控制台 <Icon name="arrow"/></button></div>
      </section>}
    </motion.article></AnimatePresence>
  </>;
}
function Heading({index,title,description}:{index:number;title:string;description:string}){return <div className="section-heading"><p className="eyebrow">{String(index+1).padStart(2,'0')} / {foundrySections[index]}</p><h2>{title}</h2><p className="section-description">{description}</p></div>;}
function Continue({text,button,onClick,disabled=false}:{text:string;button:string;onClick:()=>void;disabled?:boolean}){return <div className="transition"><p>{text}</p><button className="primary-button" disabled={disabled} onClick={onClick}>{button}<Icon name="arrow"/></button></div>;}
function Source({paper=false}:{paper?:boolean}){return <p className={`source-label ${paper?'paper':'simulation'}`} data-source-type={paper?'paper_evidence':'conceptual_simulation'}><span/>{paper?'论文机制说明 · 第 4 页 Eq. 3–4 / 第 6 页 Implementation Details':'教学模拟 · 只演示结构与贡献，不测量模型效果'}</p>;}
