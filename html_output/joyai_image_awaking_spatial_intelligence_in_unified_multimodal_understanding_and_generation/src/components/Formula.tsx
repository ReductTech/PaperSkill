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
function makeClickableFormula(html: string, symbols: { sym: string }[], active: string | null): string {
  if (!symbols.length) return html;
  let protectedHtml = html;
  const placeholders: Array<{ token: string; markup: string }> = [];

  // Symbols such as L_SFT are displayed as L<sub>SFT</sub>. Protect and wrap
  // that complete HTML fragment before splitting tags from normal text.
  symbols.forEach((symbol, index) => {
    const match = symbol.sym.match(/^([^_]+)_(.+)$/);
    if (!match) return;
    const [, base, sub] = match;
    const visible = `${base}<sub>${sub}</sub>`;
    if (!protectedHtml.includes(visible)) return;
    const token = `@@FORMULA_SYMBOL_${index}@@`;
    const safe = escapeHtmlAttr(symbol.sym);
    const activeClass = active === symbol.sym ? ' active' : '';
    const markup = `<span class="sym fe-formula-sym${activeClass}" data-sym="${safe}">${visible}</span>`;
    protectedHtml = protectedHtml.split(visible).join(token);
    placeholders.push({ token, markup });
  });

  const tokens = protectedHtml.split(/(<[^>]+>)/g);
  const sorted = [...symbols].filter((symbol) => !symbol.sym.includes('_')).sort((a, b) => b.sym.length - a.sym.length);
  const pattern = sorted.map((s) => escapeRegExp(s.sym)).join('|');
  const re = pattern ? new RegExp(`(${pattern})`, 'g') : null;
  let result = tokens
    .map((tok) => {
      if (tok.startsWith('<') || !re) return tok;
      return tok.replace(re, (m) => {
        const safe = escapeHtmlAttr(m);
        const activeClass = active === m ? ' active' : '';
        return `<span class="sym fe-formula-sym${activeClass}" data-sym="${safe}">${m}</span>`;
      });
    })
    .join('');
  placeholders.forEach(({ token, markup }) => { result = result.split(token).join(markup); });
  return result;
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
