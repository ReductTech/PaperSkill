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
 * Symbols are matched against the RAW html (they may contain <sub>/<sup> tags), so the
 * scan walks the string: tag chunks are copied verbatim, and at every non-tag position
 * the longest matching symbol (already sorted) is wrapped in one pass.
 */
function makeClickableFormula(
  html: string,
  symbols: { sym: string }[],
  active: string | null
): string {
  const list = symbols
    .map((s) => s.sym)
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);
  if (!list.length) return html;

  let out = '';
  let i = 0;
  while (i < html.length) {
    if (html[i] === '<') {
      const end = html.indexOf('>', i);
      if (end === -1) {
        out += html.slice(i);
        break;
      }
      out += html.slice(i, end + 1);
      i = end + 1;
      continue;
    }
    const hit = list.find((s) => html.startsWith(s, i));
    if (hit) {
      const cls = hit === active ? 'sym fe-formula-sym active' : 'sym fe-formula-sym';
      out += `<span class="${cls}" data-sym="${escapeHtmlAttr(hit)}">${hit}</span>`;
      i += hit.length;
    } else {
      out += html[i];
      i += 1;
    }
  }
  return out;
}

export function Formula({ formula }: { formula: FormulaDef }) {
  const [active, setActive] = useState<string | null>(null);

  const formulaHtml = useMemo(
    () => makeClickableFormula(formula.unicode, formula.symbols, active),
    [formula.unicode, formula.symbols, active]
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
          <span
            className="fe-explain-sym"
            dangerouslySetInnerHTML={{ __html: activeSym.sym }}
          />
          <span
            className="fe-explain-desc"
            dangerouslySetInnerHTML={{ __html: activeSym.desc }}
          />
        </div>
      ) : null}
    </div>
  );
}
