import React, { useState, useMemo, useId } from 'react';
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
function makeClickableFormula(html: string, symbols: { sym: string }[], id: string): string {
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
        return `<span class="sym fe-formula-sym " data-sym="${safe}" tabindex="0" role="button" aria-label="解释 ${safe}" aria-describedby="${id}">${m}</span>`;
      });
    })
    .join('');
}

export function Formula({ formula }: { formula: FormulaDef }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [focused, setFocused] = useState<string | null>(null);
  const [tapped, setTapped] = useState<string | null>(null);
  const id = useId();
  const active = hovered ?? focused ?? tapped;
  const formulaHtml = useMemo(() => makeClickableFormula(formula.unicode, formula.symbols, id), [formula, id]);
  const symbol = (target: EventTarget) => (target as HTMLElement).closest('[data-sym]')?.getAttribute('data-sym') ?? null;
  const activeSym = formula.symbols.find(s => s.sym === active);
  return <div className="formula-explain" onMouseLeave={() => setHovered(null)}
    onMouseOver={e => {const sym = symbol(e.target); if(sym) setHovered(sym);}}
    onFocus={e => setFocused(symbol(e.target))} onBlur={e => {if(!e.currentTarget.contains(e.relatedTarget)) setFocused(null);}}
    onClick={e => {const sym = symbol(e.target); if(sym) setTapped(v => v === sym ? null : sym);}}
    onKeyDown={e => {if(e.key === 'Escape'){setHovered(null);setFocused(null);setTapped(null);} if(['Enter',' '].includes(e.key)){const sym=symbol(e.target);if(sym){e.preventDefault();setTapped(sym);}}}}>
    <p className="fe-hint">悬停在公式符号上查看解释 · 触屏可点按</p>
    <div className="fe-lead" dangerouslySetInnerHTML={{__html:formula.lead}} />
    <div className="fe-formula" dangerouslySetInnerHTML={{__html:formulaHtml}} />
    <div className="fe-explanation-slot" id={id} role={activeSym ? 'tooltip' : undefined}>
      {activeSym ? <div className="fe-explain" key={activeSym.sym}><span className="fe-explain-sym">{activeSym.sym}</span><span className="fe-explain-desc" dangerouslySetInnerHTML={{__html:activeSym.desc}} /></div> : <div className="fe-placeholder"><span>↗</span> 将鼠标放到带下划线的符号上，拆开这一行公式。</div>}
    </div>
  </div>;
}
