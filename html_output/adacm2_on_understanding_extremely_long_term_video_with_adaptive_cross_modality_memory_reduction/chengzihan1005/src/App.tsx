import React, { useState, useEffect, useCallback } from 'react';
import { chapterQuizzes, tutorial } from './data/tutorial';
import { Hero } from './components/Hero';
import { ChapterBridge } from './components/ChapterBridge';
import { AnalogyCard } from './components/AnalogyCard';
import { Module } from './components/Module';
import { Formula } from './components/Formula';
import { InsightBar } from './components/InsightBar';
import { Takeaway } from './components/Takeaway';
import { BiliVideos } from './components/BiliVideos';

export default function App() {
  const chapters = tutorial.chapters;
  const total = chapters.length;
  const bili = tutorial.bilibili || [];
  const hasBili = bili.length > 0;
  const lastSlide = total + (hasBili ? 1 : 0); // 0=hero, 1..total=chapters, total+1=bili

  const [active, setActive] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [quizOpen, setQuizOpen] = useState(false);
  const [quizStep, setQuizStep] = useState(0);
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);

  const goTo = useCallback(
    (i: number) => {
      setActive(Math.max(0, Math.min(i, lastSlide)));
      setSidebarOpen(false);
    },
    [lastSlide]
  );

  const next = useCallback(() => goTo(active + 1), [active, goTo]);
  const prev = useCallback(() => goTo(active - 1), [active, goTo]);

  // Reset scroll on every slide change so a long chapter always opens from the top.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [active]);

  const sidebarItems = [
    { idx: 0, num: '封面', title: tutorial.meta.titleZh || tutorial.meta.titleEn },
    ...chapters.map((ch, i) => ({ idx: i + 1, num: `§${i + 1}`, title: ch.title })),
    ...(hasBili ? [{ idx: total + 1, num: '📺', title: '延伸视频' }] : []),
  ];

  const currentChapter = active >= 1 && active <= total ? chapters[active - 1] : null;
  const currentQuiz = currentChapter ? chapterQuizzes[currentChapter.id] : undefined;

  const openQuiz = useCallback(() => {
    if (!currentQuiz) return;
    setQuizStep(0);
    setQuizAnswer(null);
    setQuizOpen(true);
  }, [currentQuiz]);

  const closeQuiz = useCallback(() => {
    setQuizOpen(false);
    setQuizAnswer(null);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (quizOpen) {
        if (e.key === 'Escape') closeQuiz();
        return;
      }
      const target = e.target;
      if (target instanceof HTMLElement && target.closest('input, textarea, select, [contenteditable="true"], [role="slider"]')) {
        return;
      }
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
  }, [closeQuiz, next, prev, quizOpen]);

  useEffect(() => {
    closeQuiz();
  }, [active, closeQuiz]);

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
              {currentQuiz ? (
                <div className="chapter-toolbar chapter-quiz-bottom">
                  <span className="chapter-toolbar-note">本章内容已读完？用 2 道可选小测检验一下记忆</span>
                  <button className="quiz-trigger" onClick={openQuiz} type="button">
                    🧪 打开本章小测 · 2 题
                  </button>
                </div>
              ) : null}
            </section>
          ) : hasBili ? (
            <BiliVideos items={bili} />
          ) : null}
        </div>

        <div className="slide-nav">
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
        </div>

        {quizOpen && currentChapter && currentQuiz ? (
          <div className="quiz-overlay" onClick={closeQuiz} role="presentation">
            <section
              className="quiz-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby="quiz-dialog-title"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="quiz-dialog-topline">
                <span className="quiz-kicker">章节小测 · {currentChapter.title}</span>
                <button className="quiz-close" onClick={closeQuiz} type="button" aria-label="关闭小测">
                  ×
                </button>
              </div>
              <div className="quiz-progress" aria-label={`第 ${quizStep + 1} 题，共 2 题`}>
                <span className="quiz-progress-fill" style={{ width: `${((quizStep + 1) / 2) * 100}%` }} />
              </div>
              <div className="quiz-count">第 {quizStep + 1} / 2 题</div>
              <h3 id="quiz-dialog-title">{currentQuiz[quizStep].prompt}</h3>
              <div className="quiz-options">
                {currentQuiz[quizStep].options.map((option, index) => {
                  const selected = quizAnswer === index;
                  const answered = quizAnswer !== null;
                  const correct = index === currentQuiz[quizStep].answer;
                  return (
                    <button
                      key={option}
                      type="button"
                      className={`quiz-option ${selected ? (correct ? 'is-correct' : 'is-wrong') : ''} ${answered && correct ? 'is-answer' : ''}`}
                      onClick={() => setQuizAnswer(index)}
                      disabled={answered}
                    >
                      <span className="quiz-option-letter">{String.fromCharCode(65 + index)}</span>
                      <span>{option}</span>
                      {answered && correct ? <span className="quiz-option-mark">✓</span> : null}
                      {selected && !correct ? <span className="quiz-option-mark">×</span> : null}
                    </button>
                  );
                })}
              </div>
              {quizAnswer !== null ? (
                <div className={`quiz-result ${quizAnswer === currentQuiz[quizStep].answer ? 'is-correct' : 'is-wrong'}`}>
                  <strong>{quizAnswer === currentQuiz[quizStep].answer ? '答对了！' : '这次选错了，但不影响继续阅读。'}</strong>
                  <p>{currentQuiz[quizStep].explanation}</p>
                  <small>📄 {currentQuiz[quizStep].evidence}</small>
                </div>
              ) : (
                <p className="quiz-hint">选错不会锁定章节；你也可以随时关闭弹窗。</p>
              )}
              <div className="quiz-actions">
                <button className="quiz-later" onClick={closeQuiz} type="button">稍后再做</button>
                {quizAnswer !== null ? (
                  <button
                    className="quiz-next"
                    onClick={() => {
                      if (quizStep === 0) {
                        setQuizStep(1);
                        setQuizAnswer(null);
                      } else {
                        closeQuiz();
                      }
                    }}
                    type="button"
                  >
                    {quizStep === 0 ? '下一题 →' : '完成小测 ✓'}
                  </button>
                ) : null}
              </div>
            </section>
          </div>
        ) : null}
      </main>
    </div>
  );
}
