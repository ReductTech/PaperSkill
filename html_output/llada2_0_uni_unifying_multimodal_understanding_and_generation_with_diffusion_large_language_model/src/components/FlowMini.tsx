import React from 'react';

// Chapter-local progress strip. `current` is the chapter that owns this strip;
// it must not be coupled to how many chapters have been progressively revealed.
export function FlowMini({ total, current }: { total: number; current: number }) {
  return (
    <div className="flow-mini">
      {Array.from({ length: total }).map((_, i) => {
        const n = i + 1;
        const cls =
          n < current ? 'flow-step done' : n === current ? 'flow-step active' : 'flow-step';
        return (
          <React.Fragment key={n}>
            {i > 0 ? <span className="flow-arrow">→</span> : null}
            <div className={cls} data-step={n}>
              Step {n}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}
