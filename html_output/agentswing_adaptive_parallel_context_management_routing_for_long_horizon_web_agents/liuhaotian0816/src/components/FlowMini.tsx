import React from 'react';

// Chapter progress mini-strip reused from the reference template. `revealed` is the
// number of chapters currently shown; the matching step is "active", earlier ones "done".
export function FlowMini({ total, revealed }: { total: number; revealed: number }) {
  return (
    <div className="flow-mini" aria-label={`已展开 ${revealed} / ${total} 章`}>
      {Array.from({ length: total }).map((_, i) => {
        const n = i + 1;
        const cls =
          n < revealed ? 'flow-step done' : n === revealed ? 'flow-step active' : 'flow-step';
        return (
          <div className={cls} data-step={n} key={n} title={`第 ${n} 章`}>
            {n}
          </div>
        );
      })}
    </div>
  );
}
