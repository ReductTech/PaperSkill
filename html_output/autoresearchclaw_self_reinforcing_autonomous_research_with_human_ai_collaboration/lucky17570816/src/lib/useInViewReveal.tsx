import { type HTMLAttributes, type ReactNode, useEffect, useRef, useState } from 'react';

/** Marks a scientific figure as visible once it enters the viewport. */
export function useInViewReveal<T extends Element>() {
  const ref = useRef<T>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || revealed) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setRevealed(true); observer.disconnect(); }
    }, { threshold: 0.18 });
    observer.observe(element);
    return () => observer.disconnect();
  }, [revealed]);

  return { ref, revealed };
}

export function Reveal({ children, className = '', ...props }: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  const { ref, revealed } = useInViewReveal<HTMLDivElement>();
  return <div ref={ref} className={`visual-reveal ${revealed ? 'is-revealed' : ''} ${className}`} {...props}>{children}</div>;
}
