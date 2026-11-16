import React, { useMemo } from 'react';
import { SymbolGlossary } from './SymbolHint';
import type { FormulaDef } from '../types';

// Unicode/HTML formula with hover, focus and touch symbol explanations.

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
function makeClickableFormula(html: string, symbols: { sym: string; desc: string }[]): string {
  if (!symbols.length) return html;
  const tokens = html.split(/(<[^>]+>|&(?:#\d+|#x[\da-f]+|\w+);)/gi);
  const sorted = [...symbols].sort((a, b) => b.sym.length - a.sym.length);
  const pattern = sorted.map((s) => escapeRegExp(s.sym)).join('|');
  if (!pattern) return html;
  const re = new RegExp(`(${pattern})`, 'g');
  return tokens
    .map((tok) => {
      if (tok.startsWith('<') || /^&(?:#\d+|#x[\da-f]+|\w+);$/i.test(tok)) return tok;
      return tok.replace(re, (m, _capture, offset: number) => {
        if ((/^[a-z]/i.test(m) && /[a-z]/i.test(tok[offset - 1] ?? '')) ||
            (/[a-z]$/i.test(m) && /[a-z]/i.test(tok[offset + m.length] ?? ''))) return m;
        const safe = escapeHtmlAttr(m);
        const meaning = escapeHtmlAttr(symbols.find(s => s.sym === m)!.desc.replace(/<[^>]*>/g, ''));
        return `<span class="formula-symbol" tabindex="0" role="button" aria-label="${meaning}" data-formula-symbol="${safe}" data-formula-meaning="${meaning}">${m}</span>`;
      });
    })
    .join('');
}

export function Formula({ formula }: { formula: FormulaDef }) {
  const formulaHtml = useMemo(
    () => makeClickableFormula(formula.unicode, formula.symbols),
    [formula.unicode, formula.symbols]
  );
  return <div className="formula-explain">
    <div className="fe-lead" dangerouslySetInnerHTML={{ __html: formula.lead }} />
    <div className="fe-formula"><SymbolGlossary>
      <span dangerouslySetInnerHTML={{ __html: formulaHtml }} />
    </SymbolGlossary></div>
  </div>;
}
