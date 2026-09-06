import React, { useState, useMemo } from 'react';
import type { FormulaDef } from '../types';

// Formula block: Unicode formula (no KaTeX) with clickable symbols that reveal meaning.
// Symbols inside the formula itself are made clickable (not just the list below).

const escapeHtmlAttr = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

/**
 * Wrap each symbol occurrence in the formula HTML with a clickable span.
 * Verbatim, longest-first replacement with placeholder protection — handles
 * symbols that themselves contain HTML tags (e.g. "z<sub>M</sub>"), which the
 * old tag/text-split pass could never match. The source formula HTML has no
 * attributes whose text collides with any symbol.
 */
function makeClickableFormula(html: string, symbols: { sym: string }[]): string {
  if (!symbols.length) return html;
  const sorted = [...symbols].sort((a, b) => b.sym.length - a.sym.length);
  const kept: string[] = [];
  let out = html;
  for (const s of sorted) {
    if (!s.sym || !out.includes(s.sym)) continue;
    out = out.split(s.sym).join(`\u0000${kept.length}\u0000`);
    kept.push(s.sym);
  }
  return out.replace(/\u0000(\d+)\u0000/g, (_m, i: string) => {
    const sym = kept[Number(i)];
    return `<span class="sym fe-formula-sym" data-sym="${escapeHtmlAttr(sym)}">${sym}</span>`;
  });
}

export function Formula({ formula }: { formula: FormulaDef }) {
  const [active, setActive] = useState<string | null>(null);

  const formulaHtml = useMemo(
    () => makeClickableFormula(formula.unicode, formula.symbols),
    [formula.unicode, formula.symbols]
  );

  const toggle = (sym: string) => setActive((prev) => (prev === sym ? null : sym));

  const onClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = (e.target as HTMLElement).closest('[data-sym]');
    if (!el) return;
    const sym = el.getAttribute('data-sym');
    if (sym) toggle(sym);
  };

  // Only the symbol actually clicked in the formula reveals its meaning; no
  // duplicate clickable chip list is rendered below the formula.
  const activeSym = formula.symbols.find((s) => s.sym === active) ?? null;

  return (
    <div className="formula-explain" onClick={onClick}>
      <p className="fe-hint">点击公式中的符号查看含义</p>
      <div className="fe-lead" dangerouslySetInnerHTML={{ __html: formula.lead }} />
      <div className="fe-formula" dangerouslySetInnerHTML={{ __html: formulaHtml }} />
      {activeSym ? (
        <div className="fe-explain" key={activeSym.sym}>
          <span className="fe-explain-sym" dangerouslySetInnerHTML={{ __html: activeSym.sym }} />
          <span
            className="fe-explain-desc"
            dangerouslySetInnerHTML={{ __html: activeSym.desc }}
          />
        </div>
      ) : null}
    </div>
  );
}
