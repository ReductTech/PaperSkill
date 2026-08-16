import React from 'react';
import type { SpeakerCue as SpeakerCueDef } from '../types';

export function SpeakerCue({ cue, isLast }: { cue: SpeakerCueDef; isLast: boolean }) {
  return (
    <aside className="speaker-cue" aria-label="章节演示要点">
      <div className="speaker-cue-grid">
        <div className="speaker-cue-item">
          <span className="speaker-cue-label">操作</span>
          <p>{cue.action}</p>
        </div>
        <div className="speaker-cue-item">
          <span className="speaker-cue-label">收束</span>
          <p>{cue.close}</p>
        </div>
        <div className="speaker-cue-item">
          <span className="speaker-cue-label">{isLast ? '结束' : '转场'}</span>
          <p>{cue.transition}</p>
        </div>
      </div>
    </aside>
  );
}
