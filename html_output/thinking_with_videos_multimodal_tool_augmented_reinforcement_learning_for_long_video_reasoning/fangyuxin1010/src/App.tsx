import React,{useEffect,useState} from 'react';
import {lessons,chapterNames,paperTitle,type Lesson} from './data/lessons';
import {videos} from './data/videos';
import {AnimatedLesson} from './modules/AnimatedLesson';
import {CoverOverview} from './modules/CoverOverview';
import {IllustratedLesson} from './modules/IllustratedLesson';
import {RewardDemoProvider} from './modules/RewardDemo';
import {chapterIntros,readings} from './data/readings';
const course:Lesson[]=[...lessons,
 {chapter:10,title:'把收益放回实验条件中',subtitle:'消融对照帮助辨认训练、工具和奖励设计各自带来的变化。',kind:'ablations',points:[{title:'训练步骤有作用',text:'省略工具SFT时，LVR准确率为70.5%；保留后为79.3%。'},{title:'控制变量要看清',text:'更高像素、更多任务与更大数据集会改变比较条件。'},{title:'变化不总是单调',text:'第四阶段累计已用样本从8k到12k时，LVR出现小幅波动；训练到16k时提高。'}]},
 {chapter:10,title:'知道它能做什么，也知道边界',subtitle:'回看机制补充视觉证据，却不能替代尚未接入的信息与工具。',kind:'limits',points:[{title:'音频尚未整合',text:'需要声音才能区分的线索，无法只依靠视觉补齐。'},{title:'空间支持有限',text:'能找时间范围，不代表已经解决细粒度空间定位。'},{title:'回看有计算成本',text:'多轮生成与工具执行增加开销，应按证据需要决定是否调用。'}]}
];
function Evidence({lesson}:{lesson:Lesson}){const [open,setOpen]=useState(false);return <details className="reading-evidence" onToggle={e=>setOpen(e.currentTarget.open)}><summary>{readings[lesson.kind].detail}<span>数据与计算</span></summary>{open&&<div className="evidence-body"><AnimatedLesson kind={lesson.kind}/></div>}</details>;}
export default function App(){
 const [collapsed,setCollapsed]=useState(false),[menu,setMenu]=useState(false),[active,setActive]=useState(()=>{
  const id=location.hash.slice(1);if(id==='videos')return 11;const match=/^chapter-(\d+)$/.exec(id);return match?Math.max(0,Math.min(10,Number(match[1]))):0;
 });
 const go=(index:number)=>{
  const next=Math.max(0,Math.min(11,index));
  history.replaceState(null,'','#'+(next===0?'cover':next===11?'videos':'chapter-'+next));
  setActive(next);setMenu(false);
 };
 useEffect(()=>{history.replaceState(null,'','#'+(active===0?'cover':active===11?'videos':'chapter-'+active));window.scrollTo({top:0,behavior:'instant'});},[active]);
 useEffect(()=>{const onHash=()=>{const id=location.hash.slice(1),match=/^chapter-(\d+)$/.exec(id);setActive(id==='videos'?11:match?Math.max(0,Math.min(10,Number(match[1]))):0);};window.addEventListener('hashchange',onHash);return()=>window.removeEventListener('hashchange',onHash);},[]);
 useEffect(()=>{
  const onKey=(e:KeyboardEvent)=>{if((e.target as HTMLElement).closest('input,button,select,textarea,a,[role=button]'))return;if(e.key==='ArrowRight'){e.preventDefault();setActive(v=>Math.min(11,v+1));}if(e.key==='ArrowLeft'){e.preventDefault();setActive(v=>Math.max(0,v-1));}if(e.key==='Escape')setMenu(false);};
  window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey);
 },[]);
 const continueTo=(index:number,label:string)=><div className="chapter-continue"><button className="slide-nav-btn slide-nav-btn-primary v-next" onClick={()=>go(index)}>{label} →</button></div>;
 return <div className={'slide-layout v-app chapter-reading'+(collapsed?' sidebar-collapsed':'')+(menu?' sidebar-open':'')}>
  <aside className={'slide-sidebar v-sidebar'+(menu?' open':'')}>
   <div className="slide-sidebar-header"><button className="v-brand" onClick={()=>go(0)}>{paperTitle}</button></div>
   <nav className="slide-sidebar-nav" aria-label="章节导航">
    <button className={'slide-sidebar-item v-cover-nav'+(active===0?' active':'')} onClick={()=>go(0)}><span className="slide-sidebar-num">封面</span><span className="slide-sidebar-text">让观察跟上推理</span></button>
    {chapterNames.map((name,i)=><button key={name} className={'slide-sidebar-item v-nav-item'+(active===i+1?' active':'')} aria-current={active===i+1?'location':undefined} onClick={()=>go(i+1)}><span className="slide-sidebar-num">{'§'+(i+1)}</span><span className="slide-sidebar-text">{name}</span></button>)}
    <button className={'slide-sidebar-item v-video-nav'+(active===11?' active':'')} onClick={()=>go(11)}><span className="slide-sidebar-num">↗</span><span className="slide-sidebar-text">延伸视频</span></button>
   </nav>
  </aside>
  <button className="slide-sidebar-collapse v-collapse" aria-label={collapsed?'展开目录':'折叠目录'} onClick={()=>setCollapsed(p=>!p)}>{collapsed?'☰':'◀'}</button>
  {menu&&<button className="v-menu-shade" aria-label="关闭目录" onClick={()=>setMenu(false)}/>}
  <main className="slide-main v-main">
   <div className="v-topbar"><button className="v-menu-button" onClick={()=>setMenu(p=>!p)} aria-label="打开章节目录">☰ 目录</button><span>{active===0?'封面':active===11?'延伸视频':'第 '+active+' 章'}</span></div>
   <div className="slide-content v-content">
    {active===0&&<section id="cover" data-reading-index="0" className="hero v-cover"><div className="hero-inner">
     <h1>{paperTitle}</h1>
     <p className="hero-sub">在需要证据的地方回看，让长视频中的关键细节进入判断。</p>
     <p className="hero-abs">先理解整段视频，再主动选择片段；把新画面接回推理，逐步形成有依据的答案。</p>
     <div className="hero-meta"><span>按需观察</span><span>多模态推理</span><span>难度感知学习</span></div>
     <CoverOverview/>
    </div>{continueTo(1,'开始学习第一章')}</section>}
    {chapterNames.map((name,i)=>{if(active!==i+1)return null;const units=course.filter(l=>l.chapter===i+1);return <section className="chap slide-chap v-lesson" id={'chapter-'+(i+1)} data-reading-index={i+1} key={name}>
     <h1 className="chap-title"><span className="num">§{i+1}.</span><span className="chapter-heading-text">{name}</span><span className="reading-badge">{i<4?'观察与推理':i<8?'工具与学习':i===8?'奖励设计':'结果与边界'}</span></h1>
     <nav className="reading-trail" aria-label="学习进度">{chapterNames.map((n,j)=><button key={n} title={n} aria-label={'前往第'+(j+1)+'章'} aria-current={i===j?'step':undefined} onClick={()=>go(j+1)} className={i===j?'current':i>j?'visited':''}>§{j+1}</button>)}</nav>
     <div className="chap-bridge reading-bridge"><span className="bridge-mark">↗</span><div className="cb-body"><h2>本章要解决的问题</h2><p className="cb-text">{chapterIntros[i].question}</p></div></div>
     <aside className="reading-analogy"><span className="analogy-label">先建立直觉</span><div><h2>{chapterIntros[i].analogy}</h2><p>{chapterIntros[i].text}</p></div></aside>
     {units.map((lesson,index)=>{const reading=readings[lesson.kind];return <RewardDemoProvider kind={lesson.kind} key={lesson.kind}><div className="v-unit" data-lesson={lesson.kind}>
      <section className="module v-module">
       <header className="module-head"><span className="num">{i+1}.{index+1}</span><h2>{lesson.title}</h2></header>
       <div className="module-body">
        <div className="reading-prose">{reading.before.map((p,j)=><p key={j}>{p}</p>)}</div>
        <div className="reading-observe"><strong>观察重点</strong><p>{reading.watch}</p></div>
        {i<4?<AnimatedLesson kind={lesson.kind}/>:<IllustratedLesson kind={lesson.kind}/>}
        <div className="reading-insight"><h3>从演示中理解机制</h3>{reading.after.map((p,j)=><p key={j}>{p}</p>)}</div>
        <aside className="reading-example"><span>具体想一想</span><div><h3>{reading.example.title}</h3><p>{reading.example.text}</p></div></aside>
        {lesson.formula&&<div className="v-formula reading-formula"><span>把过程写成公式</span><p>{lesson.formula}</p></div>}
        {reading.detail&&<Evidence lesson={lesson}/>}
       </div>
      </section>
      <aside className="v-notes"><div className="v-takeaways">{lesson.points.map((point,j)=><div className={'v-point takeaway-'+j} key={point.title}><span className="takeaway-number">{String(j+1).padStart(2,'0')}</span><h2>{point.title}</h2><p>{point.text}</p></div>)}</div></aside>
     </div></RewardDemoProvider>;})}
     {continueTo(i+2,i===9?'继续查看延伸视频':'继续学习下一章')}
    </section>;})}
    {active===11&&<section id="videos" data-reading-index="11" className="dl-related-section v-video-page">
     <h1>继续理解策略优化</h1><p>用两个基础讲解，进一步理解强化学习与 GRPO。</p>
     <div className="v-video-grid">{videos.map(v=><a key={v.bvid} className="v-video-card" href={'https://www.bilibili.com/video/'+v.bvid+'/'} target="_blank" rel="noreferrer"><div className="v-video-cover"><img src={v.cover} alt={v.title} referrerPolicy="no-referrer"/><span className="v-video-play">▶</span><span className="v-video-duration">{v.duration}</span></div><h2>{v.title}</h2><p>{v.views}次播放 <span>打开视频 ↗</span></p></a>)}</div>
     {continueTo(0,'回到封面')}
    </section>}
   </div>
   <footer className="slide-nav v-footer"><button className="slide-nav-btn v-back" onClick={()=>go(active-1)} disabled={active===0}>← 上一章</button><span className="slide-nav-counter">{active+1} / 12</span><button className="slide-nav-btn slide-nav-btn-primary v-next" onClick={()=>go(active===11?0:active+1)}>{active===0?'开始学习第一章':active===11?'回到封面':active===10?'继续查看延伸视频':'继续学习下一章'} →</button></footer>
  </main>
 </div>;
}
