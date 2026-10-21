import type { FormulaDef } from '../types';

// Keep every symbol explanation visible so the formula is complete for touch,
// keyboard and screen-reader users without a hover or click prerequisite.
export function Formula({ formula }: { formula: FormulaDef }) {
  return (
    <div className="formula-explain">
      <p className="fe-hint">核心公式与符号</p>
      <div className="fe-lead" dangerouslySetInnerHTML={{ __html: formula.lead }} />
      <div className="fe-formula" role="math" aria-label={formula.unicode}>
        {formula.unicode}
      </div>
      <dl className="fe-symbol-list">
        {formula.symbols.map(({ sym, desc }) => (
          <div className="fe-symbol-item" key={sym}>
            <dt>{sym}</dt>
            <dd dangerouslySetInnerHTML={{ __html: desc }} />
          </div>
        ))}
      </dl>
    </div>
  );
}
