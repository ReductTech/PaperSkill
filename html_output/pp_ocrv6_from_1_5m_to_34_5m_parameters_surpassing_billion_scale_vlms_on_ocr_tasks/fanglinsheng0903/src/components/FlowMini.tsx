import React from 'react';

interface FlowMiniProps {
  total: number;
  current: number;
  revealed: number;
  labels: string[];
  onNavigate: (chapter: number) => void;
}

export function FlowMini({ total, current, revealed, labels, onNavigate }: FlowMiniProps) {
  return (
    <nav className="flow-mini" aria-label={`第 ${current} 章课程进度`}>
      {Array.from({ length: total }).map((_, i) => {
        const n = i + 1;
        const isLocked = n > revealed;
        const cls = n === current
          ? 'flow-step active'
          : n < current
            ? 'flow-step done'
            : n <= revealed
              ? 'flow-step available'
              : 'flow-step';
        return (
          <React.Fragment key={n}>
            {i > 0 ? <span className="flow-arrow" aria-hidden="true">→</span> : null}
            <button
              type="button"
              className={cls}
              data-step={n}
              disabled={isLocked}
              aria-current={n === current ? 'step' : undefined}
              aria-label={isLocked ? `第 ${n} 章 ${labels[i]}，尚未解锁` : `前往第 ${n} 章 ${labels[i]}`}
              onClick={() => onNavigate(n)}
            >
              <span className="flow-step-index">§{n}</span>
              <span className="flow-step-label">{labels[i]}</span>
            </button>
          </React.Fragment>
        );
      })}
    </nav>
  );
}
