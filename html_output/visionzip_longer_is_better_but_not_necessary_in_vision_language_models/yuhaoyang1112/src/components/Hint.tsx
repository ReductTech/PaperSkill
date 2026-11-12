import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { glossary, type TermKey } from '../data/glossary';
import './hints.css';

type HintProps = { text: string; label?: string; title?: string; children: ReactNode };

export function Hint({ text, label, title, children }: HintProps) {
  const descriptionId = useId();
  return <>
    <button type="button" className="vz-hint-inline" data-hint={text}
      data-hint-title={title ?? label ?? (typeof children === 'string' ? children : undefined)}
      aria-label={label} aria-describedby={descriptionId}>{children}</button>
    <span hidden className="vz-hint-description" id={descriptionId}>{text}</span>
  </>;
}

export function Term({ name, children }: { name: TermKey; children?: ReactNode }) {
  const term = glossary[name];
  return <span className="vz-term"><Hint title={term.title} text={term.meaning + term.role}>{children ?? name}</Hint></span>;
}

const trigger = (target: EventTarget | null) =>
  target instanceof Element ? target.closest<HTMLElement>('[data-hint]') : null;

// Like the reference SymbolGlossary, delegate events and render one positioned
// portal. A temporary pointer/keyboard reading can coexist with a pinned cell.
export function HintLayer() {
  const id = useId();
  const box = useRef<HTMLDivElement>(null);
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [content, setContent] = useState({title:'', text:''});

  useEffect(() => {
    let hovering: HTMLElement | null = null;
    let focused: HTMLElement | null = null;
    let pinned: HTMLElement | null = null;
    let keyboard = true;
    let timer: number;
    const show = () => setAnchor([hovering, focused, pinned].find(el => el?.isConnected) ?? null);
    const cancel = () => window.clearTimeout(timer);
    const close = () => { cancel(); hovering = focused = pinned = null; show(); };
    const inPopup = (target: EventTarget | null) => target instanceof Node && box.current?.contains(target);
    const over = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return;
      if (inPopup(event.target)) { cancel(); return; }
      const el = trigger(event.target);
      if (!el || el === trigger(event.relatedTarget)) return;
      cancel();
      hovering = el;
      show();
    };
    const out = (event: PointerEvent) => {
      if (event.pointerType === 'touch' || inPopup(event.relatedTarget)) return;
      if (!trigger(event.target) && !inPopup(event.target)) return;
      if (trigger(event.relatedTarget)) return;
      cancel();
      timer = window.setTimeout(() => { hovering = null; show(); }, 100);
    };
    const focus = (event: FocusEvent) => {
      if (!keyboard) return;
      cancel();
      hovering = null;
      focused = trigger(event.target);
      show();
    };
    const blur = (event: FocusEvent) => {
      if (trigger(event.target) !== focused) return;
      focused = null;
      show();
    };
    const down = (event: PointerEvent) => {
      keyboard = false;
      focused = null;
      if (!trigger(event.target) && !inPopup(event.target)) close();
    };
    const click = (event: MouseEvent) => {
      const el = trigger(event.target);
      if (!el) return;
      cancel();
      if (el === pinned) { close(); return; }
      pinned = el;
      hovering = focused = null;
      show();
    };
    const key = (event: KeyboardEvent) => {
      keyboard = true;
      if (event.key === 'Escape') close();
      if (event.key === 'Tab') { pinned = hovering = null; show(); }
    };
    const scroll = (event: Event) => {
      if (inPopup(event.target)) return;
      const el = hovering ?? focused ?? pinned;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const bar = document.querySelector('.mobile-bar')?.getBoundingClientRect();
      if (!el.isConnected || r.bottom <= (bar?.height ? bar.bottom : 0) || r.top >= innerHeight || r.right <= 0 || r.left >= innerWidth) close();
    };
    document.addEventListener('pointerover',over);
    document.addEventListener('pointerout',out);
    document.addEventListener('pointerdown',down,true);
    document.addEventListener('click',click);
    document.addEventListener('focusin',focus);
    document.addEventListener('focusout',blur);
    document.addEventListener('keydown',key,true);
    window.addEventListener('scroll',scroll,true);
    window.addEventListener('resize',close);
    return () => {
      cancel();
      document.removeEventListener('pointerover',over);
      document.removeEventListener('pointerout',out);
      document.removeEventListener('pointerdown',down,true);
      document.removeEventListener('click',click);
      document.removeEventListener('focusin',focus);
      document.removeEventListener('focusout',blur);
      document.removeEventListener('keydown',key,true);
      window.removeEventListener('scroll',scroll,true);
      window.removeEventListener('resize',close);
    };
  }, []);

  useLayoutEffect(() => {
    if (!anchor) return;
    const refresh = () => setContent({title:anchor.dataset.hintTitle ?? '',text:anchor.dataset.hint ?? ''});
    refresh();
    const changes = new MutationObserver(refresh);
    changes.observe(anchor,{attributes:true,attributeFilter:['data-hint','data-hint-title']});
    const described = anchor.getAttribute('aria-describedby');
    if (!described) anchor.setAttribute('aria-describedby',id);
    anchor.setAttribute('data-hint-open','');
    const host = anchor.closest('.reader');
    const checkAnchor = new MutationObserver(() => { if (!anchor.isConnected) setAnchor(null); });
    if (host) checkAnchor.observe(host, { childList: true, subtree: true });
    return () => {
      changes.disconnect();
      checkAnchor.disconnect();
      anchor.removeAttribute('data-hint-open');
      if (!described && anchor.getAttribute('aria-describedby') === id) anchor.removeAttribute('aria-describedby');
    };
  },[anchor,id]);

  useLayoutEffect(() => {
    const panel = box.current;
    if (!anchor || !panel) return;
    const place = () => {
      const r = anchor.getBoundingClientRect();
      const p = panel.getBoundingClientRect();
      const width = document.documentElement.clientWidth;
      const height = document.documentElement.clientHeight;
      const header = document.querySelector('.mobile-bar')?.getBoundingClientRect();
      const minTop = header && header.height > 0 ? header.bottom + 5 : 8;
      const left = Math.max(8, Math.min(r.left + (r.width-p.width)/2, width-p.width-8));
      const below = r.bottom + 7;
      const top = below + p.height <= height-8 ? below : r.top-p.height-7;
      panel.style.left = left + 'px';
      panel.style.top = Math.max(minTop, Math.min(top, height-p.height-8)) + 'px';
    };
    place();
    const observer = new ResizeObserver(place);
    observer.observe(panel);
    observer.observe(anchor);
    window.addEventListener('scroll', place, { capture: true, passive: true });
    return () => { observer.disconnect(); window.removeEventListener('scroll', place, true); };
  },[anchor,content]);

  return anchor && createPortal(<div ref={box} role="tooltip" id={id} className="vz-popover">
    {content.title && <strong>{content.title}</strong>}{content.text}
  </div>,document.body);
}
