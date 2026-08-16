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
  const hasVisual = Boolean(Widget || analogy.figure);

  return (
    <div className={`analogy-card${hasVisual ? ' has-visual' : ' concept-note'}`}>
      {hasVisual ? (
        <div className="analogy-visual">
          {Widget ? <Widget chapterId={chapterId} moduleId="ana" /> : null}
          {!Widget && analogy.figure ? <Figure src={analogy.figure} alt={analogy.title} /> : null}
        </div>
      ) : null}
      <div className="analogy-body">
        <div className="analogy-title">{analogy.title}</div>
        <div className="analogy-text" dangerouslySetInnerHTML={{ __html: analogy.text }} />
      </div>
    </div>
  );
}
