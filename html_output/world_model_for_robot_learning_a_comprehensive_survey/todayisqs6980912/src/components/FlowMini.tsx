import React from 'react';

// Chapter progress mini-strip reused from the reference template. `revealed` is the
// number of chapters currently shown; the matching step is "active", earlier ones "done".
export function FlowMini({ total, revealed }: { total: number; revealed: number }) {
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
              §{n}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}
