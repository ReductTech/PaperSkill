import React, { useState, useEffect, useCallback } from 'react';
import { tutorial } from './data/tutorial';
import { Hero } from './components/Hero';
import { ChapterBridge } from './components/ChapterBridge';
import { AnalogyCard } from './components/AnalogyCard';
import { Module } from './components/Module';
import { Formula } from './components/Formula';
import { InsightBar } from './components/InsightBar';
import { Takeaway } from './components/Takeaway';

export default function App() {
  const chapters = tutorial.chapters;
  const total = chapters.length;
  const lastSlide = total; // 0=hero, 1..total=chapters

  const slideFromHash = useCallback(() => {
    const match = window.location.hash.match(/^#chap-(\d+)$/);
    const index = match ? Number(match[1]) : 0;
    return index >= 1 && index <= lastSlide ? index : 0;
  }, [lastSlide]);

  const [active, setActive] = useState(slideFromHash);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const goTo = useCallback(
    (i: number) => {
      const target = Math.max(0, Math.min(i, lastSlide));
      if (target !== active) {
        const url = target === 0
          ? window.location.pathname + window.location.search
          : `#chap-${target}`;
        window.history.pushState(null, '', url);
        setActive(target);
      }
      setSidebarOpen(false);
    },
    [active, lastSlide]
  );

  const next = useCallback(() => goTo(active + 1), [active, goTo]);
  const prev = useCallback(() => goTo(active - 1), [active, goTo]);

  // Reset scroll on every slide change so a long chapter always opens from the top.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [active]);

  useEffect(() => {
    const syncFromUrl = () => setActive(slideFromHash());
    window.addEventListener('popstate', syncFromUrl);
    window.addEventListener('hashchange', syncFromUrl);
    return () => {
      window.removeEventListener('popstate', syncFromUrl);
      window.removeEventListener('hashchange', syncFromUrl);
    };
  }, [slideFromHash]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      if (e.target instanceof Element && e.target.closest('button, input, select, textarea, a, summary, [contenteditable]:not([contenteditable="false"]), [role="slider"], [role="button"], [tabindex]:not([tabindex="-1"])')) return;
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        next();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prev();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev]);

  const sidebarItems = [
    { idx: 0, num: '封面', title: tutorial.meta.titleZh || tutorial.meta.titleEn },
    ...chapters.map((ch, i) => ({ idx: i + 1, num: `§${i + 1}`, title: ch.title })),
  ];

  const currentChapter = active >= 1 && active <= total ? chapters[active - 1] : null;

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
        <div className="slide-content" key={active}>
          {active === 0 ? (
            <Hero meta={tutorial.meta} hero={tutorial.hero} onStart={() => goTo(1)} />
          ) : currentChapter ? (
            <section className="chap slide-chap" id={currentChapter.id}>
              <h2 className="chap-title">
                <span className="num">§{active}.</span>
                {currentChapter.title}
                <span className={`badge-tag ${currentChapter.badge}`}>
                  {currentChapter.badgeLabel}
                </span>
              </h2>
              <ChapterBridge text={currentChapter.bridge} href={`#${currentChapter.id}`} />
              {active === 9 && currentChapter.insight ? <InsightBar text={currentChapter.insight} /> : null}
              {active === 3 && currentChapter.formula ? <Formula formula={currentChapter.formula} /> : null}
              {active === 10 ? (
                <div className="limitations-overview">
                  <h3>先记住四项边界</h3>
                  <ul>
                    <li>rank 与插入位置要按任务选择；小 rank 不保证处处有效。</li>
                    <li>LoRA 节省任务更新参数，基础模型仍要存储和加载。</li>
                    <li>多个已合并任务权重不便在同一批次动态混用。</li>
                    <li>原论文主要验证语言任务，未验证视觉语言个性化或长期记忆。</li>
                  </ul>
                  <p>LoRA 是五篇路线的起点：先回答如何低成本适配大模型，再把研究问题推进到视觉语言任务与用户个性化。路线表示问题演进，不表示后四篇直接继承 LoRA。</p>
                </div>
              ) : null}
              {[1, 3, 6].includes(active) ? <AnalogyCard analogy={currentChapter.analogy} chapterId={currentChapter.id} /> : null}
              {currentChapter.modules.map((m) => (
                <Module key={m.id} module={m} chapterId={currentChapter.id} />
              ))}
              {active === 8 ? (
                <aside className="experiment-examples" aria-label="论文中的 GLUE 与 ROUGE 数字示例">
                  <h3>两组论文原始数字</h3>
                  <div className="experiment-examples-grid">
                    <div className="experiment-example">
                      <strong>RoBERTa base · GLUE/MNLI</strong>
                      <span>整体准确率（%）</span>
                      <p>Full FT <b>87.6</b> · LoRA <b>87.5</b></p>
                      <small>两者接近；FT 值来自既有工作。来源：论文表 2。</small>
                    </div>
                    <div className="experiment-example">
                      <strong>GPT-3 · SAMSum</strong>
                      <span>ROUGE-1 / 2 / L</span>
                      <p>Full FT <b>52.0 / 28.0 / 44.5</b><br />LoRA（可训练参数 4.7M）<b>53.8 / 29.8 / 45.9</b></p>
                      <small>这一任务配置下 LoRA 更高。来源：论文表 4。</small>
                    </div>
                  </div>
                  <p className="experiment-examples-note">这里的 MNLI 准确率与 SAMSum ROUGE 属于不同指标，不能直接比较数值大小。</p>
                </aside>
              ) : null}
              {active !== 9 && currentChapter.insight ? <InsightBar text={currentChapter.insight} /> : null}
              {active !== 3 && currentChapter.formula ? <Formula formula={currentChapter.formula} /> : null}
              <Takeaway items={currentChapter.takeaways} />
            </section>
          ) : null}
        </div>

        {active > 0 ? <div className="slide-nav">
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
        </div> : null}
      </main>
    </div>
  );
}
