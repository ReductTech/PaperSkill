import React, { useMemo, useState } from 'react';
import type { FormulaDef } from '../types';

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function splitFormula(value: string, symbols: FormulaDef['symbols']) {
  const pattern = [...symbols]
    .sort((left, right) => right.sym.length - left.sym.length)
    .map((item) => escapeRegExp(item.sym))
    .join('|');
  return pattern ? value.split(new RegExp(`(${pattern})`, 'g')).filter(Boolean) : [value];
}

export function Formula({ formula }: { formula: FormulaDef }) {
  const [active, setActive] = useState<string | null>(null);
  const parts = useMemo(() => splitFormula(formula.unicode, formula.symbols), [formula]);
  const symbolMap = useMemo(() => new Map(formula.symbols.map((item) => [item.sym, item])), [formula.symbols]);
  const activeSymbol = active ? symbolMap.get(active) : undefined;

  return (
    <div className="formula-explain">
      <div className="fe-lead">{formula.lead}</div>
      <div className="fe-formula" aria-label={`${formula.unicode}，点击符号查看含义`}>
        {parts.map((part, index) => {
          const symbol = symbolMap.get(part);
          return symbol ? (
            <button
              className={`sym fe-formula-sym${active === part ? ' active' : ''}`}
              type="button"
              aria-pressed={active === part}
              aria-label={`${part}：查看含义`}
              key={`${part}-${index}`}
              onClick={() => setActive((current) => current === part ? null : part)}
            >
              {part}
            </button>
          ) : <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>;
        })}
      </div>
      <p className="fe-hint">点击公式中的符号查看含义</p>
      {activeSymbol ? (
        <div className="fe-explain" role="status">
          <span className="fe-explain-sym">{activeSymbol.sym}</span>
          <span className="fe-explain-desc">{activeSymbol.desc}</span>
        </div>
      ) : null}
    </div>
  );
}
