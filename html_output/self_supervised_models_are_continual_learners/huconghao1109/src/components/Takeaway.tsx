import type { Takeaway as TakeawayDef } from '../types';

// Three parallel takeaways at the end of each chapter. The three points are not a
// sequence, so no arrows; a plain index carries the ordering without pretending
// to be an icon.
export function Takeaway({ items }: { items: TakeawayDef[] }) {
  return (
    <div className="embed-takeaway">
      {items.map((it, i) => (
        <div className="et-item" key={i}>
          <span className="et-index">{String(i + 1).padStart(2, '0')}</span>
          <div className="et-title">{it.title}</div>
          <div className="et-desc">{it.desc}</div>
        </div>
      ))}
    </div>
  );
}
