import React from 'react';
import type { ChapterDef } from '../types';

// Chapter progress mini-strip reused from the reference template. `revealed` is the
// number of chapters currently shown; the matching step is "active", earlier ones "done".
export function FlowMini({
  chapters,
  revealed,
  onNavigate,
}: {
  chapters: ChapterDef[];
  revealed: number;
  onNavigate: (chapterNumber: number) => void;
}) {
  return (
    <nav className="flow-mini" aria-label="教程章节目录">
      {chapters.map((chapter, i) => {
        const n = i + 1;
        const cls =
          n < revealed ? 'flow-step done' : n === revealed ? 'flow-step active' : 'flow-step';
        return (
          <React.Fragment key={n}>
            {i > 0 ? <span className="flow-arrow">→</span> : null}
            <button
              className={cls}
              data-step={n}
              onClick={() => onNavigate(n)}
              aria-current={n === revealed ? 'step' : undefined}
              title={`§${n} ${chapter.title}`}
            >
              <span>§{n}</span>
              <span className="flow-step-title">{chapter.title}</span>
            </button>
          </React.Fragment>
        );
      })}
    </nav>
  );
}
