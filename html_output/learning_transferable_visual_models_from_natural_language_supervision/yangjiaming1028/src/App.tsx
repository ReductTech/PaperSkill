import { useEffect, useRef, useState } from 'react';
import { tutorial } from './data/tutorial';
import { chapterExperience, learningStages } from './data/experience';
import { widgetRegistry } from './modules/registry';
import { Formula } from './components/Formula';
import { ClipCoverAnimation } from './components/ClipCoverAnimation';
import { ClipStoryline } from './components/ClipStoryline';
import './styles/chapter-flow.css';

const readChapter = () => Math.min(10, Math.max(0, Number(window.location.hash.match(/^#chapter-(\d+)$/)?.[1] || 0)));
function Brand({ onClick }: { onClick: () => void }) {
  return <button className="brand" onClick={onClick} aria-label="CLIP 教程首页"><svg viewBox="0 0 32 32" aria-hidden="true"><rect x="3" y="4" width="19" height="19" rx="5"/><rect x="11" y="12" width="18" height="17" rx="5"/><path d="m10 14 3 3 6-7"/></svg><strong>CLIP</strong></button>;
}

function Home({ goTo }: { goTo: (n: number) => void }) {
  return <>
    <section className="landing-hero">
      <div className="hero-copy"><p className="eyebrow"><span className="live-dot"/> OPENAI · ICML 2021</p><h1>让图像与文字<br/>说上<span>同一种语言。</span></h1><p className="hero-lead">亲手配对、比较向量、完成预测，读懂 CLIP 的核心思路与能力边界。</p><div className="hero-actions"><button className="primary-button" onClick={() => goTo(1)}>开始探索<span>↗</span></button></div><div className="hero-facts"><span><b>10</b> 个章节</span><span><b>11</b> 个实验</span><span>从直觉到原理</span></div></div>
      <ClipCoverAnimation/>
    </section>

  </>;
}

export default function App() {
  const [active, setActive] = useState(readChapter);
  const [contentsOpen, setContentsOpen] = useState(false);
  const previousChapter = useRef(active);
  useEffect(() => {
    if (previousChapter.current !== active) {
      document.getElementById('main-content')?.focus({ preventScroll: true });
      previousChapter.current = active;
    }
  }, [active]);
  const [trainingStep, setTrainingStep] = useState(0);
  const trainingTabs = useRef<HTMLDivElement>(null);
  const switchTrainingStep = (step: number, scroll = false) => { setTrainingStep(step); if (scroll) { trainingTabs.current?.scrollIntoView({ block: 'start', behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); document.getElementById('training-tab-' + step)?.focus({ preventScroll: true }); } };
  const menuRef = useRef<HTMLDivElement>(null);
  const tocButton = useRef<HTMLButtonElement>(null);
  const goTo = (n: number) => { const next = Math.max(0, Math.min(10, n)); window.history.pushState(null, '', next ? '#chapter-' + next : window.location.pathname); setActive(next); setTrainingStep(0); setContentsOpen(false); document.getElementById('main-content')?.focus({ preventScroll: true }); window.scrollTo({ top: 0, behavior: 'instant' }); };
  useEffect(() => { const sync = () => { setActive(readChapter()); setTrainingStep(0); setContentsOpen(false); window.scrollTo({ top: 0, behavior: 'instant' }); }; window.addEventListener('popstate', sync); window.addEventListener('hashchange', sync); return () => { window.removeEventListener('popstate', sync); window.removeEventListener('hashchange', sync); }; }, []);
  useEffect(() => { if (!contentsOpen) return; (menuRef.current?.querySelector<HTMLButtonElement>('.contents-grid .current') ?? menuRef.current?.querySelector<HTMLButtonElement>('.contents-grid button'))?.focus({ preventScroll: true }); const close = (e: PointerEvent) => { if (!menuRef.current?.contains(e.target as Node) && !tocButton.current?.contains(e.target as Node)) setContentsOpen(false); }; const key = (e: KeyboardEvent) => { if (e.key === 'Escape') { setContentsOpen(false); tocButton.current?.focus(); } }; window.addEventListener('pointerdown', close); window.addEventListener('keydown', key); return () => { window.removeEventListener('pointerdown', close); window.removeEventListener('keydown', key); }; }, [contentsOpen]);
  const chapter = active ? tutorial.chapters[active - 1] : null;
  const experience = active ? chapterExperience[active - 1] : null;

  return <div className={'experience' + (active === 0 ? ' is-home' : '')}>
    <a className="skip-link" href="#main-content" onClick={event => { event.preventDefault(); const main=document.getElementById('main-content'); main?.focus(); main?.scrollIntoView({block:'start'}); }}>跳到主要内容</a>
    <header className="site-header"><div className="header-inner"><Brand onClick={() => goTo(0)}/><nav className="stage-nav" aria-label="学习阶段"><button className={active === 0 ? 'active' : ''} onClick={() => goTo(0)}>导览</button>{learningStages.map(s => <button key={s.title} className={s.chapters.includes(active) ? 'active' : ''} onClick={() => goTo(s.start)}>{s.title}</button>)}</nav><button ref={tocButton} className={'contents-button' + (contentsOpen ? ' active' : '')} aria-expanded={contentsOpen} aria-controls="chapter-menu" onClick={() => setContentsOpen(v => !v)}><span>☷</span> 全部章节</button></div></header>
    {contentsOpen && <div id="chapter-menu" className="contents-panel" ref={menuRef} role="navigation" aria-label="章节目录"><div className="contents-heading"><div><p className="eyebrow">YOUR FIELD GUIDE</p><h2>选择你想探索的问题</h2></div><button className="icon-button" aria-label="关闭章节目录" onClick={() => { setContentsOpen(false); tocButton.current?.focus(); }}>×</button></div><div className="contents-grid">{chapterExperience.map((entry, i) => <button key={entry.title} className={active === i + 1 ? 'current' : ''} onClick={() => goTo(i + 1)}><span>{String(i + 1).padStart(2, '0')}</span><div><b>{entry.title}</b><small>{entry.stage} · 约 {entry.minutes} 分钟</small></div><i>↗</i></button>)}</div></div>}
    <main id="main-content" className="site-main" tabIndex={-1}>
      {!chapter || !experience ? <Home goTo={goTo}/> : <article className="chapter-page" key={active}>
        <div className="chapter-toolbar"><button className="back-link" onClick={() => goTo(0)}>← 回到导览</button><div className="chapter-steps" aria-label="章节导航">{chapterExperience.map((entry, i) => <button key={entry.title} aria-label={'第' + (i + 1) + '章 ' + entry.stage} aria-current={active === i + 1 ? 'step' : undefined} className={active === i + 1 ? 'current' : ''} onClick={() => goTo(i + 1)}>{String(i + 1).padStart(2, '0')}</button>)}</div></div>
        <ClipStoryline chapter={active}/>
        <header className="chapter-header"><p className="eyebrow"><span className="chapter-index">{String(active).padStart(2, '0')}</span>{experience.stage} <span className="read-time">约 {experience.minutes} 分钟</span></p><h1>{experience.title}</h1><p className="chapter-lead">{experience.lead}</p></header>
        <div className="question-strip"><span>带着问题动手</span><p>{experience.question}</p><span aria-hidden="true">↓</span></div>
        {active === 7 && <div className="training-steps" ref={trainingTabs} role="tablist" aria-label="训练实验步骤">{[{ title: '看损失', detail: '改配对分数，观察概率' }, { title: '看分数更新', detail: '更新三个示例分数' }].map((step, i) => <button key={step.title} type="button" role="tab" id={'training-tab-' + i} aria-selected={trainingStep === i} aria-controls={'training-panel-' + i} tabIndex={trainingStep === i ? 0 : -1} onClick={() => switchTrainingStep(i)} onKeyDown={event => { if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) { event.preventDefault(); const next = event.key === 'Home' ? 0 : event.key === 'End' ? 1 : 1 - i; switchTrainingStep(next); document.getElementById('training-tab-' + next)?.focus(); } }}><span>0{i + 1}</span><div><strong>{step.title}</strong><small>{step.detail}</small></div></button>)}</div>}
        {chapter.modules.map((module, i) => { const Widget = widgetRegistry[module.componentId]; return <section className="experiment-card" key={module.id} hidden={active === 7 && trainingStep !== i} role={active === 7 ? 'tabpanel' : undefined} id={active === 7 ? 'training-panel-' + i : undefined} aria-labelledby={active === 7 ? 'training-tab-' + i : 'lab-title-' + module.id}><div className="experiment-heading"><div><p className="eyebrow">动手实验 / {String(i + 1).padStart(2, '0')}</p><h2 id={'lab-title-' + module.id}>{module.title}</h2></div><span className={'data-badge' + (active === 10 ? ' evidence' : '')}><i/>{active === 10 ? '论文报告数据' : [1,9].includes(active) ? '交互原理演示' : '可计算的教学模拟'}</span></div><p className="experiment-instruction">{experience.instructions[i]}</p><div className="experiment-body">{Widget ? <Widget chapterId={chapter.id} moduleId={module.id}/> : null}</div>{active === 7 && <div className="training-next"><span>{i === 0 ? '接下来，用三个示例分数观察一次梯度更新。' : '随时回到第一步对照；两个实验会保留当前状态。'}</span><button className={i === 0 ? 'continue-action' : 'review-action'} type="button" onClick={() => switchTrainingStep(1 - i, true)}>{i === 0 ? '继续：看分数更新 →' : '← 回看损失实验'}</button></div>}</section>; })}
        <div className="lesson-notes"><div className="insight-note"><span className="insight-icon">↳</span><div><small>这一步，真正需要记住的是</small><p dangerouslySetInnerHTML={{ __html: chapter.insight || chapter.bridge }}/></div></div>{chapter.formula && <section className="formula-section" aria-labelledby="formula-title"><header className="formula-heading"><p className="eyebrow">FROM INTUITION TO EQUATION</p><h2 id="formula-title">把直觉写成公式</h2><p>沿着刚才的实验读公式，含义就在对应符号旁。</p></header><Formula formula={chapter.formula}/></section>}<details className="deep-dive"><summary><span><small>CONTEXT & EVIDENCE</small>原理说明与论文依据</span><span className="evidence-toggle" aria-hidden="true">＋</span></summary><div className="evidence-copy"><p>{chapter.bridge}</p>{chapter.modules.map(module => <div key={module.id}><h3>{module.title}</h3><p dangerouslySetInnerHTML={{ __html: module.desc }}/></div>)}<a href="https://proceedings.mlr.press/v139/radford21a.html" target="_blank" rel="noreferrer">查看原论文 ↗</a></div></details><div className="takeaway-grid">{chapter.takeaways.map((item, i) => <div className="takeaway-item" key={item.title}><span>0{i + 1}</span><h3>{item.title}</h3><p>{item.desc}</p></div>)}</div></div>
        <footer className="chapter-footer"><button className="secondary-button" onClick={() => goTo(active - 1)}>← {active === 1 ? '回到导览' : '上一章'}</button><span>{String(active).padStart(2, '0')} / 10</span><button className="primary-button chapter-continue" aria-label={active === 10 ? '回到导览 ↑' : '下一章 →'} onClick={() => goTo(active === 10 ? 0 : active + 1)}><span><small>{active === 10 ? '回到导览' : '下一章'}</small><strong>{active === 10 ? '再选一个问题探索' : chapterExperience[active].stage}</strong></span><i aria-hidden="true">{active === 10 ? '↑' : '→'}</i></button></footer>
        {active === 10 && <section className="further-reading"><p className="eyebrow">KEEP EXPLORING</p><h2>继续往下读</h2><div>{tutorial.bilibili?.map(video => <a key={video.bvid} href={'https://www.bilibili.com/video/' + video.bvid} target="_blank" rel="noreferrer"><span>▶</span><b>{video.title}</b><span>↗</span></a>)}</div></section>}
      </article>}
    </main>{active > 0 && <footer className="site-footer"><span>CLIP · 图像与语言之间</span><p>基于 Radford et al., ICML 2021 · 为初学者设计</p><button onClick={() => goTo(0)}>回到起点 ↑</button></footer>}
  </div>;
}
