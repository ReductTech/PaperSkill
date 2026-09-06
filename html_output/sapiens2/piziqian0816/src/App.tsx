import React, { useEffect, useState } from 'react';
import { Formula } from './components/Formula';
import { PageDrawers } from './components/PageDrawers';
import { PaperCover } from './components/PaperCover';
import { tutorial } from './data/tutorial';
import { widgetRegistry } from './modules/registry';
import type { ChapterDef } from './types';

function SlideIndex({ labels, current }: { labels: string[]; current: number }) {
  return (
    <div className="slide-index" aria-label="课件内容索引">
      {labels.map((label, itemIndex) => (
        <span
          className={itemIndex === current ? 'active' : ''}
          aria-current={itemIndex === current ? 'page' : undefined}
          key={label}
        >
          {label}
        </span>
      ))}
    </div>
  );
}

function SlideNavigation({ current, total, onMove, onSelect, hasIntro = false }: {
  current: number;
  total: number;
  onMove: (delta: number) => void;
  onSelect: (index: number) => void;
  hasIntro?: boolean;
}) {
  return (
    <nav className="slide-navigation" aria-label="课件翻页">
      <div className="slide-navigation-actions">
        <button onClick={() => onMove(-1)} disabled={current === 0 && !hasIntro}>返回学习</button>
        <button onClick={() => onMove(1)} disabled={current === total - 1}>继续学习</button>
      </div>
      <div className="slide-page-dots" aria-label={`当前第 ${current + 1} 页，共 ${total} 页`}>
        {Array.from({ length: total }, (_, dot) => (
          <button
            aria-label={`跳转到第 ${dot + 1} 页`}
            aria-current={dot === current ? 'page' : undefined}
            className={dot === current ? 'active' : ''}
            onClick={() => onSelect(dot)}
            key={dot}
          />
        ))}
      </div>
    </nav>
  );
}

function MainSlide({ page, index, labels, onMove, onSelect }: {
  page: ChapterDef;
  index: number;
  labels: string[];
  onMove: (delta: number) => void;
  onSelect: (index: number) => void;
}) {
  const module = page.modules[0];
  const Widget = module ? widgetRegistry[module.componentId] : undefined;
  return (
    <article className="deck-slide" aria-labelledby={`${page.id}-title`}>
      <div className="slide-topline">
        <SlideIndex labels={labels} current={index} />
      </div>
      <h1 id={`${page.id}-title`}>{page.title}</h1>
      <p className="slide-thesis">{page.bridge}</p>
      <section className="slide-stage">
        <div className="stage-heading">
          <span>{module?.id}</span>
          <div><h2>{module?.title}</h2><p>{module?.desc}</p></div>
        </div>
        {Widget ? <Widget chapterId={page.id} moduleId={module.id} /> : null}
      </section>
      {page.formula ? <Formula formula={page.formula} /> : null}
      {page.insight ? <div className="slide-conclusion">{page.insight}</div> : null}
      <PageDrawers pageId={page.id} figures={page.paperFigures} />
      <SlideNavigation current={index} total={labels.length} onMove={onMove} onSelect={onSelect} hasIntro />
    </article>
  );
}

export default function App() {
  const [showCover, setShowCover] = useState(true);
  const [mainIndex, setMainIndex] = useState(0);
  const mainPages = tutorial.chapters;
  const move = (delta: number) => {
    if (showCover) {
      if (delta > 0) setShowCover(false);
      return;
    }
    if (delta < 0 && mainIndex === 0) {
      setShowCover(true);
      return;
    }
    setMainIndex((value) => Math.max(0, Math.min(mainPages.length - 1, value + delta)));
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight' || event.key === 'PageDown') move(1);
      if (event.key === 'ArrowLeft' || event.key === 'PageUp') move(-1);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  return (
    <div className="presentation-shell">
      <header className="deck-header">
        <div>
          <span className="deck-eyebrow">SAPIENS → SAPIENS2</span>
          <strong>{tutorial.meta.titleZh}</strong>
        </div>
      </header>

      <main className="deck-main">
        {showCover ? (
          <PaperCover onStart={() => setShowCover(false)} />
        ) : (
          <MainSlide
            page={mainPages[mainIndex]}
            index={mainIndex}
            labels={mainPages.map((page) => page.indexLabel)}
            onMove={move}
            onSelect={setMainIndex}
          />
        )}
      </main>
    </div>
  );
}
