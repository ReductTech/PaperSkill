import React, { useId, useMemo, useState } from 'react';
import type { FormulaDef, SymbolDef } from '../types';

type Part = { text: string; sym?: string };
// Only explicitly registered symbols/aliases are interactive. Function names
// stay atomic, so x in exp or a/o in softmax cannot become false variables.
export function formulaParts(text: string, symbols: SymbolDef[]): Part[] {
  const candidates = symbols.flatMap(s => [s.sym, ...(s.aliases ?? [])].map(alias => ({ alias, sym: s.sym })))
    .sort((a, b) => b.alias.length - a.alias.length);
  const parts: Part[] = [];
  let i = 0;
  while (i < text.length) {
    const word = /^(softmax|Readout|Block|mean|exp|LN|log)(?![a-z])/.exec(text.slice(i))?.[0];
    const found = candidates.find(c => text.startsWith(c.alias, i)
      && (!word || c.alias === word)
      && !(c.alias === 'Σ' && text[i + 1] === 'ᵢ'));
    if (found) { parts.push({ text: found.alias, sym: found.sym }); i += found.alias.length; }
    else {
      const raw = word || text[i];
      const last = parts[parts.length - 1];
      if (last && !last.sym) last.text += raw; else parts.push({ text: raw });
      i += raw.length;
    }
  }
  return parts;
}

export function Formula({ formula }: { formula: FormulaDef }) {
  const [active, setActive] = useState<string | null>(null);
  const explanationId = useId();
  const parts = useMemo(() => formulaParts(formula.unicode, formula.symbols), [formula]);
  const visible = new Set(parts.flatMap(p => p.sym ? [p.sym] : []));
  const activeSym = formula.symbols.find(s => s.sym === active);
  const symbolButton = (sym: string, label: string, key: React.Key) => (
    <button type="button" key={key} className={'fe-formula-sym' + (active === sym ? ' active' : '')}
      aria-label={'解释符号 ' + sym} aria-expanded={active === sym} aria-controls={explanationId}
      onClick={() => setActive(previous => previous === sym ? null : sym)}>{label}</button>
  );
  return (
    <div className="formula-explain">
      <p className="fe-hint">选择带下划线的符号查看含义；键盘可用 Tab、Enter 或空格。</p>
      <div className="fe-lead" dangerouslySetInnerHTML={{ __html: formula.lead }} />
      <div className="fe-formula">{parts.map((p, i) => p.sym ? symbolButton(p.sym, p.text, i) : p.text)}</div>
      {formula.symbols.some(s => !visible.has(s.sym)) && <div className="fe-extra-symbols" aria-label="补充符号释义">
        {formula.symbols.filter(s => !visible.has(s.sym)).map(s => symbolButton(s.sym, s.sym, s.sym))}
      </div>}
      <div id={explanationId} className="fe-explain" role="status" aria-live="polite" aria-atomic="true">
        {activeSym ? <><span className="fe-explain-sym">{activeSym.sym}</span>
          <span className="fe-explain-desc" dangerouslySetInnerHTML={{ __html: activeSym.desc }} /></>
          : <span className="fe-explain-desc">选中符号后，解释会显示在这里。</span>}
      </div>
    </div>
  );
}
