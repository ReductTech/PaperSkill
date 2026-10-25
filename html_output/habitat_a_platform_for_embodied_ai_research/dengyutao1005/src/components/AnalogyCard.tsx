import React from 'react';
import type { AnalogyCard as AnalogyCardDef } from '../types';
import { widgetRegistry } from '../modules/registry';
import { comicData } from '../data/tutorial';
import { ComicViewer } from './ComicViewer';
import { Figure } from './Figure';

// Life-metaphor analogy card：
// 该章节已有漫画 → 用漫画替换原来的“粗糙 SVG 逐帧动画”作为开篇视觉；
// 否则回退到 analogy 组件 / 论文配图 / 空白画布。
export function AnalogyCard({
  analogy,
  chapterId,
}: {
  analogy: AnalogyCardDef;
  chapterId: string;
}) {
  const Widget = analogy.componentId ? widgetRegistry[analogy.componentId] : undefined;
  const comics = comicData.filter((c) => c.chapterId === chapterId);
  return (
    <div className="analogy-card">
      <div className="analogy-visual">
        {comics.length > 0 ? (
          <ComicViewer comics={comics} />
        ) : Widget ? (
          <Widget chapterId={chapterId} moduleId="ana" />
        ) : analogy.figure ? (
          <Figure src={analogy.figure} alt={analogy.title} />
        ) : (
          <canvas width={560} height={140} />
        )}
      </div>
      <div className="analogy-body">
        <div className="analogy-title">{analogy.title}</div>
        <div className="analogy-text" dangerouslySetInnerHTML={{ __html: analogy.text }} />
      </div>
    </div>
  );
}
