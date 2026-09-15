import React from 'react';
import type { ProcessStepDef } from '../types';

export function ProcessGuide({ steps }: { steps?: ProcessStepDef[] }) {
  if (!steps?.length) return null;
  return (
    <div className="process-guide" aria-label="阅读流程">
      <div className="process-title">先按这条逻辑读图</div>
      <div className="process-steps">
        {steps.map((step, index) => (
          <React.Fragment key={`${index}-${step.title}`}>
            {index ? <div className="process-arrow" aria-hidden="true">→</div> : null}
            <div className="process-step-card">
              <span>{index + 1}</span>
              <div><strong>{step.title}</strong><p>{step.detail}</p></div>
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
