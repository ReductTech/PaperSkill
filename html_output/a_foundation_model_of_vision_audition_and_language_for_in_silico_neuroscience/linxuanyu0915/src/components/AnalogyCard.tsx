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
  const compact = !['chap-2', 'chap-3', 'chap-4', 'chap-6'].includes(chapterId);
  return (
    <div className={`analogy-card ${compact ? 'analogy-card-compact' : ''}`}>
      {!compact ? <div className="analogy-visual">
        <div className="visual-source-tag teaching">教学示意 · 非论文原图</div>
        {Widget ? (
          <Widget chapterId={chapterId} moduleId="ana" />
        ) : analogy.figure ? (
          <Figure src={analogy.figure} alt={analogy.title} />
        ) : (
          <canvas width={560} height={140} />
        )}
      </div> : null}
      <div className="analogy-body">
        <div className="analogy-title">{compact ? '教学提示' : analogy.title}</div>
        <div className="analogy-text" dangerouslySetInnerHTML={{ __html: analogy.text }} />
      </div>
    </div>
  );
}
