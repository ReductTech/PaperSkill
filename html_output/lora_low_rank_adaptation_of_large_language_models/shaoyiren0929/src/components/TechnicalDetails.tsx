import React from 'react';
import type { FormulaDef, Takeaway } from '../types';
import { Formula } from './Formula';

export function TechnicalDetails({
  formula,
  details,
}: {
  formula?: FormulaDef;
  details: Takeaway[];
}) {
  if (!formula && details.length === 0) return null;

  return (
    <details className="technical-details">
      <summary>
        <span className="technical-details-icon" aria-hidden="true">⚙</span>
        <span>
          <strong>技术细节</strong>
          <small>公式、符号与实现要点</small>
        </span>
        <span className="technical-details-chevron" aria-hidden="true">⌄</span>
      </summary>
      <div className="technical-details-body">
        {formula ? <Formula formula={formula} /> : null}
        {details.length > 0 ? (
          <div className="technical-details-list">
            {details.map((item) => (
              <div className="technical-detail-row" key={item.title}>
                <span className="technical-detail-icon" aria-hidden="true">{item.icon}</span>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </details>
  );
}
