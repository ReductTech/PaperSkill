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
  return (
    <div className="analogy-card">
      <div className="analogy-visual">
        {Widget ? (
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
        <details className="canvas-transcript analogy-transcript">
          <summary>动画文字说明</summary>
          <p>{analogy.canvasAlt || analogy.text.replace(/<[^>]+>/g, '')}</p>
        </details>
      </div>
    </div>
  );
}
