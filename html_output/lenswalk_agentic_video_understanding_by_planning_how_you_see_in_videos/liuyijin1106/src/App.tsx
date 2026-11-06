import { useEffect, useRef, useState } from 'react';
import { BookOpen, ExternalLink, RotateCcw } from 'lucide-react';
import { chapters, CODE, CVPR_PDF, PAPER, PROJECT } from './content';
import { LessonModule } from './components/LessonModules';
import { LearningModule } from './components/LearningModule';
import { HeroComparison } from './components/HeroComparison';
import { S9Benchmarks } from './components/S9Benchmarks';
import { S10Analysis } from './components/S10Analysis';

const STORAGE = 'lenswalk-paper-skill-progress-v3';
const PREVIOUS_STORAGE = 'lenswalk-paper-skill-progress-v2';
const OLD_STORAGE = 'lenswalk-paper-skill-progress-v1';
const oldToNew = [0,1,2,3,4,6,7,8,9,9,9,10,10,10,10,11];
type Progress = { unlockedThrough: number };
const initial: Progress = { unlockedThrough: 0 };

const subsectionTitles: Record<string, string> = {
  fixed: '固定采样如何漏掉短时动作',
  loop: '流程与视频同步：观察证据如何回流',
  scope: '参数化行动表示',
  scan: '从整段视频找到候选时间区域',
  segment: '重新采样连续片段，确认短暂动作',
  stitch: '联合非连续片段核查跨时刻关系',
  memory: '用时间戳与主体表锚定证据',
  simulator: '从问题到 Finish 的完整推理轨迹',
  benchmarks: '跨基准测试的评测范围',
  results: '消融实验、观察策略与可靠性边界'
};
const chapterRoles: Record<string, string> = {
  fixed: '从固定采样漏掉短时动作的例子出发，明确为什么视频问答需要主动补取证据。',
  loop: '建立 Reasoner、Toolkit、Observer 与 History 的分工，理解推理如何驱动下一次观察。',
  scope: '把观察意图拆成工具、时间范围与采样密度，让规划能够实际执行。',
  scan: '先在长视频中广域搜索，找到值得进一步观察的候选时间区域。',
  segment: '对连续候选片段重新取帧，辨别稀疏采样可能遗漏的短暂动作。',
  stitch: '把相隔较远的片段放在同一次观察中，核查跨时刻的主体和事件关系。',
  memory: '用时间戳和主体记忆锚定跨轮证据，减少推理时的定位与指代混淆。',
  simulator: '串联规划、观察、记忆与 Finish，复原一条完整的教学推理轨迹。',
  benchmarks: '说明论文使用的任务、模型组合和比较基线，为解读结果划定范围。',
  results: '从消融、策略分布与计算成本三个角度，判断主动观察的收益和可靠性边界。'
};

function readProgress(): Progress {
  try {
    const current = localStorage.getItem(STORAGE);
    const previous = localStorage.getItem(PREVIOUS_STORAGE);
    const raw = current ?? previous ?? localStorage.getItem(OLD_STORAGE);
    if (!raw) return initial;
    const value = JSON.parse(raw) as Partial<Progress>;
    if (!Number.isInteger(value.unlockedThrough)) return initial;
    const legacyUnlocked = current || previous ? value.unlockedThrough! : oldToNew[value.unlockedThrough!];
    const unlockedThrough = Math.min(chapters.length, legacyUnlocked);
    if (!Number.isInteger(unlockedThrough) || unlockedThrough < 0) return initial;
    return { unlockedThrough };
  } catch { return initial; }
}

export default function App() {
  const [progress, setProgress] = useState<Progress>(readProgress);
  const [active, setActive] = useState('top');
  const [destination, setDestination] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [compact, setCompact] = useState(() => window.matchMedia('(max-width: 768px)').matches);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [epoch, setEpoch] = useState(0);
  const currentChapter = Math.max(0, chapters.findIndex(chapter => chapter.id === active));
  const menuRef = useRef<HTMLButtonElement>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 768px)');
    const update = () => setCompact(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const redirectOldChapter = () => {
      if (!['#limits', '#s11', '#final'].includes(window.location.hash)) return;
      window.history.replaceState(null, '', '#results');
      if (progress.unlockedThrough === chapters.length) setDestination('results');
    };
    redirectOldChapter();
    window.addEventListener('hashchange', redirectOldChapter);
    return () => window.removeEventListener('hashchange', redirectOldChapter);
  }, [progress.unlockedThrough]);

  function navigate(id: string) {
    if (id !== 'top' && !chapters.slice(0, progress.unlockedThrough).some(c => c.id === id)) return;
    setMobileOpen(false);
    setActive(id);
    setDestination(id);
  }
  function start() {
    setProgress(p => ({ ...p, unlockedThrough: Math.max(1, p.unlockedThrough) }));
    setActive('fixed');
    setDestination('fixed');
  }
  function advance(index: number) {
    if (index !== progress.unlockedThrough - 1 || index >= chapters.length - 1) return;
    const next = chapters[index + 1].id;
    setProgress(p => ({ unlockedThrough: Math.max(p.unlockedThrough, index + 2) }));
    setDestination(next);
    setActive(next);
  }
  function moveChapter(direction: -1 | 1) {
    const target = currentChapter + direction;
    if (target < 0 || target >= chapters.length) return;
    if (target < progress.unlockedThrough) navigate(chapters[target].id);
    else if (direction === 1 && target === progress.unlockedThrough) advance(target - 1);
  }
  function reset() {
    try { localStorage.removeItem(STORAGE); localStorage.removeItem(PREVIOUS_STORAGE); localStorage.removeItem(OLD_STORAGE); } catch { /* local state still resets */ }
    setProgress(initial);
    setEpoch(n => n + 1);
    setMobileOpen(false);
    setDestination('top');
    setActive('top');
  }

  useEffect(() => {
    try { if (progress.unlockedThrough === 0) localStorage.removeItem(STORAGE); else localStorage.setItem(STORAGE, JSON.stringify(progress)); } catch { /* browsing remains usable */ }
  }, [progress]);
  useEffect(() => {
    if (!destination) return;
    const request = requestAnimationFrame(() => {
      const target = document.getElementById(destination);
      target?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
      target?.querySelector<HTMLElement>('h1, h2')?.focus({ preventScroll: true });
      setDestination(null);
    });
    return () => cancelAnimationFrame(request);
  }, [destination, progress.unlockedThrough]);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const line = window.innerHeight * .3;
      const visible = Array.from(document.querySelectorAll<HTMLElement>('main section.chapter'));
      let current = window.scrollY < (visible[0]?.offsetTop ?? Infinity) - line ? 'top' : visible[0]?.id ?? 'top';
      visible.forEach(node => { if (node.getBoundingClientRect().top <= line) current = node.id; });
      setActive(current);
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); if (frame) cancelAnimationFrame(frame); };
  }, [progress.unlockedThrough]);
  useEffect(() => {
    if (!mobileOpen) return;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    navRef.current?.querySelector<HTMLElement>('button:not(:disabled)')?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setMobileOpen(false); requestAnimationFrame(() => menuRef.current?.focus()); }
      if (event.key !== 'Tab') return;
      const focusable = navRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href]');
      if (!focusable?.length) return;
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    const onResize = () => { if (window.innerWidth > 768) setMobileOpen(false); };
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    return () => { document.body.style.overflow = oldOverflow; window.removeEventListener('keydown', onKey); window.removeEventListener('resize', onResize); };
  }, [mobileOpen]);

  return <div className={`app-shell ${progress.unlockedThrough ? 'ppt-bars-on' : ''} ${sidebarCollapsed ? 'sidebar-collapsed' : ''} ${mobileOpen ? 'sidebar-open' : ''}`}>
    <a className="skip-link" href="#top">跳到正文</a>
    <div className="reading-progress" role="progressbar" aria-label="章节解锁进度" aria-valuemin={0} aria-valuemax={chapters.length} aria-valuenow={progress.unlockedThrough} style={{ width: `${progress.unlockedThrough / chapters.length * 100}%` }} />
    {progress.unlockedThrough > 0 && <div className={`slide-layout ppt-overlay ${sidebarCollapsed ? 'sidebar-collapsed' : ''} ${mobileOpen ? 'sidebar-open' : ''}`}>
      <button className="slide-sidebar-toggle" ref={menuRef} aria-label={mobileOpen ? '关闭目录' : '打开目录'} aria-controls="chapter-sidebar" aria-expanded={mobileOpen} onClick={() => setMobileOpen(v => !v)}><span className="slide-sidebar-toggle-icon">{mobileOpen ? '✕' : '☰'}</span>目录</button>
      {mobileOpen && <div className="slide-sidebar-overlay" aria-hidden="true" onClick={() => { setMobileOpen(false); requestAnimationFrame(() => menuRef.current?.focus()); }}/ >}
      <aside id="chapter-sidebar" ref={navRef} className="slide-sidebar" inert={(compact && !mobileOpen) || (!compact && sidebarCollapsed)} role={mobileOpen ? 'dialog' : undefined} aria-modal={mobileOpen || undefined} aria-label="学习导航">
        <div className="slide-sidebar-header"><div className="slide-sidebar-venue">Interactive Tutorial</div><div className="slide-sidebar-title">LensWalk：通过规划观察方式实现智能体视频理解 · 交互式教程</div></div>
        <nav className="slide-sidebar-nav" aria-label="章节导航">
          {chapters.map((chapter, i) => <button key={chapter.id} className={`slide-sidebar-item ${active === chapter.id ? 'active' : ''} ${i >= progress.unlockedThrough ? 'is-locked' : ''}`} disabled={i >= progress.unlockedThrough} aria-current={active === chapter.id ? 'step' : undefined} onClick={() => navigate(chapter.id)}><span className="slide-sidebar-num">§{i + 1}</span><span className="slide-sidebar-text">{chapter.sidebarTitle}</span></button>)}
        </nav>
        <div className="slide-sidebar-tools"><button disabled={progress.unlockedThrough < chapters.length} onClick={() => navigate('fixed')}><BookOpen size={15}/>复习全部章节</button><button onClick={reset}><RotateCcw size={15}/>重新开始</button><a href={PAPER} target="_blank" rel="noreferrer">论文全文 <ExternalLink size={14}/></a></div>
      </aside>
      <button className="slide-sidebar-collapse" aria-label={sidebarCollapsed ? '展开目录' : '折叠目录'} aria-controls="chapter-sidebar" onClick={() => setSidebarCollapsed(v => !v)}>{sidebarCollapsed ? '☰' : '◀'}</button>
      <div className="slide-nav"><button className="slide-nav-btn" disabled={active === 'top' || currentChapter === 0} onClick={() => moveChapter(-1)}>← 上一章</button><span className="slide-nav-counter">{currentChapter + 1} / {chapters.length}</span><button className="slide-nav-btn slide-nav-btn-primary" disabled={currentChapter === chapters.length - 1} onClick={() => moveChapter(1)}>下一章 →</button></div>
    </div>}
    <main className="tutorial-main" inert={mobileOpen}>
      <section id="top" className="hero hero-section" aria-labelledby="hero-title"><div className="hero-inner">
        <div className="hero-venue">Interactive Tutorial</div>
        <h1 id="hero-title" tabIndex={-1}>LensWalk: Agentic Video Understanding by Planning How You See in Videos</h1>
        <div className="hero-sub">通过规划观察方式实现智能体视频理解 · CVPR 2026 Highlight</div>
        <p className="hero-abs">LensWalk 让推理器随着问题和已有证据，主动决定下一次看哪段视频、看多宽、采样多密；新的带时间戳证据又推动下一轮推理。</p>
        <div className="hero-meta">{['Reason–Plan–Observe', 'Temporal Scope', 'Sampling Density', 'Multi-turn Evidence'].map(tag => <span className="tag" key={tag}>{tag}</span>)}</div>
        <div className="hero-links"><a href={CVPR_PDF} target="_blank" rel="noreferrer">Paper PDF <ExternalLink size={15}/></a><a href={CODE} target="_blank" rel="noreferrer">Code <ExternalLink size={15}/></a><a href={PROJECT} target="_blank" rel="noreferrer">Project <ExternalLink size={15}/></a></div>
        <HeroComparison/>
        {progress.unlockedThrough === 0 && <div className="chap-loader"><div className="chap-loader-hint">准备好了吗？</div><button className="chap-loader-btn" onClick={start}>开始学习 §1 <span className="chap-loader-arrow" aria-hidden="true">→</span></button></div>}
      </div></section>
      <div key={epoch}>{chapters.slice(0, progress.unlockedThrough).map((chapter, index) => {
        return <section id={chapter.id} className="chapter chap" aria-labelledby={`${chapter.id}-title`} key={chapter.id}>
          <header className="paper-section-header"><h2 className="chap-title" id={`${chapter.id}-title`} tabIndex={-1}><span className="num">§{index + 1}.</span>{chapter.title}<span className={`badge-tag ${index >= 8 ? 'both' : index >= 4 ? 'trn' : 'inf'}`}>{index >= 8 ? '进阶' : index >= 4 ? '应用' : '基础'}</span></h2>
            <div className="flow-mini" aria-label={`当前第 ${index + 1} 章，共 ${chapters.length} 章`}>{chapters.map((_, step) => <span className="flow-fragment" key={step}>{step > 0 && <span className="flow-arrow" aria-hidden="true">→</span>}<span className={`flow-step ${step < index ? 'done' : step === index ? 'active' : ''}`} data-step={step + 1}>§{step + 1}</span></span>)}</div>
            <div className="chap-bridge"><div className="cb-icon" aria-hidden="true">🔗</div><div className="cb-body"><div className="cb-title">本节作用</div><div className="cb-text">{chapterRoles[chapter.id]}</div></div></div>
          </header>
          {chapter.id === 'benchmarks' ? <S9Benchmarks/>
            : chapter.id === 'results' ? <S10Analysis/>
            : chapter.id === 'segment' || chapter.id === 'stitch' || chapter.id === 'simulator'
            ? <LessonModule id={chapter.id} onComplete={() => {}}/>
            : <LearningModule number={`${index + 1}.1`} title={subsectionTitles[chapter.id]}>
                <LessonModule id={chapter.id} onComplete={() => {}}/>
              </LearningModule>}
          {index === progress.unlockedThrough - 1 && index < chapters.length - 1 && <div className="lesson-footer chap-loader"><div className="chap-loader-hint"/><button className="chap-loader-btn" onClick={() => advance(index)}>继续学习 §{index + 2} <span className="chap-loader-arrow" aria-hidden="true">→</span></button></div>}
        </section>;
      })}
      </div>
    </main>
  </div>;
}
