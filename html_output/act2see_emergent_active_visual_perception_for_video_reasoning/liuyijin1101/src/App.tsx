import { Fragment, useEffect, useState } from 'react';
import { ArrowRight, BookOpen, RotateCcw } from 'lucide-react';
import { chapterBodies } from './ChapterBodies';
import { Act2SeeHeroDemo } from './components/Act2SeeHeroDemo';
import { EvidenceDecisionProvider } from './EvidenceDecision';
import { ARXIV, chapters, CODE, CVF } from './content';
import { FinalQuiz } from './Reliability';
import { SFTLearningProvider } from './SFTLearning';
import { PptBars } from './components/PptBars';
import { freshProgress, loadProgress, saveProgress, type TutorialProgress } from './tutorialProgress';

function FlowMini({ revealed }: { revealed: number }) {
  return <div className="flow-mini" aria-label={`学习进度：已展开 ${revealed} / ${chapters.length} 章`}>
    {chapters.map((chapter, index) => <Fragment key={chapter.id}>
      {index > 0 && <span className="flow-arrow" aria-hidden="true">→</span>}
      <div className={`flow-step ${index + 1 < revealed ? 'done' : index + 1 === revealed ? 'active' : ''}`} data-step={index + 1} title={chapter.title}>§{index + 1}</div>
    </Fragment>)}
  </div>;
}

function Hero({ started, onStart }: { started: boolean; onStart: () => void }) {
  return <section className="hero" id="top"><div className="hero-inner">
    <div className="hero-venue">Interactive Tutorial</div>
    <h1 tabIndex={-1}>Act2See: Emergent Active Visual Perception for Video Reasoning</h1>
    <div className="hero-sub">Act2See：从被动采样到主动视觉推理</div>
    <p className="hero-abs">一条从视觉证据缺失，到主动工具调用、监督训练与性能验证的完整学习路径。</p>
    <div className="hero-meta"><a href={CVF} target="_blank" rel="noreferrer">Paper ↗</a><a href={ARXIV} target="_blank" rel="noreferrer">arXiv ↗</a><a href={CODE} target="_blank" rel="noreferrer">Code ↗</a><span>视频推理</span><span>主动视觉感知</span></div>
    <Act2SeeHeroDemo/>
    {!started && <div className="chap-loader"><div className="chap-loader-hint">准备好了吗？</div><button className="chap-loader-btn" onClick={onStart}>开始学习 §1 <span className="chap-loader-arrow">→</span></button></div>}
  </div></section>;
}

function Chapter({ index, progress, onNext, onReview, onReset }: { index: number; progress: TutorialProgress; onNext: () => void; onReview: () => void; onReset: () => void }) {
  const chapter = chapters[index];
  const isCurrent = index === progress.completed && progress.completed < chapters.length;
  const sectionModules = chapterBodies[chapter.id].map((subsection, subIndex) => <div className="module" key={`${chapter.id}-${subIndex}`}><div className="module-head"><span className="num">{index + 1}.{subIndex + 1}</span><h4>{subsection.title}</h4><span className="module-source">{chapter.sourceRefs.join(' · ')}</span></div><div className="module-body">{subsection.content}</div></div>);
  return <section className="chap" id={chapter.id} aria-labelledby={`${chapter.id}-title`}>
    <h2 className="chap-title" id={`${chapter.id}-title`} tabIndex={-1}><span className="num">§{index + 1}.</span>{chapter.title}<span className={`badge-tag ${chapter.difficulty === '入门' ? 'trn' : chapter.difficulty === '进阶' ? 'inf' : 'both'}`}>{chapter.difficulty}</span></h2>
    <FlowMini revealed={progress.unlocked}/>
    <div className="chap-bridge"><div className="cb-icon" aria-hidden="true">🔗</div><div className="cb-body"><div className="cb-title">本节作用</div><div className="cb-text">{chapter.role}：{chapter.question}</div></div></div>
    {chapter.id === 'evidence-decision' ? <EvidenceDecisionProvider>{sectionModules}</EvidenceDecisionProvider> : chapter.id === 'sft-learning' ? <SFTLearningProvider>{sectionModules}</SFTLearningProvider> : sectionModules}
    {index === chapters.length - 1 && <div id="final" className="final-chap"><div className="module"><div className="module-head"><span className="num">9.{chapterBodies[chapter.id].length + 1}</span><h4 tabIndex={-1}>核心机制综合测验</h4></div><div className="module-body"><FinalQuiz/></div></div><div className="final-actions"><button className="chap-loader-btn" onClick={onReview}><BookOpen size={18}/> 复习全部章节 <ArrowRight size={18}/></button><button className="reset-button" onClick={onReset}><RotateCcw size={17}/> 重新开始</button></div></div>}
    {isCurrent && <div className="chap-loader"><button className="chap-loader-btn" onClick={onNext}>{index === chapters.length - 1 ? '完成本轮学习' : `继续学习 §${index + 2}`} <span className="chap-loader-arrow">→</span></button></div>}
  </section>;
}

export default function App() {
  const [progress, setProgress] = useState<TutorialProgress>(loadProgress);
  const [destination, setDestination] = useState('');
  const [epoch, setEpoch] = useState(0);
  const revealed = progress.unlocked;

  useEffect(() => saveProgress(progress), [progress]);
  useEffect(() => {
    let frame = 0;
    const syncActive = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const visible = chapters.slice(0, progress.unlocked);
        const current = [...visible].reverse().find(chapter => (document.getElementById(chapter.id)?.getBoundingClientRect().top ?? Infinity) <= window.innerHeight * 0.3);
        const activeId = current?.id ?? null;
        setProgress(previous => previous.activeId === activeId ? previous : { ...previous, activeId });
      });
    };
    syncActive();
    window.addEventListener('scroll', syncActive, { passive: true });
    window.addEventListener('resize', syncActive);
    return () => { cancelAnimationFrame(frame); window.removeEventListener('scroll', syncActive); window.removeEventListener('resize', syncActive); };
  }, [progress.unlocked]);
  useEffect(() => {
    if (!destination) return;
    const frame = requestAnimationFrame(() => {
      const target = document.getElementById(destination);
      if (target) {
        target.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
        target.querySelector<HTMLElement>('h1,h2,h4')?.focus({ preventScroll: true });
        setDestination('');
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [destination, progress.unlocked, epoch]);

  function navigate(index: number) {
    const chapter = chapters[index];
    if (!chapter) return;
    setProgress(current => ({ ...current, unlocked: Math.max(current.unlocked, index + 1) }));
    setDestination(chapter.id);
  }

  function start() {
    setProgress(current => ({ ...current, unlocked: Math.max(1, current.unlocked) }));
    setDestination(chapters[0].id);
  }
  function next(index: number) {
    if (index !== progress.completed) return;
    if (index === chapters.length - 1) {
      setProgress(current => ({ ...current, completed: chapters.length, review: true }));
      setDestination('final');
    } else {
      setProgress(current => ({ ...current, unlocked: Math.max(current.unlocked, index + 2), completed: index + 1, review: false }));
      setDestination(chapters[index + 1].id);
    }
  }
  function reset() {
    // Persist a fresh v2 state; deleting v2 would re-import the retained v1 backup on refresh.
    setProgress(freshProgress());
    setEpoch(value => value + 1);
    setDestination('top');
  }

  return <><a className="skip-link" href="#top">跳到正文</a><Hero started={revealed > 0} onStart={start}/><main key={epoch}>
    {chapters.map((chapter, index) => index < revealed ? <Chapter key={chapter.id} index={index} progress={progress} onNext={() => next(index)} onReview={() => { setProgress(current => ({ ...current, review: true })); setDestination(chapters[0].id); }} onReset={reset}/> : null)}
  </main><PptBars progress={progress} onNavigate={navigate}/></>;
}
