import React, { useState, useEffect, useCallback } from 'react';
import { tutorial } from './data/tutorial';
import { Hero } from './components/Hero';
import { ChapterBridge } from './components/ChapterBridge';
import { AnalogyCard } from './components/AnalogyCard';
import { Module } from './components/Module';
import { Formula } from './components/Formula';
import { InsightBar } from './components/InsightBar';
import { Takeaway } from './components/Takeaway';
import { BiliVideos } from './components/BiliVideos';
import { ChapterQuiz } from './modules/chapterQuiz';
import { LessonProvider, useLesson } from './modules/lessonState';

function TutorialApp() {
  const chapters = tutorial.chapters;
  const total = chapters.length;
  const bili = tutorial.bilibili || [];
  const hasBili = bili.length > 0;
  const lastSlide = total + (hasBili ? 1 : 0);
  const lesson = useLesson();

  const [active, setActive] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [legendOpen, setLegendOpen] = useState(false);
  const [quizOpen, setQuizOpen] = useState(false);

  const goTo = useCallback((index: number) => {
    const target = Math.max(0, Math.min(index, lastSlide));
    const preset = chapters[target - 1]?.representationPreset;
    if (preset) lesson.setPreset(preset);
    setActive(target);
    setSidebarOpen(false);
    setQuizOpen(false);
  }, [lastSlide, lesson.setPreset]);
  const next = useCallback(() => goTo(active + 1), [active, goTo]);
  const prev = useCallback(() => goTo(active - 1), [active, goTo]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [active]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (quizOpen || document.querySelector('.vl-paper-zoom')) return;
      if (event.target instanceof HTMLElement && event.target.closest('button,input,textarea,select,[contenteditable="true"]')) return;
      if (event.key === 'ArrowRight') { event.preventDefault(); next(); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); prev(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev, quizOpen]);

  const sidebarItems = [
    { idx: 0, num: '封面', title: tutorial.meta.titleZh },
    ...chapters.map((chapter, index) => ({ idx: index + 1, num: String(index + 1).padStart(2, '0'), title: chapter.title })),
    ...(hasBili ? [{ idx: total + 1, num: '视频', title: '延伸视频' }] : []),
  ];
  const currentChapter = active >= 1 && active <= total ? chapters[active - 1] : null;
  const currentTitle = active === 0 ? '方法总览' : currentChapter ? currentChapter.title : '延伸视频';
  const totalContentTokens = lesson.visual + lesson.motion;
  return <div className={'slide-layout ' + (sidebarOpen ? 'sidebar-open ' : '') + (sidebarCollapsed ? 'sidebar-collapsed' : '')}>
    <button type="button" className="slide-sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}><span className="slide-sidebar-toggle-icon">{sidebarOpen ? '✕' : '☰'}</span>目录</button>
    {sidebarOpen && <div className="slide-sidebar-overlay" onClick={() => setSidebarOpen(false)}/>}
    <aside className="slide-sidebar">
      <div className="slide-sidebar-header"><div className="slide-sidebar-venue">{tutorial.meta.venue}</div><div className="slide-sidebar-title">{tutorial.meta.titleZh}</div></div>
      <nav className="slide-sidebar-nav">{sidebarItems.map(item => <button type="button" key={item.idx} className={'slide-sidebar-item ' + (active === item.idx ? 'active' : '')} onClick={() => goTo(item.idx)}><span className="slide-sidebar-num">{item.num}</span><span className="slide-sidebar-text">{item.title}</span></button>)}</nav>
    </aside>
    <button type="button" className="slide-sidebar-collapse" onClick={() => setSidebarCollapsed(!sidebarCollapsed)} title={sidebarCollapsed ? '展开目录' : '折叠目录'}>{sidebarCollapsed ? '☰' : '◀'}</button>
    <main className="slide-main">
      <div className="vl-course-bar">
        <div className="vl-course-position"><small>VIDEO-LAVIT · 交互论文</small><strong>{active === 0 ? '开始' : active <= total ? '第 ' + active + ' / 10 章' : '延伸'} · {currentTitle}</strong><div className="vl-course-progress"><i style={{ width: String(active / lastSlide * 100) + '%' }}/></div></div>
        <div className="vl-course-tools">
          <div className="vl-top-counter"><small>当前视频表示 · 内容 token 示意</small><b>Visual {lesson.visual} <span>+</span> Motion {lesson.motion} <span>=</span> ≈{totalContentTokens}</b><em>{lesson.clips} clip · 不含文本与边界标记</em></div>
          <div className="vl-legend-box"><button type="button" aria-expanded={legendOpen} onClick={() => setLegendOpen(!legendOpen)}>证据标签 ⓘ</button>{legendOpen && <div className="vl-legend-popover"><p><b>论文证据</b> 原文图、表、公式或配置</p><p><b>教学模拟</b> 为理解机制构造的可操作示意</p><p><b>延伸推演</b> 需要新实验验证的想法</p></div>}</div>
        </div>
      </div>
      <div className="slide-content" key={active}>
        {active === 0 ? <Hero meta={tutorial.meta} hero={tutorial.hero} onNavigate={goTo}/> : currentChapter ? <section className="chap slide-chap">
          <h2 className="chap-title"><span className="num">§{active}.</span>{currentChapter.title}<span className={'badge-tag ' + currentChapter.badge}>{currentChapter.badgeLabel}</span></h2>
          <ChapterBridge text={currentChapter.bridge}/>
          <AnalogyCard analogy={currentChapter.analogy} chapterId={currentChapter.id}/>
          {currentChapter.modules.map(module => <Module key={module.id} module={module} chapterId={currentChapter.id}/>)}
          {currentChapter.insight && <InsightBar text={currentChapter.insight}/>}
          {currentChapter.formula && <Formula formula={currentChapter.formula}/>}
          <Takeaway items={currentChapter.takeaways}/>
          <ChapterQuiz chapterIndex={active - 1} open={quizOpen} onOpenChange={setQuizOpen}/>
        </section> : hasBili ? <BiliVideos items={bili}/> : null}
      </div>
      <div className="slide-nav"><button type="button" className="slide-nav-btn" onClick={prev} disabled={active === 0}>← 上一页</button><span className="slide-nav-counter">{active + 1} / {lastSlide + 1}</span><button type="button" className="slide-nav-btn slide-nav-btn-primary" onClick={next} disabled={active === lastSlide}>下一页 →</button></div>
    </main>
  </div>;
}

export default function App() {
  return <LessonProvider><TutorialApp/></LessonProvider>;
}
