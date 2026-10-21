import React,{useState,useEffect,useCallback} from 'react';
import {tutorial} from './data/tutorial';
import {Hero} from './components/Hero';




import {ArchiveReview,useTrainingArchive} from './components/TrainingArchive';
import {BiliVideos} from './components/BiliVideos';
import {ChapterJourney,chapterStages} from './components/ChapterJourney';
export default function App(){
const [active,setActive]=useState(0),[menu,setMenu]=useState(false);const [visited,setVisited]=useState<number[]>([]);const chapters=tutorial.chapters;const review=chapters.length+1;const last=review+(tutorial.bilibili?.length?1:0);const archive=useTrainingArchive();const [steps,setSteps]=useState<number[]>(Array(chapters.length).fill(0));const inChapter=active>0&&active<=chapters.length;const stage=inChapter?steps[active-1]||0:0;const stages=inChapter?chapterStages(chapters[active-1]):[];const finalStage=inChapter&&stage===stages.length-1;
const go=useCallback((n:number)=>{const target=Math.max(0,Math.min(last,n));setActive(target);setMenu(false);if(target>0&&target<=chapters.length)setVisited(v=>v.includes(target)?v:[...v,target]);window.scrollTo({top:0,behavior:'instant'});},[last,chapters.length]);
useEffect(()=>{const handler=(e:KeyboardEvent)=>{if((e.target as HTMLElement).closest('input,textarea,select,[contenteditable="true"]'))return;if(e.key==='Escape')setMenu(false);};window.addEventListener('keydown',handler);return()=>window.removeEventListener('keydown',handler)},[]);
function advance(){if(inChapter&&!finalStage){setSteps(s=>s.map((v,i)=>i===active-1?v+1:v));window.scrollTo({top:0,behavior:'instant'});}else go(active+1)} function retreat(){if(inChapter&&stage>0){setSteps(s=>s.map((v,i)=>i===active-1?v-1:v));window.scrollTo({top:0,behavior:'instant'});}else go(active-1)} return <div className="story-app">
<header className="garden-header"><button className="garden-brand" onClick={()=>go(0)} aria-label="回到故事封面"><span className="brand-flower">✧</span><span>桃源<span className="brand-divider"> / </span>提示训练师</span></button><span className="garden-status"><i/>核心大脑 · 只读</span><button className="garden-menu" onClick={()=>setMenu(!menu)} aria-expanded={menu}>章节目录 {menu?'−':'＋'}</button></header>
{menu&&<div className="story-drawer"><nav aria-label="故事章节"><button onClick={()=>go(0)}>00 · 进入桃源</button>{chapters.map((c,i)=><button className={active===i+1?'is-selected':''} key={c.id} onClick={()=>go(i+1)}><span>{String(i+1).padStart(2,'0')}</span>{c.title}<small>{visited.includes(i+1)?'已探索':''}</small></button>)}<button onClick={()=>go(review)}>复盘 · 训练档案<small>{archive.saved.length}/10 已归档</small></button>{tutorial.bilibili?.length?<button onClick={()=>go(last)}>延伸 · 论文视频</button>:null}</nav></div>}
<main className="story-main">
<div hidden={active!==0}><Hero meta={tutorial.meta} hero={tutorial.hero}/></div>
{chapters.map((ch,i)=><div key={ch.id} hidden={active!==i+1}><ChapterJourney ch={ch} id={i} step={steps[i]||0} saved={archive.saved.includes(i)} onSave={()=>archive.save(i)}/></div>)}<div hidden={active!==review}><ArchiveReview saved={archive.saved} onVisit={go}/></div>{tutorial.bilibili?.length?<div hidden={active!==last} className="story-videos"><div className="chapter-eyebrow">离园之前 / 延伸阅读</div><h1>继续倾听，继续探索</h1><p>论文与方法的拓展讲解。视频不代替原始论文证据。</p><BiliVideos items={tutorial.bilibili}/></div>:null}
</main>
<footer className="story-footer"><button className="quiet-button" onClick={retreat} disabled={active===0}>← 返回</button><div className="journey-progress"><span>{active===0?'Robot Prompt Trainer':active<=chapters.length?`日志 ${String(active).padStart(2,'0')} · ${stage+1}/${stages.length}`:active===review?'训练档案复盘':'延伸阅读'}</span><div className="journey-line"><i style={{width:`${Math.min(active,10)*10}%`}}/></div></div><button className="continue-button" onClick={advance} disabled={active===last}>{active===0?'接受训练师身份':inChapter&&!finalStage?stages[stage].next:active===chapters.length?'进入档案复盘':active===last?'旅程已结束':active===review?'延伸阅读':'进入下一章'} <span>→</span></button></footer>
</div>}
