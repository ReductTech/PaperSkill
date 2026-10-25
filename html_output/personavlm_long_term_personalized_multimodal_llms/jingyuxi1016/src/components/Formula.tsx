import React, { useState, useMemo, useEffect, useId, useRef } from 'react';
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
 * Wrap each symbol occurrence in the formula HTML with a keyboard-accessible button.
 * - Split the HTML into tags vs text so we never touch inside tags/attributes.
 * - Use one combined regex (longest symbols first) so multi-char symbols win over
 *   their single-char substrings, and the replacement is a single non-overlapping pass.
 */
function makeClickableFormula(html: string, symbols: { sym: string }[], explanationId: string): string {
  if (!symbols.length) return html;
  const tokens = html.split(/(<[^>]+>)/g);
  const sorted = [...symbols].sort((a, b) => b.sym.length - a.sym.length);
  const pattern = sorted.map((s) => escapeRegExp(s.sym)).join('|');
  if (!pattern) return html;
  const re = new RegExp(`(${pattern})`, 'g');
  return tokens
    .map((tok) => {
      if (tok.startsWith('<')) return tok;
      return tok.replace(re, (m, _group, offset: number) => {
        // A variable named m must not turn the m inside min into a control.
        if (/^[A-Za-z][A-Za-z0-9_]*$/.test(m) && (/[A-Za-z0-9_]/.test(tok[offset - 1] || '') || /[A-Za-z0-9_]/.test(tok[offset + m.length] || ''))) return m;
        const safe = escapeHtmlAttr(m);
        return `<button type="button" class="sym fe-formula-sym" data-sym="${safe}" aria-label="解释符号 ${safe}" aria-expanded="false" aria-controls="${escapeHtmlAttr(explanationId)}">${m}</button>`;
      });
    })
    .join('');
}

export function Formula({ formula }: { formula: FormulaDef }) {
  const [active, setActive] = useState<string | null>(null);
  const container = useRef<HTMLDivElement>(null);
  const explanationId = useId();

  const formulaHtml = useMemo(
    () => makeClickableFormula(formula.unicode, formula.symbols, explanationId),
    [formula.unicode, formula.symbols, explanationId]
  );

  useEffect(() => {
    container.current?.querySelectorAll<HTMLElement>('[data-sym]').forEach(el => {
      const selected = el.dataset.sym === active;
      el.setAttribute('aria-expanded', String(selected));
      el.classList.toggle('active', selected);
    });
  }, [active]);

  const toggle = (sym: string) => setActive((prev) => (prev === sym ? null : sym));

  const onClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = (e.target as HTMLElement).closest('[data-sym]');
    if (!el) return;
    const sym = el.getAttribute('data-sym');
    if (sym) toggle(sym);
  };

  const activeSym = formula.symbols.find((s) => s.sym === active) ?? null;
  const extraTerms = formula.symbols.filter(s => !formula.unicode.includes(s.sym));

  return (
    <div className="formula-explain" onClick={onClick} ref={container}>
      <p className="fe-hint">点击符号查看含义；键盘可用 Tab、Enter / Space</p>
      <div className="fe-lead" dangerouslySetInnerHTML={{ __html: formula.lead }} />
      <div className="fe-formula" dangerouslySetInnerHTML={{ __html: formulaHtml }} />
      {extraTerms.length > 0 && <div className="fe-extra-terms">{extraTerms.map(term => <button type="button" className="chip" key={term.sym} data-sym={term.sym} aria-expanded={active === term.sym} aria-controls={explanationId}>{term.sym} 是什么？</button>)}</div>}
      <div id={explanationId} aria-live="polite">{activeSym ? (
        <div className="fe-explain" key={activeSym.sym}>
          <span className="fe-explain-sym">{activeSym.sym}</span>
          <span
            className="fe-explain-desc"
            dangerouslySetInnerHTML={{ __html: activeSym.desc }}
          />
        </div>
      ) : null}</div>
    </div>
  );
}
