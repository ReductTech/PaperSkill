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
 * Convert LaTeX-style ^{...} and _{...} to HTML <sup> and <sub> tags.
 * Handles both braced (^{xy}, _{xy}) and single-char (^x, _x) forms.
 * Handles nested braces recursively (e.g. k_{s_i}).
 * Protects existing HTML tags so attributes like data-sym="x_p" are not mangled.
 */
function parseLatexStyle(text: string): string {
  // Step 1: protect existing HTML tags with placeholders
  const tags: string[] = [];
  let protectedText = text.replace(/<[^>]+>/g, (m) => {
    tags.push(m);
    return `\u0000${tags.length - 1}\u0000`;
  });

  // Step 2: parse LaTeX in the protected text only
  let result = protectedText;
  let prev = '';
  while (prev !== result) {
    prev = result;
    result = result
      // Braced forms: ^{...} and _{...}
      .replace(/\^\{([^{}]*)\}/g, '<sup>$1</sup>')
      .replace(/_\{([^{}]*)\}/g, '<sub>$1</sub>')
      // Single-char forms: ^x and _x (any single non-special char, incl. Greek)
      .replace(/\^([^\s{}_^])/g, '<sup>$1</sup>')
      .replace(/_([^\s{}_^])/g, '<sub>$1</sub>');
  }

  // Step 3: restore HTML tags
  result = result.replace(/\u0000(\d+)\u0000/g, (_, i) => tags[parseInt(i)]);

  return result;
}

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
  const pattern = sorted.map((s) => escapeRegExp(s.sym)).join('|');
  if (!pattern) return html;
  const re = new RegExp(`(${pattern})`, 'g');
  return tokens
    .map((tok) => {
      if (tok.startsWith('<')) return tok;
      return tok.replace(re, (m) => {
        const safe = escapeHtmlAttr(m);
        return `<span class="sym fe-formula-sym" data-sym="${safe}">${m}</span>`;
      });
    })
    .join('');
}

export function Formula({ formula }: { formula: FormulaDef }) {
  const [active, setActive] = useState<string | null>(null);

  const formulaHtml = useMemo(() => {
    // First make symbols clickable (wraps them in <span data-sym="...">)
    const withSymbols = makeClickableFormula(formula.unicode, formula.symbols);
    // Then parse LaTeX superscripts/subscripts (HTML tags are protected)
    return parseLatexStyle(withSymbols);
  }, [formula.unicode, formula.symbols]);

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
