import React from 'react';

export function ChapterBridge({ text, chapterIndex = 0 }: { text: string; chapterIndex?: number }) {
  return (
    <div className={`chap-bridge ${chapterIndex > 0 ? 'chap-bridge--teach' : ''} reveal-on-scroll`}>
      <div className="cb-body">
        <div className="cb-title">本节作用</div>
        <div className="cb-text">
          {chapterIndex === 0 ? <span className="cb-quote">&gt;</span> : null}
          <span>{text}</span>
        </div>
      </div>
    </div>
  );
}
