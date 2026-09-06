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
  const hasBody = Boolean((analogy.title || '').trim() || (analogy.text || '').trim());
  const hasVisual = Boolean(Widget || analogy.figure);

  if (!hasBody && !hasVisual) return null;

  return (
    <div className={`analogy-card ${hasBody ? '' : 'analogy-card-visual-only'}`}>
      <div className="analogy-visual">
        {Widget ? (
          <Widget chapterId={chapterId} moduleId="ana" />
        ) : analogy.figure ? (
          <Figure src={analogy.figure} alt={analogy.title} />
        ) : null}
      </div>
      {hasBody ? (
        <div className="analogy-body">
          <div className="analogy-title">{analogy.title}</div>
          <div className="analogy-text" dangerouslySetInnerHTML={{ __html: analogy.text }} />
        </div>
      ) : null}
    </div>
  );
}
