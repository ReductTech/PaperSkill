import React from 'react';
import type { AnalogyCard as AnalogyCardDef } from '../types';
import { widgetRegistry } from '../modules/registry';
import { Figure } from './Figure';

// Life-metaphor analogy card (244x130 canvas animation OR an optional paper figure).
export function AnalogyCard({
  analogy,
  chapterId,
}: {
  analogy: AnalogyCardDef;
  chapterId: string;
}) {
  const Widget = analogy.componentId ? widgetRegistry[analogy.componentId] : undefined;
  const wideVisual = chapterId === 'chap-3';
  return (
    <div className={'analogy-card ' + (analogy.figure ? 'evidence-card' : 'life-card') + (wideVisual ? ' analogy-card--wide-visual' : '')}>
      <div className="analogy-visual">
        {analogy.figure ? (
          <Figure src={analogy.figure} alt={analogy.title} />
        ) : Widget ? (
          <Widget chapterId={chapterId} moduleId="ana" />
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
