import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Latex } from '../modules/formula-math';
import type { FormulaDef } from '../types';
import '../modules/formula-reader.css';

const symbolAt = (target: EventTarget | null) =>
  target instanceof Element ? target.closest<HTMLElement>('[data-symbol]') : null;

export function Formula({ formula }: { formula: FormulaDef }) {
  const root = useRef<HTMLDivElement>(null);
  const popup = useRef<HTMLElement>(null);
  const closeTimer = useRef<number>();
  const hintId = useId();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const symbol = anchor ? formula.symbols[anchor.dataset.symbol!] : undefined;

  const cancelClose = () => window.clearTimeout(closeTimer.current);
  const reveal = (element: HTMLElement | null) => {
    cancelClose();
    setAnchor(element);
  };
  const leave = () => {
    cancelClose();
    closeTimer.current = window.setTimeout(() => setAnchor(null), 160);
  };
  useEffect(() => cancelClose, []);

  useLayoutEffect(() => {
    if (!anchor || !symbol || !popup.current) return;
    const tip = popup.current;
    anchor.classList.add('coop-symbol-active');
    const place = () => {
      const box = anchor.getBoundingClientRect();
      const width = document.documentElement.clientWidth;
      const height = window.innerHeight;
      if (!anchor.isConnected || box.bottom < 0 || box.top > height) {
        setAnchor(null);
        return;
      }
      const roomBelow = height - box.bottom - 10;
      const tipHeight = tip.offsetHeight;
      const expression = anchor.closest('.coop-equation-expression')!.getBoundingClientRect();
      const fitsAtSide = expression.right + tip.offsetWidth + 24 < width;
      const top = fitsAtSide ? box.top + box.height / 2 - tipHeight / 2
        : roomBelow >= tipHeight || roomBelow >= box.top
        ? box.bottom + 9 : box.top - tipHeight - 9;
      const left = fitsAtSide ? expression.right + 14 : box.left + box.width / 2 - tip.offsetWidth / 2;
      tip.style.top = Math.max(8, Math.min(top, height - tipHeight - 8)) + 'px';
      tip.style.left = Math.max(10, Math.min(left, width - tip.offsetWidth - 10)) + 'px';
    };
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target) && !tip.contains(event.target)) setAnchor(null);
    };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') setAnchor(null); };
    place();
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => {
      anchor.classList.remove('coop-symbol-active');
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', escape);
    };
  }, [anchor, symbol]);

  return <div ref={root} className="formula-explain coop-equations">
    <div className="coop-equation-lead" dangerouslySetInnerHTML={{ __html: formula.lead }} />
    <p className="coop-equation-help">
      <span className="coop-help-pointer">悬停在符号上可查看含义。</span>
      <span className="coop-help-touch">轻点符号可查看含义。</span>
    </p>
    <div className="coop-equation-list">
      {formula.lines.map((line, row) => <div className="coop-equation-row" key={line.label}>
        <div className="coop-equation-label">{line.label}</div>
        <div className="coop-equation-expression" role="group" tabIndex={0} data-equation-row={row}
          aria-label={line.label + '。使用左右方向键逐个查看符号。'}
          aria-describedby={anchor?.closest<HTMLElement>('[data-equation-row]')?.dataset.equationRow === String(row) ? hintId : undefined}
          onFocus={event => reveal(event.currentTarget.querySelector('[data-order="0"]'))}
          onBlur={() => reveal(null)}
          onPointerOver={event => {
            if (event.pointerType === 'touch') return;
            const next = symbolAt(event.target);
            if (next) reveal(next); else leave();
          }}
          onPointerLeave={event => { if (event.pointerType !== 'touch') leave(); }}
          onClick={event => reveal(symbolAt(event.target))}
          onKeyDown={event => {
            const terms = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('[data-symbol]'))
              .sort((a, b) => Number(a.dataset.order) - Number(b.dataset.order));
            if (!terms.length) return;
            const current = anchor ? terms.indexOf(anchor) : -1;
            const last = terms.length - 1;
            let next = current;
            switch (event.key) {
              case 'ArrowRight': next = (current + 1) % terms.length; break;
              case 'ArrowLeft': next = current <= 0 ? last : current - 1; break;
              case 'Home': next = 0; break;
              case 'End': next = last; break;
              case 'Enter':
              case ' ': next = current < 0 ? 0 : current; break;
              default: return;
            }
            event.preventDefault();
            event.stopPropagation();
            reveal(terms[next]);
          }}>
          <Latex tex={line.tex} symbols={formula.symbols} display />
        </div>
      </div>)}
    </div>
    {symbol && createPortal(<aside className="coop-symbol-hint" role="tooltip" aria-live="polite"
      id={hintId} ref={popup} onPointerEnter={cancelClose}
      onPointerLeave={event => { if (event.pointerType !== 'touch') leave(); }}>
      <strong><Latex tex={symbol.tex} /> <span>{symbol.name}</span></strong>
      <p>{symbol.desc}</p>
    </aside>, document.body)}
  </div>;
}
