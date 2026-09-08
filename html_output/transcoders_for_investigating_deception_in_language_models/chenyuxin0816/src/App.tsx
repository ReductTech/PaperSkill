import React, { useEffect, useState } from 'react';
import { tutorial } from './data/tutorial';
import { Hero } from './components/Hero';
import { ModuleDeck } from './components/ModuleDeck';
import { Formula } from './components/Formula';
import { InsightBar } from './components/InsightBar';
import { BiliVideos } from './components/BiliVideos';

export default function App() {
  const total = tutorial.chapters.length;
  const [started, setStarted] = useState(false);
  const [presentationMode, setPresentationMode] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const bili = tutorial.bilibili || [];

  const openTutorial = (presenting: boolean) => {
    if (presenting) document.documentElement.dataset.presentationMode = 'true';
    else delete document.documentElement.dataset.presentationMode;
    setPresentationMode(presenting);
    setCurrentPage(0);
    setStarted(true);
  };

  const goToPage = (nextPage: number) => {
    setCurrentPage(Math.max(0, Math.min(total - 1, nextPage)));
  };

  const returnToCover = () => {
    delete document.documentElement.dataset.presentationMode;
    setPresentationMode(false);
    setStarted(false);
    window.scrollTo({ top: 0 });
  };

  useEffect(() => {
    if (!started) return;
    window.scrollTo({ top: 0 });
  }, [currentPage, started]);

  if (!started) {
    return (
      <Hero
        meta={tutorial.meta}
        hero={tutorial.hero}
        onStart={() => openTutorial(false)}
        onPresent={() => openTutorial(true)}
        started={false}
      />
    );
  }

  return (
    <div className="slide-app">
      <header className="slide-topbar">
        <button className="slide-home" type="button" onClick={returnToCover} title="返回封面" aria-label="返回封面">
          ⌂
        </button>
        <div className="slide-paper-name">
          <strong>Transcoders × Deception</strong>
          <span>{presentationMode ? '4 分钟演示' : '交互学习'}</span>
        </div>
        <nav className="slide-pagination" aria-label="章节页码">
          {tutorial.chapters.map((chapter, index) => (
            <button
              key={chapter.id}
              type="button"
              className={currentPage === index ? 'is-active' : ''}
              aria-current={currentPage === index ? 'page' : undefined}
              aria-label={'第 ' + (index + 1) + ' 页：' + chapter.title}
              title={chapter.title}
              onClick={() => goToPage(index)}
            >
              {index + 1}
            </button>
          ))}
        </nav>
        <span className="slide-counter" aria-live="polite">
          {currentPage + 1}<small> / {total}</small>
        </span>
      </header>

      <main className="slide-stage">
        {tutorial.chapters.map((chapter, index) => {
          const isActive = currentPage === index;
          const isOpeningChapter = chapter.id === 'chap-1';
          const isLast = index === total - 1;
          return (
            <section
              className={'chap chap-slide' + (isActive ? ' is-active' : '')}
              id={chapter.id}
              key={chapter.id}
              hidden={!isActive}
              aria-hidden={!isActive}
            >
              <h2 className="chap-title">
                <span className="num">§{index + 1}.</span>
                {chapter.title}
                <span className={'badge-tag ' + chapter.badge}>{chapter.badgeLabel}</span>
              </h2>
              {isOpeningChapter ? (
                <p className="chap-opening-lead">
                  密钥已经写入 System Prompt。模型知道答案，却可能选择不告诉用户。
                </p>
              ) : (
                <p className="slide-lead" dangerouslySetInnerHTML={{ __html: chapter.bridge }} />
              )}
              <ModuleDeck modules={chapter.modules} chapterId={chapter.id} />
              {isOpeningChapter ? (
                <div className="chap-opening-transition">
                  <strong>论文要回答：模型从“知道密钥”到“选择隐藏”，内部到底发生了什么？</strong>
                  <div className="chap-opening-route" aria-label="论文研究路线">
                    <span>Transcoder 拆解 Feature</span>
                    <i aria-hidden="true">→</i>
                    <span>归因图追踪连接</span>
                    <i aria-hidden="true">→</i>
                    <span>Steering 验证作用</span>
                  </div>
                </div>
              ) : chapter.insight ? (
                <InsightBar text={chapter.insight} />
              ) : null}
              {chapter.formula ? <Formula formula={chapter.formula} /> : null}
              {isLast && bili.length > 0 ? <BiliVideos items={bili} /> : null}
            </section>
          );
        })}
      </main>

    </div>
  );
}
