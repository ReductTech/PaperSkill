import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import katex from 'katex';
import type { SymbolDef } from '../types';
import { annotateFormula } from './mathMeanings';
import 'katex/dist/katex.min.css';
import './math-hover.css';

export interface MathTextProps {
  tex: string;
  display?: boolean;
  className?: string;
  symbols?: SymbolDef[];
  explanation?: string;
}
const emptySymbols: SymbolDef[] = [];

export function MathText({ tex, display = false, className = '', symbols = emptySymbols, explanation }: MathTextProps) {
  const annotated = useMemo(() => annotateFormula(tex, symbols, explanation), [tex, symbols, explanation]);
  const html = useMemo(() => katex.renderToString(annotated.tex, {
    displayMode: display, output: 'htmlAndMathml', throwOnError: false,
    trust: context => context.command === '\\htmlData', strict: 'ignore',
  }), [annotated.tex, display]);
  const wrapper = useRef<HTMLSpanElement>(null);
  const tooltip = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>();
  const [pinned, setPinned] = useState(false);
  const anchor = useRef<HTMLElement | null>(null);
  const [active, setActive] = useState<number | null>(null);
  const [nestedControl, setNestedControl] = useState(false);
  const [position, setPosition] = useState({ left: 16, top: 16, ready: false });
  const tooltipId = 'math-help-' + useId().replace(/:/g, '');
  const meaning = active !== null && active >= 0 ? annotated.meanings[active] : null;
  const open = active !== null;
  const cancelClose = () => { if (closeTimer.current) clearTimeout(closeTimer.current); };
  const close = () => { cancelClose(); setPinned(false); setActive(null); };
  const delayedClose = () => { cancelClose(); if (!pinned) closeTimer.current = setTimeout(() => setActive(null), 140); };

  const reveal = (element: HTMLElement | null, index: number) => {
    cancelClose();
    anchor.current = element || wrapper.current;
    document.dispatchEvent(new window.CustomEvent('clip-math-open', { detail: tooltipId }));
    setActive(index);
  };
  const isWithin = (element: HTMLElement | null, target: EventTarget | null) => target instanceof Node && !!element?.contains(target);
  const termAt = (target: EventTarget | null) => target instanceof Element ? target.closest<HTMLElement>('[data-term-id]') : null;
  const showTarget = (target: EventTarget | null) => {
    const term = termAt(target);
    reveal(term, term ? Number(term.dataset.termId) : -1);
  };

  useLayoutEffect(() => {
    setNestedControl(!!wrapper.current?.closest('button, a, summary'));
    close();
  }, [tex]);
  useLayoutEffect(() => {
    wrapper.current?.querySelectorAll('[data-term-id]').forEach(element => {
      element.classList.toggle('math-term-active', open && Number((element as HTMLElement).dataset.termId) === active);
    });
    if (!open || !tooltip.current || !anchor.current) return;
    const place = () => {
      if (!tooltip.current || !anchor.current) return;
      const rect = anchor.current.getBoundingClientRect();
      const box = tooltip.current.getBoundingClientRect();
      const width = window.innerWidth, height = window.innerHeight;
      const left = Math.max(12, Math.min(rect.left + rect.width / 2 - box.width / 2, width - box.width - 12));
      const below = rect.bottom + 12;
      const top = below + box.height <= height - 12 ? below : Math.max(12, rect.top - box.height - 12);
      setPosition({ left, top, ready: true });
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => { window.removeEventListener('resize', place); window.removeEventListener('scroll', place, true); };
  }, [active, open, annotated, pinned]);
  useEffect(() => {
    if (!open) return;
    const dismiss = (event: PointerEvent) => { if (!isWithin(wrapper.current, event.target) && !isWithin(tooltip.current, event.target)) close(); };
    const otherFormula = (event: Event) => { if ((event as CustomEvent<string>).detail !== tooltipId) close(); };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') close(); };
    document.addEventListener('pointerdown', dismiss);
    document.addEventListener('keydown', escape);
    document.addEventListener('clip-math-open', otherFormula);
    return () => { document.removeEventListener('pointerdown', dismiss); document.removeEventListener('keydown', escape); document.removeEventListener('clip-math-open', otherFormula); };
  }, [open]);
  useEffect(() => () => cancelClose(), []);

  return <>
    <span ref={wrapper} className={(display ? 'math-display' : 'math-inline') + ' math-explorable' + (className ? ' ' + className : '')}
      tabIndex={nestedControl ? undefined : 0}
      role={nestedControl ? undefined : 'group'}
      aria-label={nestedControl ? undefined : '公式；聚焦查看含义，左右方向键逐个查看符号'}
      aria-describedby={open ? tooltipId : undefined}
      onPointerOver={event => { if (event.pointerType !== 'touch' && !pinned) showTarget(event.target); }}
      onPointerLeave={event => { if (!isWithin(tooltip.current, event.relatedTarget)) delayedClose(); }}
      onFocus={event => { if (event.target === event.currentTarget) reveal(wrapper.current, -1); }}
      onBlur={event => { if (!pinned && !isWithin(tooltip.current, event.relatedTarget)) close(); }}
      onClick={event => {
        if (nestedControl) return;
        event.stopPropagation();
        const term = termAt(event.target);
        const next = term ? Number(term.dataset.termId) : -1;
        if (pinned && active === next) close();
        else { setPinned(true); reveal(term, next); }
      }}
      onKeyDown={event => {
        if (nestedControl) return;
        if (event.key === 'Tab') close();
        if (event.key === 'Escape') { close(); event.stopPropagation(); }
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault(); event.stopPropagation();
          if (pinned) close(); else { setPinned(true); reveal(wrapper.current, -1); }
        }
        if ((event.key === 'ArrowRight' || event.key === 'ArrowLeft') && annotated.meanings.length) {
          event.preventDefault(); event.stopPropagation(); setPinned(true);
          const direction = event.key === 'ArrowRight' ? 1 : -1;
          const next = active === null || active < 0 ? (direction > 0 ? 0 : annotated.meanings.length - 1) : (active + direction + annotated.meanings.length) % annotated.meanings.length;
          reveal(wrapper.current?.querySelector<HTMLElement>('[data-term-id="' + next + '"]') || null, next);
        }
      }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
    {open && createPortal(<div ref={tooltip} id={tooltipId} role="tooltip" className="math-tooltip"
      style={{ left: position.left, top: position.top, visibility: position.ready ? 'visible' : 'hidden' }}
      onPointerEnter={cancelClose} onPointerLeave={delayedClose}>
      <div className="math-tooltip-heading"><span>{meaning ? '符号含义' : '读懂这条公式'}</span>{meaning && <span className="math-tooltip-count">{active! + 1} / {annotated.meanings.length}</span>}</div>
      <strong>{meaning?.name || '这一步在计算什么'}</strong>
      <p>{meaning?.description || annotated.explanation}</p>
      <small>{pinned ? '已固定 · 点击原处、外部或按 Esc 关闭' : '移到符号看含义 · 点击可固定'}</small>
    </div>, document.body)}
  </>;
}
