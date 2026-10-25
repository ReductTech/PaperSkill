import React from 'react';
import type { DeepDiveDef } from '../types';

// Collapsible per-chapter principle deep dive. Content is generated (trusted), so inline HTML is allowed.
export function DeepDive({ deepDive }: { deepDive: DeepDiveDef }) {
  return (
    <details className="deep-dive">
      <summary>{deepDive.title || '原理详解'}</summary>
      <div className="deep-dive-body">
        {deepDive.paragraphs.map((p, i) => (
          <p key={i} dangerouslySetInnerHTML={{ __html: p }} />
        ))}
      </div>
    </details>
  );
}
