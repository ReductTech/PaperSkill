import React, { useState, useMemo } from 'react';
import type { FormulaDef } from '../types';

// Lightweight mathematical typesetting without an external runtime. The source uses
// familiar A_{l,i}/L_BCE notation; convert it to semantic HTML sub/sup elements.

const escapeHtml = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

function formatMath(source: string): string {
  return escapeHtml(source)
    .replace(/_\{([^{}]+)\}/g, '<sub>$1</sub>')
    .replace(/_([A-Za-z0-9]+)/g, '<sub>$1</sub>')
    .replace(/\^\{([^{}]+)\}/g, '<sup>$1</sup>')
    .replace(/\^([A-Za-z0-9]+)/g, '<sup>$1</sup>');
}

export function Formula({ formula }: { formula: FormulaDef }) {
  const [active, setActive] = useState<string | null>(null);

  const formulaHtml = useMemo(() => formatMath(formula.unicode), [formula.unicode]);

  const toggle = (sym: string) => setActive((prev) => (prev === sym ? null : sym));

  const activeSym = formula.symbols.find((s) => s.sym === active) ?? null;

  return (
    <div className="formula-explain">
      <p className="fe-hint">公式与符号说明</p>
      <div className="fe-lead" dangerouslySetInnerHTML={{ __html: formula.lead }} />
      <div className="fe-formula" role="math" aria-label={formula.unicode} dangerouslySetInnerHTML={{ __html: formulaHtml }} />
      <div className="fe-symbols" aria-label="公式符号说明">
        {formula.symbols.map((item) => (
          <button
            type="button"
            key={item.sym}
            className={`fe-symbol-btn ${active === item.sym ? 'active' : ''}`}
            aria-pressed={active === item.sym}
            onClick={() => toggle(item.sym)}
            dangerouslySetInnerHTML={{ __html: formatMath(item.sym) }}
          />
        ))}
      </div>
      {activeSym ? (
        <div className="fe-explain" key={activeSym.sym}>
          <span className="fe-explain-sym" dangerouslySetInnerHTML={{ __html: formatMath(activeSym.sym) }} />
          <span
            className="fe-explain-desc"
            dangerouslySetInnerHTML={{ __html: activeSym.desc }}
          />
        </div>
      ) : null}
    </div>
  );
}
