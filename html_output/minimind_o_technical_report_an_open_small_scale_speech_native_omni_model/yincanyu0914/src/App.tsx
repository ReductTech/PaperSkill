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
import { KeywordIntro } from './modules/keyword-intro';
import { ModelExperience } from './modules/model-experience';
import { AiTutor } from './modules/ai-tutor';
import { useChapterWheel } from './modules/reading-wheel';

export default function App() {
  const chapters = tutorial.chapters;
  const total = chapters.length;
  const bili = tutorial.bilibili || [];
  const hasBili = bili.length > 0;
  const lastSlide = total + (hasBili ? 1 : 0); // 0=hero, 1..total=chapters, total+1=bili

  const [active, setActive] = useState(0);
  const [introOpen, setIntroOpen] = useState(true);
  const [experienceOpen, setExperienceOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const goTo = useCallback(
    (i: number) => {
      setActive(Math.max(0, Math.min(i, lastSlide)));
      setExperienceOpen(false);
      setSidebarOpen(false);
    },
    [lastSlide]
  );

  const next = useCallback(() => goTo(active + 1), [active, goTo]);
  const prev = useCallback(() => goTo(active - 1), [active, goTo]);
  useChapterWheel(!introOpen && !experienceOpen && active >= 1 && active < total, active, next);

  // Reset scroll on every slide change so a long chapter always opens from the top.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [active]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (introOpen || experienceOpen) return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        next();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        prev();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev, introOpen, experienceOpen]);

  const sidebarItems = [
    { idx: 0, num: '封面', title: tutorial.meta.titleZh || tutorial.meta.titleEn },
    ...chapters.map((ch, i) => ({ idx: i + 1, num: `§${i + 1}`, title: ch.title })),
    ...(hasBili ? [{ idx: total + 1, num: '📺', title: '延伸视频' }] : []),
  ];

  const currentChapter = active >= 1 && active <= total ? chapters[active - 1] : null;
  const tutorChapter = introOpen ? '关键词探索' : experienceOpen ? '真实模型体验' : currentChapter?.title || '论文概览';
  const tutorContext = currentChapter && !introOpen && !experienceOpen ? JSON.stringify(currentChapter) : tutorial.meta.coreInsight;

  const openExperience = () => {setIntroOpen(false); setExperienceOpen(true); setSidebarOpen(false); window.scrollTo({top:0,behavior:'instant'});};
  if (introOpen) return <><KeywordIntro onExperience={openExperience} onEnter={(chapter) => { goTo(chapter); setIntroOpen(false); window.scrollTo({top: 0, behavior: 'instant'}); }} /><AiTutor chapter={tutorChapter} context={tutorContext}/></>;

  return (
    <div className={`slide-layout ${sidebarOpen ? 'sidebar-open' : ''} ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <button className="slide-sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
        <span className="slide-sidebar-toggle-icon">{sidebarOpen ? '✕' : '☰'}</span>
        目录
      </button>

      {sidebarOpen ? (
        <div className="slide-sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      ) : null}

      <aside className="slide-sidebar">
        <div className="slide-sidebar-header">
          <button onClick={() => {setIntroOpen(true); window.scrollTo({top: 0, behavior: 'instant'});}} style={{background:'transparent',border:'1px solid #cad7e6',borderRadius:6,color:'#27446e',padding:'6px 10px',marginBottom:12,cursor:'pointer',fontSize:12}}>← 关键词探索</button>
          <div className="slide-sidebar-venue">{tutorial.meta.venue}</div>
          <div className="slide-sidebar-title">
            {tutorial.meta.titleZh || tutorial.meta.titleEn}
          </div>
        </div>
        <nav className="slide-sidebar-nav">
          <button className={`slide-sidebar-item ${experienceOpen ? 'active' : ''}`} onClick={openExperience}><span className="slide-sidebar-num">体验</span><span className="slide-sidebar-text">亲手试试真实模型 ↗</span></button>
          {sidebarItems.map((item) => (
            <button
              key={item.idx}
              className={`slide-sidebar-item ${!experienceOpen && active === item.idx ? 'active' : ''}`}
              onClick={() => goTo(item.idx)}
            >
              <span className="slide-sidebar-num">{item.num}</span>
              <span className="slide-sidebar-text">{item.title}</span>
            </button>
          ))}
        </nav>
      </aside>

      <button
        className="slide-sidebar-collapse"
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        title={sidebarCollapsed ? '展开目录' : '折叠目录'}
      >
        {sidebarCollapsed ? '☰' : '◀'}
      </button>

      <AiTutor chapter={tutorChapter} context={tutorContext}/>
      <main className="slide-main">
        <div className="slide-content" key={experienceOpen ? 'experience' : active}>
          {experienceOpen ? <ModelExperience onChapter={goTo} /> : active === 0 ? (
            <Hero meta={tutorial.meta} hero={tutorial.hero} />
          ) : currentChapter ? (
            <section className="chap slide-chap">
              <h2 className="chap-title">
                <span className="num">§{active}.</span>
                {currentChapter.title}
                <span className={`badge-tag ${currentChapter.badge}`}>
                  {currentChapter.badgeLabel}
                </span>
              </h2>
              <ChapterBridge text={currentChapter.bridge} />
              <AnalogyCard analogy={currentChapter.analogy} chapterId={currentChapter.id} />
              {currentChapter.modules.map((m) => (
                <Module key={m.id} module={m} chapterId={currentChapter.id} />
              ))}
              {currentChapter.insight ? <InsightBar text={currentChapter.insight} /> : null}
              {currentChapter.formula ? <Formula formula={currentChapter.formula} /> : null}
              <Takeaway items={currentChapter.takeaways} />
            </section>
          ) : hasBili ? (
            <BiliVideos items={bili} />
          ) : null}
        </div>

        {!experienceOpen && currentChapter && active < total && <p style={{textAlign:'center',color:'#617992',fontSize:13,margin:'24px 0 0'}}>读到这里，继续向下滚动即可进入下一章</p>}
        <div className="slide-nav">
          {experienceOpen ? <button className="slide-nav-btn slide-nav-btn-primary" onClick={() => goTo(active)}>返回教程 →</button> : <>
          <button className="slide-nav-btn" onClick={prev} disabled={active === 0}>
            ← 上一章
          </button>
          <span className="slide-nav-counter">
            {active + 1} / {lastSlide + 1}
          </span>
          <button
            className="slide-nav-btn slide-nav-btn-primary"
            onClick={next}
            disabled={active === lastSlide}
          >
            下一章 →
          </button>
          </>}
        </div>
      </main>
    </div>
  );
}
