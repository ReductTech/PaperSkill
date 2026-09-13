import React, { useState, useEffect, useCallback, useRef } from 'react';
import { tutorial } from './data/tutorial';
import { Hero } from './components/Hero';
import { ChapterBridge } from './components/ChapterBridge';
import { AnalogyCard } from './components/AnalogyCard';
import { Module } from './components/Module';
import { Formula } from './components/Formula';
import { InsightBar } from './components/InsightBar';
import { Takeaway } from './components/Takeaway';
import { BiliVideos } from './components/BiliVideos';
import { ErrorBoundary } from './components/ErrorBoundary';

export default function App() {
  const chapters = tutorial.chapters;
  const bili = tutorial.bilibili || [];
  const hasBili = bili.length > 0;

  // Unified metaphor: calligraphy learning journey
  const metaphorSteps = [
    { step: '选笔', label: '大笔写小字', desc: '问题引入' },
    { step: '读帖', label: '不同字体的字帖', desc: '输入表示' },
    { step: '临帖', label: '认字+描红', desc: '核心洞察' },
    { step: '评分', label: '双评分练字', desc: '数学框架' },
    { step: '范本', label: '17种文字字帖', desc: '数据集' },
    { step: '迁移', label: '笔法迁移', desc: '推理迁移' },
    { step: '练习', label: '交替练习', desc: '训练过程' },
    { step: '工具', label: '不同大小毛笔', desc: '模型架构' },
    { step: '精修', label: '描红看边缘', desc: '实用技巧' },
    { step: '比赛', label: '书法比赛', desc: '实验结果' },
  ];

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');
  const [showBackToTop, setShowBackToTop] = useState(false);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  const scrollTo = useCallback((id: string) => {
    const el = sectionRefs.current[id];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setSidebarOpen(false);
  }, []);

  // Track active section via IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: '-30% 0px -60% 0px', threshold: 0 }
    );

    Object.values(sectionRefs.current).forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  // Fade-in sections as they enter viewport
  useEffect(() => {
    const fadeObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            fadeObserver.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.05 }
    );

    document.querySelectorAll('.scroll-section').forEach((el) => {
      fadeObserver.observe(el);
    });

    return () => fadeObserver.disconnect();
  }, []);

  // Back-to-top visibility
  useEffect(() => {
    const onScroll = () => {
      setShowBackToTop(window.scrollY > 600);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const sidebarItems = [
    { id: 'hero', num: '封面', title: tutorial.meta.titleZh || tutorial.meta.titleEn },
    ...chapters.map((ch, i) => ({ id: `chap-${i + 1}`, num: `§${i + 1}`, title: ch.title })),
    ...(hasBili ? [{ id: 'bilibili', num: '📺', title: '延伸视频' }] : []),
  ];

  return (
    <ErrorBoundary>
    <div className={`scroll-layout ${sidebarOpen ? 'sidebar-open' : ''} ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <button className="scroll-sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
        <span className="scroll-sidebar-toggle-icon">{sidebarOpen ? '✕' : '☰'}</span>
        目录
      </button>

      {sidebarOpen ? (
        <div className="scroll-sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      ) : null}

      <aside className="scroll-sidebar">
        <div className="scroll-sidebar-header">
          <div className="scroll-sidebar-venue">{tutorial.meta.venue}</div>
          <div className="scroll-sidebar-title">
            {tutorial.meta.titleZh || tutorial.meta.titleEn}
          </div>
        </div>
        <nav className="scroll-sidebar-nav">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              className={`scroll-sidebar-item ${activeSection === item.id ? 'active' : ''}`}
              onClick={() => scrollTo(item.id)}
            >
              <span className="scroll-sidebar-num">{item.num}</span>
              <span className="scroll-sidebar-text">{item.title}</span>
            </button>
          ))}
        </nav>
      </aside>

      <button
        className="scroll-sidebar-collapse"
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        title={sidebarCollapsed ? '展开目录' : '折叠目录'}
      >
        {sidebarCollapsed ? '☰' : '◀'}
      </button>

      <main className="scroll-main">
        <div className="scroll-content">
          {/* Hero */}
          <section id="hero" ref={(el) => { sectionRefs.current['hero'] = el; }} className="scroll-section">
            <Hero meta={tutorial.meta} hero={tutorial.hero} />
          </section>

                    {/* Metaphor Journey Overview */}
          <section className="scroll-section metaphor-overview-section">
            <div className="metaphor-overview">
              <div className="metaphor-overview-header">
                <span className="metaphor-overview-icon">🖌</span>
                <div>
                  <h3 className="metaphor-overview-title">贯穿全文的比喻：书法临摹练习</h3>
                  <p className="metaphor-overview-desc">整篇教程用"学书法"的旅程来理解 MonkeyOCRv2——从选笔、读帖、临帖，到最终比赛，每一步对应论文的一个核心概念。</p>
                </div>
              </div>
              <div className="metaphor-journey">
                {metaphorSteps.map((m, idx) => (
                  <button
                    key={idx}
                    className={`metaphor-journey-step ${activeSection === `chap-${idx + 1}` ? 'active' : ''}`}
                    onClick={() => scrollTo(`chap-${idx + 1}`)}
                  >
                    <span className="metaphor-journey-num">{idx + 1}</span>
                    <span className="metaphor-journey-step-label">{m.step}</span>
                    <span className="metaphor-journey-step-name">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Chapters */}
          {chapters.map((ch, i) => (
            <section
              key={ch.id}
              id={`chap-${i + 1}`}
              ref={(el) => { sectionRefs.current[`chap-${i + 1}`] = el; }}
              className="scroll-section"
            >
              <div className="chap scroll-chap">
                <h2 className="chap-title">
                  <span className="num">§{i + 1}.</span>
                  {ch.title}
                  <span className="chap-metaphor-tag">
                    <span className="chap-metaphor-icon">🖌</span>
                    {metaphorSteps[i]?.step} · {metaphorSteps[i]?.label}
                  </span>
                  <span className={`badge-tag ${ch.badge}`}>
                    {ch.badgeLabel}
                  </span>
                </h2>
                <ChapterBridge text={ch.bridge} />
                <AnalogyCard analogy={ch.analogy} chapterId={ch.id} />
                {ch.modules.map((m) => (
                  <Module key={m.id} module={m} chapterId={ch.id} />
                ))}
                {ch.insight ? <InsightBar text={ch.insight} /> : null}
                {ch.formula ? <Formula formula={ch.formula} /> : null}
                <Takeaway items={ch.takeaways} />
              </div>
            </section>
          ))}

          {/* Bilibili */}
          {hasBili ? (
            <section
              id="bilibili"
              ref={(el) => { sectionRefs.current['bilibili'] = el; }}
              className="scroll-section"
            >
              <BiliVideos items={bili} />
            </section>
          ) : null}
        </div>
      </main>

      {/* Back to top */}
      {showBackToTop ? (
        <button
          className="scroll-back-to-top"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          title="回到顶部"
        >
          ↑
        </button>
      ) : null}
    </div>
    </ErrorBoundary>
  );
}
