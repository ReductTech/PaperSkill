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
          <div style={{ width: 244, height: 130, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44, background: '#f5f8f0', borderRadius: 10 }}>💡</div>
        )}
      </div>
      <div className="analogy-body">
        <div className="analogy-title">{analogy.title}</div>
        <div className="analogy-text" dangerouslySetInnerHTML={{ __html: analogy.text }} />
      </div>
    </div>
  );
}
