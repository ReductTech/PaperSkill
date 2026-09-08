import React from 'react';

export function FlowMini({
  labels,
  activeIndex = 0,
}: {
  labels: string[];
  activeIndex?: number;
}) {
  return (
    <div className="flow-mini reveal-on-scroll">
      {labels.map((label, i) => {
        const cls = i < activeIndex ? 'flow-step done' : i === activeIndex ? 'flow-step active' : 'flow-step';
        return (
          <React.Fragment key={label}>
            {i > 0 ? <span className="flow-arrow">→</span> : null}
            <div className={cls}>{label}</div>
          </React.Fragment>
        );
      })}
    </div>
  );
}
