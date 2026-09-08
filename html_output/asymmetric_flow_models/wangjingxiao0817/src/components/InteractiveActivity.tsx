import React from 'react';

type InteractiveActivityProps = {
  instruction: React.ReactNode;
  observation?: React.ReactNode;
  observationKey?: string;
  controls?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
};

/** Shared interaction shell. Keep visible text minimal: one instruction, one result. */
export function InteractiveActivity({
  instruction,
  observation,
  observationKey,
  controls,
  className = '',
  children,
}: InteractiveActivityProps) {
  return (
    <section className={`af-activity ${className}`.trim()}>
      <header className="af-activity-head">
        <div className="af-activity-copy">
          <span className="af-activity-kicker">动手操作</span>
          <p>{instruction}</p>
        </div>
        {controls ? <div className="af-activity-controls">{controls}</div> : null}
      </header>
      <div className="af-activity-stage">{children}</div>
      {observation ? (
        <div className="af-observation" role="status" aria-live="polite">
          <p key={observationKey}>{observation}</p>
        </div>
      ) : null}
    </section>
  );
}
