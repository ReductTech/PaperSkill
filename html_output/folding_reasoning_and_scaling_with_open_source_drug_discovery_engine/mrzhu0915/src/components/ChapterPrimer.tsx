import React from 'react';
import type { TermDef } from '../types';

export function ChapterPrimer({ paragraphs, terms }: { paragraphs?: string[]; terms?: TermDef[] }) {
  if (!paragraphs?.length && !terms?.length) return null;
  return (
    <section className="chapter-primer" aria-label="本章背景与术语">
      <div className="primer-copy">
        <div className="primer-kicker">读图前先知道</div>
        {paragraphs?.map((paragraph, index) => (
          <p key={index} dangerouslySetInnerHTML={{ __html: paragraph }} />
        ))}
      </div>
      {terms?.length ? (
        <div className="term-grid">
          {terms.map((term) => (
            <article className="term-card" key={`${term.term}-${term.notation ?? ''}`}>
              <div className="term-head">
                <strong>{term.term}</strong>
                {term.notation ? <code>{term.notation}</code> : null}
              </div>
              <p>{term.definition}</p>
              <div className="term-role"><b>在流程中的作用：</b>{term.role}</div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
