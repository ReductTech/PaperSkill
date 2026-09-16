import React, { useEffect, useRef, useState } from 'react';

type Bubble = { symbol: string; tip: string } | null;

interface MathMLCardProps {
  title: string;
  lead: string;
  source: string;
  activeKey?: string;
  className?: string;
  children: React.ReactNode;
}

/** A local, non-clipping explanation surface for native MathML symbols. */
export function MathMLCard({ title, lead, source, activeKey, className = '', children }: MathMLCardProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<Bubble>(null);
  const [pinned, setPinned] = useState<Bubble>(null);

  const readTerm = (target: EventTarget | null): Bubble => {
    if (!(target instanceof Element)) return null;
    const term = target.closest<MathMLElement>('[data-sym][data-tip]');
    if (!term || !rootRef.current?.contains(term)) return null;
    return { symbol: term.getAttribute('data-label') || term.textContent?.trim() || '公式符号', tip: term.dataset.tip || '' };
  };

  const pin = (target: EventTarget | null) => {
    const bubble = readTerm(target);
    if (!bubble) return false;
    rootRef.current?.querySelectorAll<HTMLElement>('[data-selected="true"]').forEach((node) => delete node.dataset.selected);
    const term = target instanceof Element ? target.closest<HTMLElement>('[data-sym][data-tip]') : null;
    if (term) term.dataset.selected = 'true';
    setPinned(bubble);
    return true;
  };

  useEffect(() => {
    setHovered(null);
    setPinned(null);
    rootRef.current?.querySelectorAll<HTMLElement>('[data-selected="true"]').forEach((node) => delete node.dataset.selected);
  }, [activeKey]);

  const bubble = pinned || hovered;

  return (
    <section ref={rootRef} className={`mathml-card ${className}`} data-active-key={activeKey || ''}
      onPointerOver={(event) => { const value = readTerm(event.target); if (value) setHovered(value); }}
      onPointerLeave={() => setHovered(null)}
      onFocus={(event) => { const value = readTerm(event.target); if (value) setHovered(value); }}
      onBlur={(event) => { if (!rootRef.current?.contains(event.relatedTarget as Node | null)) setHovered(null); }}
      onClick={(event) => pin(event.target)}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          setPinned(null);
          setHovered(null);
          rootRef.current?.querySelectorAll<HTMLElement>('[data-selected="true"]').forEach((node) => delete node.dataset.selected);
          return;
        }
        if ((event.key === 'Enter' || event.key === ' ') && pin(event.target)) event.preventDefault();
      }}>
      <header className="mathml-head">
        <div><span>悬停或聚焦符号可查看说明</span><h3>{title}</h3></div>
        <small>{source}</small>
      </header>
      <p>{lead}</p>
      <div className="mathml-scroll">{children}</div>
      <div className={`mathml-bubble ${bubble ? 'has-symbol' : ''}`} role="status" aria-live="polite">
        {bubble ? <><b>{bubble.symbol}</b><span>{bubble.tip}</span>{pinned && <button type="button" aria-label="取消固定符号解释" onClick={(event) => { event.stopPropagation(); setPinned(null); }}>取消固定</button>}</> : <><b>符号说明</b><span>把鼠标移到主要符号上，或用 Tab 聚焦；点击可把解释固定在这里。</span></>}
      </div>
    </section>
  );
}

export function MathSym({ id, tip, label, active = false, children }: { id: string; tip: string; label: string; active?: boolean; children: React.ReactNode }) {
  return <mrow data-sym={id} data-tip={tip} data-label={label} data-focus={active ? 'true' : undefined} tabIndex={0} role="button" aria-label={`${label}：${tip}`}>{children}</mrow>;
}

export function Upright({ children }: { children: React.ReactNode }) {
  return <mtext className="math-upright">{children}</mtext>;
}
