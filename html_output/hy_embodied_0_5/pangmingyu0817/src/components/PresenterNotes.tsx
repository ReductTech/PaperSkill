import React from 'react';
import type { PresenterScriptBlock } from '../data/presenterScript';

export function PresenterNotes({ script }: { script: PresenterScriptBlock }) {
  return (
    <div className="presenter-notes" aria-label={`${script.time} 延伸讲解`}>
      <div className="presenter-speech">
        {script.speech.map((item, index) => item.kind === 'quote'
          ? <blockquote key={index}>{item.text}</blockquote>
          : <p key={index}>{item.text}</p>)}
      </div>
    </div>
  );
}
