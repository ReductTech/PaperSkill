import React from 'react';

// Chapter progress mini-strip reused from the reference template. `revealed` is the
// number of chapters currently shown; the matching step is "active", earlier ones "done".
export function FlowMini({ total, revealed }: { total: number; revealed: number }) {
  const firstEnd = total <= 5 ? 2 : 4;
  const secondEnd = total <= 5 ? 4 : 6;
  const stages = [
    { label: '01 看得准', start: 1, end: Math.min(firstEnd, total) },
    { label: '02 想得明白', start: Math.min(firstEnd + 1, total), end: Math.min(secondEnd, total) },
    { label: '03 跑得起来', start: Math.min(secondEnd + 1, total), end: total },
  ].filter(stage => stage.start <= total);
  return (
    <div className="flow-mini pain-progress" aria-label="三阶段学习进度">
      {stages.map((stage, i) => {
        const cls = revealed > stage.end ? 'flow-step done' : revealed >= stage.start ? 'flow-step active' : 'flow-step';
        return (
          <React.Fragment key={stage.label}>
            {i > 0 ? <span className="flow-arrow">→</span> : null}
            <div className={cls}>{stage.label}<small>§{stage.start}–{stage.end}</small></div>
          </React.Fragment>
        );
      })}
    </div>
  );
}
