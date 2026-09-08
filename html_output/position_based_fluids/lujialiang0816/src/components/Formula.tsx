import React, { useMemo, useState } from 'react';
import katex from 'katex';
import type { FormulaDef } from '../types';

export function Formula({ formula }: { formula: FormulaDef }) {
  const [active, setActive] = useState<string | null>(null);
  const formulaHtml = useMemo(
    () => formula.latex
      ? katex.renderToString(formula.latex, { displayMode: true, throwOnError: false, strict: 'ignore' })
      : formula.unicode,
    [formula.latex, formula.unicode]
  );
  const activeSym = formula.symbols.find((s) => s.sym === active) ?? null;

  return (
    <div className="formula-explain">
      {formula.symbols.length > 0 ? <p className="fe-hint">点击下方符号查看含义</p> : null}
      <div className="fe-lead">{formula.lead}</div>
      <div className="fe-formula" dangerouslySetInnerHTML={{ __html: formulaHtml }} />
      {formula.symbols.length > 0 ? (
        <div className="fe-symbols" role="group" aria-label="公式符号说明">
          {formula.symbols.map((symbol) => (
            <button
              key={symbol.sym}
              type="button"
              className={active === symbol.sym ? 'active' : ''}
              onClick={() => setActive((prev) => prev === symbol.sym ? null : symbol.sym)}
            >
              <span dangerouslySetInnerHTML={{ __html: katex.renderToString(symbol.latex ?? symbol.sym, { throwOnError: false, strict: 'ignore' }) }} />
            </button>
          ))}
        </div>
      ) : null}
      {activeSym ? (
        <div className="fe-explain" key={activeSym.sym}>
          <span className="fe-explain-sym">{activeSym.sym}</span>
          <span
            className="fe-explain-desc"
            dangerouslySetInnerHTML={{ __html: activeSym.desc }}
          />
        </div>
      ) : null}
    </div>
  );
}
