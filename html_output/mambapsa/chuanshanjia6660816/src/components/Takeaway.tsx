import React from 'react';
import type { Takeaway as TakeawayDef } from '../types';

// Chapter takeaway, three items, numbered instead of emoji.
export function Takeaway({ items }: { items: TakeawayDef[] }) {
  return (
    <div className="embed-takeaway">
      {items.map((it, i) => (
        <div className="et-item" key={i}>
          <div className="et-icon">{String(i + 1).padStart(2, '0')}</div>
          <div className="et-title">{it.title}</div>
          <div className="et-desc">{it.desc}</div>
        </div>
      ))}
    </div>
  );
}
