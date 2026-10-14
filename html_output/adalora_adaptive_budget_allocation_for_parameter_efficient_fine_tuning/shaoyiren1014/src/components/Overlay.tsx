import { useEffect, useRef, type ReactNode } from 'react';
import Icon from './Icon';

export default function Overlay({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const before = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusable = () => [...(panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input,select,textarea,summary,[tabindex="0"]') || [])].filter(el=>el.getClientRects().length>0);
    focusable()[0]?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'Tab') {
        const all = focusable(); const first = all[0]; const last = all.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener('keydown',key);
    return () => { document.body.style.overflow = before; document.removeEventListener('keydown',key); previous?.focus(); };
  }, [onClose]);
  return <div className="overlay" ref={panel} role="dialog" aria-modal="true" aria-labelledby="overlay-title">
    <div className="overlay-heading"><span className="eyebrow">ENGINEER’S FIELD GUIDE</span><button className="text-button" onClick={onClose}><span>返回学习</span><Icon name="close"/></button></div>
    <h2 id="overlay-title">{title}</h2>{children}
  </div>;
}
