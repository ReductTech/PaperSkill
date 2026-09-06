import React, { useEffect, useState } from 'react';
import { tutorial } from './data/tutorial';
import { Hero } from './components/Hero';
import { ChapterProgress } from './components/ChapterProgress';
import { SceneShell } from './components/SceneShell';
import { InteractiveScene } from './components/InteractiveScene';
import { Module } from './components/Module';
import { Formula } from './components/Formula';
import { PaperBoundaryNote } from './components/PaperBoundaryNote';
import { BiliVideos } from './components/BiliVideos';
import { useProgressiveChapters } from './lib/useProgressiveChapters';

const coreSceneIds = new Set(['chap-3', 'chap-6', 'chap-7', 'chap-8', 'chap-10']);

export default function App() {
  const total = tutorial.chapters.length;
  const { revealed, begin, revealNext } = useProgressiveChapters(total);
  const [active, setActive] = useState(1);

  useEffect(() => {
    if (revealed < 1) return;
    const chapter = tutorial.chapters[revealed - 1];
    const element = document.getElementById(chapter.id);
    if (!element) return;
    setActive(revealed);
    const frame = requestAnimationFrame(() => element.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    return () => cancelAnimationFrame(frame);
  }, [revealed]);

  useEffect(() => {
    if (!revealed) return;
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      const index = tutorial.chapters.findIndex((chapter) => chapter.id === visible.target.id);
      if (index >= 0) setActive(index + 1);
    }, { threshold: [0.25, 0.55], rootMargin: '-12% 0px -45% 0px' });
    tutorial.chapters.slice(0, revealed).forEach((chapter) => {
      const element = document.getElementById(chapter.id);
      if (element) observer.observe(element);
    });
    return () => observer.disconnect();
  }, [revealed]);

  const navigate = (index: number) => document.getElementById(tutorial.chapters[index - 1].id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <>
      <Hero meta={tutorial.meta} onStart={begin} started={revealed > 0} />
      {revealed > 0 ? <ChapterProgress chapters={tutorial.chapters} active={active} revealed={revealed} onNavigate={navigate} /> : null}
      <main>
        {tutorial.chapters.slice(0, revealed).map((chapter, index) => {
          const number = index + 1;
          const isLatest = number === revealed;
          const isLast = number === total;
          const isCore = coreSceneIds.has(chapter.id);
          return (
            <SceneShell key={chapter.id} chapter={chapter} number={number} core={isCore}>
              {isCore ? <InteractiveScene chapterId={chapter.id} /> : (
                <div className="scene-legacy-stage">
                  <p className="scene-question">{chapter.bridge}</p>
                  {chapter.modules.map((module) => <Module key={module.id} module={module} chapterId={chapter.id} />)}
                  {chapter.formula ? <Formula formula={chapter.formula} /> : null}
                  <PaperBoundaryNote text={chapter.insight ?? chapter.takeaways[2]?.desc} />
                </div>
              )}
              {isLatest && !isLast ? <div className="chapter-next"><button onClick={revealNext}>继续学习 <span>§{number + 1}</span></button></div> : null}
              {isLast && tutorial.bilibili?.length ? <BiliVideos items={tutorial.bilibili} /> : null}
            </SceneShell>
          );
        })}
      </main>
    </>
  );
}
