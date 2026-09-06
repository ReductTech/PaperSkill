import React from 'react';
import type { AnalogyCard as AnalogyCardDef } from '../types';

export function AnalogyCard({ analogy, chapterId }: { analogy: AnalogyCardDef; chapterId: string }) {
  const chapterNumber = chapterId.replace('chap-', '§');
  return (
    <div className="chapter-reading-map">
      <div className="reading-map-mark"><small>READING MAP</small><b>{chapterNumber}</b></div>
      <div className="reading-map-body">
        <div className="reading-map-title">{analogy.title}</div>
        <div className="reading-map-text" dangerouslySetInnerHTML={{ __html: analogy.text }} />
      </div>
    </div>
  );
}
