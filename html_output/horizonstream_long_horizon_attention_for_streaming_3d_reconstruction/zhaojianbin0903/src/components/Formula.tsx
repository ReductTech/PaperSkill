import React from 'react';
import type { FormulaDef } from '../types';

// A report-ready relationship panel. Definitions stay visible so the audience
// never has to discover the meaning of a symbol by clicking it.
export function Formula({ formula }: { formula: FormulaDef }) {
  return (
    <div className="formula-explain">
      <div className="fe-lead">{formula.lead}</div>
      <div className="fe-content">
        <div className="fe-formula" dangerouslySetInnerHTML={{ __html: formula.unicode }} />
        <div className="fe-definitions">
          {formula.symbols.map((item) => (
            <div className="fe-definition" key={item.sym}>
              <span className="fe-definition-sym">{item.sym}</span>
              <span className="fe-definition-desc">{item.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
