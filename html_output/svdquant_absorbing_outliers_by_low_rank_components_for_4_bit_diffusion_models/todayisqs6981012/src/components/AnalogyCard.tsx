import React from 'react';
import type { AnalogyCard as AnalogyCardDef } from '../types';
import { widgetRegistry } from '../modules/registry';
import { Figure } from './Figure';

// Life-metaphor analogy card (560x140 canvas animation OR an optional paper figure).
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
    <div className="analogy-card">
      {hasVisual && (
        <div className="analogy-visual">
          {Widget ? (
            <Widget chapterId={chapterId} moduleId="ana" />
          ) : analogy.figure ? (
            <Figure src={analogy.figure} alt={analogy.title} />
          ) : null}
        </div>
      )}
      <div className="analogy-body">
        <div className="analogy-title">{analogy.title}</div>
        <div className="analogy-text" dangerouslySetInnerHTML={{ __html: analogy.text }} />
      </div>
    </div>
  );
}
