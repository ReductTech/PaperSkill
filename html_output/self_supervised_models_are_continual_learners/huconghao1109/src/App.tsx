import React, { useCallback, useEffect, useState } from 'react';
import { tutorial } from './data/tutorial';
import { Hero } from './components/Hero';
import { ChapterBridge } from './components/ChapterBridge';
import { AnalogyCard } from './components/AnalogyCard';
import { Module } from './components/Module';
import { Formula } from './components/Formula';
import { InsightBar } from './components/InsightBar';
import { Takeaway } from './components/Takeaway';
import { BiliVideos } from './components/BiliVideos';
import { WidgetBoundary } from './components/WidgetBoundary';

class PageBoundary extends React.Component<
  { children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="scroll-fallback">
          页面渲染出错。请刷新重试；教程内容仍保存在 src/data/tutorial.ts 中。
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const chapters = tutorial.chapters;
  const bili = tutorial.bilibili || [];
  const hasBili = bili.length > 0;
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);
  const [navOpen, setNavOpen] = useState(false);

  const ids = ['top', ...chapters.map((c) => c.id), ...(hasBili ? ['videos'] : [])];

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const probe = window.scrollY + window.innerHeight * 0.3;
        let idx = 0;
        ids.forEach((id, i) => {
          const el = document.getElementById(id);
          if (!el) return;
          const top = el.getBoundingClientRect().top + window.scrollY;
          if (top <= probe) idx = i;
        });
        setActive(idx);
        const doc = document.documentElement;
        const max = doc.scrollHeight - doc.clientHeight;
        setProgress(max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0);
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [ids]);

  const goTo = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setNavOpen(false);
  }, []);

  const navItems = [
    { id: 'top', num: '封面', title: '导读' },
    ...chapters.map((ch, i) => ({ id: ch.id, num: `§${i + 1}`, title: ch.title })),
    ...(hasBili ? [{ id: 'videos', num: '视频', title: '延伸视频' }] : []),
  ];

  return (
    <PageBoundary>
      <div className="scroll-progress" aria-hidden="true">
        <span style={{ width: `${progress * 100}%` }} />
      </div>

      <div className="scroll-shell">
        <button
          className="scroll-nav-toggle"
          onClick={() => setNavOpen((v) => !v)}
          aria-label="切换目录"
        >
          {navOpen ? '✕' : '☰'} 目录
        </button>

        {navOpen ? <div className="scroll-nav-mask" onClick={() => setNavOpen(false)} /> : null}

        <aside className={`scroll-nav ${navOpen ? 'open' : ''}`}>
          <div className="scroll-nav-head">
            <div className="scroll-nav-venue">{tutorial.meta.venue}</div>
            <div className="scroll-nav-title">{tutorial.meta.titleZh || tutorial.meta.titleEn}</div>
          </div>
          <nav className="scroll-nav-list">
            {navItems.map((item) => (
              <button
                key={item.id}
                className={`scroll-nav-item ${ids[active] === item.id ? 'active' : ''}`}
                onClick={() => goTo(item.id)}
              >
                <span className="scroll-nav-num">{item.num}</span>
                <span className="scroll-nav-text">{item.title}</span>
              </button>
            ))}
          </nav>
          <div className="scroll-nav-foot">共 {chapters.length} 章 · 所有图形都可操作</div>
        </aside>

        <main className="scroll-main">
          <div id="top">
            <WidgetBoundary>
              <Hero meta={tutorial.meta} hero={tutorial.hero} />
            </WidgetBoundary>
          </div>

          {chapters.map((ch, i) => (
            <section className="chap scroll-chap" id={ch.id} key={ch.id}>
              <h2 className="chap-title">
                <span className="num">§{i + 1}.</span>
                {ch.title}
                <span className={`badge-tag ${ch.badge}`}>{ch.badgeLabel}</span>
              </h2>
              <ChapterBridge text={ch.bridge} />
              <WidgetBoundary>
                <AnalogyCard analogy={ch.analogy} chapterId={ch.id} />
              </WidgetBoundary>
              {ch.modules.map((m) => (
                <WidgetBoundary key={m.id}>
                  <Module module={m} chapterId={ch.id} />
                </WidgetBoundary>
              ))}
              {ch.insight ? <InsightBar text={ch.insight} /> : null}
              {ch.formula ? <Formula formula={ch.formula} /> : null}
              <Takeaway items={ch.takeaways} />
            </section>
          ))}

          {hasBili ? (
            <div id="videos">
              <BiliVideos items={bili} />
            </div>
          ) : null}

          <footer className="scroll-foot">
            <span>{tutorial.meta.titleEn}</span>
            <span>{tutorial.meta.venue}</span>
          </footer>
        </main>
      </div>
    </PageBoundary>
  );
}
