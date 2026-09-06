import React, { useEffect, useMemo, useState } from 'react';
import { tutorial } from './data/tutorial';
import { Hero } from './components/Hero';
import { ChapterBridge } from './components/ChapterBridge';
import { AnalogyCard } from './components/AnalogyCard';
import { Module } from './components/Module';
import { Formula } from './components/Formula';
import { InsightBar } from './components/InsightBar';
import { Takeaway } from './components/Takeaway';
import { BiliVideos } from './components/BiliVideos';
import { ChapterQuiz } from './components/ChapterQuiz';

export default function App() {
  const [revealedPart, setRevealedPart] = useState(-1);
  const bili = tutorial.bilibili || [];
  const chaptersById = useMemo(
    () => new Map(tutorial.chapters.map((chapter) => [chapter.id, chapter])),
    [],
  );
  const appendix = (tutorial.appendixChapterIds || [])
    .map((id) => chaptersById.get(id))
    .filter((chapter) => chapter !== undefined);

  useEffect(() => {
    if (revealedPart < 0) return;
    const part = tutorial.parts[revealedPart];
    const el = part ? document.getElementById(part.id) : null;
    if (!el) return;
    const id = requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    return () => cancelAnimationFrame(id);
  }, [revealedPart]);

  const renderChapter = (chapter: (typeof tutorial.chapters)[number], localIndex: number) => (
    <section className="chap part-chapter" id={chapter.id} key={chapter.id}>
      <div className="part-chapter-kicker">内部章节 {localIndex + 1}</div>
      <h2 className="chap-title">
        <span className="num">§{localIndex + 1}.</span>
        {chapter.title}
        <span className={`badge-tag ${chapter.badge}`}>{chapter.badgeLabel}</span>
      </h2>
      <ChapterBridge text={chapter.bridge} />
      <AnalogyCard analogy={chapter.analogy} chapterId={chapter.id} />
      {chapter.modules.map((module) => (
        <Module key={module.id} module={module} chapterId={chapter.id} />
      ))}
      {chapter.insight ? <InsightBar text={chapter.insight} /> : null}
      {chapter.formula ? <Formula formula={chapter.formula} /> : null}
      <Takeaway items={chapter.takeaways} />
      <ChapterQuiz questions={chapter.quiz} />
    </section>
  );

  return (
    <>
      <Hero
        meta={tutorial.meta}
        hero={tutorial.hero}
        prerequisites={tutorial.prerequisites}
        parts={tutorial.parts}
        onStart={() => setRevealedPart(0)}
        started={revealedPart >= 0}
      />
      <main>
        {tutorial.parts.map((part, partIndex) => {
          if (partIndex > revealedPart) return null;
          const chapters = part.chapterIds
            .map((id) => chaptersById.get(id))
            .filter((chapter) => chapter !== undefined);
          const isCurrent = partIndex === revealedPart;
          const isLast = partIndex === tutorial.parts.length - 1;
          const nextPart = tutorial.parts[partIndex + 1];
          return (
            <section className={`part-shell is-${part.moduleId}`} id={part.id} key={part.id}>
              <header className="part-header">
                <div className="part-header-meta">
                  <span>{part.moduleLabel}</span>
                  <b>{part.number === 0 ? '导读 · Part 0' : `Part ${part.number} / 6`}</b>
                </div>
                <h1>{part.title}</h1>
                <p>{part.summary}</p>
                {part.crossImpact ? <div className="part-cross-impact">跨模块影响：{part.crossImpact}</div> : null}
              </header>

              <div className="part-chapters">
                {chapters.map((chapter, localIndex) => renderChapter(chapter, localIndex))}
              </div>

              {isCurrent && !isLast ? (
                <div className="chap-loader">
                  <div className="chap-loader-hint">
                    {part.number === 0 ? '导读完成，下面进入论文的六个核心部分。' : `Part ${part.number} 完成`}
                  </div>
                  <button className="chap-loader-btn" onClick={() => setRevealedPart((value) => value + 1)}>
                    {nextPart.number === 1 ? '进入正文 · Part 1 / 6' : `继续 · Part ${nextPart.number} / 6`}
                    <span className="chap-loader-arrow">→</span>
                  </button>
                </div>
              ) : null}

              {isCurrent && isLast ? (
                <>
                  {appendix.length > 0 ? (
                    <section className="part-appendix">
                      <header>
                        <span>结语</span>
                        <h2>两条主线汇合：证据与边界</h2>
                      </header>
                      {appendix.map((chapter, index) => renderChapter(chapter, index))}
                    </section>
                  ) : null}
                  {bili.length > 0 ? <BiliVideos items={bili} /> : null}
                </>
              ) : null}
            </section>
          );
        })}
      </main>
    </>
  );
}
