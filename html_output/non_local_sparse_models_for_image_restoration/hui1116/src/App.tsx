import { useState, useEffect, useCallback, useRef } from 'react';
import { tutorial } from './data/tutorial';
import { paperEquations } from './data/paper-equations';
import { Hero } from './components/Hero';
import { ChapterModules } from './components/ChapterModules';
import { AnalogyCard } from './components/AnalogyCard';
import { Formula } from './components/Formula';
import { InsightBar } from './components/InsightBar';
import { Takeaway } from './components/Takeaway';
import { BiliVideos } from './components/BiliVideos';

const chapters = tutorial.chapters;
const videos = tutorial.bilibili ?? [];
const routes = ['overview', ...chapters.map(chapter => chapter.route), ...(videos.length ? ['videos'] : [])];
const previousChapters = [
  'bayer-raw', 'bayer-raw', 'patch-matching', 'sparse-coding', 'joint-sparsity',
  'merge-patches', 'joint-sparsity', 'real-raw', 'real-raw', 'experiments',
];

function activeRoute() {
  const hash = window.location.hash.slice(1);
  const previous = /^chap-(\d+)$/.exec(hash);
  const route = previous ? previousChapters[Number(previous[1]) - 1] : hash;
  return Math.max(0, routes.findIndex(candidate => candidate === route));
}

export default function App() {
  const total = chapters.length;
  const hasBili = videos.length > 0;
  const lastSlide = routes.length - 1;

  const [active, setActive] = useState(activeRoute);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const directoryRef = useRef<HTMLButtonElement>(null);
  const focusContent = useRef(false);

  const goTo = useCallback(
    (i: number) => {
      const nextSlide = Math.max(0, Math.min(i, lastSlide));
      if (nextSlide !== active) {
        focusContent.current = true;
        window.history.pushState(null, '', '#' + routes[nextSlide]);
        setActive(nextSlide);
      } else if (sidebarOpen) {
        contentRef.current?.focus({ preventScroll: true });
      }
      setSidebarOpen(false);
    },
    [active, lastSlide, sidebarOpen]
  );

  const next = useCallback(() => goTo(active + 1), [active, goTo]);
  const prev = useCallback(() => goTo(active - 1), [active, goTo]);

  // Reset scroll on every slide change so a long chapter always opens from the top.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    if (focusContent.current) {
      focusContent.current = false;
      contentRef.current?.focus({ preventScroll: true });
    }
  }, [active]);

  useEffect(() => {
    const readRoute = () => {
      const nextSlide = activeRoute();
      if (nextSlide === active) return;
      focusContent.current = true;
      setActive(nextSlide);
      setSidebarOpen(false);
    };
    window.addEventListener('popstate', readRoute);
    window.addEventListener('hashchange', readRoute);
    return () => {
      window.removeEventListener('popstate', readRoute);
      window.removeEventListener('hashchange', readRoute);
    };
  }, [active]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && sidebarOpen) {
        setSidebarOpen(false);
        directoryRef.current?.focus();
        return;
      }
      const target = e.target;
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey ||
          (target instanceof Element && target.closest('input, select, textarea, button, summary, a, [contenteditable]'))) {
        return;
      }
      if (e.key === 'ArrowRight' && active < lastSlide) {
        e.preventDefault();
        next();
      } else if (e.key === 'ArrowLeft' && active > 0) {
        e.preventDefault();
        prev();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, lastSlide, next, prev, sidebarOpen]);

  const sidebarItems = [
    { idx: 0, num: '封面', title: tutorial.meta.titleZh || tutorial.meta.titleEn },
    ...chapters.map((ch, i) => ({ idx: i + 1, num: `§${i + 1}`, title: ch.title })),
    ...(hasBili ? [{ idx: total + 1, num: '📺', title: '延伸视频' }] : []),
  ];

  const currentChapter = active >= 1 && active <= total ? chapters[active - 1] : null;

  return (
    <div className={`slide-layout ${sidebarOpen ? 'sidebar-open' : ''} ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <button ref={directoryRef} type="button" className="slide-sidebar-toggle" aria-controls="tutorial-navigation" aria-expanded={sidebarOpen} onClick={() => setSidebarOpen(value => !value)}>
        <span aria-hidden="true" className="slide-sidebar-toggle-icon">{sidebarOpen ? '✕' : '☰'}</span>
        目录
      </button>

      {sidebarOpen ? (
        <div className="slide-sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      ) : null}

      <aside id="tutorial-navigation" className="slide-sidebar">
        <div className="slide-sidebar-header">
          <div className="slide-sidebar-venue">{tutorial.meta.venue}</div>
          <div className="slide-sidebar-title">
            {tutorial.meta.titleZh || tutorial.meta.titleEn}
          </div>
        </div>
        <nav className="slide-sidebar-nav" aria-label="章节目录">
          {sidebarItems.map((item) => (
            <button
              key={item.idx}
              type="button"
              aria-current={active === item.idx ? 'page' : undefined}
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
        type="button"
        className="slide-sidebar-collapse"
        onClick={() => setSidebarCollapsed(value => !value)}
        title={sidebarCollapsed ? '展开目录' : '折叠目录'}
        aria-label={sidebarCollapsed ? '展开目录' : '折叠目录'}
        aria-expanded={!sidebarCollapsed}
        aria-controls="tutorial-navigation"
      >
        {sidebarCollapsed ? '☰' : '◀'}
      </button>

      <main className="slide-main">
        <div className="slide-content" key={active} ref={contentRef} tabIndex={-1} aria-label={sidebarItems[active].title}>
          {active === 0 ? (
            <Hero meta={tutorial.meta} hero={tutorial.hero} onStart={() => goTo(1)} />
          ) : currentChapter ? (
            <section className="chap slide-chap">
              <h2 className="chap-title">
                <span className="num">§{active}.</span>
                {currentChapter.title}
                <span className={`badge-tag ${currentChapter.badge}`}>
                  {currentChapter.badgeLabel}
                </span>
              </h2>
              <p className="chapter-intro">{currentChapter.bridge}</p>
              {currentChapter.analogy ? <AnalogyCard analogy={currentChapter.analogy} chapterId={currentChapter.id} /> : null}
              <ChapterModules chapter={currentChapter} paperSource={tutorial.meta.paperSource} />
              {currentChapter.insight ? <InsightBar text={currentChapter.insight} /> : null}
              {currentChapter.equations?.length ? (
                <section className="chapter-equations" aria-labelledby="paper-equations-title">
                  <h3 id="paper-equations-title">原论文公式</h3>
                  {currentChapter.equations.map(id => (
                    <Formula key={id} formula={paperEquations[id]} paperSource={tutorial.meta.paperSource} />
                  ))}
                </section>
              ) : null}
              {currentChapter.takeaways.length > 0 ? <Takeaway items={currentChapter.takeaways} /> : null}
              {currentChapter.transition ? (
                <aside className="chapter-transition">
                  <strong>下一节的问题</strong>
                  <p>{currentChapter.transition}</p>
                </aside>
              ) : null}
            </section>
          ) : hasBili ? (
            <BiliVideos items={videos} />
          ) : null}
        </div>

        <nav className="slide-nav" aria-label="前后翻页">
          <button type="button" className="slide-nav-btn" onClick={prev} disabled={active === 0}>
            ← 上一页
          </button>
          <span className="slide-nav-counter" aria-label={`第 ${active + 1} 页，共 ${lastSlide + 1} 页`}>
            {active + 1} / {lastSlide + 1}
          </span>
          <button
            type="button"
            className="slide-nav-btn slide-nav-btn-primary"
            onClick={next}
            disabled={active === lastSlide}
          >
            {active === lastSlide - 1 && hasBili ? '延伸视频 →' : '下一页 →'}
          </button>
        </nav>
      </main>
    </div>
  );
}
