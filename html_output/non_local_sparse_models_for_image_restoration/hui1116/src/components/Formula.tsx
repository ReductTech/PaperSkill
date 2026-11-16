import { useId, useState } from 'react';
import type { FormulaDef } from '../types';

export function Formula({ formula, paperSource }: { formula: FormulaDef; paperSource?: string }) {
  const [active, setActive] = useState(0);
  const explanationId = useId();
  const titleId = useId();
  const symbol = formula.symbols[active];
  const equation = '<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">' + formula.mathml + '</math>';

  return (
    <article className="paper-equation" aria-labelledby={titleId}>
      <header className="paper-equation-heading">
        <h4 id={titleId}>{formula.title}</h4>
        {paperSource ? (
          <a className="paper-source" href={paperSource + '#page=' + formula.page} target="_blank" rel="noreferrer">
            {formula.label} ↗
          </a>
        ) : <span>{formula.label}</span>}
      </header>
      <p>{formula.lead}</p>
      <div className="paper-equation-math" dangerouslySetInnerHTML={{ __html: equation }} />
      {symbol ? (
        <div className="paper-equation-glossary">
          <div className="paper-equation-symbols" role="group" aria-label="公式符号">
            {formula.symbols.map(({ sym }, index) => (
              <button
                type="button"
                key={sym}
                className={index === active ? 'chip selected' : 'chip'}
                aria-pressed={index === active}
                aria-controls={explanationId}
                onClick={() => setActive(index)}
              >
                {sym}
              </button>
            ))}
          </div>
          <p id={explanationId} aria-live="polite">{symbol.desc}</p>
        </div>
      ) : null}
    </article>
  );
}
