import React, { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

/** Delegated hints also work with the HTML symbols in the legacy Formula block. */
export function SymbolGlossary({ children }: { children: React.ReactNode }) {
  const root = useRef<HTMLSpanElement>(null);
  const popup = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const [active, setActive] = useState<HTMLElement | null>(null);
  const [pinned, setPinned] = useState(false);
  const [position, setPosition] = useState({ left: 12, top: 12 });
  const id = useId();
  const cancel = () => clearTimeout(timer.current);
  const close = () => { cancel(); setActive(null); setPinned(false); };
  const leave = () => {
    cancel();
    if (!pinned) timer.current = setTimeout(() => {
      if (!root.current?.contains(document.activeElement)) setActive(null);
    }, 120);
  };
  const trigger = (target: EventTarget | null) => target instanceof Element
    ? target.closest<HTMLElement>('[data-formula-symbol]') : null;

  useLayoutEffect(() => {
    if (!active || !popup.current) return;
    const r = active.getBoundingClientRect();
    const p = popup.current.getBoundingClientRect();
    setPosition({
      left: Math.max(12, Math.min(r.left + r.width / 2 - p.width / 2, window.innerWidth - p.width - 12)),
      top: Math.max(12, Math.min(r.bottom + 10 + p.height > window.innerHeight - 12
        ? r.top - p.height - 10 : r.bottom + 10, window.innerHeight - p.height - 12)),
    });
    active.setAttribute('aria-describedby', id);
    return () => active.removeAttribute('aria-describedby');
  }, [active, id]);

  useEffect(() => {
    if (!active) return;
    const outside = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node) && !popup.current?.contains(e.target as Node)) close();
    };
    const escape = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    document.addEventListener('fullscreenchange', close);
    window.addEventListener('resize', close);
    window.addEventListener('scroll', close, true);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', escape);
      document.removeEventListener('fullscreenchange', close);
      window.removeEventListener('resize', close);
      window.removeEventListener('scroll', close, true);
      cancel();
    };
  }, [active]);

  return <span ref={root} className="formula-symbols"
    onPointerOver={e => { const el = trigger(e.target); if (el) { cancel(); setActive(el); } }}
    onPointerOut={leave}
    onFocus={e => { const el = trigger(e.target); if (el) { cancel(); setActive(el); } }}
    onBlur={e => { if (!root.current?.contains(e.relatedTarget as Node) && !pinned) close(); }}
    onClick={e => {
      const el = trigger(e.target);
      if (el) { cancel(); if (pinned && active === el) close(); else { setActive(el); setPinned(true); } }
    }}
    onKeyDown={e => {
      if ((e.key === 'Enter' || e.key === ' ') && trigger(e.target)) {
        e.preventDefault(); (e.target as HTMLElement).click();
      }
    }}>
    {children}
    {active && createPortal(<div ref={popup} id={id} role="tooltip" className="formula-symbol-tooltip"
      style={position} onPointerEnter={cancel} onPointerLeave={leave}>
      {active.dataset.formulaMeaning}
    </div>, document.fullscreenElement ?? document.body)}
  </span>;
}

/** Use around the actual symbol, including an HTML/MathML expression. Meaning is plain Chinese. */
export function SymbolHint({ children, meaning }: { children: React.ReactNode; meaning: string }) {
  return <SymbolGlossary><span className="formula-symbol" tabIndex={0} role="button"
    aria-label={meaning} data-formula-symbol="" data-formula-meaning={meaning}>{children}</span></SymbolGlossary>;
}
