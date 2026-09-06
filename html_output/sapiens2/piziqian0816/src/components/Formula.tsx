import React, { useMemo } from 'react';
import katex from 'katex';
import type { FormulaDef } from '../types';

export function Formula({ formula }: { formula: FormulaDef }) {
  const rendered = useMemo(() => {
    if (!formula.latex) return null;
    return katex.renderToString(formula.latex, {
      displayMode: true,
      throwOnError: false,
      strict: 'warn',
    });
  }, [formula.latex]);

  return (
    <section className="formula-explain presentation-formula" aria-label="核心公式">
      <div className="fe-lead">{formula.lead}</div>
      {rendered ? (
        <div className="fe-formula" dangerouslySetInnerHTML={{ __html: rendered }} />
      ) : (
        <div className="fe-formula">{formula.unicode}</div>
      )}
      <div className="formula-symbols">
        {formula.symbols.map((symbol) => <span key={symbol.sym}><b>{symbol.sym}</b>：{symbol.desc}</span>)}
      </div>
    </section>
  );
}
