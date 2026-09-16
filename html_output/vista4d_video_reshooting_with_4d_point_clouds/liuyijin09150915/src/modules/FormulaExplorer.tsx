"use client";

import { useState, type ReactNode } from "react";
import { Pin } from "lucide-react";

type SymbolDefinition = { label: string; detail: string; stage: string };
type SymbolMap = Record<string, SymbolDefinition>;

export function FormulaExplorer({
  number,
  title,
  symbols,
  renderFormula,
  onStageChange,
}: {
  number: string;
  title: string;
  symbols: SymbolMap;
  renderFormula: (symbol: (key: string, content?: ReactNode) => ReactNode) => ReactNode;
  onStageChange?: (stage: string | null) => void;
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [focused, setFocused] = useState<string | null>(null);
  const [pinned, setPinned] = useState<string | null>(null);
  const selected = hovered ?? focused ?? pinned;
  const definition = selected ? symbols[selected] : null;

  const setHoveredSymbol = (key: string | null) => {
    setHovered(key);
  };
  const setFocusedSymbol = (key: string | null) => {
    setFocused(key);
  };
  const togglePinned = (key: string) => {
    const next = pinned === key ? null : key;
    setPinned(next);
    onStageChange?.(next ? symbols[next].stage : null);
  };
  const symbol = (key: string, content?: ReactNode) => (
    <button
      type="button"
      className={`math-symbol ${selected === key ? "active" : ""} ${pinned === key ? "pinned" : ""}`}
      onMouseEnter={() => setHoveredSymbol(key)}
      onMouseLeave={() => setHoveredSymbol(null)}
      onFocus={() => setFocusedSymbol(key)}
      onBlur={() => setFocusedSymbol(null)}
      onClick={() => togglePinned(key)}
      aria-pressed={pinned === key}
      aria-label={`${symbols[key].label}：${symbols[key].detail}`}
    >
      {content ?? symbols[key].label}
    </button>
  );

  return (
    <div className="formula-explorer">
      <div className="formula-head"><span>{number}</span><h3>{title}</h3></div>
      <div className="math-line">{renderFormula(symbol)}</div>
      <div className={`formula-explanation ${definition ? "has-selection" : ""}`} aria-live="polite">
        {definition ? <><b>{definition.label}</b><p>{definition.detail}</p>{pinned === selected && <span><Pin /> 已固定；点击其他符号可切换</span>}</> : <p className="formula-hint">悬停查看 · 点击固定</p>}
      </div>
    </div>
  );
}
