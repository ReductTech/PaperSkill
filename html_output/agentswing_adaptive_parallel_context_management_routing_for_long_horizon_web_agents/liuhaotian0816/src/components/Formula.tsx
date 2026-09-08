import React, { useState } from 'react';
import type { FormulaDef } from '../types';

// Formula block: HTML/Unicode formula (no KaTeX) with separate clickable symbol chips.

export function Formula({ formula }: { formula: FormulaDef }) {
  const [active, setActive] = useState<string | null>(null);

  const toggle = (sym: string) => setActive((prev) => (prev === sym ? null : sym));

  const activeSym = formula.symbols.find((s) => s.sym === active) ?? null;

  return (
    <div className="formula-explain">
      <p className="fe-hint">点下面的符号，看它在公式里指什么</p>
      <div className="fe-lead" dangerouslySetInnerHTML={{ __html: formula.lead }} />
      <div className="fe-formula" dangerouslySetInnerHTML={{ __html: formula.unicode }} />
      <div className="fe-symbol-row">
        {formula.symbols.map((s) => (
          <button
            type="button"
            key={s.sym}
            className={`sym ${active === s.sym ? 'active' : ''}`}
            onClick={() => toggle(s.sym)}
          >
            {s.sym}
          </button>
        ))}
      </div>
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
