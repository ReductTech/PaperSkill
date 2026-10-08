import React from 'react';
import type { Takeaway as TakeawayDef } from '../types';

// Three-item chapter takeaway (🎯 🔧 ✨). Reused at the end of every chapter.
export function Takeaway({ items }: { items: TakeawayDef[] }) {
  return (
    <div className="embed-takeaway">
      {items.map((it, i) => (
        <React.Fragment key={i}>
          {i > 0 ? <div className="et-arrow">→</div> : null}
          <div className="et-item">
            <div className="et-icon">{it.icon}</div>
            <div className="et-title">{it.title}</div>
            <div className="et-desc">{it.desc}</div>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}
