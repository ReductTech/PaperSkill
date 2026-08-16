import React from 'react';
import type { Takeaway as TakeawayDef } from '../types';

// Compact numbered conclusions. Items are parallel claims, so no directional arrows.
export function Takeaway({ items }: { items: TakeawayDef[] }) {
  return (
    <div className="embed-takeaway">
      {items.map((it, i) => (
        <div className="et-item" key={i}>
          <div className="et-index">{String(i + 1).padStart(2, '0')}</div>
          <div className="et-title">{it.title}</div>
          <div className="et-desc">{it.desc}</div>
        </div>
      ))}
    </div>
  );
}
