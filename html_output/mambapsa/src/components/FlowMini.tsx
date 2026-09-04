import React from 'react';

// Chapter progress mini-strip reused from the reference template. `revealed` is the
// number of chapters currently shown; the matching step is "active", earlier ones "done".
// Clicking a revealed step scrolls to that chapter; unrevealed steps are locked.
export function FlowMini({ total, revealed }: { total: number; revealed: number }) {
  const jump = (n: number) => {
    if (n > revealed) return;
    document.getElementById(`chap-${n}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="flow-mini">
      {Array.from({ length: total }).map((_, i) => {
        const n = i + 1;
        const locked = n > revealed;
        const cls = locked
          ? 'flow-step locked'
          : n < revealed
            ? 'flow-step done'
            : 'flow-step active';
        return (
          <React.Fragment key={n}>
            {i > 0 ? <span className="flow-arrow">→</span> : null}
            <div
              className={cls}
              data-step={n}
              title={locked ? `第 ${n} 章尚未解锁` : `跳转到第 ${n} 章`}
              onClick={() => jump(n)}
            >
              §{n}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}
