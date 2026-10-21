import React from 'react';
import type { AnalogyCard as AnalogyCardDef } from '../types';

// Life-metaphor analogy card (560x140 canvas animation OR an optional paper figure).
export function AnalogyCard({
  analogy,
  chapterId,
}: {
  analogy: AnalogyCardDef;
  chapterId: string;
}) {
  const chapter = Number(chapterId.replace('chap-', ''));
  const glyphs = ['▣','▤','↗','◇','▦','[ ]','✧','∞','≡','▥','⚖'];
  return (
    <div className="analogy-card">
      <div className="analogy-visual">
        <div className={`vl-analogy-art chapter-${chapter}`} aria-hidden="true"><span className="vl-analogy-guide"/>{chapter === 2 && <span className="vl-analogy-vector">↗</span>}<span className="vl-analogy-subject">{glyphs[chapter] || '▣'}</span><small>小 V · {String(chapter).padStart(2,'0')}</small></div>
      </div>
      <div className="analogy-body">
        <div className="analogy-title">{analogy.title}</div>
        <div className="analogy-text" dangerouslySetInnerHTML={{ __html: analogy.text }} />
      </div>
    </div>
  );
}
