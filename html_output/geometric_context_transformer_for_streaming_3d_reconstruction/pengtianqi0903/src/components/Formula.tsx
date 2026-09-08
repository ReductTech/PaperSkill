import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { FormulaDef, SymbolDef } from '../types';

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
 * Wrap each symbol occurrence in the formula HTML with a native button.
 * - Protect explicit HTML tokens first so a variable such as N<sub>GCA</sub>
 *   becomes one target and its inner text cannot be wrapped a second time.
 * - Split the remaining HTML into tags vs text so we never touch attributes.
 * - Use one combined regex (longest symbols first) so multi-char symbols win over
 *   their single-char substrings, and the replacement is a single non-overlapping pass.
 */
function makeClickableFormula(html: string, symbols: SymbolDef[]): string {
  if (!symbols.length) return html;

  const protectedTokens: { placeholder: string; wrapped: string }[] = [];
  let protectedHtml = html;

  const htmlSymbols = symbols
    .filter((symbol): symbol is SymbolDef & { html: string } => Boolean(symbol.html))
    .sort((a, b) => b.html.length - a.html.length);

  htmlSymbols.forEach((symbol) => {
    if (!protectedHtml.includes(symbol.html)) return;

    const placeholder = `<span data-fe-formula-placeholder="${protectedTokens.length}"></span>`;
    const safeSym = escapeHtmlAttr(symbol.sym);
    const wrapped = `<button type="button" class="sym fe-formula-sym" data-sym="${safeSym}" aria-pressed="false">${symbol.html}</button>`;

    protectedHtml = protectedHtml.split(symbol.html).join(placeholder);
    protectedTokens.push({ placeholder, wrapped });
  });

  const uniqueSymbols = [...new Set(symbols.map((symbol) => symbol.sym).filter(Boolean))];
  const pattern = uniqueSymbols
    .sort((a, b) => b.length - a.length)
    .map(escapeRegExp)
    .join('|');

  if (!pattern) {
    return protectedTokens.reduce(
      (result, token) => result.split(token.placeholder).join(token.wrapped),
      protectedHtml
    );
  }

  const tokens = protectedHtml.split(/(<[^>]+>)/g);
  const re = new RegExp(`(${pattern})`, 'g');
  const clickableHtml = tokens
    .map((tok) => {
      if (tok.startsWith('<')) return tok;
      return tok.replace(re, (m) => {
        const safe = escapeHtmlAttr(m);
        return `<button type="button" class="sym fe-formula-sym" data-sym="${safe}" aria-pressed="false">${safe}</button>`;
      });
    })
    .join('');

  return protectedTokens.reduce(
    (result, token) => result.split(token.placeholder).join(token.wrapped),
    clickableHtml
  );
}

export function Formula({ formula }: { formula: FormulaDef }) {
  const [active, setActive] = useState<string | null>(null);
  const formulaRef = useRef<HTMLDivElement>(null);

  const formulaHtml = useMemo(
    () => makeClickableFormula(formula.unicode, formula.symbols),
    [formula.unicode, formula.symbols]
  );

  // Keep the generated native buttons mounted while the selected symbol changes.
  // Replacing innerHTML on every activation would discard keyboard focus.
  const formulaMarkup = useMemo(
    () => (
      <div
        ref={formulaRef}
        className="fe-formula"
        role="group"
        aria-label="可交互公式，按 Tab 选择完整变量并按 Enter 或空格查看含义"
        dangerouslySetInnerHTML={{ __html: formulaHtml }}
      />
    ),
    [formulaHtml]
  );

  useEffect(() => {
    formulaRef.current?.querySelectorAll<HTMLButtonElement>('[data-sym]').forEach((button) => {
      const selected = button.dataset.sym === active;
      button.classList.toggle('active', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
  }, [active, formulaHtml]);

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
      <div className="content-eyebrow formula-eyebrow">{formula.label}</div>
      <p className="fe-hint">点击公式中的完整变量查看含义</p>
      <div className="fe-lead" dangerouslySetInnerHTML={{ __html: formula.lead }} />
      {formulaMarkup}
      {activeSym ? (
        <div className="fe-explain" key={activeSym.sym} role="status" aria-live="polite" aria-atomic="true">
          <span
            className="fe-explain-sym"
            dangerouslySetInnerHTML={{ __html: activeSym.html ?? activeSym.sym }}
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
