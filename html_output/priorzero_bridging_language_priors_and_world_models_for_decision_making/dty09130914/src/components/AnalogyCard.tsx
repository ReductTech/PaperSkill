import React from 'react';
import type { AnalogyCard as AnalogyCardDef } from '../types';
import { Figure } from './Figure';
import { MechanismThumb } from './MechanismThumb';

// Life-metaphor analogy card (560x140 canvas animation OR an optional paper figure).
export function AnalogyCard({
  analogy,
  chapterId,
}: {
  analogy: AnalogyCardDef;
  chapterId: string;
}) {
  return (
    <div className="analogy-card">
      <div className="analogy-visual">
        {chapterId ? (
          <MechanismThumb chapterId={chapterId} />
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
