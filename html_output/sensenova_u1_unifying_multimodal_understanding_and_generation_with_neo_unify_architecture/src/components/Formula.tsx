import React, { useMemo, useState } from 'react';
import type { FormulaDef } from '../types';

// Formula block: the data keeps a canonical LaTeX source and a matching MathML rendering.
// MathML gives native fractions, roots, scripts and aligned rows without a CDN or runtime
// dependency. Major symbols carry data-sym attributes and remain clickable.

const escapeHtmlAttr = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const formatSymbolHtml = (s: string) =>
  escapeHtmlAttr(s).replace(/_(.+)$/u, '<sub>$1</sub>');

// A presentation MathML <math> element needs one expression root. Formula items
// are intentionally written as readable equation fragments, so wrap each fragment
// in an outer mrow before giving it to the browser's MathML layout engine.
const wrapMathRow = (mathml: string) =>
  mathml.replace(/^(\s*<math\b[^>]*>)([\s\S]*)(<\/math>\s*)$/u, '$1<mrow>$2</mrow>$3');

export function Formula({ formula }: { formula: FormulaDef }) {
  const [active, setActive] = useState<string | null>(null);
  const items = useMemo(
    () => formula.items ?? [{ label: '公式', latex: formula.latex, mathml: formula.mathml }],
    [formula]
  );

  const formulaHtml = useMemo(() => items.map((item) => {
    const mathml = formula.items ? wrapMathRow(item.mathml) : item.mathml;
    if (!active) return mathml;
    const safe = escapeHtmlAttr(active);
    const pattern = new RegExp(`data-sym="${escapeRegExp(safe)}"`, 'g');
    return mathml.replace(pattern, `data-sym="${safe}" class="fe-formula-sym active"`);
  }), [active, formula.items, items]);

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
    <div className={`formula-explain ${items.length > 1 ? 'formula-explain--split' : ''} ${formula.layout === 'cfg' ? 'formula-explain--cfg' : ''}`} onClick={onClick}>
      <p className="fe-hint">点击公式中的符号查看含义</p>
      <div className="fe-lead" dangerouslySetInnerHTML={{ __html: formula.lead }} />
      {formula.layout === 'cfg' ? <p className="fe-formula-caption">论文原式 · Eq. (6)</p> : null}
      <div className="fe-formula-list">
        {items.map((item, index) => (
          <section className="fe-formula-item" key={item.label} aria-label={item.label}>
            {items.length > 1 ? <p className="fe-formula-label">{item.label}</p> : null}
            <div
              className="fe-formula fe-mathml"
              aria-label={item.latex}
              dangerouslySetInnerHTML={{ __html: formulaHtml[index] }}
            />
          </section>
        ))}
      </div>
      {activeSym ? (
        <div className="fe-explain" key={activeSym.sym}>
          <span
            className="fe-explain-sym"
            dangerouslySetInnerHTML={{ __html: formatSymbolHtml(activeSym.sym) }}
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
