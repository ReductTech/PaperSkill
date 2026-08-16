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

// 把公式里的 Unicode 上下标与组合变音符规范成 HTML，交给浏览器排版，
// 避免在衬线粗体下符号挤压、重叠。
const SUB_MAP: Record<string, string> = {
  '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4',
  '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9',
  '₋': '-', '₊': '+', 'ₐ': 'a', 'ₜ': 't', 'ₓ': 'x',
  'ₕ': 'h', 'ₖ': 'k', 'ₙ': 'n', 'ₚ': 'p', 'ₛ': 's', 'ᵢ': 'i', 'ⱼ': 'j',
};
const SUP_MAP: Record<string, string> = {
  '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4',
  '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9',
  'ᵀ': 'T', 'ᵗ': 't', 'ˣ': 'x', 'ⁿ': 'n', 'ᵏ': 'k', '⁺': '+', '⁻': '-',
};
const SUB_CHARS = Object.keys(SUB_MAP).join('');
const SUP_CHARS = Object.keys(SUP_MAP).join('');
/** 规范 Unicode 上下标：X̄（组合上横线）→ 上横线，`_k` → 下标，ₜ/² 等 → sub/sup。 */
function deunicodeSubSup(text: string): string {
  let out = text.replace(/([A-Za-z])̄/g, '<span class="fe-bar">$1</span>');
  out = out.replace(/_([A-Za-z0-9])/g, '<sub>$1</sub>');
  out = out.replace(new RegExp(`[${SUB_CHARS}]`, 'g'), (ch) => `<sub>${SUB_MAP[ch]}</sub>`);
  out = out.replace(new RegExp(`[${SUP_CHARS}]`, 'g'), (ch) => `<sup>${SUP_MAP[ch]}</sup>`);
  return out;
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
  const wrapped = tokens
    .map((tok) => {
      if (tok.startsWith('<')) return tok;
      return tok.replace(re, (m) => {
        const safe = escapeHtmlAttr(m);
        return `<span class="sym fe-formula-sym" data-sym="${safe}">${m}</span>`;
      });
    })
    .join('');
  // 再规范一次上下标：只处理标签之间的文本，绝不动 data-sym 属性
  return wrapped
    .split(/(<[^>]+>)/g)
    .map((tok) => (tok.startsWith('<') ? tok : deunicodeSubSup(tok)))
    .join('');
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
