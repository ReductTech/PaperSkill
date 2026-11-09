import React, { useState, useMemo } from 'react';
import type { FormulaDef } from '../types';

// Formula block: HTML with native <sub>/<sup> (no KaTeX, no external font), with
// every symbol occurrence in the formula itself clickable.

const escapeHtml = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Turn a plain symbol label such as `L_SSL`, `z^A`, `z_i^A` into the exact HTML
 * markup used inside the formula, so the label and the formula share one syntax.
 */
function symbolToHtml(sym: string): string {
  return escapeHtml(sym)
    .replace(/_\{([^}]+)\}/g, (_m, g: string) => `<sub>${g}</sub>`)
    .replace(/\^\{([^}]+)\}/g, (_m, g: string) => `<sup>${g}</sup>`)
    .replace(/_([A-Za-z0-9]+)/g, (_m, g: string) => `<sub>${g}</sub>`)
    .replace(/\^([A-Za-z0-9]+)/g, (_m, g: string) => `<sup>${g}</sup>`);
}

type SymEntry = { sym: string; html: string };

/**
 * Mark clickable regions in the formula HTML.
 * One combined regex alternation, tags first, symbols longest-first, so:
 * - we never match a symbol inside a tag (the tag branch consumes it);
 * - a label with subscripts (`L<sub>SSL</sub>`) wins over its bare prefix (`L`).
 */
function makeClickable(html: string, entries: SymEntry[], active: string | null): string {
  if (!entries.length) return html;
  const byHtml = new Map(entries.map((e) => [e.html, e.sym]));
  const alts = entries.map((e) => escapeRegExp(e.html)).join('|');
  const re = new RegExp(`(<[^>]+>)|(?:${alts})`, 'g');
  return html.replace(re, (m) => {
    const sym = byHtml.get(m);
    if (!sym) return m;
    const cls = sym === active ? ' fe-formula-sym is-active' : ' fe-formula-sym';
    return `<span class="${cls}" data-sym="${escapeHtml(sym)}">${m}</span>`;
  });
}

export function Formula({ formula }: { formula: FormulaDef }) {
  const [active, setActive] = useState<string | null>(null);

  const entries = useMemo<SymEntry[]>(() => {
    return formula.symbols
      .map((s) => ({ sym: s.sym, html: symbolToHtml(s.sym) }))
      .sort((a, b) => b.html.length - a.html.length);
  }, [formula.symbols]);

  const formulaHtml = useMemo(
    () => makeClickable(formula.unicode, entries, active),
    [formula.unicode, entries, active]
  );

  const toggle = (sym: string) => setActive((prev) => (prev === sym ? null : sym));

  const onClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = (e.target as HTMLElement).closest('[data-sym]');
    if (!el) return;
    const sym = el.getAttribute('data-sym');
    if (sym) toggle(sym);
  };

  const activeSym = formula.symbols.find((s) => s.sym === active) ?? null;

  return (
    <div className="formula-explain" onClick={onClick}>
      <p className="fe-lead" dangerouslySetInnerHTML={{ __html: formula.lead }} />
      <div
        className="fe-formula"
        role="group"
        aria-label="公式，点击符号查看含义"
        dangerouslySetInnerHTML={{ __html: formulaHtml }}
      />
      <p className="fe-hint">点击公式中的符号查看含义</p>
      {activeSym ? (
        <div className="fe-explain" key={activeSym.sym}>
          <span
            className="fe-explain-sym"
            dangerouslySetInnerHTML={{ __html: symbolToHtml(activeSym.sym) }}
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
