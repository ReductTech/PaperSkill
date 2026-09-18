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

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Wrap each symbol occurrence in the formula HTML with a clickable span.
 * - Split the HTML into tags vs text so we never touch inside tags/attributes.
 * - Use one combined regex (longest symbols first) so multi-char symbols win over
 *   their single-char substrings, and the replacement is a single non-overlapping pass.
 */
function makeClickableFormula(html: string, symbols: { sym: string }[]): string {
  if (!symbols.length) return html;
  const tokens = html.split(/(<[^>]+>)/g);
  const sorted = [...symbols].sort((a, b) => b.sym.length - a.sym.length);
  const symSet = new Set(symbols.map((s) => s.sym));
  const result: string[] = [];
  let i = 0;

  while (i < tokens.length) {
    // Pattern: text + <sub> + text + </sub>  -> wrap the whole "X<sub>Y</sub>" if Y is a symbol
    if (
      i + 3 < tokens.length &&
      !tokens[i].startsWith('<') &&
      tokens[i + 1] === '<sub>' &&
      !tokens[i + 2].startsWith('<') &&
      tokens[i + 3] === '</sub>'
    ) {
      const prefix = tokens[i];
      const subText = tokens[i + 2];
      // Check if the subscript text matches a symbol
      if (symSet.has(subText)) {
        // Find the last alphanumeric/Latin/Greek char in prefix as the symbol base
        const m = prefix.match(/([A-Za-z\u00C0-\u024F\u0370-\u03FF]+)$/);
        const base = m ? m[1] : '';
        const before = prefix.slice(0, prefix.length - base.length);
        const fullSym = `${base}<sub>${subText}</sub>`;
        const safe = escapeHtmlAttr(subText);
        if (before) result.push(before);
        result.push(`<span class="sym fe-formula-sym" data-sym="${safe}">${fullSym}</span>`);
        i += 4;
        continue;
      }
    }

    // Regular text token: replace plain symbols
    if (!tokens[i].startsWith('<')) {
      const pattern = sorted.map((s) => escapeRegExp(s.sym)).join('|');
      if (pattern) {
        const re = new RegExp(`(${pattern})`, 'g');
        result.push(
          tokens[i].replace(re, (m) => {
            const safe = escapeHtmlAttr(m);
            return `<span class="sym fe-formula-sym" data-sym="${safe}">${m}</span>`;
          })
        );
      } else {
        result.push(tokens[i]);
      }
    } else {
      result.push(tokens[i]);
    }
    i++;
  }

  return result.join('');
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
          <span className="fe-explain-sym" dangerouslySetInnerHTML={{ __html: activeSym.display || activeSym.sym }} />
          <span
            className="fe-explain-desc"
            dangerouslySetInnerHTML={{ __html: activeSym.desc }}
          />
        </div>
      ) : null}
    </div>
  );
}
