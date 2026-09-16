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
  const sorted = [...symbols].sort((a, b) => b.sym.length - a.sym.length);
  const richSymbols = sorted.filter(({ sym }) => sym.includes('<'));
  const plainSymbols = sorted.filter(({ sym }) => !sym.includes('<'));
  const placeholders = richSymbols.map((symbol, index) => ({
    marker: `\uE000${index}\uE001`,
    symbol,
  }));

  let prepared = html;
  placeholders.forEach(({ marker, symbol }) => {
    prepared = prepared.split(symbol.sym).join(marker);
  });

  const pattern = plainSymbols.map(({ sym }) => escapeRegExp(sym)).join('|');
  const re = pattern ? new RegExp(`(${pattern})`, 'g') : null;
  let result = prepared
    .split(/(<[^>]+>)/g)
    .map((tok) => {
      if (tok.startsWith('<') || !re) return tok;
      return tok.replace(re, (match) => {
        const safe = escapeHtmlAttr(match);
        return `<span class="sym fe-formula-sym" data-sym="${safe}" role="button" tabindex="0">${match}</span>`;
      });
    })
    .join('');

  placeholders.forEach(({ marker, symbol }) => {
    const safe = escapeHtmlAttr(symbol.sym);
    result = result.split(marker).join(
      `<span class="sym fe-formula-sym" data-sym="${safe}" role="button" tabindex="0">${symbol.sym}</span>`
    );
  });

  return result;
}

export function Formula({ formula }: { formula: FormulaDef }) {
  const [active, setActive] = useState<string | null>(null);

  const formulaHtml = useMemo(
    () => makeClickableFormula(formula.unicode, formula.symbols),
    [formula.unicode, formula.symbols]
  );

  const toggle = (sym: string) => setActive((prev) => (prev === sym ? null : sym));

  const getSymbol = (target: EventTarget | null) => {
    if (!(target instanceof Element)) return null;
    return target.closest<HTMLElement>('[data-sym]')?.getAttribute('data-sym') ?? null;
  };

  const onClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const sym = getSymbol(e.target);
    if (sym) toggle(sym);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const sym = getSymbol(e.target);
    if (!sym) return;
    e.preventDefault();
    toggle(sym);
  };

  // Only the symbol actually clicked in the formula reveals its meaning; no
  // duplicate clickable chip list is rendered below the formula.
  const activeSym = formula.symbols.find((s) => s.sym === active) ?? null;

  return (
    <div className="formula-explain" onClick={onClick} onKeyDown={onKeyDown}>
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
