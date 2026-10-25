import FinalKnowledgeReview from './components/FinalKnowledgeReview';
import {unlockedConcepts} from './data/knowledgeUnlocks';
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import Icon from './components/Icon';
import MechanicalEngine from './components/MechanicalEngine';
import Overlay from './components/Overlay';
import { figure1 } from './data/paperEvidence';
import { route, sections, predictions, allocationSource, scenarioSource } from './data/storyScript';
import { useLearning, type Prediction } from './store/adaptationStore';
import CouncilOfModules from './acts/CouncilOfModules';
import { useCouncil, councilSections } from './store/councilStore';
import { archiveAttempt, readHistory } from './store/learningHistory';
import RankAllocation from './acts/RankAllocation';
import RankJournal from './components/RankJournal';
import {useRank,rankSections} from './store/rankStore';
import {rankPredictions} from './data/rankAllocation';
import SingularFoundry from './acts/SingularFoundry';
import FoundryJournal from './components/FoundryJournal';
import {useFoundry,foundrySections} from './store/foundryStore';
import {foundryPredictions} from './data/singularFoundry';
const ImportanceTribunal=lazy(()=>import('./acts/ImportanceTribunal'));
import TribunalJournal from './components/TribunalJournal';
import {useTribunal,tribunalSections} from './store/tribunalStore';
import {scoreMethods} from './data/importanceTribunal';
const BudgetControlTower=lazy(()=>import('./acts/BudgetControlTower'));
import TowerJournal from './components/TowerJournal';
import {useTower,towerSections} from './store/towerStore';
import {schedulePolicies} from './data/budgetSchedule';
const PerformanceArena=lazy(()=>import('./acts/PerformanceArena'));
import ArenaJournal from './components/ArenaJournal';
import {useArena,arenaSections} from './store/arenaStore';
const AblationLaboratory=lazy(()=>import('./acts/AblationLaboratory'));
import AblationJournal from './components/AblationJournal';
import {useAblation,ablationSections} from './store/ablationStore';
const RankObservatory=lazy(()=>import('./acts/RankObservatory'));
import ObservatoryJournal from './components/ObservatoryJournal';
import {useObservatory,observatorySections} from './store/observatoryStore';
const FinalVerdict=lazy(()=>import('./acts/FinalVerdict'));
import VerdictJournal from './components/VerdictJournal';
import {useVerdict,verdictSections} from './store/verdictStore';
import {buildLearningReport,type ChapterSnapshot} from './data/learningReport';

export default function App() {
  const { state, dispatch } = useLearning();
  const council = useCouncil();
  const rank = useRank();
  const foundry = useFoundry();
  const tribunal = useTribunal();
  const tower = useTower();
  const arena = useArena();
  const ablation = useAblation();
  const observatory = useObservatory();
  const verdict = useVerdict();
  const [activeAct,setActiveAct] = useState<0|1|2|3|4|5|6|7|8|9>(()=>{try{const saved=localStorage.getItem('adaptive-engine:current-act');return saved==='9'?9:saved==='8'?8:saved==='7'?7:saved==='6'?6:saved==='5'?5:saved==='4'?4:saved==='3'?3:saved==='2'?2:saved==='1'?1:0;}catch{return 0;}});
  const chapterStates=[state,council.state,rank.state,foundry.state,tribunal.state,tower.state,arena.state,ablation.state,observatory.state,verdict.state];
  const activeState=chapterStates[activeAct];
  const chapterSections=[sections,councilSections,rankSections,foundrySections,tribunalSections,towerSections,arenaSections,ablationSections,observatorySections,verdictSections];
  const [history,setHistory] = useState(readHistory);
  const systemReduced = useReducedMotion();
  const reduced = state.reducedMotion ?? !!systemReduced;
  const [overlay, setOverlay] = useState<'route'|'journal'|'knowledge'|null>(null);
  const [routeSelection, setRouteSelection] = useState(0);
  const [choice, setChoice] = useState<Prediction|null>(state.firstPrediction);
  const [from, setFrom] = useState(0);
  const [to, setTo] = useState(1);
  const [announcement, setAnnouncement] = useState('');
  const [music, setMusic] = useState(false);
  const [storageAvailable, setStorageAvailable] = useState(true);
  const main = useRef<HTMLElement>(null);
  const audio = useRef<{ context: AudioContext; gain: GainNode }|null>(null);
  const closeOverlay = useCallback(() => setOverlay(null),[]);
  useEffect(() => {
    try { localStorage.setItem('adaptive-engine:storage-check','1'); localStorage.removeItem('adaptive-engine:storage-check'); }
    catch { setStorageAvailable(false); }
  },[]);
  useEffect(() => {
    main.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'instant' });
  },[state.step,council.state.step,rank.state.step,foundry.state.step,tribunal.state.step,tower.state.step,arena.state.step,arena.state.room,ablation.state.step,ablation.state.active,observatory.state.step,verdict.state.step,activeAct]);
  useEffect(()=>{try{localStorage.setItem('adaptive-engine:current-act',String(activeAct));}catch{/* Navigation remains available. */}},[activeAct]);
  useEffect(() => {
    const visibility = () => { if (audio.current) { if (document.hidden) void audio.current.context.suspend(); else if (music) void audio.current.context.resume(); } };
    document.addEventListener('visibilitychange', visibility);
    return () => document.removeEventListener('visibilitychange',visibility);
  },[music]);
  useEffect(() => () => { if (audio.current) void audio.current.context.close(); },[]);
  async function toggleMusic() {
    try {
      if (!audio.current) {
        const context = new AudioContext(); const gain = context.createGain(); gain.gain.value = 0;
        gain.connect(context.destination);
        for (const frequency of [65.41,98,130.81]) { const oscillator = context.createOscillator(); oscillator.type = 'sine'; oscillator.frequency.value = frequency; oscillator.connect(gain); oscillator.start(); }
        audio.current = { context, gain };
      }
      await audio.current.context.resume();
      audio.current.gain.gain.setTargetAtTime(music?0:.016,audio.current.context.currentTime,.3);
      setMusic(!music);
      setAnnouncement(music?'背景音乐已关闭。':'轻柔环境和弦已打开。');
    } catch { setAnnouncement('这个浏览器暂时无法播放声音，仍可完成全部学习。'); }
  }
  function step(n: number) { dispatch({type:'step',value:n}); }
  const eligible = (n: number) => n<=1 || n===2 && !!state.firstPrediction || n===3 && state.operated || n===4 && state.evidenceRead || n===5 && state.completed;
  const predictionLabel = predictions.find(p=>p.id===state.firstPrediction)?.label;
  function enterAct(value:0|1|2|3|4|5|6|7|8|9){setActiveAct(value);closeOverlay();}
  function resetChapter(){
    setHistory(archiveAttempt(activeAct,activeState,history));
    if(activeAct===0){dispatch({type:'reset'});setChoice(null);setFrom(0);setTo(1);}else if(activeAct===1)council.dispatch({type:'reset'});else if(activeAct===2)rank.dispatch({type:'reset'});else if(activeAct===3)foundry.dispatch({type:'reset'});else if(activeAct===4)tribunal.dispatch({type:'reset'});else if(activeAct===5)tower.dispatch({type:'reset'});else if(activeAct===6)arena.dispatch({type:'reset'});else if(activeAct===7)ablation.dispatch({type:'reset'});else if(activeAct===8)observatory.dispatch({type:'reset'});else verdict.dispatch({type:'reset'});
    closeOverlay();setAnnouncement(`ACT ${activeAct} 的交互已重置，之前的学习记录已保留。`);
  }
  function exportReport() {
    const blob = new Blob([JSON.stringify({ project:'THE ADAPTIVE ENGINE', act0:state, act1:council.state, act2:rank.state, act3:foundry.state, act4:tribunal.state, act5:tower.state, act6:arena.state, act7:ablation.state, act8:observatory.state, act9:verdict.state, learningReport:buildLearningReport(chapterStates as unknown as ChapterSnapshot[],verdict.state,history), priorAttempts:history, note:'这是学习记录，不是模型训练结果。' },null,2)],{type:'application/json'});
    const link = document.createElement('a'); link.href=URL.createObjectURL(blob); link.download='adaptive-engine-learning.json'; link.click(); URL.revokeObjectURL(link.href);
  }
  return <>
    <a className="skip-link" href="#chapter">跳到学习内容</a>
    <header className="topbar">
      <button className="text-button route-entry" onClick={()=>{setRouteSelection(activeAct);setOverlay('route');}}><Icon name="route"/><span>主线路线图</span><span className="route-count">{chapterStates.filter(s=>s.completed).length} / 10</span></button>
      <a className="wordmark" href="#chapter" aria-label="自适应引擎，学习内容"><span className="wordmark-symbol">A</span><span>THE ADAPTIVE ENGINE</span></a>
      <div className="header-actions">
        <button className="text-button" onClick={()=>setOverlay('knowledge')}>知识补给 <span>{unlockedConcepts(chapterStates as unknown as ChapterSnapshot[]).length}/13</span></button>
        <button className="icon-button" onClick={toggleMusic} aria-label={music?'关闭背景音乐':'打开背景音乐'} aria-pressed={music} title={music?'关闭音乐':'打开音乐'}><Icon name="sound"/>{!music&&<span className="off-slash"/>}</button>
        <button className="icon-button" onClick={()=>dispatch({type:'motion'})} aria-label={reduced?'恢复动画':'减弱动画'} aria-pressed={reduced} title={reduced?'动画已减弱':'减弱动画'}><Icon name="motion"/></button>
        <button className="text-button journal-entry" aria-label="学习记录" onClick={()=>setOverlay('journal')}><Icon name="journal"/><span>学习记录</span></button>
      </div>
    </header>
    <div className="location-bar">
      <div><Icon name={['pin','layers','sliders','sliders','gauge','gauge','layers','sliders','chart','check'][activeAct]} size={15}/><span>ACT {activeAct}</span><span className="location-divider">/</span><span>{['资源管理部','模块议会','Rank 配额室','奇异方向工坊','重要性裁判所','预算控制塔','参数预算竞技场','消融实验室','Rank 分布观测站','工程审查室'][activeAct]}</span><span className="location-divider">/</span><span>{chapterSections[activeAct][activeState.step]}</span></div>
      <button className="text-button reset-chapter" onClick={resetChapter} title="重新体验本章，之前的记录保留"><Icon name="reset" size={14}/><span>重置本章</span></button>
    </div>
    {!storageAvailable&&<p className="storage-notice" role="status">浏览器未允许保存。本次可以继续学习，关闭后进度可能无法保留。</p>}
    <main id="chapter" tabIndex={-1} ref={main}>
      {activeAct===9?<Suspense fallback={<p className="reading-section" role="status">正在展开本章…</p>}><FinalVerdict {...verdict} reduced={reduced} chapters={chapterStates as unknown as ChapterSnapshot[]} history={history} onRevisit={i=>enterAct(i as 0|1|2|3|4|5|6|7|8|9)} onExport={exportReport} onRoute={()=>{setRouteSelection(9);setOverlay('route');}}/></Suspense>:activeAct===8?<Suspense fallback={<p className="reading-section" role="status">正在展开本章…</p>}><RankObservatory {...observatory} reduced={reduced} onNext={()=>enterAct(9)} pastModule={council.state.modulePrediction} pastLayer={council.state.layerPrediction} onRevisit={()=>enterAct(1)} onRoute={()=>{setRouteSelection(8);setOverlay('route');}}/></Suspense>:activeAct===7?<Suspense fallback={<p className="reading-section" role="status">正在展开本章…</p>}><AblationLaboratory {...ablation} reduced={reduced} onNext={()=>enterAct(8)} onRoute={()=>{setRouteSelection(7);setOverlay('route');}}/></Suspense>:activeAct===6?<Suspense fallback={<p className="reading-section" role="status">正在展开本章…</p>}><PerformanceArena {...arena} reduced={reduced} onNext={()=>enterAct(7)} onRoute={()=>{setRouteSelection(6);setOverlay('route');}}/></Suspense>:activeAct===5?<Suspense fallback={<p className="reading-section" role="status">正在展开本章…</p>}><BudgetControlTower {...tower} reduced={reduced} onNext={()=>enterAct(6)} onRoute={()=>{setRouteSelection(5);setOverlay('route');}}/></Suspense>:activeAct===4?<Suspense fallback={<p className="reading-section" role="status">正在展开本章…</p>}><ImportanceTribunal {...tribunal} reduced={reduced} onNext={()=>enterAct(5)} onRoute={()=>{setRouteSelection(4);setOverlay('route');}}/></Suspense>:activeAct===3?<SingularFoundry {...foundry} reduced={reduced} onNext={()=>enterAct(4)} onRoute={()=>{setRouteSelection(3);setOverlay('route');}}/>:activeAct===2?<RankAllocation {...rank} reduced={reduced} onNext={()=>enterAct(3)} onRoute={()=>{setRouteSelection(2);setOverlay('route');}}/>:activeAct===1?<CouncilOfModules {...council} reduced={reduced} onNext={()=>enterAct(2)} onRoute={()=>{setRouteSelection(1);setOverlay('route');}}/>:<>
      <nav className="section-nav" aria-label="本章各部分">
        {sections.map((name,i)=><button key={name} disabled={!eligible(i)} aria-current={i===state.step?'step':undefined} onClick={()=>step(i)}><span>{i<state.step||state.completed?<Icon name="check" size={12}/>:String(i+1).padStart(2,'0')}</span><span className="section-name">{name}</span></button>)}
      </nav>
      <AnimatePresence mode="wait" initial={false}>
        <motion.article key={state.step} initial={{opacity:reduced?1:0,y:reduced?0:8}} animate={{opacity:1,y:0}} exit={{opacity:reduced?1:0}} transition={{duration:reduced?0:.2}}>
          {state.step===0&&<section className="intro-section">
            <div className="intro-copy">
              <p className="eyebrow"><span className="eyebrow-line"/>AN INTERACTIVE RESEARCH JOURNEY</p>
              <h1>THE ADAPTIVE<br/><span>ENGINE</span></h1>
              <div className="chinese-title">自适应引擎 <span>／ 第一幕：预算危机</span></div>
              <h2 className="intro-question">有限的预算，<br/>如何做出最重要的改变？</h2>
              <p className="intro-text">你接管了一座已经学会用少量参数适应新任务的工厂。资源委员会刚削减了预算，现在必须重新考虑分配。</p>
              <p className="intro-text">每个部门都分一样多，真的合适吗？<br/>这章不用先记公式。先做判断，试着分配，再看看论文里发生了什么。</p>
              <button className="primary-button" onClick={()=>step(1)}>接管这次分配 <Icon name="arrow"/></button>
              <div className="intro-meta"><span>CHIEF ADAPTATION ENGINEER</span><span>首席适配工程师</span></div>
            </div>
            <div className="intro-visual"><div className="drawing-top"><span>RESEARCH BLUEPRINT</span><span>Nº 001</span></div><MechanicalEngine reduced={reduced}/><p className="quiet-caption">主引擎已经学会了很多。<br/>这一次，我们只调整一小部分。</p><div className="source-note"><span className="source-dot"/>{scenarioSource.label}</div></div>
          </section>}
          {state.step===1&&<section className="reading-section">
            <SectionHeading index="02" kicker="先做判断" title="如果资源有限，你会怎么分？" description="先不用找标准答案。留下你的第一反应，后面我们会带着证据回来看看。"/>
            <p className="narrative">四个部门都说自己需要资源。旧办法很简单：每个部门得到同样多。你觉得，这样一定合适吗？</p>
            <fieldset className="choices"><legend className="sr-only">选择你的初始判断</legend>
              {predictions.map(p=><label key={p.id} className={choice===p.id?'selected':''}><input type="radio" name="prediction" value={p.id} checked={choice===p.id} disabled={!!state.firstPrediction} onChange={()=>setChoice(p.id)}/><span className="choice-text">{p.label}<small>{p.detail}</small></span><span className="choice-index">{p.id==='equal'?'A':p.id==='different'?'B':'C'}</span></label>)}
            </fieldset>
            {state.firstPrediction&&<p className="inline-note">这是你第一次提交的判断，已保留。之后的想法会作为“修正认识”另外记录。</p>}
            <Transition text="想法先记下来。接着，把它变成一次可以观察的分配。" button="去分配这笔资源" disabled={!choice} onClick={()=>{if(choice){dispatch({type:'predict',value:choice});step(2);}}}/>
          </section>}
          {state.step===2&&<section className="reading-section wide">
            <SectionHeading index="03" kicker="试着分配" title="改变份额，看看谁得到更多。" description="这里的资源筹码代表可用的改动容量。筹码总共 12 枚，你可以平均分，也可以把一枚从某个部门转给另一个。"/>
            <SourceLabel type="simulation"/>
            <div className="allocation-layout"><div>
              <div className="allocation-budget"><span>总资源</span><strong>{state.allocation.reduce((a,b)=>a+b,0)} <small>/ 12</small></strong><span>总量保持不变</span></div>
              <div className="allocation-rows">{state.allocation.map((n,i)=><div className="allocation-row" key={i}><span className="department">部门 {['A','B','C','D'][i]}</span><div className="tokens" aria-label={`${n} 枚筹码`}>{[0,1,2,3,4,5].map(j=><span key={j} className={j<n?'filled':''}/>)}</div><span className="allocation-number">{n}</span></div>)}</div>
              <div className="strategy-row"><button className="secondary-button" onClick={()=>{dispatch({type:'strategy',value:'equal'});setAnnouncement('已选择平均分配，四个部门各得到 3 枚筹码。');}}>先保持平均分配</button><button className="text-button" onClick={()=>dispatch({type:'strategy',value:'adjust'})}>试着调整 <Icon name="arrow" size={17}/></button></div>
              {state.strategy==='adjust'&&<div className="transfer-controls"><label>从 <select aria-label="转出部门" value={from} onChange={e=>setFrom(Number(e.target.value))}>{[0,1,2,3].map(i=><option value={i} key={i}>部门 {['A','B','C','D'][i]}</option>)}</select></label><Icon name="arrow"/><label>给 <select aria-label="转入部门" value={to} onChange={e=>setTo(Number(e.target.value))}>{[0,1,2,3].map(i=><option value={i} key={i}>部门 {['A','B','C','D'][i]}</option>)}</select></label><button className="primary-button compact" disabled={from===to||state.allocation[from]===0||state.allocation[to]>=6} onClick={()=>{dispatch({type:'transfer',from,to});setAnnouncement(`从部门 ${['A','B','C','D'][from]} 转给部门 ${['A','B','C','D'][to]} 一枚筹码，总资源仍为 12。`);}}>转移 1 枚</button>{from===to&&<small className="inline-note">请选择两个不同部门。</small>}</div>}
            </div><MechanicalEngine allocation={state.allocation} reduced={reduced}/></div>
            <p className="feedback" aria-live="polite">{state.operated?(state.strategy==='equal'?'份额一样了，但我们还没有证据说明需求也一样。':'你改变了资源放的位置；一个部门得到更多，其他部门就需要让出一些。'):'请选择保持平均，或调整一次份额。'}<span>这里没有训练模型，不能据此判断哪个方案效果更好。</span></p>
            <Transition text="这次分配只告诉我们资源怎样变化。接下来，看一份真正的研究记录。" button="看看论文里的证据" disabled={!state.operated} onClick={()=>step(3)}/>
          </section>}
          {state.step===3&&<section className="reading-section wide">
            <SectionHeading index="04" kicker="看看证据" title="同样多的参数，放在哪里有区别吗？" description="研究者也问了这个问题。他们保持可训练参数一样多，只改变它们放的位置，再比较结果。"/>
            <SourceLabel type="paper"/>
            {!state.evidenceRead?<div className="evidence-before"><p>这是原论文已经完成的实验。先想一想：保持数量相同，能不能保证结果也相同？</p><button className="primary-button" onClick={()=>dispatch({type:'read'})}>揭示研究记录 <Icon name="arrow"/></button></div>:<>
              <div className="evidence-layout"><div><p className="evidence-lead">结果并不一样。</p><p className="narrative">{figure1.intuition}</p><p className="evidence-boundary">{figure1.boundary}</p><p className="inline-note">你不用记这些数字。先看懂：同样的数量，可以对应不同的结果。</p></div><div className="evidence-chart"><div className="chart-heading"><span>六个不同位置的实验结果</span><small>正确率（%）· 越高越好</small></div><div className="point-chart" role="img" aria-label="六种位置的 MNLI-m 正确率从 88.58% 到 89.99% 不等。使用局部坐标范围 88.5% 到 90%。"><div className="chart-axis"><span>88.5</span><span>89.0</span><span>89.5</span><span>90.0</span></div>{figure1.rows.map(r=><div className="point-row" key={r.id}><span>{r.beginner}</span><div className="point-track"><span className="point" style={{left:`${(r.value-88.5)/1.5*100}%`}}/></div><span className="point-value">{r.value.toFixed(2)}</span></div>)}</div><p className="chart-footnote">局部范围 88.5–90.0%，用于看清差异；不是从零起点画的长度比较。</p></div></div>
              <details className="technical-details"><summary>展开实验条件与原始数据</summary><div className="details-content"><p><strong>研究问题：</strong>{figure1.question}</p><p><strong>保持不变：</strong>底座模型 DeBERTaV3-base、任务 MNLI-m、总可训练参数 0.28M（约 28 万）。<br/><strong>改变的条件：</strong>每次只在所有层的一种矩阵位置上使用 LoRA。<br/><strong>结果概括：</strong>同样的总参数数量，不同放置方式表现不同。具体结构将在 ACT 1 的 LoRA 回顾中解释。</p><table><caption>原论文第 2 页 · Figure 1a</caption><thead><tr><th>界面位置</th><th>原图矩阵</th><th>模块</th><th>正确率 %</th></tr></thead><tbody>{figure1.rows.map(r=><tr key={r.id}><td>{r.beginner}</td><td>{r.id}</td><td>{r.group}</td><td>{r.value.toFixed(2)}</td></tr>)}</tbody></table><p><strong>适用条件：</strong>只支持该模型、任务、预算和实验配置的比较；图注没有独立标明 split 和随机种子协议。不把玩家操作映射为模型表现。</p><a href={figure1.source.url} target="_blank" rel="noreferrer">阅读原论文 · arXiv 2303.10512v2 ↗</a></div></details>
            </>}
            <Transition text="现在我们多了一条证据。带着它，重新看一眼最初的想法。" button="回到我的判断" disabled={!state.evidenceRead} onClick={()=>step(4)}/>
          </section>}
          {state.step===4&&<section className="reading-section">
            <SectionHeading index="05" kicker="修正认识" title="平均分配，一定合适吗？" description="你不需要否定自己的第一反应。只要想想，现在的证据允许我们说到哪一步。"/>
            <div className="past-prediction"><span>你最初的判断</span><p>“{predictionLabel}”</p></div>
            <fieldset className="choices"><legend>看完记录，你现在更认同哪句话？</legend>{[
              ['universal','平均分配一定最有效。'],
              ['conditional','不一定。还要考虑把参数放在哪里，以及当前任务需要什么。'],
              ['opposite','平均分配在任何任务里都没有用。'],
            ].map(([id,label])=><label key={id} className={state.reflection===id?'selected':''}><input type="radio" name="reflection" disabled={state.completed} checked={state.reflection===id} onChange={()=>dispatch({type:'reflect',value:id})}/><span className="choice-text">{label}</span></label>)}</fieldset>
            {state.completed&&<p className="inline-note">这是完成本章时保存的判断。回看不会改写这份学习记录。</p>}
            {state.reflection&&<p className="feedback" aria-live="polite">{state.reflection==='conditional'?'这条结论留住了关键条件：数量之外，位置也值得考虑。':'这句话说得太绝对了。一份特定任务的实验，不能说明所有任务都会怎样。'}<span>{state.reflection==='conditional'?'这还没有告诉我们最佳方案，只是指出了下一步应该调查什么。':'再看看：论文展示的是同样预算下的不同结果，而不是对所有分配方式的保证。'}</span></p>}
            <Transition text="我们先把这个发现记下来，再去认识机器里的各个部门。" button="完成本章，点亮路线" disabled={state.reflection!=='conditional'} onClick={()=>dispatch({type:'complete'})}/>
          </section>}
          {state.step===5&&<section className="reading-section completion">
            <p className="eyebrow"><Icon name="check" size={17}/>ACT 0 / DISCOVERY UNLOCKED</p><h2>参数少，<br/>也要放对地方。</h2><p className="completion-discovery">同样预算，不同分配方式可能表现不同。</p><p className="narrative">你没有训练出一个“最佳模型”。你发现了一个值得继续研究的问题：有限的改动容量，应该留给谁？</p>
            <div className="next-preview"><span className="eyebrow">NEXT / ACT 1</span><h3>先回顾 LoRA，再调查各部门。</h3><p>下一幕先看看 Transformer 有哪些部分、LoRA 加在哪里，以及为什么它只需要训练少量参数。然后，我们再判断哪些位置值得更多资源。</p></div>
            <div className="completion-actions"><button className="primary-button" onClick={()=>enterAct(1)}>进入 ACT 1 <Icon name="arrow"/></button><button className="text-button" onClick={()=>{setRouteSelection(0);setOverlay('route');}}>查看点亮的路线 <Icon name="route"/></button><button className="text-button" onClick={()=>step(0)}>回看这一幕</button></div>
          </section>}
        </motion.article>
      </AnimatePresence>
      </>}
      <footer className="chapter-footer"><span>ADALORA / A LEARNING JOURNEY</span><span>{activeState.completed?'本章发现已记录':`ACT ${activeAct} · ${activeState.step+1} / ${chapterSections[activeAct].length}`}</span><button className="text-button" onClick={()=>setOverlay('journal')}>{storageAvailable?'进度保存在此浏览器':'仅本次会话保留'}<Icon name="journal" size={14}/></button></footer>
    </main>
    <div className="sr-only" role="status" aria-live="polite">{announcement}</div>
    {overlay==='knowledge'&&<Overlay title="在探索中，逐渐读懂引擎。" onClose={closeOverlay}><FinalKnowledgeReview unlocked={unlockedConcepts(chapterStates as unknown as ChapterSnapshot[])}/></Overlay>}
    {overlay==='route'&&<Overlay title="从 LoRA，到更有依据的分配。" onClose={closeOverlay}>
      <p className="overlay-intro">逐步回答十个问题。每完成一幕，就点亮一个节点。已经开放的章节可以随时进入或回看。</p>
      <div className="roadmap-layout"><ol className="roadmap">{route.map((r,i)=>{const completed=chapterStates[i]?.completed||false;return <li key={r.title} className={`${i===routeSelection?'active':''} ${completed?'complete':''}`}><button aria-pressed={i===routeSelection} onClick={()=>setRouteSelection(i)}><span className="route-node">{completed?<Icon name="check" size={18}/>:String(i).padStart(2,'0')}</span><span className="route-label"><strong>{r.title}</strong><small>{completed?'已完成':i===activeAct?'正在学习':i<=9?'已开放':'后续章节'} · {r.subtitle}</small></span><Icon name={r.icon} size={18}/></button></li>;})}</ol>
      <div className="route-detail"><p className="eyebrow">ACT {routeSelection} / {route[routeSelection].subtitle}</p><h3>{route[routeSelection].title}</h3><p>{route[routeSelection].purpose}</p><span className="route-action">{route[routeSelection].action}</span>{routeSelection<=9?<button className="primary-button" onClick={()=>enterAct(routeSelection as 0|1|2|3|4|5|6|7|8|9)}>{routeSelection===activeAct?'回到当前学习':`进入 ACT ${routeSelection}`}<Icon name="arrow"/></button>:<p className="inline-note">这是尚未开发的后续导读。查看不会点亮节点。</p>}{routeSelection===1&&<ol className="lora-outline"><li>Transformer：一层层重复的处理单元。</li><li>LoRA：在原矩阵旁加一条小型更新支路。</li><li>省参数：训练两张小表，不重改整张大表。</li><li>新问题：改动容量放在哪一处更值得？</li></ol>}</div></div>
    </Overlay>}
    {overlay==='journal'&&<Overlay title="把想法留下，把证据带上。" onClose={closeOverlay}>
      <p className="overlay-intro">ACT {activeAct} · 当前体验。这份记录保存你的判断变化，不评价模型训练效果。</p>
      {activeAct===9?<VerdictJournal state={verdict.state}/>:activeAct===8?<ObservatoryJournal state={observatory.state}/>:activeAct===7?<AblationJournal state={ablation.state}/>:activeAct===6?<ArenaJournal state={arena.state}/>:activeAct===5?<TowerJournal state={tower.state}/>:activeAct===4?<TribunalJournal state={tribunal.state}/>:activeAct===3?<FoundryJournal state={foundry.state}/>:activeAct===2?<RankJournal state={rank.state}/>:activeAct===0?<div className="journal-lines"><div><span>最初的想法</span><p>{predictionLabel||'你还没有提交第一判断。'}</p></div><div><span>尝试过的分配</span><p>{state.operated?state.allocation.map((n,i)=>`${['A','B','C','D'][i]}：${n}`).join(' / '):'尚未操作。'}</p></div><div><span>读过的论文证据</span><p>{state.evidenceRead?'第 2 页 Figure 1a：同样参数量，不同位置表现不同。':'尚未揭示研究记录。'}</p></div><div><span>本章发现</span><p>{state.completed?'同样预算，不同分配方式可能表现不同。':'完成预测、操作、证据与修正后，发现会记录在这里。'}</p></div></div>:<div className="journal-lines"><div><span>LoRA 回顾</span><p>认识 {council.state.visited.length} / 2 个模块，比较 {council.state.modes.length} / 2 种训练方式。{council.state.countObserved?`算例中 Rank ${council.state.rank} 对应 ${128*council.state.rank} 个支路参数。`:'尚未揭示参数算例。'}</p></div><div><span>最初的模块预测</span><p>{council.state.modulePrediction==='ffn'?'FFN 可能较高':council.state.modulePrediction==='attention'?'Attention 可能较高':council.state.modulePrediction==='same'?'结果可能相近':'尚未预测。'}</p></div><div><span>最初的层组预测</span><p>{council.state.layerPrediction==='higher'?'较后层可能较高':council.state.layerPrediction==='lower'?'较早层可能较高':council.state.layerPrediction==='same'?'层的位置可能没有区别':'尚未预测。'}</p></div><div><span>论文证据</span><p>{council.state.moduleRead?'已读 Figure 1a。':'未读模块实验。'}{council.state.layerRead?'已读 Figure 1b。':'未读层组实验。'}</p></div><div><span>本章发现</span><p>{council.state.completed?'LoRA 省参数；不同位置的适配价值可能不同，需要结合任务证据分配。':'完成回顾、预测、观察与修正后，点亮本章发现。'}</p></div></div>}
      <div className="journal-actions"><button className="secondary-button" onClick={exportReport}>导出学习记录</button><button className="text-button" onClick={resetChapter}>重置本章</button></div>
      <p className="inline-note">重置会重新开放本章操作与判断，路线节点需要再次完成后点亮。之前的记录存入下方历史，其他章节和音乐、动画偏好保留。</p>
      {history.length>0&&<details className="technical-details"><summary>查看重置前的记录（{history.length} 次）</summary><div className="details-content">{history.map((attempt,i)=><details className="history-attempt" key={`${attempt.savedAt}-${i}`}><summary>ACT {attempt.chapter} · 第 {i+1} 份记录 · {new Date(attempt.savedAt).toLocaleString('zh-CN')} · {attempt.state.completed?'已完成':'未完成'}</summary><p>预测：{attempt.chapter===0?(predictions.find(p=>p.id===attempt.state.firstPrediction)?.label||'尚未提交'):attempt.chapter===9?'工程判断、边界与自述见完整导出记录':attempt.chapter===8?'分布预测、观察和回看见完整导出记录':attempt.chapter===7?'四项拆解的预测与证据见完整导出记录':attempt.chapter===6?'三个任务的预测与例外见完整导出记录':attempt.chapter===5?(schedulePolicies.find(p=>p.id===attempt.state.prediction)?.label||'尚未预测'):attempt.chapter===4?(scoreMethods.find(p=>p.id===attempt.state.prediction)?.label||'尚未预测'):attempt.chapter===3?(foundryPredictions.find(p=>p.id===attempt.state.prediction)?.label||'尚未预测'):attempt.chapter===2?(rankPredictions.find(p=>p.id===attempt.state.prediction)?.label||'尚未预测'): `模块 ${attempt.state.modulePrediction||'未预测'} / 层组 ${attempt.state.layerPrediction||'未预测'}`}</p><p>完成状态与全部操作保留在导出的学习记录中。</p></details>)}</div></details>}
    </Overlay>}
  </>;
}

function SectionHeading({ index, kicker, title, description }: { index: string; kicker: string; title: string; description: string }) {
  return <div className="section-heading"><p className="eyebrow">{index} / {kicker}</p><h2>{title}</h2><p className="section-description">{description}</p></div>;
}
function Transition({ text, button, onClick, disabled = false }: { text: string; button: string; onClick: () => void; disabled?: boolean }) {
  return <div className="transition"><p>{text}</p><button className="primary-button" onClick={onClick} disabled={disabled}>{button}<Icon name="arrow"/></button></div>;
}
function SourceLabel({ type }: { type: 'simulation'|'paper' }) {
  return <p className={`source-label ${type}`}><span/>{type==='paper'?'论文证据 · 第 2 页 Figure 1a':allocationSource.label}</p>;
}
