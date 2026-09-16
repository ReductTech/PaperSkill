import React, { useState, useEffect, useRef, useCallback } from 'react';
import { tutorial } from './data/tutorial';
import { Hero } from './components/Hero';
import { Intro } from './components/Intro';
import { Outline } from './components/Outline';
import { PARTS } from './outline';
import { ChapterBridge } from './components/ChapterBridge';
import { AnalogyCard } from './components/AnalogyCard';
import { Module } from './components/Module';
import { Formula } from './components/Formula';
import { InsightBar } from './components/InsightBar';
import { Takeaway } from './components/Takeaway';
import { BiliVideos } from './components/BiliVideos';
import { ReproGuide } from './components/ReproGuide';
import { SciFiVideo } from './components/SciFiVideo';
import { AnimeAgents } from './components/AnimeAgents';
import { ChapterSource } from './components/ChapterSource';
import { ChapterQA } from './components/ChapterQA';
import { ChapterLink } from './components/ChapterLink';
import { ChapterStudy } from './components/ChapterStudy';
import { DataDeepDive } from './components/DataDeepDive';
import { Applications } from './components/Applications';
import { ChapterTransition } from './components/ChapterTransition';
import { ChapterIntro } from './components/ChapterIntro';
import { TechDeepDive } from './components/TechDeepDive';
import { VideoDemo } from './components/VideoDemo';

export default function App() {
  const chapters = tutorial.chapters;
  const bili = tutorial.bilibili || [];
  const hasBili = bili.length > 0;

  // One scrollable page: 0=cover, 1=outline, 2=intro, 3=anime, 4..N+3=chapters, N+4=repro, N+5=scifi, N+6=videos.
  const HERO_IDX = 0;
  const OUTLINE_IDX = 1;
  const INTRO_IDX = 2;
  const ANIME_IDX = 3;
  const FIRST_CHAPTER_IDX = 4; // chapter 1 lives at index 4
  const reproIdx = FIRST_CHAPTER_IDX + chapters.length;
  const techIdx = reproIdx + 1;
  const appsIdx = techIdx + 1;
  const scifiIdx = appsIdx + 1;
  const videoIdx = scifiIdx + 1;
  const biliIdx = videoIdx + 1;

  const [active, setActive] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const sectionRefs = useRef<Array<HTMLElement | null>>([]);

  // Scroll-spy: highlight the sidebar item of the section currently at the top of the reading area.
  useEffect(() => {
    const onScroll = () => {
      let current = 0;
      for (let i = sectionRefs.current.length - 1; i >= 0; i--) {
        const el = sectionRefs.current[i];
        if (el && el.getBoundingClientRect().top <= 120) {
          current = i;
          break;
        }
      }
      setActive(current);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = useCallback((i: number) => {
    const el = sectionRefs.current[i];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setSidebarOpen(false);
  }, []);

  // Outline chapter links pass a 1-based chapter number.
  const jumpToChapter = useCallback(
    (n: number) => scrollTo(FIRST_CHAPTER_IDX + n - 1),
    [scrollTo]
  );
  const jumpToRepro = useCallback(() => scrollTo(reproIdx), [scrollTo, reproIdx]);

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
          <div className="slide-sidebar-venue">{tutorial.meta.venue}</div>
          <div className="slide-sidebar-title">
            {tutorial.meta.titleZh || tutorial.meta.titleEn}
          </div>
        </div>
        <nav className="slide-sidebar-nav">
          <button
            className={`slide-sidebar-item ${active === HERO_IDX ? 'active' : ''}`}
            onClick={() => scrollTo(HERO_IDX)}
          >
            <span className="slide-sidebar-num">封面</span>
            <span className="slide-sidebar-text">{tutorial.meta.titleZh || tutorial.meta.titleEn}</span>
          </button>

          <button
            className={`slide-sidebar-item ${active === OUTLINE_IDX ? 'active' : ''}`}
            onClick={() => scrollTo(OUTLINE_IDX)}
          >
            <span className="slide-sidebar-num">总纲</span>
            <span className="slide-sidebar-text">阅读导览 · 六大部分</span>
          </button>

          <button
            className={`slide-sidebar-item ${active === INTRO_IDX ? 'active' : ''}`}
            onClick={() => scrollTo(INTRO_IDX)}
          >
            <span className="slide-sidebar-num">引言</span>
            <span className="slide-sidebar-text">一个「危险」但迷人的问题</span>
          </button>

          <button
            className={`slide-sidebar-item ${active === ANIME_IDX ? 'active' : ''}`}
            onClick={() => scrollTo(ANIME_IDX)}
          >
            <span className="slide-sidebar-num">🎭</span>
            <span className="slide-sidebar-text">角色小剧场 · 动漫演示</span>
          </button>

          {PARTS.map((part) => (
            <div key={part.n} className="sidebar-part">
              <div className="sidebar-part-head">
                <span className="sidebar-part-num">{part.n}</span>
                <span className="sidebar-part-title">{part.title}</span>
              </div>
              {part.chapters.map((ci) => (
                <button
                  key={ci}
                  className={`slide-sidebar-item sidebar-chapter ${active === FIRST_CHAPTER_IDX + ci - 1 ? 'active' : ''}`}
                  onClick={() => scrollTo(FIRST_CHAPTER_IDX + ci - 1)}
                >
                  <span className="slide-sidebar-num">§{ci}</span>
                  <span className="slide-sidebar-text">{chapters[ci - 1].title}</span>
                </button>
              ))}
              {part.n === 6 ? (
                <button
                  className={`slide-sidebar-item sidebar-chapter ${active === reproIdx ? 'active' : ''}`}
                  onClick={() => scrollTo(reproIdx)}
                >
                  <span className="slide-sidebar-num">📋</span>
                  <span className="slide-sidebar-text">项目复现指南与避坑要点</span>
                </button>
              ) : null}
            </div>
          ))}

          <button
            className={`slide-sidebar-item ${active === techIdx ? 'active' : ''}`}
            onClick={() => scrollTo(techIdx)}
          >
            <span className="slide-sidebar-num">🔬</span>
            <span className="slide-sidebar-text">关键技术实现（补充）</span>
          </button>

          <button
            className={`slide-sidebar-item ${active === appsIdx ? 'active' : ''}`}
            onClick={() => scrollTo(appsIdx)}
          >
            <span className="slide-sidebar-num">🌐</span>
            <span className="slide-sidebar-text">应用前景与适用范围</span>
          </button>

          <button
            className={`slide-sidebar-item ${active === scifiIdx ? 'active' : ''}`}
            onClick={() => scrollTo(scifiIdx)}
          >
            <span className="slide-sidebar-num">🎬</span>
            <span className="slide-sidebar-text">科普视频 · 灵感与片段</span>
          </button>

          <button
            className={`slide-sidebar-item ${active === videoIdx ? 'active' : ''}`}
            onClick={() => scrollTo(videoIdx)}
          >
            <span className="slide-sidebar-num">🎥</span>
            <span className="slide-sidebar-text">视频演示</span>
          </button>

          {hasBili ? (
            <button
              className={`slide-sidebar-item ${active === biliIdx ? 'active' : ''}`}
              onClick={() => scrollTo(biliIdx)}
            >
              <span className="slide-sidebar-num">📺</span>
              <span className="slide-sidebar-text">延伸视频</span>
            </button>
          ) : null}
        </nav>
      </aside>

      <button
        className="slide-sidebar-collapse"
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        title={sidebarCollapsed ? '展开目录' : '折叠目录'}
      >
        {sidebarCollapsed ? '☰' : '◀'}
      </button>

      <main className="slide-main">
        <div className="slide-content continuous">
          <div
            ref={(el) => {
              sectionRefs.current[HERO_IDX] = el;
            }}
            data-idx={HERO_IDX}
          >
            <Hero meta={tutorial.meta} hero={tutorial.hero} />
          </div>

          <div
            ref={(el) => {
              sectionRefs.current[OUTLINE_IDX] = el;
            }}
            data-idx={OUTLINE_IDX}
          >
            <Outline chapters={chapters} onJump={jumpToChapter} onRepro={jumpToRepro} />
          </div>

          <div
            ref={(el) => {
              sectionRefs.current[INTRO_IDX] = el;
            }}
            data-idx={INTRO_IDX}
          >
            <Intro />
          </div>

          <div
            ref={(el) => {
              sectionRefs.current[ANIME_IDX] = el;
            }}
            data-idx={ANIME_IDX}
          >
            <AnimeAgents />
          </div>

          {chapters.map((ch, i) => (
            <section
              key={ch.id}
              className="chap slide-chap"
              ref={(el) => {
                sectionRefs.current[FIRST_CHAPTER_IDX + i] = el;
              }}
              data-idx={FIRST_CHAPTER_IDX + i}
            >
              <h2 className="chap-title">
                <span className="num">§{i + 1}.</span>
                {ch.title}
                <span className={`badge-tag ${ch.badge}`}>{ch.badgeLabel}</span>
              </h2>
              <ChapterIntro chapterId={ch.id} />
              <ChapterBridge text={ch.bridge} />
              <AnalogyCard analogy={ch.analogy} chapterId={ch.id} />
              {ch.modules.map((m) => (
                <Module key={m.id} module={m} chapterId={ch.id} />
              ))}
              {ch.insight ? <InsightBar text={ch.insight} /> : null}
              {ch.formula ? <Formula formula={ch.formula} /> : null}
              <ChapterSource chapterId={ch.id} />
              <ChapterQA chapterId={ch.id} />
              <Takeaway items={ch.takeaways} />
              <ChapterLink chapterId={ch.id} />
              <ChapterStudy chapterId={ch.id} />
              <DataDeepDive chapterId={ch.id} />
              <ChapterTransition
                chapterId={ch.id}
                nextTitle={i + 1 < chapters.length ? chapters[i + 1].title : undefined}
              />
            </section>
          ))}

          <div
            ref={(el) => {
              sectionRefs.current[reproIdx] = el;
            }}
            data-idx={reproIdx}
          >
            <ReproGuide />
          </div>

          <div
            ref={(el) => {
              sectionRefs.current[techIdx] = el;
            }}
            data-idx={techIdx}
          >
            <TechDeepDive />
          </div>

          <div
            ref={(el) => {
              sectionRefs.current[appsIdx] = el;
            }}
            data-idx={appsIdx}
          >
            <Applications />
          </div>

          <div
            ref={(el) => {
              sectionRefs.current[scifiIdx] = el;
            }}
            data-idx={scifiIdx}
          >
            <SciFiVideo />
          </div>

          <div
            ref={(el) => {
              sectionRefs.current[videoIdx] = el;
            }}
            data-idx={videoIdx}
          >
            <VideoDemo />
          </div>

          {hasBili ? (
            <div
              ref={(el) => {
                sectionRefs.current[biliIdx] = el;
              }}
              data-idx={biliIdx}
            >
              <BiliVideos items={bili} />
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}
