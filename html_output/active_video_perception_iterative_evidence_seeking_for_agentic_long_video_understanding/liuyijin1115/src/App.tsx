import { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { ARXIV, chapters, CODE, CVPR, PAPER } from './content';
import { LessonModule } from './components/LessonModules';
import { PptBars } from './components/PptBars';
import { HeroEvidenceDemo, HeroPlayback } from './components/HeroEvidenceDemo';

const STORAGE = 'avp-paperskill-progress-v3';
const OLD_STORAGE = 'avp-paperskill-progress-v2';
type Progress = { revealed: number; completedThrough: number };
const initial: Progress = { revealed: 0, completedThrough: 0 };

function readProgress(): Progress {
  try {
    const raw = localStorage.getItem(STORAGE);
    if (raw) {
      const value = JSON.parse(raw) as Partial<Progress>;
      if (Number.isInteger(value.revealed) && Number.isInteger(value.completedThrough) && value.revealed! >= 0 && value.revealed! <= chapters.length && value.completedThrough! >= 0 && value.completedThrough! <= value.revealed!) {
        return { revealed: value.revealed!, completedThrough: value.completedThrough! };
      }
    }
    const oldRaw = localStorage.getItem(OLD_STORAGE);
    if (!oldRaw) return initial;
    const old = JSON.parse(oldRaw) as Partial<Progress>;
    if (!Number.isInteger(old.revealed) || !Number.isInteger(old.completedThrough) || old.revealed! < 0 || old.revealed! > 16 || old.completedThrough! < 0 || old.completedThrough! > old.revealed!) return initial;
    const depth = [0, 1, 1, 2, 3, 4, 5, 6, 7, 7, 7, 8, 9, 9, 10, 10, 10];
    return { revealed: depth[old.revealed!], completedThrough: Math.min(depth[old.completedThrough!], depth[old.revealed!]) };
  } catch { return initial; }
}

function FlowMini({ revealed, current }: { revealed: number; current: number }) {
  return <div className="flow-mini" aria-label={`章节进度：当前第 ${current + 1} 章，已展开 ${revealed} / ${chapters.length} 章`}>
    {chapters.map((chapter, index) => <span className="flow-group" key={chapter.id}>
      {index > 0 && <span className="flow-arrow" aria-hidden="true">→</span>}
      <span className={`flow-step ${index < current ? 'done' : index === current ? 'active' : ''}`} title={chapter.title}>§{index + 1}</span>
    </span>)}
  </div>;
}

export default function App() {
  const [progress, setProgress] = useState<Progress>(readProgress);
  const [destination, setDestination] = useState<string | null>(null);

  function begin() {
    setProgress(p => ({ ...p, revealed: Math.max(p.revealed, 1) }));
    setDestination(chapters[0].id);
  }
  function complete(index: number) {
    setProgress(p => index === p.completedThrough ? { ...p, completedThrough: index + 1 } : p);
  }
  function continueFrom(index: number) {
    if (index === chapters.length - 1) {
      setDestination(chapters[0].id);
    } else {
      setProgress(p => ({ ...p, revealed: Math.max(p.revealed, index + 2) }));
      setDestination(chapters[index + 1].id);
    }
  }
  function reset() {
    try { localStorage.removeItem(STORAGE); localStorage.removeItem(OLD_STORAGE); } catch { /* local state remains usable */ }
    setProgress(initial);
    setDestination('top');
  }
  function navigateToChapter(index: number) {
    const chapter = chapters[index];
    if (!chapter) return;
    setProgress(p => ({ ...p, revealed: Math.max(p.revealed, index + 1) }));
    setDestination(chapter.id);
  }
  useEffect(() => {
    try { localStorage.setItem(STORAGE, JSON.stringify(progress)); } catch { /* local state remains usable */ }
  }, [progress]);
  useEffect(() => {
    if (!destination) return;
    const id = requestAnimationFrame(() => {
      const target = document.getElementById(destination);
      target?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
      target?.querySelector<HTMLElement>('h1, h2')?.focus({ preventScroll: true });
      setDestination(null);
    });
    return () => cancelAnimationFrame(id);
  }, [destination, progress.revealed]);

  return <div className="app-shell">
    <a className="skip-link" href="#main">跳到正文</a>
    <section id="top" className="hero" aria-labelledby="hero-title">
      <div className="hero-inner">
        <div className="hero-venue">Interactive Tutorial</div>
        <h1 id="hero-title" tabIndex={-1}>Active Video Perception</h1>
        <div className="hero-sub">主动视频感知：让智能体迭代寻找长视频证据 · CVPR 2026 Findings</div>
        <p className="hero-abs">长视频太长，真正关键的是<b>知道还缺什么证据，并决定下一次去哪里看。</b> AVP 将长视频理解改造成主动取证过程：先规划观察，从视频中取得带时间戳的证据，再反思是否已经足以回答。</p>
        <div className="hero-meta"><span>长视频理解</span><span>主动感知</span><span>Plan → Observe → Reflect</span></div>
        <div className="hero-resources"><a href={CVPR} target="_blank" rel="noreferrer">CVPR Paper <ExternalLink size={14} /></a><a href={ARXIV} target="_blank" rel="noreferrer">arXiv <ExternalLink size={14} /></a><a href={CODE} target="_blank" rel="noreferrer">Code <ExternalLink size={14} /></a></div>
      </div>
      <HeroPlayback><div className="hero-compare" aria-label="固定采样与主动观察的流程对比">
        <div className="bg-side old"><div className="bg-side-head">传统方法</div><div className="bg-side-canvas"><HeroEvidenceDemo /></div><div className="bg-side-tag">关键动作未记录，<b>无法回答</b></div></div>
        <div className="bg-side new"><div className="bg-side-head">本文方法</div><div className="bg-side-canvas"><HeroEvidenceDemo active /></div><div className="bg-side-tag">看到放下钥匙，<b>得到直接证据</b></div></div>
      </div></HeroPlayback>
      {progress.revealed === 0 && <div className="chap-loader"><div className="chap-loader-hint">准备好了吗？</div><button className="chap-loader-btn" onClick={begin}>开始学习 §1 <span className="chap-loader-arrow">→</span></button></div>}
    </section>

    <main id="main">
      {chapters.slice(0, progress.revealed).map((chapter, index) => <section className="chap" id={chapter.id} aria-labelledby={`${chapter.id}-title`} key={chapter.id}>
        <h2 className="chap-title" id={`${chapter.id}-title`} tabIndex={-1}><span className="num">§{index + 1}.</span>{chapter.title}<span className={`badge-tag ${chapter.id === 'case' ? 'trn' : 'both'}`}>{chapter.id === 'case' ? '教学解释' : '交互学习'}</span></h2>
        <FlowMini revealed={progress.revealed} current={index} />
        <div className="chap-bridge"><div className="cb-icon" aria-hidden="true">🔗</div><div className="cb-body"><div className="cb-title">本节问题</div><div className="cb-text">{chapter.question}</div></div></div>
        <LessonModule id={chapter.id} chapterNumber={index + 1} onComplete={() => complete(index)} />
        {index < chapters.length - 1 && <p className="chapter-next">接下来：{chapter.next}</p>}
        {index === progress.revealed - 1 && <div className="chap-loader"><div className="chap-loader-hint" /><button className="chap-loader-btn" onClick={() => continueFrom(index)}>{index === chapters.length - 1 ? '复习全部章节' : `继续学习 §${index + 2}`} <span className="chap-loader-arrow">→</span></button></div>}
      </section>)}
      <footer className="footer"><div><strong>AVP · PaperSkill</strong></div><div><a href={PAPER} target="_blank" rel="noreferrer">论文全文</a><a href={CODE} target="_blank" rel="noreferrer">官方代码</a>{progress.revealed > 0 && <button onClick={reset}>重新开始</button>}</div></footer>
    </main>
    <PptBars chapters={chapters} revealed={progress.revealed} onNavigate={navigateToChapter} visible={progress.revealed > 0} />
  </div>;
}
