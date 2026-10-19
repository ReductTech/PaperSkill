import React, { useCallback, useEffect, useRef, useState } from 'react';
import { tutorial } from './data/tutorial';
import { Hero } from './components/Hero';
import { ChapterBridge } from './components/ChapterBridge';
import { AnalogyCard } from './components/AnalogyCard';
import { Module } from './components/Module';
import { Formula } from './components/Formula';
import { InsightBar } from './components/InsightBar';
import { Takeaway } from './components/Takeaway';
import { BiliVideos } from './components/BiliVideos';

// 整篇长文模式：封面 + 10 章顺序排在同一页，左侧目录只做锚点跳转。
// 所有章节同时挂载，画布离开视口时由 IntersectionObserver 自动暂停。
export default function App() {
  const chapters = tutorial.chapters;
  const bili = tutorial.bilibili || [];
  const hasBili = bili.length > 0;

  const [active, setActive] = useState(0); // 0 = 封面，1..n = 章节
  const [showTop, setShowTop] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => typeof window !== 'undefined' && window.innerWidth <= 1180
  );
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);
  const barRef = useRef<HTMLDivElement>(null);

  const sidebarItems = [
    { idx: 0, num: '封面', title: tutorial.meta.titleZh || tutorial.meta.titleEn },
    ...chapters.map((ch, i) => ({ idx: i + 1, num: `§${i + 1}`, title: ch.title })),
    ...(hasBili ? [{ idx: chapters.length + 1, num: '📺', title: '延伸视频' }] : []),
  ];

  const goTo = useCallback((i: number) => {
    setSidebarOpen(false);
    const el = sectionRefs.current[i];
    if (!el) return;
    // 手机上顶部有固定的「目录」按钮，留出它的高度
    const offset = window.innerWidth <= 768 ? 60 : 12;
    const top = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    setActive(i);
  }, []);

  // 滚动时高亮目录：取最后一个已越过顶部 140px 的区块
  useEffect(() => {
    let raf = 0;
    const measure = () => {
      raf = 0;
      let idx = 0;
      sectionRefs.current.forEach((el, i) => {
        if (el && el.getBoundingClientRect().top <= 140) idx = i;
      });
      setActive((prev) => (prev === idx ? prev : idx));
      setShowTop(window.scrollY > 700);
      // 进度条直接写 DOM，避免每帧触发整篇重渲染
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 8 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      if (barRef.current) barRef.current.style.transform = `scaleX(${p})`;
    };
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      className={`slide-layout article-mode ${sidebarOpen ? 'sidebar-open' : ''} ${
        sidebarCollapsed ? 'sidebar-collapsed' : ''
      }`}
    >
      <div className="read-bar" ref={barRef} aria-hidden="true" />

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
          {sidebarItems.map((item) => (
            <button
              key={item.idx}
              className={`slide-sidebar-item ${active === item.idx ? 'active' : ''}`}
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

      <main className="slide-main">
        <div className="slide-content">
          <div
            className="article-hero"
            ref={(el) => {
              sectionRefs.current[0] = el;
            }}
          >
            <Hero meta={tutorial.meta} hero={tutorial.hero} />
          </div>

          <nav className="term-index" aria-label="术语速查">
            <span className="term-index-label">术语速查</span>
            <a href="#chap-3">
              <b>DSR</b> 动态结构重组
            </a>
            <a href="#chap-4">
              <b>MBD</b> 主干蒸馏
            </a>
            <a href="#chap-5">
              <b>PSM</b> 原型选择
            </a>
            <a href="#chap-9">
              <b>重参数化</b> 训练双路 → 推理单路
            </a>
          </nav>

          {chapters.map((ch, i) => (
            <section
              className="chap slide-chap article-chap"
              id={ch.id}
              key={ch.id}
              ref={(el) => {
                sectionRefs.current[i + 1] = el;
              }}
            >
              <h2 className="chap-title">
                <span className="num">§{i + 1}.</span>
                {ch.title}
                <span className={`badge-tag ${ch.badge}`}>{ch.badgeLabel}</span>
              </h2>
              <ChapterBridge text={ch.bridge} />
              <AnalogyCard analogy={ch.analogy} chapterId={ch.id} />
              {ch.modules.map((m) => (
                <Module key={m.id} module={m} chapterId={ch.id} />
              ))}
              {ch.insight ? <InsightBar text={ch.insight} /> : null}
              {ch.formula ? <Formula formula={ch.formula} /> : null}
              <Takeaway items={ch.takeaways} />
            </section>
          ))}

          {hasBili ? (
            <div
              className="article-bili"
              ref={(el) => {
                sectionRefs.current[chapters.length + 1] = el;
              }}
            >
              <BiliVideos items={bili} />
            </div>
          ) : null}

          <footer className="article-footer">
            {tutorial.meta.titleEn} · {tutorial.meta.venue} · {tutorial.meta.authors}
          </footer>
        </div>
      </main>

      {showTop ? (
        <button
          className="article-top"
          title="回到顶部"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          ↑
        </button>
      ) : null}
    </div>
  );
}
