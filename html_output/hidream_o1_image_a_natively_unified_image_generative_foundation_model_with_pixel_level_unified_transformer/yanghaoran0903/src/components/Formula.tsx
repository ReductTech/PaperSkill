import React, { useMemo, useState } from 'react';
import type { FormulaDef } from '../types';

function FormulaSym({ sym, desc, active, onClick }: { sym: string; desc: string; active: boolean; onClick: () => void }) {
  return (
    <button className={`sym ${active ? 'active' : ''}`} onClick={onClick} type="button">
      {sym}
      <span className="sr-only">{desc}</span>
    </button>
  );
}

export function Formula({ formula }: { formula: FormulaDef }) {
  const [active, setActive] = useState<string | null>(null);
  const symMap = useMemo(() => new Map(formula.symbols.map((s) => [s.sym, s.desc])), [formula.symbols]);
  return (
    <div className="formula-explain reveal-on-scroll">
      <div className="fe-lead">{formula.lead}</div>
      <div className="fe-formula">
        {formula.unicode
          .split(/([A-Za-z_][A-Za-z0-9_()|,+\-*/\s]+?)/g)
          .filter(Boolean)
          .map((piece, i) => {
            const desc = symMap.get(piece);
            return desc ? (
              <FormulaSym key={i} sym={piece} desc={desc} active={active === piece} onClick={() => setActive((v) => (v === piece ? null : piece))} />
            ) : (
              <span key={i}>{piece}</span>
            );
          })}
      </div>
      {active && symMap.get(active) ? (
        <div className="fe-explain">
          <span className="fe-explain-sym">{active}</span>
          <span className="fe-explain-desc">{symMap.get(active)}</span>
        </div>
      ) : null}
    </div>
  );
}
