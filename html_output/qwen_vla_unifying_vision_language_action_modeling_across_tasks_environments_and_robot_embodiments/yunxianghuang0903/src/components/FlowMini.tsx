import React from 'react';

// Chapter progress mini-strip.
// `revealed` = how many chapters have been unlocked; `current` = the chapter owning this strip.
export function FlowMini({ total, revealed, current }: { total: number; revealed: number; current: number }) {
  return (
    <div className="flow-mini" aria-label={`当前第 ${current} 节，共 ${total} 节`}>
      {Array.from({ length: total }).map((_, i) => {
        const n = i + 1;
        const unlocked = n <= revealed;
        const cls = n === current ? 'flow-step active' : unlocked ? 'flow-step done' : 'flow-step';
        return (
          <React.Fragment key={n}>
            {i > 0 ? <span className="flow-arrow">→</span> : null}
            <div className={cls} data-step={n} aria-current={n === current ? 'step' : undefined}>
              §{n}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}
