import React, { useMemo, useState } from 'react';
import type { FormulaDef } from '../types';

type FormulaSymbol = FormulaDef['symbols'][number];
type FormulaPart = { text: string; symbol?: FormulaSymbol };

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function splitFormula(text: string, symbols: FormulaSymbol[]): FormulaPart[] {
  const sorted = [...symbols].sort((a, b) => b.sym.length - a.sym.length);
  const pattern = sorted.map((s) => escapeRegExp(s.sym)).join('|');
  if (!pattern) return [{ text, symbol: undefined }];
  const re = new RegExp(`(${pattern})`, 'g');
  return text.split(re).filter(Boolean).map((part) => ({
    text: part,
    symbol: sorted.find((item) => item.sym === part),
  }));
}

export function Formula({ formula }: { formula: FormulaDef }) {
  const [active, setActive] = useState<string | null>(null);
  const parts = useMemo(
    () => splitFormula(formula.unicode, formula.symbols),
    [formula.unicode, formula.symbols]
  );
  const inFormula = parts.some((part) => part.symbol);
  const activeSym = formula.symbols.find((s) => s.sym === active) ?? null;

  return (
    <section className="formula-explain" aria-label="公式交互解释">
      <p className="fe-hint">
        {inFormula ? '点击公式中带底纹的术语查看含义' : '点击下方术语查看含义'}
      </p>
      <div className="fe-lead" dangerouslySetInnerHTML={{ __html: formula.lead }} />
      <div className="fe-formula" aria-label={formula.unicode}>
        {parts.map((part, index) =>
          part.symbol ? (
            <button
              key={`${part.text}-${index}`}
              type="button"
              className={`fe-formula-sym ${active === part.symbol.sym ? 'active' : ''}`}
              aria-pressed={active === part.symbol.sym}
              aria-label={`解释 ${part.symbol.sym}`}
              onClick={() => setActive(part.symbol!.sym)}
            >
              {part.text}
            </button>
          ) : (
            <span key={`${part.text}-${index}`}>{part.text}</span>
          )
        )}
      </div>
      {!inFormula ? (
        <div className="fe-symbol-list" aria-label="可解释术语">
          {formula.symbols.map((symbol) => (
            <button
              key={symbol.sym}
              type="button"
              className={`fe-symbol-button ${active === symbol.sym ? 'active' : ''}`}
              aria-pressed={active === symbol.sym}
              onClick={() => setActive(symbol.sym)}
            >
              {symbol.sym}
            </button>
          ))}
        </div>
      ) : null}
      {activeSym ? (
        <div className="fe-explain" role="status" aria-live="polite" key={activeSym.sym}>
          <span className="fe-explain-sym">{activeSym.sym}</span>
          <span
            className="fe-explain-desc"
            dangerouslySetInnerHTML={{ __html: activeSym.desc }}
          />
        </div>
      ) : null}
    </section>
  );
}
