import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import '../styles/s3-formula.css';

type SymbolKey = 'action' | 'tool' | 'question' | 'scope' | 'specific';
const meanings: Record<SymbolKey, string> = {
  action: '第 t 轮生成的观察行动。',
  tool: '本轮选择的观察工具。',
  question: '提供给 Observer 的观察子问题。',
  scope: '指定的观察时间范围及相关预算。',
  specific: '所选工具的专用参数。本例无额外设置；FPS 与帧预算仍计入 𝓘ₜ。'
};

export function S3Formula({ onActiveChange }: { onActiveChange: (symbol: SymbolKey | null) => void }) {
  const [hovered, setHovered] = useState<SymbolKey | null>(null);
  const [pinned, setPinned] = useState<SymbolKey | null>(null);
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null);
  const anchors = useRef<Partial<Record<SymbolKey, HTMLButtonElement>>>({});
  const cardRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLSpanElement>(null);
  const tooltipId = useId();
  const active = pinned ?? hovered;

  useEffect(() => onActiveChange(active), [active, onActiveChange]);

  useEffect(() => {
    if (!active) return;
    const closeOutside = (event: PointerEvent) => {
      if (rootRef.current?.contains(event.target as Node) || cardRef.current?.contains(event.target as Node)) return;
      setPinned(null);
      setHovered(null);
    };
    const closeEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setPinned(null);
      setHovered(null);
    };
    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('keydown', closeEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOutside);
      document.removeEventListener('keydown', closeEscape);
    };
  }, [active]);

  useLayoutEffect(() => {
    if (!active) return;
    const place = () => {
      const anchor = anchors.current[active];
      const card = cardRef.current;
      if (!anchor || !card) return;
      const rect = anchor.getBoundingClientRect();
      const width = card.offsetWidth;
      const height = card.offsetHeight;
      const left = Math.max(12, Math.min(window.innerWidth - width - 12, rect.left + rect.width / 2 - width / 2));
      const below = rect.bottom + 8;
      const top = below + height <= window.innerHeight - 12 ? below : Math.max(12, rect.top - height - 8);
      setPosition({ left, top });
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [active]);

  const symbol = (key: SymbolKey, content: React.ReactNode) => <button
    key={key}
    ref={element => { if (element) anchors.current[key] = element; }}
    type="button"
    className={`sym fe-formula-sym${active === key ? ' active' : ''}`}
    aria-label={`${key === 'action' ? 'a 下标 t' : key === 'tool' ? 'o 下标 t' : key === 'question' ? 'q 下标 t' : key === 'scope' ? 'I 下标 t' : 'rho 下标 o t'}：${meanings[key]}`}
    aria-pressed={pinned === key}
    aria-describedby={active === key ? tooltipId : undefined}
    onPointerEnter={event => { if (event.pointerType === 'mouse') setHovered(key); }}
    onPointerLeave={() => setHovered(current => current === key ? null : current)}
    onFocus={() => setHovered(key)}
    onBlur={() => setHovered(current => current === key ? null : current)}
    onClick={() => { setPinned(current => current === key ? null : key); setHovered(null); }}
  >{content}</button>;

  return <>
    <span className="fe-formula s3-fe-formula" ref={rootRef} aria-label="参数化观察行动公式">
      {symbol('action', <>a<sub>t</sub></>)}<span className="s3-fe-operator"> = (</span>
      {symbol('tool', <>o<sub>t</sub></>)}<span className="s3-fe-operator">, </span>
      {symbol('question', <>q<sub>t</sub></>)}<span className="s3-fe-operator">, </span>
      {symbol('scope', <>𝓘<sub>t</sub></>)}<span className="s3-fe-operator">, </span>
      {symbol('specific', <>ρ<sub>o<sub>t</sub></sub></>)}<span className="s3-fe-operator">)</span>
    </span>
    {active && createPortal(<div id={tooltipId} ref={cardRef} className="fe-explain s3-fe-explain" role="tooltip" style={{ left: position?.left ?? 0, top: position?.top ?? 0, visibility: position ? 'visible' : 'hidden' }}>
      <span className="fe-explain-sym">{active === 'action' ? <>a<sub>t</sub></> : active === 'tool' ? <>o<sub>t</sub></> : active === 'question' ? <>q<sub>t</sub></> : active === 'scope' ? <>𝓘<sub>t</sub></> : <>ρ<sub>o<sub>t</sub></sub></>}</span>
      <span className="fe-explain-desc">{meanings[active]}</span>
    </div>, document.body)}
  </>;
}
