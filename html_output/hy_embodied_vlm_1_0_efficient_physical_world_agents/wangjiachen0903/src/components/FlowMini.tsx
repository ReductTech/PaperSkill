import React from 'react';

// Chapter progress strip. Each step shows its short title so the learner can
// see the whole narrative arc at a glance.
export function FlowMini({
  total,
  revealed,
  titles,
}: {
  total: number;
  revealed: number;
  titles?: string[];
}) {
  const label = (n: number): string => {
    const t = titles && titles[n - 1] ? titles[n - 1] : '';
    let seg = t.split('：')[1] || t.split(':')[1] || t;
    if (seg.length > 6) seg = seg.slice(0, 5);
    return seg;
  };
  return (
    <div className="flow-mini">
      {Array.from({ length: total }).map((_, i) => {
        const n = i + 1;
        const cls =
          n < revealed ? 'flow-step done' : n === revealed ? 'flow-step active' : 'flow-step';
        return (
          <React.Fragment key={n}>
            {i > 0 ? <span className="flow-arrow">→</span> : null}
            <div className={cls} data-step={n}>
              §{n} <span className="flow-title">{label(n)}</span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}
