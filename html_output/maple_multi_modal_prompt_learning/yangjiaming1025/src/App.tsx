import React,{useState,useEffect,useCallback} from 'react';
import {tutorial} from './data/tutorial';
import {Hero} from './components/Hero';
import {ChapterBridge} from './components/ChapterBridge';
import {AnalogyCard} from './components/AnalogyCard';
import {Module} from './components/Module';
import {Formula} from './components/Formula';
import {InsightBar} from './components/InsightBar';
import {Takeaway} from './components/Takeaway';
import {BiliVideos} from './components/BiliVideos';
export default function App(){
 const chapters=tutorial.chapters,total=chapters.length,bili=tutorial.bilibili||[],last=total+(bili.length?1:0);
 const readHash=()=>{const hit=/^#chapter-(\d+)$/.exec(window.location.hash);return Math.min(last,hit?Number(hit[1]):0)};
 const [active,setActive]=useState(readHash),[visited,setVisited]=useState<Set<number>>(()=>new Set([readHash()]));
 const goTo=useCallback((n:number)=>{const next=Math.max(0,Math.min(last,n));setActive(next);setVisited(old=>new Set([...old,next]));history.replaceState(null,'',next?'#chapter-'+next:location.pathname+location.search);},[last]);
 useEffect(()=>{window.scrollTo({top:0,behavior:'instant'});},[active]);
 useEffect(()=>{const change=()=>setActive(readHash());window.addEventListener('hashchange',change);return()=>window.removeEventListener('hashchange',change)},[last]);
 useEffect(()=>{const onKey=(e:KeyboardEvent)=>{const target=e.target as HTMLElement;if(e.defaultPrevented||e.altKey||e.ctrlKey||e.metaKey||target.isContentEditable||target.closest('button,input,select,textarea,a,[tabindex],[role=dialog]'))return;if(e.key==='ArrowRight'){e.preventDefault();goTo(active+1)}if(e.key==='ArrowLeft'){e.preventDefault();goTo(active-1)}};window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey)},[active,goTo]);
 const chapter=active>0&&active<=total?chapters[active-1]:null;
 return <div className="maple-app">
  <header className="maple-header"><div className="maple-header-inner"><button className="maple-wordmark" aria-label="MaPLe 封面" onClick={()=>goTo(0)}>MaPLe<span> / </span></button><nav className="maple-number-nav" aria-label="章节目录">{Array.from({length:last+1},(_,i)=>{const name=i===0?'封面':i<=total?chapters[i-1].title:'延伸阅读';return <button type="button" key={i} onClick={()=>goTo(i)} aria-label={i+' · '+name} title={name} aria-current={active===i?'page':undefined} className={[active===i?'is-active':'',visited.has(i)?'is-visited':''].join(' ')}>{i}</button>})}</nav></div></header>
  <main className={'maple-main '+(active===0?'is-cover':'')}><div key={active} className="maple-content">
   {active===0?<Hero meta={tutorial.meta} hero={tutorial.hero} onStart={()=>goTo(1)}/>:chapter?<section className="chap maple-chapter">
    <div className="maple-chapter-heading"><div className="maple-chapter-kicker"><span>CHAPTER {String(active).padStart(2,'0')}</span><span className={'badge-tag '+chapter.badge}>{chapter.badgeLabel}</span></div><h2 className="chap-title">{chapter.title}</h2></div>
    <ChapterBridge text={chapter.bridge}/><AnalogyCard analogy={chapter.analogy} chapterId={chapter.id}/>
    {chapter.modules.map(m=><Module key={m.id} module={m} chapterId={chapter.id}/>)}
    {chapter.insight&&<InsightBar text={chapter.insight}/>}{chapter.formula&&<Formula formula={chapter.formula}/>}<Takeaway items={chapter.takeaways}/>
   </section>:<BiliVideos items={bili}/>}
  </div>{active>0&&<footer className="maple-pager"><button onClick={()=>goTo(active-1)} className="maple-page-prev">← {active===1?'封面':'上一章'}</button><span>{String(active).padStart(2,'0')} <i>/</i> {total}</span>{active<last?<button onClick={()=>goTo(active+1)} className="maple-page-next">下一章 <span>↗</span></button>:<button onClick={()=>goTo(0)} className="maple-page-next">回到封面 <span>↗</span></button>}</footer>}</main>
 </div>
}
