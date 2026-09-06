import { useId, useMemo, useState } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import type { FormulaDef } from '../types';

export function Formula({ formula }: { formula: FormulaDef }) {
  const [active, setActive] = useState<string | null>(null);
  const explanationId = useId();

  const formulaHtml = useMemo(() => {
    if (!formula.latex) return null;

    try {
      return katex.renderToString(formula.latex, {
        displayMode: true,
        output: 'htmlAndMathml',
        strict: 'warn',
        throwOnError: true,
      });
    } catch (error) {
      console.error('KaTeX formula rendering failed:', error);
      return null;
    }
  }, [formula.latex]);

  const activeSymbol = formula.symbols.find((symbol) => symbol.sym === active) ?? null;

  const toggleSymbol = (symbol: string) => {
    setActive((current) => (current === symbol ? null : symbol));
  };

  return (
    <div className="formula-explain">
      <div className="fe-lead" dangerouslySetInnerHTML={{ __html: formula.lead }} />
      {formulaHtml ? (
        <div
          className="fe-formula"
          role="math"
          aria-label={formula.unicode}
          dangerouslySetInnerHTML={{ __html: formulaHtml }}
        />
      ) : (
        <div className="fe-formula fe-formula-fallback" role="math" aria-label={formula.unicode}>
          {formula.unicode}
        </div>
      )}

      <p className="fe-hint">点击符号查看含义</p>
      <div className="fe-symbol-row" aria-label="公式符号释义">
        {formula.symbols.map((symbol) => {
          const isActive = active === symbol.sym;
          return (
            <button
              type="button"
              className={`fe-symbol-chip${isActive ? ' active' : ''}`}
              key={symbol.sym}
              aria-pressed={isActive}
              aria-controls={isActive ? explanationId : undefined}
              onClick={() => toggleSymbol(symbol.sym)}
            >
              {symbol.sym}
            </button>
          );
        })}
      </div>

      {activeSymbol ? (
        <div className="fe-explain" id={explanationId} aria-live="polite">
          <span className="fe-explain-sym">{activeSymbol.sym}</span>
          <span
            className="fe-explain-desc"
            dangerouslySetInnerHTML={{ __html: activeSymbol.desc }}
          />
        </div>
      ) : null}
    </div>
  );
}
