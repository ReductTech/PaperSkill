import React, { useMemo, useState } from 'react';
import type { FormulaDef } from '../types';

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function splitFormula(text: string, symbols: FormulaDef['symbols']) {
  const names = symbols.map(item => item.sym).sort((a, b) => b.length - a.length);
  if (!names.length) return [{ text, symbol: null }];
  const pattern = new RegExp(`(${names.map(escapeRegExp).join('|')})`, 'g');
  return text.split(pattern).filter(Boolean).map(part => ({
    text: part,
    symbol: symbols.find(item => item.sym === part) ?? null,
  }));
}

export function Formula({ formula }: { formula: FormulaDef }) {
  const [active, setActive] = useState<string | null>(null);
  const parts = useMemo(() => splitFormula(formula.unicode, formula.symbols), [formula.unicode, formula.symbols]);
  const activeSym = formula.symbols.find(item => item.sym === active);

  return <div className="formula-explain">
    <p className="fe-hint">点击公式中的符号查看含义</p>
    <div className="fe-lead">{formula.lead}</div>
    <div className={'fe-formula' + (formula.unicode.includes('\n') ? ' multiline' : '')}>{parts.map((part, index) => part.symbol
      ? <button key={index} type="button" className={'fe-formula-sym ' + (active === part.symbol.sym ? 'active' : '')}
          aria-pressed={active === part.symbol.sym} aria-label={`${part.text}：${part.symbol.desc}`}
          onClick={() => setActive(previous => previous === part.symbol?.sym ? null : part.symbol?.sym ?? null)}>{part.text}</button>
      : <React.Fragment key={index}>{part.text}</React.Fragment>)}</div>
    {activeSym && <div className="fe-explain" key={activeSym.sym}>
      <span className="fe-explain-sym">{activeSym.sym}</span>
      <span className="fe-explain-desc">{activeSym.desc}</span>
    </div>}
  </div>;
}
