import React, { useState } from 'react';
import type { ConnectQ } from '../types';

// End-of-chapter connectivity quiz: one question that links this chapter's concept
// to other chapters. Click an option, get immediate state-colored feedback.
export function ConnectCheck({ q }: { q: ConnectQ }) {
  const [picked, setPicked] = useState<number | null>(null);
  const answered = picked !== null;
  const correct = answered && picked === q.answer;

  return (
    <div className="connect-check">
      <div className="connect-check-head">
        <span className="connect-check-tag">连接性追问</span>
        <span className="connect-check-q" dangerouslySetInnerHTML={{ __html: q.question }} />
      </div>
      <div className="connect-check-options">
        {q.options.map((opt, i) => {
          let cls = 'connect-opt';
          if (answered && i === q.answer) cls += ' correct';
          else if (answered && i === picked) cls += ' wrong';
          return (
            <button
              key={i}
              className={cls}
              onClick={() => setPicked(i)}
              disabled={correct}
              aria-pressed={picked === i}
            >
              <span className="connect-opt-key">{String.fromCharCode(65 + i)}</span>
              <span dangerouslySetInnerHTML={{ __html: opt }} />
            </button>
          );
        })}
      </div>
      {answered ? (
        <div className={`connect-feedback ${correct ? 'good' : 'bad'}`}>
          {correct ? '✓ 回答正确。' : '✗ 再想一想。'}
          <span className="connect-explain" dangerouslySetInnerHTML={{ __html: q.explanation }} />
        </div>
      ) : null}
    </div>
  );
}
