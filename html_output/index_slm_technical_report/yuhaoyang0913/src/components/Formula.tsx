import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
function makeClickableFormula(html: string, symbols: { sym: string; desc: string }[], active: string | null): string {
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
        const def = symbols.find(s => s.sym === m);
        const tip = escapeHtmlAttr(def?.desc || '点击查看符号含义');
        return `<span class="sym fe-formula-sym${active === m ? ' active' : ''}" data-sym="${safe}" data-tip="${tip}" title="${tip}" tabindex="0">${m}</span>`;
      });
    })
    .join('');
}

export function Formula({ formula }: { formula: FormulaDef }) {
  const [active, setActive] = useState<string | null>(null);
  const [expanded,setExpanded]=useState(false);

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

  useEffect(()=>{if(!expanded)return;const close=(e:KeyboardEvent)=>{if(e.key==='Escape')setExpanded(false)};document.addEventListener('keydown',close);const old=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{document.removeEventListener('keydown',close);document.body.style.overflow=old}},[expanded]);

  const symbolGrid = <div className="fe-symbol-grid" aria-label="公式符号索引">
    {formula.symbols.map(symbol => <button key={symbol.sym} className={active === symbol.sym ? 'active' : ''} onClick={e=>{e.stopPropagation();toggle(symbol.sym)}}><b>{symbol.sym}</b><span>{symbol.desc}</span></button>)}
  </div>;

  return (
    <div className="formula-explain" onClick={onClick}>
      <p className="fe-hint">悬停或点击任一符号查看含义</p>
      <button className="fe-expand" onClick={e=>{e.stopPropagation();setExpanded(true)}} aria-label="放大公式解释">放大公式 ↗</button>
      <div className="fe-lead" dangerouslySetInnerHTML={{ __html: formula.lead }} />
      <div className="fe-formula" dangerouslySetInnerHTML={{ __html: formulaHtml }} />
      {formula.explanation ? <p className="fe-reading"><b>怎么读：</b>{formula.explanation}</p> : null}
      {symbolGrid}
      {activeSym ? (
        <div className="fe-explain" key={activeSym.sym}>
          <span className="fe-explain-sym">{activeSym.sym}</span>
          <span
            className="fe-explain-desc"
            dangerouslySetInnerHTML={{ __html: activeSym.desc }}
          />
        </div>
      ) : null}
      {expanded?createPortal(<div className="formula-lightbox" role="dialog" aria-modal="true" aria-label="放大的公式解释" onClick={()=>setExpanded(false)}><div className="formula-lightbox-card" onClick={e=>{e.stopPropagation();onClick(e)}}><button className="lightbox-close" onClick={()=>setExpanded(false)} aria-label="关闭公式解释">关闭 ×</button><small>FORMULA READING VIEW</small><div className="fe-lead" dangerouslySetInnerHTML={{__html:formula.lead}}/><div className="fe-formula" dangerouslySetInnerHTML={{__html:formulaHtml}}/>{formula.explanation?<p className="fe-reading"><b>怎么读：</b>{formula.explanation}</p>:null}{symbolGrid}{activeSym?<div className="fe-explain"><span className="fe-explain-sym">{activeSym.sym}</span><span className="fe-explain-desc" dangerouslySetInnerHTML={{__html:activeSym.desc}}/></div>:null}</div></div>,document.body):null}
    </div>
  );
}
