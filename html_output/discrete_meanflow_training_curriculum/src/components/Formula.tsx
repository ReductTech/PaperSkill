import React, { useState } from 'react';
import type { FormulaDef } from '../types';

export function Formula({ formula }: { formula: FormulaDef }) {
  const [active, setActive] = useState<string | null>(null);
  const activeSym = formula.symbols.find((item) => item.sym === active);

  const selectFromMath = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = (event.target as HTMLElement).closest<HTMLElement>('[data-sym]');
    const sym = target?.dataset.sym;
    if (sym && formula.symbols.some((item) => item.sym === sym)) setActive((v) => v === sym ? null : sym);
  };

  return (
    <div className="formula-explain">
      <div className="fe-lead" dangerouslySetInnerHTML={{ __html: formula.lead }} />
      {formula.mathml ? (
        <div className="fe-formula mathml-formula" role="math" tabIndex={0} aria-label={`公式：${formula.unicode}`} onClick={selectFromMath} dangerouslySetInnerHTML={{ __html: formula.mathml }} />
      ) : (
        <div className="fe-formula formula-fallback" role="math" aria-label={`公式：${formula.unicode}`}>{formula.unicode}</div>
      )}
      <div className="formula-symbols" aria-label="公式符号解释">
        {formula.symbols.map((item) => (
          <button key={item.sym} className={`sym ${active === item.sym ? 'selected' : ''}`} aria-pressed={active === item.sym} onClick={() => setActive((v) => v === item.sym ? null : item.sym)}>{item.sym}</button>
        ))}
      </div>
      {activeSym ? (
        <div className="fe-explain" aria-live="polite"><span className="fe-explain-sym">{activeSym.sym}</span><span className="fe-explain-desc">{activeSym.desc}</span></div>
      ) : <p className="fe-hint">点击公式中的彩色符号，或选择下方符号查看含义</p>}
      <noscript><div className="formula-fallback">{formula.unicode}</div></noscript>
    </div>
  );
}
