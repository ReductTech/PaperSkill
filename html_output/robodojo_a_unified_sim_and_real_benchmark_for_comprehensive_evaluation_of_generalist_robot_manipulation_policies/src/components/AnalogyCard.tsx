import React from 'react';
import type { AnalogyCard as AnalogyCardDef } from '../types';
import { widgetRegistry } from '../modules/registry';
import { Figure } from './Figure';

const chapterGifMap: Record<string, string> = {
  'chap-1': '/images/robodojo/videos/chapter-gifs/chapter-1-high-score-trap.gif',
  'chap-2': '/images/robodojo/videos/chapter-gifs/chapter-2-five-dimensions.gif',
  'chap-3': '/images/robodojo/videos/chapter-gifs/chapter-3-score-vs-success.gif',
  'chap-4': '/images/robodojo/videos/chapter-gifs/chapter-4-sim-vs-real.gif',
  'chap-5': '/images/robodojo/videos/chapter-gifs/chapter-5-three-systems.gif',
  'chap-6': '/images/robodojo/videos/chapter-gifs/chapter-6-layout-overlay.gif',
  'chap-7': '/images/robodojo/videos/chapter-gifs/chapter-7-leaderboard-mountain.gif',
  'chap-8': '/images/robodojo/videos/chapter-gifs/chapter-8-final-takeaway.gif',
};

// Life-metaphor analogy card (244x130 canvas animation OR an optional paper figure).
export function AnalogyCard({
  analogy,
  chapterId,
}: {
  analogy: AnalogyCardDef;
  chapterId: string;
}) {
  const Widget = analogy.componentId ? widgetRegistry[analogy.componentId] : undefined;
  const chapterGif = chapterGifMap[chapterId];
  return (
    <div className="analogy-card">
      <div className="analogy-visual">
        {chapterGif ? (
          <img className="analogy-chapter-gif" src={chapterGif} alt="" />
        ) : Widget ? (
          <Widget chapterId={chapterId} moduleId="ana" />
        ) : analogy.figure ? (
          <Figure src={analogy.figure} alt={analogy.title} />
        ) : (
          <canvas width={244} height={130} />
        )}
      </div>
      <div className="analogy-body">
        <div className="analogy-title">{analogy.title}</div>
        <div className="analogy-text" dangerouslySetInnerHTML={{ __html: analogy.text }} />
      </div>
    </div>
  );
}
